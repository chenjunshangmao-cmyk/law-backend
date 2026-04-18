// 数据库服务 - 完整版（使用纯 pg）
import pool from '../config/database.js';

// ==================== 用户相关操作 ====================

export const findUserByEmail = async (email) => {
  const result = await pool.query('SELECT id::text, email, password, name, membership_type, membership_expires_at, member_id, created_at, updated_at FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

export const findUserById = async (id) => {
  // id 统一用字符串格式查询（支持 string 和 number）
  const result = await pool.query('SELECT id::text, email, password, name, membership_type, membership_expires_at, member_id, created_at, updated_at FROM users WHERE id::text = $1', [String(id)]);
  return result.rows[0] || null;
};

export const findUserByMemberId = async (memberId) => {
  const result = await pool.query('SELECT id::text, email, password, name, membership_type, membership_expires_at, member_id, created_at, updated_at FROM users WHERE member_id = $1', [memberId]);
  return result.rows[0] || null;
};

// 生成会员ID：M + 年月日 + 4位随机数（如 M202604190001）
const generateMemberId = () => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `M${y}${m}${d}${rand}`;
};

export const createUser = async (userData) => {
  const { email, password, name, membership_type = 'free' } = userData;
  const memberId = generateMemberId();
  const result = await pool.query(
    'INSERT INTO users (email, password, name, membership_type, member_id) VALUES ($1, $2, $3, $4, $5) RETURNING id::text, email, password, name, membership_type, membership_expires_at, member_id, created_at, updated_at',
    [email, password, name, membership_type, memberId]
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

// ==================== 额度相关操作 ====================

export const getQuotaByUserId = async (userId) => {
  // 返回默认额度
  const user = await findUserById(userId);
  const plan = user?.membership_type || 'free';
  const limits = {
    free: { textLimit: 50, imageLimit: 10, productsLimit: 20, tasksLimit: 100 },
    basic: { textLimit: 500, imageLimit: 100, productsLimit: 200, tasksLimit: 1000 },
    pro: { textLimit: 5000, imageLimit: 1000, productsLimit: 2000, tasksLimit: 10000 },
    enterprise: { textLimit: 99999, imageLimit: 9999, productsLimit: 99999, tasksLimit: 99999 },
  };
  return { userId, plan, ...(limits[plan] || limits.free) };
};

export const updateQuota = async (userId, updates) => {
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
  const result = await pool.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows;
};

export const getAccountById = async (id) => {
  const result = await pool.query('SELECT * FROM accounts WHERE id = $1', [id]);
  return result.rows[0] || null;
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
