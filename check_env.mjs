import fs from 'fs';
// 看 auth.min.js 里的 findUserByEmailPG - 这个查的是 PostgreSQL 的 users 表
// 但我之前注册的 lyshlc@163.com 是新注册的
// 问题可能是：WorkBuddy 时期的数据库连接不一样
// 看看 .env
try {
  const env = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/.env', 'utf-8');
  const lines = env.split('\n').filter(l => l.includes('DATABASE') || l.includes('PG') || l.includes('DB'));
  console.log('DB config:', lines.join('\n'));
} catch(e) {
  console.log('No .env:', e.message);
}
console.log('\n---');
// 看看 backend/.env
try {
  const env2 = fs.readFileSync('C:/Users/Administrator/WorkBuddy/Claw/backend/.env', 'utf-8');
  const lines2 = env2.split('\n').filter(l => l.includes('DATABASE') || l.includes('PG') || l.includes('DB'));
  console.log('backend/.env DB:', lines2.join('\n'));
} catch(e) {
  console.log('No backend/.env:', e.message);
}
// 看 Render 的环境变量在代码里怎么取的
const idx = c.indexOf('process.env');
if (idx > 0) {
  const envRefs = c.substring(0, idx+2000).match(/process\.env\.\w+/g);
  if (envRefs) console.log('\nEnv refs:', [...new Set(envRefs)].join(', '));
}
