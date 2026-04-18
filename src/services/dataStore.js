// 数据存储服务 - JSON文件存储（向后兼容 auth.min.js）
// 注册用户通过 auth.min.js 写入 data/users.json（带 member_id）
// 认证时通过这里读取，两边共用同一 JSON 文件，完全同步
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 使用项目根目录下的 data 文件夹（与 auth.min.js 完全一致）
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('数据目录已创建:', DATA_DIR);
}

// 数据文件路径 - 使用绝对路径（与 auth.min.js 一致）
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const QUOTAS_FILE = path.join(DATA_DIR, 'quotas.json');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

// 初始化空数据文件
const initFile = (filePath, defaultData = []) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

initFile(USERS_FILE, []);
initFile(PRODUCTS_FILE, []);
initFile(QUOTAS_FILE, []);
initFile(ACCOUNTS_FILE, []);
initFile(TASKS_FILE, []);

// 生成唯一ID（与 auth.min.js 中的 generateUserId 保持一致）
export const generateId = () => {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
};

// 读取数据
export const readData = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

// 写入数据
export const writeData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
};

// 用户数据操作
export const getUsers = () => readData(USERS_FILE);
export const saveUsers = (users) => writeData(USERS_FILE, users);

// 同步查找：直接读 JSON 文件（auth.min.js 写到这个文件）
// 必须同步，避免 async pool 查询失败导致找不到用户
export const findUserByEmail = (email) => {
  const users = getUsers();
  return users.find(u => u.email === email) || null;
};

export const findUserById = (id) => {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
};

export const createUser = (user) => {
  const users = getUsers();
  users.push(user);
  return saveUsers(users) ? user : null;
};

export const updateUser = (id, updates) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  return saveUsers(users) ? users[index] : null;
};

// 产品数据操作
export const getProducts = () => readData(PRODUCTS_FILE);
export const saveProducts = (products) => writeData(PRODUCTS_FILE, products);

export const getProductsByUser = (userId) => {
  const products = getProducts();
  return products.filter(p => p.userId === userId);
};

export const getProductById = (id) => {
  const products = getProducts();
  return products.find(p => p.id === id);
};

export const createProduct = (product) => {
  const products = getProducts();
  products.push(product);
  return saveProducts(products) ? product : null;
};

export const updateProduct = (id, updates) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...updates };
  return saveProducts(products) ? products[index] : null;
};

export const deleteProduct = (id) => {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  return saveProducts(filtered);
};

// 额度数据操作
export const getQuotas = () => readData(QUOTAS_FILE);
export const saveQuotas = (quotas) => writeData(QUOTAS_FILE, quotas);

export const getQuotaByUserId = (userId) => {
  const quotas = getQuotas();
  let quota = quotas.find(q => q.userId === userId);
  if (!quota) {
    // 创建默认额度（免费版）
    quota = {
      userId,
      plan: 'free',
      textGenerations: 0,
      textLimit: 50,
      imageGenerations: 0,
      imageLimit: 10,
      productsLimit: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    quotas.push(quota);
    saveQuotas(quotas);
  }
  return quota;
};

export const updateQuota = (userId, updates) => {
  const quotas = getQuotas();
  const index = quotas.findIndex(q => q.userId === userId);
  if (index === -1) {
    // 创建新额度
    const newQuota = {
      userId,
      plan: 'free',
      textGenerations: 0,
      textLimit: 50,
      imageGenerations: 0,
      imageLimit: 10,
      productsLimit: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updates
    };
    quotas.push(newQuota);
    return saveQuotas(quotas) ? newQuota : null;
  }
  quotas[index] = { ...quotas[index], ...updates, updatedAt: new Date().toISOString() };
  return saveQuotas(quotas) ? quotas[index] : null;
};

export const incrementUsage = (userId, type) => {
  const quota = getQuotaByUserId(userId);
  if (type === 'text') {
    quota.textGenerations += 1;
  } else if (type === 'image') {
    quota.imageGenerations += 1;
  }
  return updateQuota(userId, quota);
};

export const checkQuota = (userId, type) => {
  const quota = getQuotaByUserId(userId);
  if (type === 'text') {
    return quota.textGenerations < quota.textLimit;
  } else if (type === 'image') {
    return quota.imageGenerations < quota.imageLimit;
  }
  return true;
};

// 任务数据操作 - 添加缺失的导出方法
export const getTasks = () => readData(TASKS_FILE);
export const saveTasks = (tasks) => writeData(TASKS_FILE, tasks);

export const getTasksByUser = (userId) => {
  const tasks = getTasks();
  return tasks.filter(t => t.userId === userId);
};

export const getTaskById = (id) => {
  const tasks = getTasks();
  return tasks.find(t => t.id === id);
};

export const createTask = (task) => {
  const tasks = getTasks();
  tasks.push(task);
  return saveTasks(tasks) ? task : null;
};

export const updateTask = (id, updates) => {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;
  tasks[index] = { ...tasks[index], ...updates };
  return saveTasks(tasks) ? tasks[index] : null;
};

export const deleteTask = (id) => {
  const tasks = getTasks();
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) return false;
  return saveTasks(filtered);
};

// 账号数据操作 - 添加缺失的导出方法
export const getAccounts = () => readData(ACCOUNTS_FILE);
export const saveAccounts = (accounts) => writeData(ACCOUNTS_FILE, accounts);

export const getAccountsByUser = (userId) => {
  const accounts = getAccounts();
  return accounts.filter(a => a.userId === userId);
};

export const getAccountById = (id) => {
  const accounts = getAccounts();
  return accounts.find(a => a.id === id);
};

export const createAccount = (account) => {
  const accounts = getAccounts();
  accounts.push(account);
  return saveAccounts(accounts) ? account : null;
};

export const updateAccount = (id, updates) => {
  const accounts = getAccounts();
  const index = accounts.findIndex(a => a.id === id);
  if (index === -1) return null;
  accounts[index] = { ...accounts[index], ...updates };
  return saveAccounts(accounts) ? accounts[index] : null;
};

export const deleteAccount = (id) => {
  const accounts = getAccounts();
  const filtered = accounts.filter(a => a.id !== id);
  if (filtered.length === accounts.length) return false;
  return saveAccounts(filtered);
};
