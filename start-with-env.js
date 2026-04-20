// 设置所有必要的环境变量
process.env.DATABASE_URL = 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db';
process.env.NODE_ENV = 'production';
process.env.PORT = '8089';
process.env.JWT_SECRET = 'claw-production-secret-2026-do-not-use-in-development-change-this-in-production';
process.env.JWT_EXPIRES_IN = '7d';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:3000,https://chenjuntrading.cn,https://api.chenjuntrading.cn';
process.env.AI_PROVIDER = 'bailian';
process.env.BAILIAN_API_KEY = 'sk-8a07c75081df49ac877d6950a95b06ec';
process.env.SHOUQIANBA_VENDOR_SN = '91803325';
process.env.SHOUQIANBA_VENDOR_KEY = '677da351628d3fe7664321669c3439b2';
process.env.SHOUQIANBA_APP_ID = '2026041600011122';
process.env.SHOUQIANBA_ACTIVATION_CODE = '66172491';
process.env.SHOUQIANBA_TERMINAL_SN = '91803325';
process.env.SHOUQIANBA_TERMINAL_KEY = '677da351628d3fe7664321669c3439b2';

console.log('启动Claw后端服务器（完整环境变量）...');
console.log('环境变量设置完成:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- JWT_SECRET 长度:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');

// 导入并启动服务器
import('./src/index.db.js').catch(err => {
  console.error('启动失败:', err.message);
  process.exit(1);
});