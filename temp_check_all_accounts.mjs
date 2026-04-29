import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // 查 lyshlc@163.com 的所有账号
    const r = await pool.query(
      `SELECT id, name, platform, status, created_at 
       FROM accounts 
       WHERE user_id = $1
       ORDER BY platform, name`,
      ['dd0a80ed-5721-44ff-bea1-3d3520c2968d']
    );
    console.log("=== lyshlc@163.com 的全部账号 ===");
    console.log(JSON.stringify(r.rows, null, 2));
  } catch(e) {
    console.error(e.message);
  } finally {
    await pool.end();
  }
})();
