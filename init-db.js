// ==========================================
// Database Schema Initialization
// Run once to create all tables
// ==========================================
import pool from './src/db/postgres.js';
import bcrypt from 'bcryptjs';

const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  price DECIMAL(10, 2),
  cost DECIMAL(10, 2),
  source_url TEXT,
  images JSONB DEFAULT '[]',
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  platform VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  credentials JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  token VARCHAR(500),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products1688 table
CREATE TABLE IF NOT EXISTS products_1688 (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  url TEXT UNIQUE NOT NULL,
  title VARCHAR(500),
  price VARCHAR(100),
  images JSONB DEFAULT '[]',
  vendor VARCHAR(255),
  vendor_id VARCHAR(100),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function initDatabase() {
  try {
    console.log('Initializing database schema...');
    await pool.query(schema);
    console.log('✅ Database schema created successfully!');
    
    // Create default admin user if not exists
    const adminCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      ['admin@claw.com']
    );
    
    if (adminCheck.rows.length === 0) {
      // Password: admin123
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        ['admin@claw.com', hash, 'Admin', 'admin']
      );
      console.log('✅ Default admin user created: admin@claw.com / admin123');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
