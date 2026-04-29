import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

try {
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));
  
  for (const t of tables.rows) {
    const count = await pool.query('SELECT COUNT(*) FROM "' + t.table_name + '"');
    console.log(t.table_name + ': ' + count.rows[0].count + ' rows');
  }
} catch(e) {
  console.error('Error:', e.message);
}
await pool.end();
