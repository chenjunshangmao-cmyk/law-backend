const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // 1. 先查用户
    const users = await pool.query("SELECT id, email FROM users");
    console.log("=== 用户列表 ===");
    console.log(JSON.stringify(users.rows, null, 2));

    // 2. 查已有账号
    const existing = await pool.query("SELECT id, name, platform FROM accounts WHERE platform='ozon'");
    console.log("\n=== 已有 OZON 账号 ===");
    console.log(JSON.stringify(existing.rows, null, 2));

    if (existing.rows.length < 3) {
      // 3. 用第一个用户 ID
      // 使用 lyshlc@163.com 的用户 ID (dd0a80ed)
const userId = 'dd0a80ed-5721-44ff-bea1-3d3520c2968d';
      if (!userId) {
        console.log("没有用户");
        return;
      }

      const ozonAccounts = [
        { id: 'ozon-chenjun-trading', name: 'Chenjun Trading', client_id: '253100', api_key: '97cbc32c-5a85-405e-8bf0-d45cb943acf1' },
        { id: 'ozon-chenjun-mall', name: 'Chenjun Mall', client_id: '2838302', api_key: '3652be69-0a0b-4e3e-8510-83ad7b082529' },
        { id: 'ozon-qiming-trading', name: 'qiming Trading', client_id: '3101652', api_key: '90356528-af82-42c1-81af-86fddec89224' }
      ];

      for (const acc of ozonAccounts) {
        // 更新 user_id 为 lyshlc@163.com
        await pool.query(
          `UPDATE accounts SET user_id=$1, updated_at=NOW() WHERE id=$2`,
          [userId, acc.id]
        );
        console.log(`✓ 已更新归属: ${acc.name} -> lyshlc@163.com`);
      }
    }

    // 4. 验证
    const after = await pool.query("SELECT id, name, platform, client_id, status, user_id FROM accounts WHERE platform='ozon'");
    console.log("\n=== 插入后 OZON 账号 ===");
    console.log(JSON.stringify(after.rows, null, 2));

    const all = await pool.query("SELECT platform, COUNT(*) FROM accounts GROUP BY platform");
    console.log("\n=== 全部平台账号 ===");
    console.log(JSON.stringify(all.rows, null, 2));

  } catch(e) {
    console.error("Error:", e.message);
  } finally {
    await pool.end();
  }
})();
