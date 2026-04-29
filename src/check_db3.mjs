import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

try {
  const r = await pool.query('SELECT * FROM youtube_authorizations');
  console.log('youtube_authorizations:', JSON.stringify(r.rows, null, 2));
  
  // Also check if there's an accounts table in PG
  try {
    const acc = await pool.query('SELECT * FROM accounts');
    console.log('accounts:', JSON.stringify(acc.rows, null, 2));
  } catch(e) {
    console.log('No accounts table in PG:', e.message);
  }
} catch(e) {
  console.error('Error:', e.message);
}
await pool.end();
