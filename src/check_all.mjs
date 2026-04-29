import pg from 'pg';
const pool = new pg.Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

// Check all users
const users = await pool.query('SELECT id, email, name, plan, member_id, membership_type, membership_expires_at FROM users');
console.log('=== Users ===');
users.rows.forEach(u => console.log(`[${u.email}] name=${u.name} plan=${u.plan} member_id=${u.member_id} type=${u.membership_type} expires=${u.membership_expires_at}`));

// Check accounts table
const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
console.log('\n=== Tables ===');
tables.rows.forEach(t => console.log(t.table_name));

// Check accounts if exist
try {
  const r = await pool.query('SELECT * FROM accounts');
  console.log('\n=== Accounts (' + r.rows.length + ') ===');
  r.rows.forEach(a => console.log(`[${a.name}] platform=${a.platform} user_id=${a.user_id} status=${a.status}`));
} catch(e) {
  console.log('\n=== Accounts table error: ' + e.message + ' ===');
  // try recreate
  await pool.query(`CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    platform VARCHAR(32) NOT NULL,
    name VARCHAR(255),
    client_id VARCHAR(255),
    api_key TEXT,
    account_data JSONB,
    status VARCHAR(32) DEFAULT 'active',
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);
  console.log('Recreated accounts table');
}

await pool.end();
