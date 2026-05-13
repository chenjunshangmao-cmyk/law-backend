const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});
c.connect().then(async () => {
  console.log('Connected to Render PG');
  const r = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('Tables:', r.rows.map(x => x.table_name).join(', '));
  
  const u = await c.query('SELECT id, email, name, role, membership_type, created_at FROM users');
  console.log('\nUsers (' + u.rows.length + '):');
  u.rows.forEach(x => console.log('  ' + x.id + ' | ' + x.email + ' | ' + x.name + ' | ' + x.membership_type + ' | ' + x.created_at));
  
  const o = await c.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 20');
  console.log('\nOrders (' + o.rows.length + '):');
  o.rows.forEach(x => console.log('  ' + x.order_no + ' | ' + x.user_email + ' | ' + x.amount + ' | ' + x.status + ' | ' + x.created_at));
  
  await c.end();
}).catch(e => console.log('Connect fail:', e.message));
