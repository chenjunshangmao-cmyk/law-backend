import pg from 'pg';
const pool = new pg.Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

const accounts = [
  { id: 'ozon-chenjun-trading', name: 'Chenjun Trading', cid: '253100', key: '97cbc32c-5a85-405e-8bf0-d45cb943acf1' },
  { id: 'ozon-chenjun-mall', name: 'Chenjun Mall', cid: '2838302', key: '3652be69-0a0b-4e3e-8510-83ad7b082529' },
  { id: 'ozon-qiming-trading', name: 'qiming Trading', cid: '3101652', key: '90356528-af82-42c1-81af-86fddec89224' }
];

for (const a of accounts) {
  await pool.query(
    'INSERT INTO accounts (id, user_id, platform, name, client_id, api_key, account_data) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING',
    [a.id, 'dd0a80ed-5721-44ff-bea1-3d3520c2968d', 'ozon', a.name, a.cid, a.key, '{}']
  );
  console.log('Inserted:', a.name);
}

const r = await pool.query('SELECT * FROM accounts');
console.log('Total accounts:', r.rows.length);
r.rows.forEach(a => console.log(' -', a.name));

await pool.end();
