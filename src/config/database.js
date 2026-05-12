// 数据库配置 - PostgreSQL (Render) - 使用纯 pg 客户端
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// 从环境变量获取数据库 URL
const databaseUrl = process.env.DATABASE_URL;

// 内存存储模式（当数据库不可用时使用）
const memoryStore = {
  users: new Map(),
  accounts: new Map(),
  products: new Map(),
  tasks: new Map(),
  videos: new Map(),
  scripts: new Map(),
  proxies: new Map(),
  syncData: new Map(),
  idCounters: { users: 1, accounts: 1, products: 1, tasks: 1, videos: 1, scripts: 1, proxies: 1, syncData: 1 }
};

// 标记是否使用内存模式
let useMemoryMode = false;

// 创建连接池（如果 DATABASE_URL 存在）
let pool = null;
if (databaseUrl) {
  // ★ 修复：Render 内部 DNS 不稳定时，自动用完整公网域名
  let fixedUrl = databaseUrl;
  if (databaseUrl.includes('dpg-') && !databaseUrl.includes('.render.com')) {
    const original = databaseUrl;
    fixedUrl = databaseUrl.replace(/@([a-z0-9-]+)(:\d+)?(\/|$)/, '@$1.virginia-postgres.render.com$2$3');
    console.log(`[数据库] 自动修复域名: ${original.split('@')[0]}@... → 使用公网域名`);
    console.log(`[数据库] 原始: ${original}`);
    console.log(`[数据库] 修复: ${fixedUrl}`);
  }
  pool = new Pool({
    connectionString: fixedUrl,
    ssl: { rejectUnauthorized: false },
    // 增强健壮性：连接池参数优化
    max: 5,           // 最大连接数
    idleTimeoutMillis: 30000,  // 空闲超时
    connectionTimeoutMillis: 10000,  // 连接超时（10秒，冷启动适配）
  });

  // 监听连接错误，自动重连
  pool.on('error', (err) => {
    console.error('[数据库] 连接池错误（自动恢复）:', err.message);
  });

  // 启动时验证连接
  (async () => {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('[数据库] PostgreSQL 连接验证成功');
      useMemoryMode = false;
    } catch (err) {
      console.error('[数据库] PostgreSQL 连接失败（使用内存模式）:', err.message);
      useMemoryMode = true;
    }
  })();
} else {
  console.warn('⚠️  DATABASE_URL 未设置，将使用内存模式运行');
  useMemoryMode = true;
}

// 内存模式查询模拟
const memoryQuery = async (sql, params) => {
  // 简单的SQL解析，支持基本的CRUD操作
  const sqlLower = sql.toLowerCase().trim();
  
  // SELECT 查询
  if (sqlLower.startsWith('select')) {
    // 从users表查询
    if (sqlLower.includes('from users')) {
      const users = Array.from(memoryStore.users.values());
      if (sqlLower.includes('where email =')) {
        const email = params[0];
        return { rows: users.filter(u => u.email === email) };
      }
      if (sqlLower.includes('where id')) {
        const id = String(params[0]);
        const user = memoryStore.users.get(id);
        return { rows: user ? [user] : [] };
      }
      return { rows: users };
    }
    // 从accounts表查询
    if (sqlLower.includes('from accounts')) {
      const accounts = Array.from(memoryStore.accounts.values());
      if (sqlLower.includes('where user_id =')) {
        const userId = String(params[0]);
        return { rows: accounts.filter(a => String(a.user_id) === userId) };
      }
      if (sqlLower.includes('where id =')) {
        const id = String(params[0]);
        const account = memoryStore.accounts.get(id);
        return { rows: account ? [account] : [] };
      }
      return { rows: accounts };
    }
    return { rows: [] };
  }
  
  // INSERT 插入
  if (sqlLower.startsWith('insert')) {
    if (sqlLower.includes('into users')) {
      const id = String(memoryStore.idCounters.users++);
      const newUser = { id, ...params[0], created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      memoryStore.users.set(id, newUser);
      return { rows: [newUser] };
    }
    if (sqlLower.includes('into accounts')) {
      const id = String(memoryStore.idCounters.accounts++);
      const newAccount = { id, ...params[0], created_at: new Date().toISOString() };
      memoryStore.accounts.set(id, newAccount);
      return { rows: [newAccount] };
    }
    return { rows: [] };
  }
  
  // UPDATE 更新
  if (sqlLower.startsWith('update')) {
    if (sqlLower.includes('users')) {
      const id = String(params[params.length - 1]);
      const user = memoryStore.users.get(id);
      if (user) {
        Object.assign(user, params[0], { updated_at: new Date().toISOString() });
        return { rows: [user] };
      }
    }
    return { rows: [] };
  }
  
  // DELETE 删除
  if (sqlLower.startsWith('delete')) {
    if (sqlLower.includes('from accounts')) {
      const id = String(params[0]);
      memoryStore.accounts.delete(id);
    }
    return { rows: [] };
  }
  
  return { rows: [] };
};

// 模拟 sequelize 接口以保持兼容性
const sequelize = {
  authenticate: async () => {
    if (useMemoryMode) {
      console.log('✅ 内存模式运行中');
      return true;
    }
    const client = await pool.connect();
    client.release();
    return true;
  },
  sync: async () => {
    if (useMemoryMode) {
      console.log('✅ 内存模式：无需同步数据库');
      return true;
    }
    // 初始化数据库表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        membership_type VARCHAR(20) DEFAULT 'free',
        membership_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // 创建/保留 accounts 表（使用 VARCHAR id 兼容 OZON 账号）
    // ⚠️ 不再 DROP 表，避免数据丢失
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        name VARCHAR(255),
        client_id VARCHAR(255),
        api_key TEXT,
        account_data JSONB DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'active',
        last_sync TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // 使用 CREATE TABLE IF NOT EXISTS，不再 DROP
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2),
        platform VARCHAR(50),
        status VARCHAR(20) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // 不再 DROP 表，避免数据丢失
    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_sync_data (
        id SERIAL PRIMARY KEY,
        account_id VARCHAR(64) REFERENCES accounts(id) ON DELETE CASCADE,
        products_count INTEGER DEFAULT 0,
        orders_count INTEGER DEFAULT 0,
        sync_status VARCHAR(20) DEFAULT 'pending',
        sync_data JSONB DEFAULT '{}',
        sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(account_id)
      )
    `);
    // 创建聊天会话表（支持AI客服长上下文记忆）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        session_id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(128) REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        source VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // 索引：加速查询
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at ASC)
    `).catch(() => {});
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id)
    `).catch(() => {});

    // 初始化 OZON 账号（如果不存在）
    await pool.query(`
      INSERT INTO accounts (id, user_id, platform, name, client_id, api_key, account_data) VALUES
      ('ozon-chenjun-trading', 'dd0a80ed-5721-44ff-bea1-3d3520c2968d', 'ozon', 'Chenjun Trading', '253100', '97cbc32c-5a85-405e-8bf0-d45cb943acf1', '{}'),
      ('ozon-chenjun-mall', 'dd0a80ed-5721-44ff-bea1-3d3520c2968d', 'ozon', 'Chenjun Mall', '2838302', '3652be69-0a0b-4e3e-8510-83ad7b082529', '{}'),
      ('ozon-qiming-trading', 'dd0a80ed-5721-44ff-bea1-3d3520c2968d', 'ozon', 'qiming Trading', '3101652', '90356528-af82-42c1-81af-86fddec89224', '{}')
      ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id
    `).catch(() => {});
    return true;
  },
  query: (sql, options) => useMemoryMode ? memoryQuery(sql, options) : pool.query(sql, options),
  close: () => useMemoryMode ? Promise.resolve() : pool.end()
};

// 测试数据库连接
export const testConnection = async () => {
  if (useMemoryMode) {
    console.log('✅ 内存模式运行中，无需数据库连接');
    return true;
  }
  try {
    // 直接使用pool测试连接
    const client = await pool.connect();
    console.log('✅ PostgreSQL 数据库连接成功');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.log('⚠️  切换到内存模式...');
    useMemoryMode = true;
    return true;
  }
};

// 同步数据库模型
export const syncDatabase = async (force = false) => {
  try {
    // 使用 alter: false 避免 PostgreSQL 兼容问题
    // 只创建不存在的表，不修改现有表结构
    await sequelize.sync({ force, alter: false });
    console.log('✅ 数据库同步成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库同步失败:', error.message);
    // 同步失败不阻止服务启动
    console.log('⚠️  继续启动服务（可能使用内存模式）...');
    return true;
  }
};

// 命名导出 sequelize 和 pool
export { sequelize, pool, useMemoryMode, memoryStore };
export default sequelize;
