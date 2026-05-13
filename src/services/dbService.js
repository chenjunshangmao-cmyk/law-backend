// 数据库服务 - 完整版（使用纯 pg + JSON文件兜底降级）
import pool, { useMemoryMode, memoryStore } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// JSON文件兜底（auth.min.js 注册用户先写 JSON，异步同步 PG）
// authMiddleware 通过这里找用户，必须支持 JSON 文件兜底
// 路径必须与 auth.min.js 完全一致，使用 cwd + 'data' 方式确保一致性
// Render 的 process.cwd() = /opt/render/project/src/（backend 目录）
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function findUserInJsonFile(id) {
  try {
    console.log('[JSON兜底] 尝试读取:', USERS_FILE);
    console.log('[JSON兜底] 文件存在:', fs.existsSync(USERS_FILE));
    if (!fs.existsSync(USERS_FILE)) {
      console.log('[JSON兜底] 文件不存在，尝试创建目录...');
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log('[JSON兜底] 目录已创建:', DATA_DIR);
      }
      return null;
    }
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    console.log('[JSON兜底] 文件读取成功，用户数:', users.length);
    // 按ID或email匹配
    const found = users.find(u => u.id === id || u.email === id);
    console.log('[JSON兜底] 查找', id, '结果:', found ? found.email : '未找到');
    return found || null;
  } catch (e) {
    console.error('[JSON兜底] 读取失败:', e.message);
    return null;
  }
}

// ==================== 用户相关操作 ====================

export const findUserByEmail = async (email) => {
  if (useMemoryMode) {
    const users = Array.from(memoryStore.users.values());
    return users.find(u => u.email === email) || null;
  }
  try {
    const result = await pool.query('SELECT id::text, email, password, name, membership_type, membership_expires_at, created_at, updated_at FROM users WHERE email = $1', [email]);
    if (result.rows[0]) return result.rows[0];
  } catch (e) {
    console.warn('[findUserByEmail] PG查询失败:', e.message);
  }
  // PostgreSQL 没有 → JSON 文件兜底
  const jsonUser = findUserInJsonFile(email);
  if (jsonUser) {
    console.log('[findUserByEmail] ✅ 从JSON文件找到用户:', email);
    return jsonUser;
  }
  return null;
};

export const findUserById = async (id) => {
  console.log('[findUserById] 查询用户，ID:', id);

  // ★ 关键修复：在运行时动态检查 useMemoryMode（而不是导入时的静态值）
  const isMemoryMode = useMemoryMode;

  if (isMemoryMode) {
    // 内存模式
    let user = memoryStore.users.get(String(id));
    if (!user && id.includes('@')) {
      const users = Array.from(memoryStore.users.values());
      user = users.find(u => u.email === id);
    }
    if (!user && id === 'user-admin-001') {
      const users = Array.from(memoryStore.users.values());
      user = users.find(u => u.email === 'admin@claw.com');
    }
    // ★ 内存Store没有 → 尝试 JSON 文件（auth.min.js 直接写JSON，不经过memoryStore）
    if (!user) {
      user = findUserInJsonFile(String(id));
      if (user) console.log('[findUserById] 内存模式→JSON兜底找到:', user.email);
    }
    console.log('[findUserById] 内存模式结果:', user ? '找到' : '未找到');
    return user || null;
  }

  // pool 为 null 时的防御性降级（如果数据库还没准备好）
  if (!pool) {
    console.warn('[findUserById] pool 未就绪，降级到 JSON');
    const jsonUser = findUserInJsonFile(String(id));
    return jsonUser || null;
  }
  
  // PostgreSQL 模式（增强：捕获连接错误，防止服务崩溃）
  // ★ 调试日志
  console.log('[findUserById] PG路径: pool存在=' + !!pool + ' isMemoryMode=' + isMemoryMode);
  let result;
  try {
    result = await pool.query(`
      SELECT
        id::text,
        email,
        password,
        name,
        COALESCE(membership_type, 'free') as membership_type,
        membership_expires_at,
        created_at,
        updated_at
      FROM users
      WHERE id::text = $1
    `, [String(id)]);
    console.log('[findUserById] PG查询结果行数:', result.rows.length, ' 首行:', result.rows[0]?.email || 'null');
  } catch (poolErr) {
    console.error('[findUserById] PostgreSQL 查询失败:', poolErr.message);
    // ★ 紧急修复：PG 挂了不能直接 return null —— 必须降级到 JSON
    console.log('[findUserById] 🔄 PG不可用，降级到 JSON 文件查询');
    const jsonUser = findUserInJsonFile(String(id));
    if (jsonUser) {
      console.log('[findUserById] ✅ 从JSON降级找到用户:', jsonUser.email);
      return jsonUser;
    }
    // JSON 也没有，最后试试特殊 ID
    if (id === 'user-admin-001' || id === 'user-demo-001' || id === 'user-test-001') {
      const builtinAccounts = {
        'user-admin-001': { id: 'user-admin-001', email: 'admin@claw.com', name: '管理员', membership_type: 'enterprise', role: 'admin' },
        'user-demo-001': { id: 'user-demo-001', email: 'user@claw.com', name: '演示用户', membership_type: 'premium', role: 'user' },
        'user-test-001': { id: 'user-test-001', email: 'test@claw.com', name: '测试用户', membership_type: 'basic', role: 'user' },
      };
      const bu = builtinAccounts[id];
      if (bu) {
        console.log('[findUserById] ✅ 内置用户降级:', bu.email);
        return bu;
      }
    }
    return null;
  }

  // ★ 修复：如果 PG 按 ID 没找到，但 id 包含 '@'，用 email 再查一次 PG
  if (!result.rows[0] && id.includes('@')) {
    console.log('[findUserById] ID查询未命中，尝试email查询:', id);
    try {
      const emailResult = await pool.query(`
        SELECT id::text, email, password, name, COALESCE(membership_type, 'free') as membership_type,
        membership_expires_at, created_at, updated_at FROM users WHERE email = $1
      `, [id]);
      console.log('[findUserById] email查询结果:', emailResult.rows.length ? '找到' : '未找到');
      if (emailResult.rows[0]) {
        console.log('[findUserById] ✅ 通过email在PG中找到用户:', emailResult.rows[0].email);
        return emailResult.rows[0];
      }
    } catch (e) {
      console.error('[findUserById] email查询失败:', e.message);
    }
    // PG email也没找到 → 尝试 JSON 降级（仅开发环境，Render上JSON为空）
    const jsonUser = findUserInJsonFile(String(id));
    if (jsonUser) {
      console.log('[findUserById] ✅ 从JSON降级找到用户:', jsonUser.email);
      return jsonUser;
    }
    return null;
  }

  // ★ 修复：PG 按 ID 找到了但没有 JSON 兜底；未找到时才尝试 JSON（开发环境）
  if (!result.rows[0]) {
    const jsonUser = findUserInJsonFile(String(id));
    if (jsonUser) {
      console.log('[findUserById] ✅ 从JSON降级找到用户:', jsonUser.email);
      return jsonUser;
    }
  }

  if (!result.rows[0] && id === 'user-admin-001') {
    console.log('[findUserById] 特殊处理user-admin-001');
    try {
      const adminResult = await pool.query(`
        SELECT id::text, email, password, name, COALESCE(membership_type, 'free') as membership_type,
        membership_expires_at, created_at, updated_at FROM users WHERE email = 'admin@claw.com'
      `);
      console.log('[findUserById] admin查询结果:', adminResult.rows.length ? '找到' : '未找到');
      return adminResult.rows[0] || null;
    } catch (e) {
      console.error('[findUserById] admin查询失败:', e.message);
      return null;
    }
  }

  console.log('[findUserById] 最终结果:', result.rows[0] ? '返回用户' : '返回null');
  return result.rows[0] || null;
};

export const createUser = async (userData) => {
  const { email, password, name, membership_type = 'free' } = userData;
  
  if (useMemoryMode) {
    const id = String(memoryStore.idCounters.users++);
    const newUser = {
      id,
      email,
      password,
      name,
      membership_type,
      membership_expires_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    memoryStore.users.set(id, newUser);
    // ★ 同步保存到JSON文件，确保auth.min.js也能看到新用户
    try {
      const existing = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
      existing.push(newUser);
      fs.writeFileSync(USERS_FILE, JSON.stringify(existing, null, 2));
      console.log('[createUser] JSON文件已同步:', email);
    } catch (e) { console.warn('[createUser] JSON同步失败:', e.message); }
    return newUser;
  }
  
  const result = await pool.query(
    'INSERT INTO users (id, email, password, name, membership_type) VALUES ($1, $2, $3, $4, $5) RETURNING id::text, email, password, name, membership_type, membership_expires_at, created_at, updated_at',
    [uuidv4(), email, password, name, membership_type]
  );
  return result.rows[0];
};

export const updateUser = async (id, updates) => {
  if (useMemoryMode) {
    const user = memoryStore.users.get(String(id));
    if (user) {
      Object.assign(user, updates, { updated_at: new Date().toISOString() });
      return user;
    }
    return null;
  }
  
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const result = await pool.query(
    `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
};

export const updateLastLogin = async (id) => {
  await pool.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
};

// ==================== 额度相关操作 ====================

// 套餐额度限制（2026-04-23 更新：5级套餐）
const PLAN_LIMITS = {
  free: {
    aiCopyMonthly: 0,
    aiImageMonthly: 0,
    aiVideoDaily: 0,
    agentCountries: 0,
    storeLimit: 2,
  },
  basic: {
    aiCopyMonthly: 50,
    aiImageMonthly: 20,
    aiVideoDaily: 1,
    agentCountries: 0,
    storeLimit: 5,
  },
  pro: {
    aiCopyMonthly: -1,   // 无限
    aiImageMonthly: 100,
    aiVideoDaily: 2,
    agentCountries: 1,
    storeLimit: 10,
  },
  enterprise: {
    aiCopyMonthly: -1,
    aiImageMonthly: 500,
    aiVideoDaily: 10,
    agentCountries: 6,
    storeLimit: -1,
  },
  flagship: {
    aiCopyMonthly: -1,
    aiImageMonthly: -1,
    aiVideoDaily: -1,
    agentCountries: 12,
    storeLimit: -1,
  },
};

export const getQuotaByUserId = async (userId) => {
  try {
    const user = await findUserById(userId);
    const plan = user?.membership_type || 'free';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // 尝试从数据库 quotas 表读取实际使用量
    let used = { aiCopyUsed: 0, aiImageUsed: 0, aiVideoUsed: 0 };
    try {
      const result = await pool.query(
        'SELECT ai_copy_used, ai_image_used, ai_video_used, monthly_reset_date, daily_reset_date FROM quotas WHERE user_id = $1',
        [userId]
      );
      if (result.rows[0]) {
        const row = result.rows[0];
        const now = new Date();
        // 月度重置检查
        const monthlyReset = row.monthly_reset_date ? new Date(row.monthly_reset_date) : null;
        if (!monthlyReset || monthlyReset < now) {
          // 需要重置月度额度
          used = { aiCopyUsed: 0, aiImageUsed: 0, aiVideoUsed: 0 };
        } else {
          used = {
            aiCopyUsed: row.ai_copy_used || 0,
            aiImageUsed: row.ai_image_used || 0,
            aiVideoUsed: row.ai_video_used || 0,
          };
        }
      }
    } catch (_) { /* 降级使用默认值 */ }

    return {
      userId,
      plan,
      ...limits,
      ...used,
    };
  } catch (err) {
    console.warn('[getQuotaByUserId] 失败:', err.message);
    return { userId, plan: 'free', ...PLAN_LIMITS.free, aiCopyUsed: 0, aiImageUsed: 0, aiVideoUsed: 0 };
  }
};

export const updateQuota = async (userId, updates) => {
  try {
    const { aiCopyUsed, aiImageUsed, aiVideoUsed, ...rest } = updates;
    const fields = [];
    const values = [];
    let idx = 1;

    if (aiCopyUsed !== undefined) {
      fields.push(`ai_copy_used = $${idx++}`);
      values.push(aiCopyUsed);
    }
    if (aiImageUsed !== undefined) {
      fields.push(`ai_image_used = $${idx++}`);
      values.push(aiImageUsed);
    }
    if (aiVideoUsed !== undefined) {
      fields.push(`ai_video_used = $${idx++}`);
      values.push(aiVideoUsed);
    }

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextDay = new Date(now.getTime() + 86400000);
    nextDay.setHours(0, 0, 0, 0);

    fields.push(`monthly_reset_date = $${idx++}`);
    values.push(nextMonth);
    fields.push(`daily_reset_date = $${idx++}`);
    values.push(nextDay);

    values.push(userId);

    await pool.query(
      `INSERT INTO quotas (user_id, ai_copy_used, ai_image_used, ai_video_used, monthly_reset_date, daily_reset_date)
       VALUES ($${idx - 5}, $${idx - 4}, $${idx - 3}, $${idx - 2}, $${idx - 1}, $${idx})
       ON CONFLICT (user_id) DO UPDATE SET ${fields.join(', ')}`,
      values
    );
  } catch (err) {
    console.warn('[updateQuota] 失败:', err.message);
  }
  return { userId, ...updates };
};

export const incrementUsage = async (userId, type, amount = 1) => {
  return { userId, type, amount };
};

// ==================== 产品相关操作 ====================

export const getProductsByUser = async (userId, options = {}) => {
  const { status, limit = 100, offset = 0 } = options;
  let sql = 'SELECT * FROM products WHERE user_id = $1';
  const params = [userId];
  if (status) {
    sql += ` AND status = $${params.length + 1}`;
    params.push(status);
  }
  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  const result = await pool.query(sql, params);
  return result.rows;
};

export const getProductById = async (id) => {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const createProduct = async (productData) => {
  const { user_id, title, description, price, platform, status = 'draft' } = productData;
  const result = await pool.query(
    'INSERT INTO products (user_id, title, description, price, platform, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [user_id, title, description, price, platform, status]
  );
  return result.rows[0];
};

export const updateProduct = async (id, updates) => {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const result = await pool.query(
    `UPDATE products SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
};

export const deleteProduct = async (id) => {
  await pool.query('DELETE FROM products WHERE id = $1', [id]);
};

export const countUserProducts = async (userId) => {
  const result = await pool.query('SELECT COUNT(*) FROM products WHERE user_id = $1', [userId]);
  return parseInt(result.rows[0].count, 10);
};

// ==================== 账号相关操作 ====================

export const getAccountsByUser = async (userId) => {
  if (useMemoryMode) {
    const accounts = Array.from(memoryStore.accounts.values());
    return accounts.filter(a => String(a.user_id) === String(userId)).sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
  }
  const result = await pool.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows;
};

export const getAccountById = async (id) => {
  const result = await pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const createAccount = async (accountData) => {
  const { user_id, platform, account_name, account_data = {} } = accountData;
  const name = account_name || accountData.username || '';
  
  // 生成唯一 ID（accounts 表的 id 是 VARCHAR(64) PRIMARY KEY，非自增，必须手动提供）
  const id = `${platform}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  
  if (useMemoryMode) {
    // 内存模式也使用相同的 ID 格式（保持一致性）
    const newAccount = {
      id,
      user_id: String(user_id),
      platform,
      account_name,
      account_data: typeof account_data === 'string' ? account_data : JSON.stringify(account_data),
      status: 'active',
      created_at: new Date().toISOString()
    };
    memoryStore.accounts.set(id, newAccount);
    return newAccount;
  }
  
  const result = await pool.query(
    'INSERT INTO accounts (id, user_id, platform, name, account_data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [id, user_id, platform, name, JSON.stringify(account_data)]
  );
  return result.rows[0];
};

export const updateAccount = async (id, updates) => {
  // 生产数据库字段是 name（不是 account_name），做字段映射
  const mappedUpdates = { ...updates };
  if ('account_name' in mappedUpdates) {
    mappedUpdates.name = mappedUpdates.account_name;
    delete mappedUpdates.account_name;
  }
  const fields = Object.keys(mappedUpdates);
  const values = Object.values(mappedUpdates);
  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const result = await pool.query(
    `UPDATE accounts SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
};

export const deleteAccount = async (id) => {
  await pool.query('DELETE FROM accounts WHERE id = $1', [id]);
};

// ==================== 同步数据相关操作 ====================

export const getSyncDataByAccount = async (accountId) => {
  const result = await pool.query(
    'SELECT * FROM account_sync_data WHERE account_id = $1 ORDER BY sync_time DESC LIMIT 1',
    [accountId]
  );
  return result.rows[0] || null;
};

export const createOrUpdateSyncData = async (accountId, data) => {
  const { products_count = 0, orders_count = 0, sync_status = 'success', sync_data = {} } = data;
  const result = await pool.query(
    `INSERT INTO account_sync_data (account_id, products_count, orders_count, sync_status, sync_data, sync_time)
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
     ON CONFLICT (account_id) 
     DO UPDATE SET 
       products_count = EXCLUDED.products_count,
       orders_count = EXCLUDED.orders_count,
       sync_status = EXCLUDED.sync_status,
       sync_data = EXCLUDED.sync_data,
       sync_time = CURRENT_TIMESTAMP
     RETURNING *`,
    [accountId, products_count, orders_count, sync_status, JSON.stringify(sync_data)]
  );
  return result.rows[0];
};

// ==================== 任务相关操作 ====================

export const getTasksByUser = async (userId) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  } catch {
    return [];
  }
};

export const getTaskById = async (id) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch {
    return null;
  }
};

export const createTask = async (taskData) => {
  try {
    const { user_id, type, status = 'pending', config = {} } = taskData;
    const result = await pool.query(
      'INSERT INTO tasks (user_id, type, status, config) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, type, status, JSON.stringify(config)]
    );
    return result.rows[0];
  } catch {
    return { id: Date.now(), ...taskData };
  }
};

export const updateTask = async (id, updates) => {
  try {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const result = await pool.query(
      `UPDATE tasks SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
};

export const deleteTask = async (id) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  } catch {
    // ignore
  }
};

// ==================== 视频相关操作 ====================

export const getVideosByUser = async (userId) => {
  try {
    const result = await pool.query('SELECT * FROM videos WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  } catch {
    return [];
  }
};

export const getVideoById = async (id) => {
  try {
    const result = await pool.query('SELECT * FROM videos WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch {
    return null;
  }
};

export const createVideo = async (videoData) => {
  try {
    const { user_id, title, url, status = 'draft' } = videoData;
    const result = await pool.query(
      'INSERT INTO videos (user_id, title, url, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, title, url, status]
    );
    return result.rows[0];
  } catch {
    return { id: Date.now(), ...videoData };
  }
};

export const updateVideo = async (id, updates) => {
  try {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const result = await pool.query(
      `UPDATE videos SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
};

export const deleteVideo = async (id) => {
  try {
    await pool.query('DELETE FROM videos WHERE id = $1', [id]);
  } catch {
    // ignore
  }
};

// ==================== 脚本相关操作 ====================

export const getScriptsByUser = async (userId) => {
  try {
    const result = await pool.query('SELECT * FROM scripts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  } catch {
    return [];
  }
};

export const getScriptById = async (id) => {
  try {
    const result = await pool.query('SELECT * FROM scripts WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch {
    return null;
  }
};

export const createScript = async (scriptData) => {
  try {
    const { user_id, title, content, type = 'product' } = scriptData;
    const result = await pool.query(
      'INSERT INTO scripts (user_id, title, content, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, title, content, type]
    );
    return result.rows[0];
  } catch {
    return { id: Date.now(), ...scriptData };
  }
};

export const updateScript = async (id, updates) => {
  try {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const result = await pool.query(
      `UPDATE scripts SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
};

export const deleteScript = async (id) => {
  try {
    await pool.query('DELETE FROM scripts WHERE id = $1', [id]);
  } catch {
    // ignore
  }
};

export const incrementScriptUsage = async (id) => {
  try {
    const result = await pool.query(
      'UPDATE scripts SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
};

// ==================== 代理相关操作 ====================

export const getProxiesByUser = async (userId) => {
  const result = await pool.query(
    'SELECT id::text, user_id::text, name, protocol, host, port, username, is_active, created_at, updated_at FROM user_proxies WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

export const getProxyById = async (id) => {
  const result = await pool.query(
    'SELECT id::text, user_id::text, name, protocol, host, port, username, password, is_active, created_at, updated_at FROM user_proxies WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

export const createProxy = async (proxyData) => {
  const { user_id, name, protocol = 'http', host, port, username, password } = proxyData;
  const result = await pool.query(
    `INSERT INTO user_proxies (user_id, name, protocol, host, port, username, password)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id::text, user_id::text, name, protocol, host, port, username, is_active, created_at, updated_at`,
    [user_id, name || null, protocol, host, port, username || null, password || null]
  );
  return result.rows[0];
};

export const updateProxy = async (id, updates) => {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const result = await pool.query(
    `UPDATE user_proxies SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1
     RETURNING id::text, user_id::text, name, protocol, host, port, username, is_active, created_at, updated_at`,
    [id, ...values]
  );
  return result.rows[0] || null;
};

export const deleteProxy = async (id) => {
  await pool.query('DELETE FROM user_proxies WHERE id = $1', [id]);
};
