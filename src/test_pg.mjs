import pg from 'pg';
const pool = new pg.Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

try {
  const r = await pool.query('SELECT * FROM accounts WHERE user_id = $1', ['user-admin-001']);
  console.log('Found:', r.rows.length);
  console.log(JSON.stringify(r.rows, null, 2));
} catch(e) {
  console.error('Error:', e.message);
}
await pool.end();
