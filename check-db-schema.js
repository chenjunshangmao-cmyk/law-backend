// 查询数据库 users 表实际有哪些列
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    // 查询列信息
    const cols = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('=== users 表结构 ===');
    cols.rows.forEach(r => {
      console.log(`${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable}) default: ${r.column_default}`);
    });
    
    // 查现有用户 sample
    const users = await pool.query('SELECT * FROM users LIMIT 3');
    console.log('\n=== 现有用户 sample ===');
    console.log(JSON.stringify(users.rows, null, 2));
    
    // 检查缺少 member_id 的用户
    const nullMemberId = await pool.query('SELECT COUNT(*) FROM users WHERE member_id IS NULL');
    console.log(`\n缺少 member_id 的用户数: ${nullMemberId.rows[0].count}`);
    
  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
