// 数据库迁移脚本：添加会员相关字段
// 运行一次：node migrate-add-member-id.js
// 需要设置 DATABASE_URL 环境变量
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function generateMemberId() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `M${y}${m}${day}${rand}`;
}

async function migrate() {
  console.log('[迁移] 开始检查并添加会员字段...');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. 添加 membership_type 列（如果没有）
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_type VARCHAR(20) DEFAULT 'free'
      `);
      console.log('[迁移] ✅ membership_type 列就绪');
    } catch (e) { /* 已存在 */ }

    // 2. 添加 membership_expires_at 列（如果没有）
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMP
      `);
      console.log('[迁移] ✅ membership_expires_at 列就绪');
    } catch (e) { /* 已存在 */ }

    // 3. 添加 member_id 列（如果没有）
    try {
      await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id VARCHAR(20) UNIQUE
      `);
      console.log('[迁移] ✅ member_id 列就绪');
    } catch (e) { /* 已存在 */ }

    // 4. 为缺少 member_id 的用户分配（按注册顺序）
    const nullUsers = await client.query(`
      SELECT id FROM users WHERE member_id IS NULL ORDER BY created_at ASC
    `);
    console.log(`[迁移] 发现 ${nullUsers.rows.length} 个用户缺少 member_id`);

    for (let i = 0; i < nullUsers.rows.length; i++) {
      const row = nullUsers.rows[i];
      const seq = String(i + 1).padStart(4, '0');
      const date = new Date();
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const memberId = `M${y}${m}${day}${seq}`;
      
      await client.query(
        'UPDATE users SET member_id = $1 WHERE id = $2',
        [memberId, row.id]
      );
      console.log(`  用户 ${row.id.slice(0, 8)}... → ${memberId}`);
    }

    // 5. 把旧 plan 列同步到 membership_type（如果有 plan 列的话）
    try {
      const planCol = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'plan'
      `);
      if (planCol.rows.length > 0) {
        await client.query(`
          UPDATE users SET membership_type = plan WHERE membership_type = 'free' AND plan IS NOT NULL
        `);
        console.log('[迁移] ✅ plan → membership_type 同步完成');
      }
    } catch (e) { /* 无 plan 列 */ }

    await client.query('COMMIT');
    console.log('[迁移] ✅ 全部完成！');
    
    // 展示结果
    const result = await pool.query('SELECT id, email, member_id, membership_type, created_at FROM users ORDER BY created_at');
    console.log('\n=== 会员列表 ===');
    result.rows.forEach(u => {
      console.log(`${u.member_id || '(无)'}  ${u.email}  plan:${u.membership_type}  注册:${u.created_at?.toISOString().slice(0,10)}`);
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[迁移] ❌ 失败:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
