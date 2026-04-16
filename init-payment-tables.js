/**
 * 初始化支付相关数据库表
 */

import pool from './src/config/database.js';

async function initPaymentTables() {
  try {
    console.log('开始初始化支付相关表...\n');

    // 1. 创建支付订单表
    console.log('1. 创建 payment_orders 表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_orders (
        id SERIAL PRIMARY KEY,
        order_no VARCHAR(64) UNIQUE NOT NULL,
        shouqianba_sn VARCHAR(64),
        user_id VARCHAR(64) NOT NULL,
        plan_type VARCHAR(32) NOT NULL,
        plan_name VARCHAR(64) NOT NULL,
        amount INTEGER NOT NULL,
        status VARCHAR(32) DEFAULT 'pending',
        payway VARCHAR(32),
        payway_name VARCHAR(32),
        client_ip VARCHAR(64),
        subject VARCHAR(256),
        notify_url TEXT,
        return_url TEXT,
        paid_at TIMESTAMP,
        expired_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ payment_orders 表创建成功\n');

    // 2. 创建收钱吧终端表
    console.log('2. 创建 shouqianba_terminals 表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shouqianba_terminals (
        id SERIAL PRIMARY KEY,
        terminal_sn VARCHAR(64) UNIQUE NOT NULL,
        terminal_key VARCHAR(128) NOT NULL,
        device_id VARCHAR(128) NOT NULL,
        store_sn VARCHAR(64),
        merchant_id VARCHAR(64),
        status VARCHAR(32) DEFAULT 'active',
        last_checkin_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ shouqianba_terminals 表创建成功\n');

    // 3. 创建索引
    console.log('3. 创建索引...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
      CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at);
    `);
    console.log('   ✅ 索引创建成功\n');

    console.log('🎉 所有支付相关表初始化完成！');
    console.log('\n下一步：');
    console.log('1. 配置环境变量（SHOUQIANBA_VENDOR_SN, SHOUQIANBA_VENDOR_KEY, SHOUQIANBA_APP_ID）');
    console.log('2. 激活收钱吧终端（运行激活脚本）');
    console.log('3. 在 index.db.js 中注册 payment 路由');

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initPaymentTables();
