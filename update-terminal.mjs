import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('=== 查看当前终端 ===');
  const res = await pool.query("SELECT * FROM shouqianba_terminals LIMIT 5");
  console.log(JSON.stringify(res.rows, null, 2));

  console.log('\n=== 更新终端为正确值 ===');
  const updated = await pool.query(`
    INSERT INTO shouqianba_terminals (terminal_sn, terminal_key, device_id, status)
    VALUES ('100111220054361978', 'bb02eea086bd071fc5c31ea980e008d2', 'claw-web-new1', 'active')
    ON CONFLICT (terminal_sn)
    DO UPDATE SET terminal_key = 'bb02eea086bd071fc5c31ea980e008d2',
                   device_id = 'claw-web-new1',
                   status = 'active',
                   last_checkin_at = NOW()
    RETURNING *
  `);
  console.log('更新结果:', JSON.stringify(updated.rows, null, 2));

  await pool.end();
  console.log('\n✅ 完成！');
}

main().catch(e => { console.error(e); process.exit(1); });
