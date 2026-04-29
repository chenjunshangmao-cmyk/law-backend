const { Pool } = require('./node_modules/pg');
const pool = new Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  // 1. 查表
  const tables = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public'");
  console.log('表:', tables.rows.map(r=>r.tablename));
  
  // 检查各表结构
  for (const tbl of ['users', 'youtube_authorizations']) {
    if (tables.rows.some(r => r.tablename === tbl)) {
      const cols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${tbl}'`);
      console.log(tbl + ' 列:', cols.rows.map(r=>r.column_name+'('+r.data_type+')').join(', '));
      const data = await pool.query(`SELECT * FROM ${tbl} LIMIT 5`);
      console.log(tbl + ' 数据:', data.rows.length, '条');
      data.rows.forEach(r => console.log(JSON.stringify(r)));
    }
  }

  // 创建 accounts 表（如果不存在）
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      platform VARCHAR(32) NOT NULL,
      name VARCHAR(255) NOT NULL,
      client_id VARCHAR(255),
      api_key TEXT,
      api_secret TEXT,
      username VARCHAR(255),
      email VARCHAR(255),
      password TEXT,
      credentials JSONB,
      status VARCHAR(32) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('accounts 表已创建/存在');
  
  // 插入测试数据
  // 先查 admin 用户的 id
  const admin = await pool.query("SELECT id FROM users WHERE email='admin@claw.com'");
  const adminId = admin.rows[0]?.id || 'unknown';
  console.log('admin id:', adminId);
  
  // 插入 OZON 账号
  await pool.query(`
    INSERT INTO accounts (id, user_id, platform, name, client_id, api_key, status)
    VALUES ($1, $2, 'ozon', 'Chenjun Trading', $3, $4, 'active')
    ON CONFLICT (id) DO UPDATE SET client_id=$3, api_key=$4, status='active', updated_at=NOW()
  `, ['ozon-2523100', adminId, '2523100', 'a19a928e-00dd-420c-ab4f-25bc66bf6f7f']);
  console.log('Chenjun Trading 已插入');
  
  // 验证
  const accts = await pool.query('SELECT * FROM accounts');
  console.log('accounts:', accts.rows.length, '条');
  accts.rows.forEach(r => console.log(JSON.stringify(r)));
  
  pool.end();
})();
