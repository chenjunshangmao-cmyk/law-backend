import pg from 'pg';
const { Pool } = pg;
import bcrypt from 'bcryptjs';

async function main() {
  const pool = new Pool({ 
    connectionString: 'postgresql://claw_render:ClawRemote2026!@localhost:5432/claw?sslmode=disable' 
  });
  
  const hash = bcrypt.hashSync('ClawAdmin2026!', 10);
  
  await pool.query(`
    INSERT INTO users (id, email, password, name, role, membership_type, membership_expires_at, status) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET 
      email=EXCLUDED.email, name=EXCLUDED.name, role=EXCLUDED.role, 
      membership_type=EXCLUDED.membership_type, membership_expires_at=EXCLUDED.membership_expires_at
  `, ['user-admin-001', 'admin@claw.com', hash, '管理员', 'admin', 'flagship', '2099-12-31', 'active']);
  console.log('✅ admin@claw.com 已写入 (flagship/永久)');
  
  await pool.query(`
    INSERT INTO users (id, email, password, name, role, membership_type, membership_expires_at, status) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET 
      email=EXCLUDED.email, name=EXCLUDED.name, role=EXCLUDED.role, 
      membership_type=EXCLUDED.membership_type, membership_expires_at=EXCLUDED.membership_expires_at
  `, ['user-demo-001', 'user@claw.com', hash, '演示用户', 'user', 'premium', '2027-05-13', 'active']);
  console.log('✅ user@claw.com 已写入 (premium)');
  
  const r = await pool.query('SELECT id, email, name, membership_type, membership_expires_at FROM users');
  console.log('\n当前用户表:');
  console.table(r.rows);
  
  await pool.end();
}

main().catch(e => {
  console.error('❌', e.message);
  process.exit(1);
});
