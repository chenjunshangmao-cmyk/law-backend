import pg from 'pg';
const pool = new pg.Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

// Check user
const r = await pool.query('SELECT * FROM users WHERE email = $1', ['lyshlc@163.com']);
console.log('User:', JSON.stringify(r.rows, null, 2));

// Check accounts for this user
const id = r.rows[0]?.id;
if (id) {
  const a = await pool.query('SELECT * FROM accounts WHERE user_id = $1', [id]);
  console.log('Accounts:', JSON.stringify(a.rows, null, 2));
}

// Check if accounts table exists
const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
console.log('Tables:', tables.rows.map(t => t.table_name).join(', '));

await pool.end();
