/**
 * 修复脚本：同步所有用户到 PostgreSQL
 * 1. 确保 users 表有 role 列
 * 2. 同步内置用户到 PG
 * 3. 同步 users.json 中的用户到 PG
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pool = new pg.Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false },
  max: 2,
});

const BCRYPT_ROUNDS = 12;

// 内置用户（与 auth.min.js BUILTIN_USERS 一致）
const BUILTIN = [
  { id: 'user-admin-001', email: 'admin@claw.com', name: '管理员', role: 'admin', plan: 'enterprise', password: 'admin123' },
  { id: 'user-demo-001', email: 'user@claw.com', name: '演示用户', role: 'user', plan: 'premium', password: 'user123' },
  { id: 'user-test-001', email: 'test@claw.com', name: '测试用户', role: 'user', plan: 'basic', password: 'test123' },
];

async function main() {
  console.log('=== 用户数据同步到 PostgreSQL ===\n');

  // 1. 确保 role 列存在
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'`);
    console.log('✅ role 列已就绪');
  } catch (e) {
    console.log('⚠️ role 列:', e.message);
  }

  // 2. 同步内置用户
  console.log('\n--- 同步内置用户 ---');
  for (const u of BUILTIN) {
    try {
      const hash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
      const existing = await pool.query('SELECT id, email FROM users WHERE email = $1', [u.email]);

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE users SET name=$1, membership_type=$2, role=$3, password=$4, updated_at=NOW() WHERE email=$5`,
          [u.name, u.plan, u.role, hash, u.email]
        );
        console.log(`  🔄 ${u.email} → 已更新 (${u.plan})`);
      } else {
        await pool.query(
          `INSERT INTO users (email, password, name, membership_type, role, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
          [u.email, hash, u.name, u.plan, u.role]
        );
        console.log(`  ✅ ${u.email} → 已创建 (${u.plan})`);
      }
    } catch (e) {
      console.log(`  ❌ ${u.email}: ${e.message}`);
    }
  }

  // 3. 同步 users.json 中的用户
  const jsonPath = path.join(process.cwd(), 'data', 'users.json');
  if (fs.existsSync(jsonPath)) {
    console.log('\n--- 同步 users.json 用户 ---');
    const jsonUsers = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    for (const u of jsonUsers) {
      try {
        const hash = u.hashedPassword || (u.password ? await bcrypt.hash(u.password, BCRYPT_ROUNDS) : null);
        if (!hash) { console.log(`  ⏭️ ${u.email} 无密码，跳过`); continue; }

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
        if (existing.rows.length > 0) {
          await pool.query(
            `UPDATE users SET name=$1, membership_type=$2, role=$3, password=$4, updated_at=NOW() WHERE email=$5`,
            [u.name || '', u.plan || 'free', u.role || 'user', hash, u.email]
          );
          console.log(`  🔄 ${u.email}`);
        } else {
          await pool.query(
            `INSERT INTO users (email, password, name, membership_type, role, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,
            [u.email, hash, u.name || '', u.plan || 'free', u.role || 'user']
          );
          console.log(`  ✅ ${u.email}`);
        }
      } catch (e) {
        console.log(`  ❌ ${u.email}: ${e.message}`);
      }
    }
  } else {
    console.log('\n⚠️ users.json 不存在，跳过');
  }

  // 4. 验证
  const count = await pool.query('SELECT COUNT(*) FROM users');
  const all = await pool.query('SELECT id, email, name, membership_type, role FROM users ORDER BY id');
  console.log(`\n=== 验证：共 ${count.rows[0].count} 个用户 ===`);
  all.rows.forEach(r => console.log(`  ID=${r.id} ${r.email} ${r.membership_type} [${r.role}]`));

  await pool.end();
  console.log('\n🎉 同步完成！');
}

main().catch(e => { console.error(e); pool.end(); process.exit(1); });
