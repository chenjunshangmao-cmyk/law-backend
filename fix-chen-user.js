// 修复：手动将 chenjunshangmao@163.com 用户同步到 PostgreSQL
import pg from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

// 从本地 JSON 读取用户信息（含 bcrypt hash）
const usersFile = path.join(__dirname, 'data', 'users.json');
const localUsers = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
const targetUser = localUsers.find(u => u.email === 'chenjunshangmao@163.com');

if (!targetUser) {
  console.error('❌ 本地 JSON 中未找到 chenjunshangmao@163.com');
  process.exit(1);
}

console.log('✅ 找到本地用户:', targetUser.email);

async function fixUser() {
  const client = await pool.connect();
  try {
    // 检查 PG 中是否已存在
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [targetUser.email]);
    if (existing.rows.length > 0) {
      console.log('⚠️ 用户已在 PG 中，ID:', existing.rows[0].id);
      // 更新密码（使用本地 hash）
      await client.query(
        'UPDATE users SET name=$1, password=$2, updated_at=NOW() WHERE email=$3',
        [targetUser.name, targetUser.hashedPassword, targetUser.email]
      );
      console.log('✅ 密码已更新');
      console.log('⚠️ 跳过 quotas 更新（无需修改）');
    } else {
      // 生成 UUID 作为 id
      const { v4: uuidv4 } = await import('uuid');
      const newId = uuidv4();
      console.log('   生成新 UUID:', newId);

      // 插入新用户
      await client.query(
        `INSERT INTO users (id, email, name, password, membership_type, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          newId,
          targetUser.email,
          targetUser.name,
          targetUser.hashedPassword,
          targetUser.plan || 'free',
          new Date().toISOString()
        ]
      );
      console.log('✅ 用户已插入 PG');

      // 创建 quotas 记录（先检查是否存在）
      const existingQuota = await client.query('SELECT id FROM quotas WHERE user_id = $1', [newId]);
      if (existingQuota.rows.length === 0) {
        await client.query(
          `INSERT INTO quotas (user_id, text_limit, text_generations, image_limit, image_generations, products_limit)
           VALUES ($1, 50, 0, 20, 0, 100)`,
          [newId]
        );
        console.log('✅ quotas 记录已创建');
      } else {
        console.log('⚠️ quotas 记录已存在，跳过');
      }
    }

    console.log('\n🎉 修复完成！用户 chenjunshangmao@163.com 可以正常登录了。');
    console.log('（密码与本地 JSON 中相同）');

  } finally {
    client.release();
    await pool.end();
  }
}

fixUser().catch(err => {
  console.error('❌ 修复失败:', err.message);
  process.exit(1);
});
