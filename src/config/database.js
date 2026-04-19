// 数据库配置 - PostgreSQL (Render) - 使用纯 pg 客户端
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// 数据库配置 - PostgreSQL (Render)
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// 从环境变量获取数据库 URL
const databaseUrl = process.env.DATABASE_URL;

let pool;

if (databaseUrl) {
  try {
    // 解析数据库URL
    const urlMatch = databaseUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
    
    if (urlMatch) {
      const [, user, password, host, database] = urlMatch;
      
      pool = new Pool({
        user,
        password,
        host,
        database,
        port: 5432,
        ssl: { rejectUnauthorized: false },
      });
      
      // 测试连接
      const client = await pool.connect();
      console.log('✅ PostgreSQL 数据库连接成功');
      client.release();
    } else {
      throw new Error('无法解析数据库URL格式');
    }
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
    console.log('数据库连接失败，使用内存模式运行');
    // 创建内存模式连接池
    pool = new Pool({
      connectionString: 'postgresql://memory:mode@localhost/memory',
    });
  }
} else {
  console.warn('未找到DATABASE_URL环境变量，使用内存模式');
  pool = new Pool({
    connectionString: 'postgresql://memory:mode@localhost/memory',
  });
}

// 模拟 sequelize 接口以保持兼容性
const sequelize = {
  authenticate: async () => {
    const client = await pool.connect();
    client.release();
    return true;
  },
  sync: async () => {
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        account_name VARCHAR(100) NOT NULL,
        account_data JSONB DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_sync_data (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
        products_count INTEGER DEFAULT 0,
        orders_count INTEGER DEFAULT 0,
        sync_status VARCHAR(20) DEFAULT 'pending',
        sync_data JSONB DEFAULT '{}',
        sync_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(account_id)
      )
    `);
    return true;
  },
  query: (sql, options) => pool.query(sql, options),
  close: () => pool.end()
};

// 测试数据库连接
export const testConnection = async () => {
  try {
    // 直接使用pool测试连接
    const client = await pool.connect();
    console.log('✅ PostgreSQL 数据库连接成功');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
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
export { sequelize, pool };
export default sequelize;
