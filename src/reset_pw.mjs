import pg from 'pg';
import bcrypt from 'bcryptjs';
const pool = new pg.Pool({
  connectionString: 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db',
  ssl: { rejectUnauthorized: false }
});

const r = await pool.query("SELECT email, password FROM users WHERE email='lyshlc@163.com'");
const hash = r.rows[0]?.password;
console.log('Hash:', hash);

const tests = ['lyshlc888', 'liyi123', '123456', 'lyshlc', 'claw2026', 'admin123', 'Lyshlc888', 'qiming2026'];
for (const pw of tests) {
  const match = await bcrypt.compare(pw, hash);
  console.log(`"${pw}": ${match}`);
}

// Reset password to lyshlc123
const newHash = await bcrypt.hash('lyshlc123', 12);
await pool.query("UPDATE users SET password=$1 WHERE email='lyshlc@163.com'", [newHash]);
console.log('Password reset to: lyshlc123');

await pool.end();
