import pg from 'pg';
const pool = new pg.Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

// Check accounts table schema
const schema = await pool.query(`
  SELECT column_name, data_type, character_maximum_length
  FROM information_schema.columns
  WHERE table_name = 'accounts'
  ORDER BY ordinal_position
`);
console.log('Accounts columns:');
schema.rows.forEach(c => console.log(' ', c.column_name, c.data_type, c.character_maximum_length || ''));

// Insert directly
try {
  const result = await pool.query(`
    INSERT INTO accounts (id, user_id, platform, name, client_id, api_key, account_data)
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
  `, ['ozon-chenjun-trading', 'dd0a80ed-5721-44ff-bea1-3d3520c2968d', 'ozon', 'Chenjun Trading', '253100', '97cbc32c-5a85-405e-8bf0-d45cb943acf1', '{}']);
  console.log('Insert OK:', result.rowCount);
} catch(e) {
  console.log('Insert error:', e.message);
}

// Final check
const r = await pool.query('SELECT * FROM accounts');
console.log('Total accounts:', r.rows.length);
r.rows.forEach(a => console.log(' -', a.id, a.name, a.platform));

await pool.end();
