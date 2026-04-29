import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

try {
  // List all tables
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));
  
  for (const t of tables.rows) {
    const count = await pool.query(`SELECT COUNT(*) FROM "${t.table_name}"`);
    console.log(t.table_name + ': ' + count.rows[0].count + ' rows');
    
    // Show schema for this table
    const cols = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_schema='public' AND table_name=$1
    `, [t.table_name]);
    console.log('  Columns:', cols.rows.map(c => c.column_name + ' (' + c.data_type + ')').join(', '));
  }
} catch(e) {
  console.error('Error:', e.message);
}
await pool.end();
