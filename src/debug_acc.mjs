import pg from 'pg';
const pool = new pg.Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});
const r = await pool.query("SELECT * FROM accounts WHERE user_id = 'dd0a80ed-5721-44ff-bea1-3d3520c2968d'");
console.log('Raw accounts:', JSON.stringify(r.rows, null, 2));
r.rows.forEach(a => {
  console.log('account_name:', a.account_name);
  console.log('name:', a.name);
  console.log('account_data:', JSON.stringify(a.account_data));
  console.log('account_data?.username:', a.account_data?.username);
  console.log('account_data?.status:', a.account_data?.status);
});
await pool.end();
