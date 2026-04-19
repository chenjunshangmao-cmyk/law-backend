// 测试 pool 导入和查询
const { createRequire } = require('module');
const require = createRequire(import.meta.url || __filename);

// 测试 database.js 导出
import('../src/config/database.js')
  .then(m => {
    console.log('pool type:', typeof m.pool);
    console.log('pool exists:', !!m.pool);
    console.log('sequelize type:', typeof m.sequelize);
    return m.pool.query('SELECT 1 as test');
  })
  .then(r => console.log('✅ 查询成功:', r.rows[0]))
  .catch(e => console.error('❌ 错误:', e.message));
