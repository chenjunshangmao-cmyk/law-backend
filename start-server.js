// 设置环境变量
process.env.DATABASE_URL = 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db';
process.env.NODE_ENV = 'production';
process.env.PORT = '8089';

console.log('启动Claw后端服务器...');
console.log('数据库URL:', process.env.DATABASE_URL ? '已设置' : '未设置');
console.log('端口:', process.env.PORT);

// 导入并启动服务器
import('./src/index.db.js').catch(err => {
  console.error('启动失败:', err.message);
  process.exit(1);
});