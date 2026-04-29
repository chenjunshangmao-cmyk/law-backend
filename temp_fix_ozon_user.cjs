const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // 把 3 个 OZON 账号绑定到 lyshlc@163.com
    const targetUserId = 'dd0a80ed-5721-44ff-bea1-3d3520c2968d';
    const ozonIds = ['ozon-chenjun-trading', 'ozon-chenjun-mall', 'ozon-qiming-trading'];
    
    for (const id of ozonIds) {
      await pool.query("UPDATE accounts SET user_id=$1, updated_at=NOW() WHERE id=$2", [targetUserId, id]);
      console.log(`Updated ${id} -> lyshlc@163.com`);
    }

    // 验证
    const r = await pool.query("SELECT id, name, user_id FROM accounts WHERE platform='ozon'");
    console.log("\n=== 最终结果 ===");
    console.log(JSON.stringify(r.rows, null, 2));
  } catch(e) {
    console.error(e.message);
  } finally {
    await pool.end();
  }
})();
