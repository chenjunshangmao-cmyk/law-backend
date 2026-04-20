// 检查数据库中的用户
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, email, member_id FROM users');
    console.log('数据库中的用户:');
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, 邮箱: ${row.email}, member_id: ${row.member_id}`);
    });
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsers().catch(console.error);