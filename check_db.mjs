import pg from 'pg';
const { Client } = pg;
const client = new Client({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected to Render PG');
  
  // 列出所有表
  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  );
  const allTables = tables.rows.map(r => r.table_name);
  console.log('Tables:', allTables.join(', '));
  
  // 查 users
  if (allTables.includes('users')) {
    const users = await client.query('SELECT * FROM users');
    console.log('\nUsers:', JSON.stringify(users.rows, null, 2));
    console.log('User count:', users.rows.length);
  } else {
    console.log('\nNo users table!');
  }
  
  // 查 orders
  if (allTables.includes('orders')) {
    const orders = await client.query('SELECT * FROM orders ORDER BY created_at DESC');
    console.log('\nOrders (' + orders.rows.length + '):', JSON.stringify(orders.rows.slice(0, 10), null, 2));
  } else {
    console.log('\nNo orders table');
    // 看看有哪些表有 order 相关数据
    const orderTables = allTables.filter(t => t.includes('order') || t.includes('payment'));
    if (orderTables.length > 0) console.log('Order-related tables:', orderTables.join(', '));
  }
  
  await client.end();
}
run().catch(e => console.log('Error:', e.message));
