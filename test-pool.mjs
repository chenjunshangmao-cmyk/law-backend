// 测试 pool 导入
import { pool } from './src/config/database.js';
console.log('pool:', pool ? 'defined' : 'NULL');
console.log('pool.constructor.name:', pool?.constructor?.name);
console.log('pool.query:', typeof pool?.query);

if (!pool) {
  console.error('❌ pool is NULL - cannot query');
} else {
  try {
    const r = await pool.query('SELECT 1 as test');
    console.log('✅ PostgreSQL连接OK:', r.rows[0]);
  } catch(e) {
    console.error('❌ 查询失败:', e.message);
    console.error('error code:', e.code);
  }
}
