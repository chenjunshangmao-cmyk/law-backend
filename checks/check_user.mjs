import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    // 查这个邮箱
    const r = await pool.query("SELECT id, email, username, role, flags, membership_tier, created_at FROM users WHERE email = 'lyshlc@163.com'");
    if (r.rows.length > 0) {
      console.log('找到用户:', JSON.stringify(r.rows[0], null, 2));
    } else {
      console.log('未找到: lyshlc@163.com');
      // 查所有邮箱搜线索
      const all = await pool.query("SELECT id, email, username, role FROM users ORDER BY id");
      console.log('\n所有用户:');
      all.rows.forEach(u => console.log(`  #${u.id} ${u.email} (${u.username}) [${u.role}]`));
    }
  } catch(e) {
    console.error('查询失败:', e.message);
  }
  await pool.end();
}
main();
