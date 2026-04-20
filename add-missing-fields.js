// 添加缺失字段脚本
import pg from 'pg';
const { Pool } = pg;

const databaseUrl = 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db';

console.log('开始添加缺失字段...');

async function addMissingFields() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');

    // 1. 添加hip_type字段
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS hip_type VARCHAR(20)
      `);
      console.log('✅ hip_type字段已添加/已存在');
    } catch (err) {
      console.log('⚠️  hip_type字段可能已存在或出错:', err.message);
    }

    // 2. 添加ownership_type字段
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(20)
      `);
      console.log('✅ ownership_type字段已添加/已存在');
    } catch (err) {
      console.log('⚠️  ownership_type字段可能已存在或出错:', err.message);
    }

    // 3. 检查当前表结构
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 更新后的users表结构:');
    console.table(res.rows);

    client.release();
    console.log('\n🎉 缺失字段添加完成！');

  } catch (error) {
    console.error('❌ 数据库操作失败:', error.message);
  } finally {
    await pool.end();
  }
}

addMissingFields().catch(console.error);