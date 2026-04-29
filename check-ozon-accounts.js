import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('正在查询 OZON 账号...\n');
    
    const result = await pool.query(`
      SELECT * FROM accounts 
      WHERE platform = 'ozon' 
      ORDER BY created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ 数据库中没有找到任何 OZON 账号记录');
    } else {
      console.log(`✅ 找到 ${result.rows.length} 个 OZON 账号:\n`);
      result.rows.forEach((row, i) => {
        console.log(`${i + 1}. 账号信息:`);
        Object.keys(row).forEach(key => {
          console.log(`   ${key}: ${row[key]}`);
        });
        console.log('');
      });
    }
    
    await pool.end();
  } catch(e) {
    console.error('查询失败:', e.message);
    process.exit(1);
  }
})();
