import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});
async function check() {
  const client = await pool.connect();
  try {
    const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'quotas'");
    console.log('quotas 表结构:', JSON.stringify(cols.rows, null, 2));
    const indexes = await client.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'quotas'");
    console.log('quotas 索引:', JSON.stringify(indexes.rows, null, 2));
    const users = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.log('users 表结构:', JSON.stringify(users.rows.filter(r => ['id','email'].includes(r.column_name)), null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}
check().catch(console.error);
