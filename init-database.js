// 初始化数据库脚本
import pg from 'pg';
const { Pool } = pg;

const databaseUrl = 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db';

console.log('开始初始化数据库...');

async function initDatabase() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');

    // 1. 创建users表（如果不存在）
    await client.query(`
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
    console.log('✅ users表已创建/已存在');

    // 2. 添加member_id列（如果不存在）
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id VARCHAR(20) UNIQUE
      `);
      console.log('✅ member_id列已添加/已存在');
    } catch (err) {
      console.log('⚠️  member_id列可能已存在:', err.message);
    }

    // 3. 检查是否有admin用户
    const userCheck = await client.query('SELECT * FROM users WHERE email = $1', ['admin@claw.com']);
    
    if (userCheck.rows.length === 0) {
      // 创建admin用户
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await client.query(`
        INSERT INTO users (email, password, name, membership_type, member_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
      `, ['admin@claw.com', hashedPassword, '管理员', 'enterprise', 'ADMIN001']);
      
      console.log('✅ 已创建admin用户');
    } else {
      console.log('✅ admin用户已存在');
    }

    // 4. 创建payment_orders表
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_orders (
        id SERIAL PRIMARY KEY,
        order_no VARCHAR(50) UNIQUE NOT NULL,
        shouqianba_sn VARCHAR(50),
        user_id VARCHAR(100) NOT NULL,
        plan_type VARCHAR(30),
        plan_name VARCHAR(50),
        amount INTEGER NOT NULL DEFAULT 0,
        subject VARCHAR(255),
        notify_url VARCHAR(500),
        return_url VARCHAR(500),
        expired_at TIMESTAMP,
        client_ip VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        payway VARCHAR(20),
        trade_no VARCHAR(100),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ payment_orders表已创建/已存在');

    // 5. 创建shouqianba_terminals表
    await client.query(`
      CREATE TABLE IF NOT EXISTS shouqianba_terminals (
        id SERIAL PRIMARY KEY,
        terminal_sn VARCHAR(50) UNIQUE NOT NULL,
        terminal_key VARCHAR(100) NOT NULL,
        device_id VARCHAR(100) DEFAULT 'test-device-001',
        status VARCHAR(20) DEFAULT 'active',
        last_checkin_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ shouqianba_terminals表已创建/已存在');

    // 6. 插入测试终端数据
    const terminalCheck = await client.query('SELECT * FROM shouqianba_terminals WHERE terminal_sn = $1', ['91803325']);
    
    if (terminalCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO shouqianba_terminals (terminal_sn, terminal_key, device_id, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (terminal_sn) DO NOTHING
      `, ['91803325', '677da351628d3fe7664321669c3439b2', 'test-device-001', 'active']);
      
      console.log('✅ 已插入收钱吧测试终端');
    } else {
      console.log('✅ 收钱吧测试终端已存在');
    }

    // 7. 创建quotas表
    await client.query(`
      CREATE TABLE IF NOT EXISTS quotas (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        plan_type VARCHAR(20) DEFAULT 'free',
        daily_generate INTEGER DEFAULT 5,
        total_products INTEGER DEFAULT 20,
        ai_calls_per_day INTEGER DEFAULT 20,
        automation_tasks INTEGER DEFAULT 2,
        used_daily_generate INTEGER DEFAULT 0,
        used_total_products INTEGER DEFAULT 0,
        used_ai_calls INTEGER DEFAULT 0,
        used_automation_tasks INTEGER DEFAULT 0,
        reset_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);
    console.log('✅ quotas表已创建/已存在');

    client.release();
    console.log('\n🎉 数据库初始化完成！');
    console.log('可以重新启动后端服务测试会员和支付功能。');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
  } finally {
    await pool.end();
  }
}

initDatabase().catch(console.error);