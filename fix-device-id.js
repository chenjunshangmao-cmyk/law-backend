// 修复device_id字段脚本
import pg from 'pg';
const { Pool } = pg;

const databaseUrl = 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db';

console.log('开始修复device_id字段问题...');

async function fixDeviceId() {
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');

    // 1. 检查shouqianba_terminals表结构
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'shouqianba_terminals' 
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 shouqianba_terminals表结构:');
    console.table(tableCheck.rows);

    // 2. 检查是否有数据
    const dataCheck = await client.query('SELECT * FROM shouqianba_terminals');
    console.log(`\n📊 表中现有记录数: ${dataCheck.rows.length}`);
    
    if (dataCheck.rows.length > 0) {
      console.log('现有数据:');
      console.table(dataCheck.rows);
    }

    // 3. 如果表是空的，插入测试数据
    if (dataCheck.rows.length === 0) {
      console.log('\n🔄 插入测试终端数据...');
      try {
        await client.query(`
          INSERT INTO shouqianba_terminals (terminal_sn, terminal_key, device_id, status)
          VALUES ($1, $2, $3, $4)
        `, ['91803325', '677da351628d3fe7664321669c3439b2', 'test-device-001', 'active']);
        
        console.log('✅ 已插入收钱吧测试终端');
      } catch (err) {
        console.log('⚠️  插入数据失败:', err.message);
        
        // 可能是device_id字段不允许null，先修改字段
        try {
          await client.query(`
            ALTER TABLE shouqianba_terminals 
            ALTER COLUMN device_id SET DEFAULT 'test-device-001'
          `);
          console.log('✅ 已设置device_id默认值');
          
          // 再次尝试插入
          await client.query(`
            INSERT INTO shouqianba_terminals (terminal_sn, terminal_key, status)
            VALUES ($1, $2, $3)
          `, ['91803325', '677da351628d3fe7664321669c3439b2', 'active']);
          
          console.log('✅ 已插入收钱吧测试终端（使用默认值）');
        } catch (err2) {
          console.log('❌ 修复失败:', err2.message);
        }
      }
    }

    client.release();
    console.log('\n🎉 device_id字段修复完成！');

  } catch (error) {
    console.error('❌ 数据库操作失败:', error.message);
  } finally {
    await pool.end();
  }
}

fixDeviceId().catch(console.error);