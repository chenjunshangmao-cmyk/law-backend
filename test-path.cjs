// 完整诊断测试：注册 → 解码token → 测试各端点
const https = require('https');
const path = require('path');

const TS = Date.now();
const EMAIL = `diag2_${TS}@t.com`;

// 注册
function api(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const b = body ? JSON.stringify(body) : '';
    const req = https.request({
      hostname: 'claw-backend-2026.onrender.com', port: 443,
      path, method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(b),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    if (b) req.write(b);
    req.end();
  });
}

(async () => {
  console.log('=== 诊断测试 ===');
  const r1 = await api('/api/auth/register', 'POST', { email: EMAIL, password: 'test123', name: '诊断' });
  const d1 = JSON.parse(r1.body);
  const token = d1.data && d1.data.token;
  const userId = d1.data && d1.data.user && d1.data.user.id;
  console.log('注册:', r1.status, '| 用户ID:', userId);

  // 解析token
  if (token) {
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('Token payload:', JSON.stringify(payload));
  }

  // 测试: 直接 POST /api/auth/login（不走JWT）
  console.log('\n--- 用同一账号登录 ---');
  const r2 = await api('/api/auth/login', 'POST', { email: EMAIL, password: 'test123' });
  console.log('登录状态:', r2.status, '| 响应:', r2.body.slice(0, 300));

  // 如果登录成功，用登录返回的token测试
  if (r2.status === 200) {
    const d2 = JSON.parse(r2.body);
    const loginToken = d2.data && d2.data.token;
    if (loginToken) {
      console.log('\n--- 用登录token测试membership ---');
      const r3 = await api('/api/membership/create', 'POST', { plan: 'basic' }, loginToken);
      console.log('membership状态:', r3.status, '| 响应:', r3.body.slice(0, 300));
    }
  }

  // 测试 /api/membership/plans (无需认证)
  console.log('\n--- 测试无需认证的plans端点 ---');
  const r4 = await api('/api/membership/plans', 'GET', null);
  console.log('plans状态:', r4.status);

  // 测试 /api/products (需要认证)
  if (token) {
    console.log('\n--- 测试products端点 ---');
    const r5 = await api('/api/products', 'GET', null, token);
    console.log('products状态:', r5.status, '| 响应:', r5.body.slice(0, 150));
  }
})().catch(e => console.error(e));
