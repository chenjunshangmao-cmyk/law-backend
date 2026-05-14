/**
 * accountsDb.js
 * 账号数据库服务 - 使用 PostgreSQL 存储平台账号
 */

import pg from 'pg';
import { readData, writeData } from './dataStore.js';
const { Pool } = pg;

let pool = null;

function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

/**
 * 获取用户的所有账号（优先数据库，降级到 JSON 文件）
 */
export async function getAccountsByUser(userId) {
  const db = getPool();
  if (db) {
    const result = await db.query('SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return result.rows;
  }
  // fallback to JSON
  const accounts = readData('accounts') || [];
  return accounts.filter(a => a.userId === userId);
}

/**
 * 获取所有账号
 */
export async function getAllAccounts() {
  const db = getPool();
  if (db) {
    const result = await db.query('SELECT * FROM accounts ORDER BY created_at DESC');
    return result.rows;
  }
  return readData('accounts') || [];
}

/**
 * 根据 ID 获取账号
 */
export async function getAccountById(id, userId = null) {
  const db = getPool();
  if (db) {
    let query = 'SELECT * FROM accounts WHERE id = $1';
    const params = [id];
    if (userId) {
      query += ' AND user_id = $2';
      params.push(userId);
    }
    const result = await db.query(query, params);
    return result.rows[0] || null;
  }
  const accounts = readData('accounts') || [];
  return accounts.find(a => a.id === id && (!userId || a.userId === userId)) || null;
}

/**
 * 创建账号
 */
export async function createAccount(accountData) {
  const db = getPool();
  if (db) {
    const { id, user_id, platform, name, client_id, api_key, api_secret, username, email, password, credentials, status } = accountData;
    const result = await db.query(
      `INSERT INTO accounts (id, user_id, platform, name, client_id, api_key, api_secret, username, email, password, credentials, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12)
       ON CONFLICT (id) DO UPDATE SET
         client_id = COALESCE($5, accounts.client_id),
         api_key = COALESCE($6, accounts.api_key),
         api_secret = COALESCE($7, accounts.api_secret),
         status = COALESCE($12, accounts.status),
         updated_at = NOW()
       RETURNING *`,
      [id, user_id, platform, name, client_id || null, api_key || null, api_secret || null,
       username || null, email || null, password || null, credentials ? JSON.stringify(credentials) : null, status || 'active']
    );
    return result.rows[0];
  }
  // fallback to JSON
  const accounts = readData('accounts') || [];
  const newAccount = { ...accountData, createdAt: Date.now(), updatedAt: Date.now() };
  accounts.push(newAccount);
  writeData('accounts', accounts);
  return newAccount;
}

/**
 * 更新账号
 */
export async function updateAccount(id, userId, updates) {
  const db = getPool();
  if (db) {
    const fields = [];
    const values = [];
    let paramIdx = 1;

    const keyMap = {
      'clientId': 'client_id', 'apiKey': 'api_key', 'apiSecret': 'api_secret',
      'lastSync': 'last_sync', 'userId': 'user_id'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        const dbKey = keyMap[key] || key.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
        if (dbKey === 'credentials') {
          fields.push(`credentials = $${paramIdx}::jsonb`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${dbKey} = $${paramIdx}`);
          values.push(value);
        }
        paramIdx++;
      }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(id, userId);

    const result = await db.query(
      `UPDATE accounts SET ${fields.join(', ')} WHERE id = $${paramIdx} AND user_id = $${paramIdx + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }
  // fallback to JSON
  const accounts = readData('accounts') || [];
  const index = accounts.findIndex(a => a.id === id && a.userId === userId);
  if (index === -1) return null;
  Object.assign(accounts[index], updates, { updatedAt: Date.now() });
  writeData('accounts', accounts);
  return accounts[index];
}

/**
 * 删除账号
 */
export async function deleteAccount(id, userId) {
  const db = getPool();
  if (db) {
    const result = await db.query('DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
    return result.rowCount > 0;
  }
  const accounts = readData('accounts') || [];
  const idx = accounts.findIndex(a => a.id === id && a.userId === userId);
  if (idx === -1) return false;
  accounts.splice(idx, 1);
  writeData('accounts', accounts);
  return true;
}

/**
 * 初始化 accounts 表
 */
export async function initAccountsTable() {
  try {
    const db = getPool();
    if (db) {
      await db.query(`
        CREATE TABLE IF NOT EXISTS accounts (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL,
          platform VARCHAR(32) NOT NULL,
          name VARCHAR(255) NOT NULL,
          client_id VARCHAR(255),
          api_key TEXT,
          api_secret TEXT,
          username VARCHAR(255),
          email VARCHAR(255),
          password TEXT,
          credentials JSONB,
          status VARCHAR(32) DEFAULT 'active',
          last_sync TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('[accountsDb] accounts 表就绪');
    }
  } catch (err) {
    console.warn('[accountsDb] 数据库不可用，使用JSON存储模式:', err.message);
  }
}
