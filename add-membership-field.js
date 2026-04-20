// 添加membership_type字段脚本
import pg from 'pg';
const { Pool } = pg;

const databaseUrl = 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db';

console.log('开始添加membership_type字段...');

async function addMembershipField() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');

    // 1. 添加membership_type字段
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_type VARCHAR(20) DEFAULT 'free'
      `);
      console.log('✅ membership_type字段已添加/已存在');
    } catch (err) {
      console.log('⚠️  membership_type字段可能已存在或出错:', err.message);
    }

    // 2. 检查当前表结构
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 更新后的users表结构:');
    console.table(res.rows);

    client.release();
    console.log('\n🎉 membership_type字段添加完成！');

  } catch (error) {
    console.error('❌ 数据库操作失败:', error.message);
  } finally {
    await pool.end();
  }
}

addMembershipField().catch(console.error);