// 查询 Render 上 data/users.json 的内容
const https = require('https');

const req = https.request({
  hostname: 'claw-backend-2026.onrender.com',
  port: 443,
  path: '/api/debug/users',
  method: 'GET'
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('状态:', res.statusCode);
    try {
      const j = JSON.parse(d);
      console.log('用户数:', j.count);
      if (j.users) {
        j.users.forEach(u => {
          console.log('---');
          console.log('  id:', u.id);
          console.log('  email:', u.email);
          console.log('  token字段类型:', typeof u.token);
          console.log('  token长度:', u.token ? JSON.stringify(u.token).length : 0);
          console.log('  token前100字符:', typeof u.token === 'string' ? u.token.slice(0, 100) : JSON.stringify(u.token).slice(0, 100));
          console.log('  password字段存在:', 'password' in u);
          console.log('  password长度:', u.password ? u.password.length : 0);
        });
      }
    } catch (e) {
      console.log('原始响应:', d.slice(0, 500));
    }
  });
});
req.end();
