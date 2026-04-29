const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    const r = await pool.query("SELECT id, name, platform, client_id, status, user_id, created_at FROM accounts WHERE platform='ozon'");
    console.log("=== OZON 账号 ===");
    console.log(JSON.stringify(r.rows, null, 2));

    const a = await pool.query("SELECT platform, COUNT(*) FROM accounts GROUP BY platform");
    console.log("\n=== 各平台账号 ===");
    console.log(JSON.stringify(a.rows, null, 2));
  } catch(e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
})();
