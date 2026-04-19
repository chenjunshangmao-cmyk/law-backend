// 诊断：检查服务器上 JSON 文件中是否有注册用户
const https = require('https');
const http = require('http');

// 注册用户并解码token
const TS = Date.now();
const EMAIL = `diag_${TS}@t.com`;
const body = JSON.stringify({ email: EMAIL, password: 'test123', name: '诊断' });

const req = https.request({
  hostname: 'claw-backend-2026.onrender.com', port: 443,
  path: '/api/auth/register', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, res => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', async () => {
    const r = JSON.parse(d);
    const token = r.data && r.data.token;
    console.log('注册状态:', res.statusCode);
    if (!token) { console.log('注册失败'); return; }

    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const userId = payload.userId;
    console.log('用户ID:', userId);

    // 直接调用 authMiddleware 模拟：解码token后查用户
    // 通过 /api/auth/me 端点（如果有的话）
    const me = await new Promise(res2 => {
      const req2 = https.request({
        hostname: 'claw-backend-2026.onrender.com', port: 443,
        path: '/api/auth/me', method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
      }, res2);
      req2.on('response', res2 => {
        let d2 = ''; res2.on('data', c => d2 += c);
        res2.on('end', () => res2({ status: res2.statusCode, body: d2 }));
      });
      req2.end();
    });
    console.log('/api/auth/me:', me.status, me.body.slice(0, 200));

    // 测试 membership
    const r2 = await new Promise(res2 => {
      const req2 = https.request({
        hostname: 'claw-backend-2026.onrender.com', port: 443,
        path: '/api/membership/create', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
      }, res2);
      let d2 = ''; res2.on('data', c => d2 += c);
      res2.on('end', () => res2({ status: res2.statusCode, body: d2 }));
      req2.write(JSON.stringify({ plan: 'basic' })); req2.end();
    });
    console.log('membership/create:', r2.status, r2.body.slice(0, 200));
  });
});
req.write(body); req.end();
