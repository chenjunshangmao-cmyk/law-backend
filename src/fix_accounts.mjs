import pg from 'pg';
const pool = new pg.Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

try {
  // Create accounts table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
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
    )
  `);
  console.log('accounts table ready');

  // Get the user id for admin and lyshlc
  const admin = await pool.query("SELECT id FROM users WHERE email = 'admin@claw.com'");
  const user = await pool.query("SELECT id FROM users WHERE email = 'lyshlc@163.com'");
  
  const adminId = admin.rows[0]?.id || 'user-admin-001';
  const userId = user.rows[0]?.id || adminId;
  
  console.log('admin ID:', adminId);
  console.log('user ID:', userId);

  // Insert 3 OZON accounts for both users
  const accounts = [
    { id: 'ozon-chenjun-trading', user_id: adminId, platform: 'ozon', name: 'Chenjun Trading', client_id: '253100', api_key: '97cbc32c-5a85-405e-8bf0-d45cb943acf1' },
    { id: 'ozon-chenjun-mall', user_id: adminId, platform: 'ozon', name: 'Chenjun Mall', client_id: '2838302', api_key: '3652be69-0a0b-4e3e-8510-83ad7b082529' },
    { id: 'ozon-qiming-trading', user_id: adminId, platform: 'ozon', name: 'qiming Trading', client_id: '3101652', api_key: '90356528-af82-42c1-81af-86fddec89224' },
  ];

  for (const a of accounts) {
    await pool.query(
      'INSERT INTO accounts (id, user_id, platform, name, client_id, api_key) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, client_id=EXCLUDED.client_id, api_key=EXCLUDED.api_key',
      [a.id, a.user_id, a.platform, a.name, a.client_id, a.api_key]
    );
    console.log('Inserted:', a.name);
  }

  // Verify
  const result = await pool.query('SELECT * FROM accounts');
  console.log('Total accounts:', result.rows.length);
  result.rows.forEach(r => console.log(' -', r.name, '(' + r.platform + ') userId:', r.user_id));
  
} catch(e) {
  console.error('Error:', e.message);
}
await pool.end();
