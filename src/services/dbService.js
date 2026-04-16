// 数据库服务 - 简化版（使用纯 pg）
import pool from '../config/database.js';

// ==================== 用户相关操作 ====================

export const findUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

export const findUserById = async (id) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const createUser = async (userData) => {
  const { email, password, name, membership_type = 'free' } = userData;
  const result = await pool.query(
    'INSERT INTO users (email, password, name, membership_type) VALUES ($1, $2, $3, $4) RETURNING *',
    [email, password, name, membership_type]
  );
  return result.rows[0];
};

export const updateUser = async (id, updates) => {
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

// ==================== 产品相关操作 ====================

export const getProductsByUser = async (userId, options = {}) => {
  const { status, limit = 100, offset = 0 } = options;
  let query = 'SELECT * FROM products WHERE user_id = $1';
  const params = [userId];
  
  if (status) {
    query += ' AND status = $2';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  return result.rows;
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
    `UPDATE products SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0] || null;
};

export const deleteProduct = async (id) => {
  await pool.query('DELETE FROM products WHERE id = $1', [id]);
};

// ==================== 账号相关操作 ====================

export const getAccountsByUser = async (userId) => {
  const result = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [userId]);
  return result.rows;
};

export const createAccount = async (accountData) => {
  const { user_id, platform, account_name, account_data = {} } = accountData;
  const result = await pool.query(
    'INSERT INTO accounts (user_id, platform, account_name, account_data) VALUES ($1, $2, $3, $4) RETURNING *',
    [user_id, platform, account_name, JSON.stringify(account_data)]
  );
  return result.rows[0];
};

export const updateAccount = async (id, updates) => {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
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

// ==================== 任务相关操作（简化）====================

export const getTasksByUser = async (userId) => {
  // 简化实现，返回空数组
  return [];
};

export const createTask = async (taskData) => {
  // 简化实现
  return { id: Date.now(), ...taskData };
};

// ==================== 额度相关操作（简化）====================

export const getUserQuota = async (userId) => {
  // 简化实现，返回默认额度
  return {
    userId,
    plan: 'free',
    textLimit: 50,
    imageLimit: 10,
    productsLimit: 20,
    tasksLimit: 100
  };
};

export const updateUserQuota = async (userId, updates) => {
  // 简化实现
  return { userId, ...updates };
};

// ==================== 视频相关操作（简化）====================

export const getVideosByUser = async (userId) => {
  return [];
};

export const createVideo = async (videoData) => {
  return { id: Date.now(), ...videoData };
};

// ==================== 脚本相关操作（简化）====================

export const getScriptsByUser = async (userId) => {
  return [];
};

export const createScript = async (scriptData) => {
  return { id: Date.now(), ...scriptData };
};
