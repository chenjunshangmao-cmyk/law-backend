// 数据库服务 - 基于 Sequelize 的 CRUD 操作
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { User, Product, Task, Account, Quota, Video, Script } from '../models/index.js';

// ==================== 用户相关操作 ====================

export const findUserByEmail = async (email) => {
  return await User.findOne({ where: { email } });
};

export const findUserById = async (id) => {
  return await User.findByPk(id);
};

export const createUser = async (userData) => {
  const user = await User.create(userData);
  
  // 创建默认额度
  await Quota.create({
    userId: user.id,
    plan: userData.plan || 'free',
    textLimit: 50,
    imageLimit: 10,
    productsLimit: 20,
    tasksLimit: 100
  });
  
  return user;
};

export const updateUser = async (id, updates) => {
  const [affectedRows] = await User.update(updates, { where: { id } });
  if (affectedRows === 0) return null;
  return await User.findByPk(id);
};

export const updateLastLogin = async (id) => {
  return await User.update({ lastLoginAt: new Date() }, { where: { id } });
};

// ==================== 产品相关操作 ====================

export const getProductsByUser = async (userId, options = {}) => {
  const { status, category, limit = 100, offset = 0 } = options;
  const where = { userId };
  
  if (status) where.status = status;
  if (category) where.category = category;
  
  return await Product.findAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });
};

export const getProductById = async (id) => {
  return await Product.findByPk(id);
};

export const createProduct = async (productData) => {
  return await Product.create(productData);
};

export const updateProduct = async (id, updates) => {
  const [affectedRows] = await Product.update(updates, { where: { id } });
  if (affectedRows === 0) return null;
  return await Product.findByPk(id);
};

export const deleteProduct = async (id) => {
  const deleted = await Product.destroy({ where: { id } });
  return deleted > 0;
};

export const countUserProducts = async (userId) => {
  return await Product.count({ where: { userId } });
};

// ==================== 任务相关操作 ====================

export const getTasks = async (options = {}) => {
  const { userId, status, type, limit = 50, offset = 0 } = options;
  const where = {};
  
  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (type) where.type = type;
  
  return await Task.findAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });
};

export const getTasksByUser = async (userId, options = {}) => {
  return await getTasks({ ...options, userId });
};

export const getTaskById = async (id) => {
  return await Task.findByPk(id);
};

export const createTask = async (taskData) => {
  return await Task.create(taskData);
};

export const updateTask = async (id, updates) => {
  const [affectedRows] = await Task.update(updates, { where: { id } });
  if (affectedRows === 0) return null;
  return await Task.findByPk(id);
};

export const deleteTask = async (id) => {
  const deleted = await Task.destroy({ where: { id } });
  return deleted > 0;
};

// ==================== 账号相关操作 ====================

export const getAccounts = async (options = {}) => {
  const { userId, platform, status } = options;
  const where = {};
  
  if (userId) where.userId = userId;
  if (platform) where.platform = platform;
  if (status) where.status = status;
  
  return await Account.findAll({ where, order: [['createdAt', 'DESC']] });
};

export const getAccountsByUser = async (userId) => {
  return await Account.findAll({
    where: { userId },
    order: [['platform', 'ASC'], ['createdAt', 'DESC']]
  });
};

export const getAccountById = async (id) => {
  return await Account.findByPk(id);
};

export const createAccount = async (accountData) => {
  return await Account.create(accountData);
};

export const updateAccount = async (id, updates) => {
  const [affectedRows] = await Account.update(updates, { where: { id } });
  if (affectedRows === 0) return null;
  return await Account.findByPk(id);
};

export const deleteAccount = async (id) => {
  const deleted = await Account.destroy({ where: { id } });
  return deleted > 0;
};

// ==================== 额度相关操作 ====================

export const getQuotaByUserId = async (userId) => {
  let quota = await Quota.findOne({ where: { userId } });
  
  if (!quota) {
    // 创建默认额度
    quota = await Quota.create({
      userId,
      plan: 'free',
      textLimit: 50,
      imageLimit: 10,
      productsLimit: 20,
      tasksLimit: 100
    });
  }
  
  return quota;
};

export const updateQuota = async (userId, updates) => {
  const [affectedRows] = await Quota.update(updates, { where: { userId } });
  if (affectedRows === 0) {
    // 如果不存在则创建
    return await Quota.create({ userId, ...updates });
  }
  return await Quota.findOne({ where: { userId } });
};

export const incrementUsage = async (userId, type) => {
  const quota = await getQuotaByUserId(userId);
  const updates = {};
  
  if (type === 'text') {
    updates.textGenerations = quota.textGenerations + 1;
  } else if (type === 'image') {
    updates.imageGenerations = quota.imageGenerations + 1;
  } else if (type === 'task') {
    updates.tasksCount = quota.tasksCount + 1;
  }
  
  return await Quota.update(updates, { where: { userId } });
};

export const checkQuota = async (userId, type) => {
  const quota = await getQuotaByUserId(userId);
  
  if (type === 'text') {
    return quota.textGenerations < quota.textLimit;
  } else if (type === 'image') {
    return quota.imageGenerations < quota.imageLimit;
  } else if (type === 'product') {
    const count = await countUserProducts(userId);
    return count < quota.productsLimit;
  } else if (type === 'task') {
    return quota.tasksCount < quota.tasksLimit;
  }
  
  return true;
};

// ==================== 视频相关操作 ====================

export const getVideosByUser = async (userId, options = {}) => {
  const { status, limit = 50, offset = 0 } = options;
  const where = { userId };
  
  if (status) where.status = status;
  
  return await Video.findAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });
};

export const getVideoById = async (id) => {
  return await Video.findByPk(id);
};

export const createVideo = async (videoData) => {
  return await Video.create(videoData);
};

export const updateVideo = async (id, updates) => {
  const [affectedRows] = await Video.update(updates, { where: { id } });
  if (affectedRows === 0) return null;
  return await Video.findByPk(id);
};

export const deleteVideo = async (id) => {
  const deleted = await Video.destroy({ where: { id } });
  return deleted > 0;
};

export const countUserVideos = async (userId) => {
  return await Video.count({ where: { userId } });
};

// ==================== 脚本相关操作 ====================

export const getScriptsByUser = async (userId, options = {}) => {
  const { scene, limit = 50, offset = 0 } = options;
  const where = { userId };
  
  if (scene) where.scene = scene;
  
  return await Script.findAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });
};

export const getScriptById = async (id) => {
  return await Script.findByPk(id);
};

export const createScript = async (scriptData) => {
  return await Script.create(scriptData);
};

export const updateScript = async (id, updates) => {
  const [affectedRows] = await Script.update(updates, { where: { id } });
  if (affectedRows === 0) return null;
  return await Script.findByPk(id);
};

export const deleteScript = async (id) => {
  const deleted = await Script.destroy({ where: { id } });
  return deleted > 0;
};

export const incrementScriptUsage = async (id) => {
  const script = await Script.findByPk(id);
  if (script) {
    await Script.update(
      { usedCount: script.usedCount + 1 },
      { where: { id } }
    );
  }
};

// ==================== 统计相关操作 ====================

export const getUserStats = async (userId) => {
  const [productCount, taskCount, accountCount, videoCount, scriptCount] = await Promise.all([
    Product.count({ where: { userId } }),
    Task.count({ where: { userId } }),
    Account.count({ where: { userId } }),
    Video.count({ where: { userId } }),
    Script.count({ where: { userId } })
  ]);
  
  const taskStats = await Task.findAll({
    where: { userId },
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
    group: ['status']
  });
  
  return {
    products: {
      total: productCount,
      byStatus: await Product.findAll({
        where: { userId },
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
        group: ['status']
      })
    },
    tasks: {
      total: taskCount,
      byStatus: taskStats
    },
    accounts: accountCount,
    videos: videoCount,
    scripts: scriptCount
  };
};
