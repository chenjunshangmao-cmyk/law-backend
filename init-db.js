// ==========================================
// Database Schema Initialization
// Run once to create all tables (PostgreSQL)
// ==========================================
import pool from './src/db/postgres.js';
import bcrypt from 'bcryptjs';

async function initDatabase() {
  try {
    console.log('Initializing PostgreSQL database schema...');
    
    // Drop existing tables first (order matters for foreign keys)
    await pool.query('DROP TABLE IF EXISTS sessions CASCADE');
    await pool.query('DROP TABLE IF EXISTS logs CASCADE');
    await pool.query('DROP TABLE IF EXISTS tasks CASCADE');
    await pool.query('DROP TABLE IF EXISTS products CASCADE');
    await pool.query('DROP TABLE IF EXISTS accounts CASCADE');
    await pool.query('DROP TABLE IF EXISTS user_proxies CASCADE');
    await pool.query('DROP TABLE IF EXISTS videos CASCADE');
    await pool.query('DROP TABLE IF EXISTS scripts CASCADE');
    await pool.query('DROP TABLE IF EXISTS quotas CASCADE');
    await pool.query('DROP TABLE IF EXISTS products_1688 CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('✅ Old tables dropped');
    
    // Create enum types
    await pool.query(`DO $$ BEGIN
      CREATE TYPE user_plan AS ENUM ('free', 'basic', 'pro', 'enterprise');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$`);
    
    await pool.query(`DO $$ BEGIN
      CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$`);
    
    await pool.query(`DO $$ BEGIN
      CREATE TYPE product_status AS ENUM ('draft', 'published', 'archived');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$`);
    
    await pool.query(`DO $$ BEGIN
      CREATE TYPE account_platform AS ENUM ('tiktok', 'youtube', 'ozon', 'taobao', 'pdd');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$`);
    
    await pool.query(`DO $$ BEGIN
      CREATE TYPE account_status AS ENUM ('active', 'inactive', 'expired', 'error');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$`);
    
    await pool.query(`DO $$ BEGIN
      CREATE TYPE task_type AS ENUM ('select', 'generate', 'publish', 'full');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$`);
    
    await pool.query(`DO $$ BEGIN
      CREATE TYPE task_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$`);
    
    console.log('✅ Enum types created');
    
    // Create users table
    await pool.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        avatar VARCHAR(500),
        plan user_plan DEFAULT 'free',
        status user_status DEFAULT 'active',
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');
    
    // Create quotas table
    await pool.query(`
      CREATE TABLE quotas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        text_generations INTEGER DEFAULT 0,
        text_limit INTEGER DEFAULT 100,
        image_generations INTEGER DEFAULT 0,
        image_limit INTEGER DEFAULT 50,
        products_limit INTEGER DEFAULT 50,
        tasks_limit INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Quotas table created');
    
    // Create products table
    await pool.query(`
      CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cost DECIMAL(10, 2) DEFAULT 0,
        price DECIMAL(10, 2) DEFAULT 0,
        currency VARCHAR(3) DEFAULT 'SGD',
        source_url VARCHAR(1000),
        category VARCHAR(100) DEFAULT 'general',
        images JSONB DEFAULT '[]',
        platform_data JSONB DEFAULT '{}',
        status product_status DEFAULT 'draft',
        tags JSONB DEFAULT '[]',
        ai_generated BOOLEAN DEFAULT false,
        generated_content JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Products table created');
    
    // Create products_1688 table
    await pool.query(`
      CREATE TABLE products_1688 (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        url TEXT UNIQUE NOT NULL,
        title VARCHAR(500),
        price VARCHAR(100),
        images JSONB DEFAULT '[]',
        vendor VARCHAR(255),
        vendor_id VARCHAR(100),
        data JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Products_1688 table created');
    
    // Create accounts table
    await pool.query(`
      CREATE TABLE accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        platform account_platform NOT NULL,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(100),
        credentials JSONB,
        cookies TEXT,
        settings JSONB DEFAULT '{}',
        status account_status DEFAULT 'active',
        last_used_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Accounts table created');

    // Create user_proxies table（账号代理配置）
    await pool.query(`
      CREATE TABLE user_proxies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100),
        protocol VARCHAR(20) DEFAULT 'http',
        host VARCHAR(255) NOT NULL,
        port INTEGER NOT NULL,
        username VARCHAR(100),
        password VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ User proxies table created');

    // 给 accounts 表加 proxy_id 字段（关联到 user_proxies）
    await pool.query(`
      ALTER TABLE accounts
      ADD COLUMN IF NOT EXISTS proxy_id UUID REFERENCES user_proxies(id) ON DELETE SET NULL
    `);
    console.log('✅ Accounts proxy_id column added');

    // Create tasks table
    await pool.query(`
      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        type task_type NOT NULL,
        status task_status DEFAULT 'pending',
        params JSONB DEFAULT '{}',
        result JSONB,
        logs JSONB DEFAULT '[]',
        progress INTEGER DEFAULT 0,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tasks table created');
    
    // Create logs table
    await pool.query(`
      CREATE TABLE logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Logs table created');
    
    // Create sessions table
    await pool.query(`
      CREATE TABLE sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500),
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Sessions table created');
    
    // Create videos table
    await pool.query(`
      CREATE TABLE videos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        script_id UUID,
        video_url VARCHAR(1000),
        thumbnail_url VARCHAR(1000),
        duration INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Videos table created');
    
    // Create scripts table
    await pool.query(`
      CREATE TABLE scripts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        content TEXT,
        product_id UUID REFERENCES products(id) ON DELETE SET NULL,
        type VARCHAR(50) DEFAULT 'product',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Scripts table created');
    
    // Create default admin user with bcrypt
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (email, password, name, plan, status) VALUES ($1, $2, $3, $4, $5)`,
      ['admin@claw.com', hash, 'Admin', 'free', 'active']
    );
    console.log('✅ Default admin user created: admin@claw.com / admin123');
    
    // Create default quota for admin
    await pool.query(`
      INSERT INTO quotas (user_id, text_limit, image_limit, products_limit, tasks_limit)
      SELECT id, 100, 50, 50, 100 FROM users WHERE email = 'admin@claw.com'
    `);
    console.log('✅ Default quota created');
    
    console.log('✅ Database initialization complete!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
