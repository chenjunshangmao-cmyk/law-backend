// 对比测试：注册token vs 登录token
const https = require('https');

const TS = Date.now();
const EMAIL = `compare_${TS}@t.com`;

// 统一请求函数
function api(path, method, body, token) {
  return new Promise((resolve) => {
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
      res.on('end', () => resolve({ s: res.statusCode, b: d }));
    });
    req.on('error', e => resolve({ s: 0, b: e.message }));
    if (b) req.write(b);
    req.end();
  });
}

(async () => {
  console.log('=== 注册token vs 登录token 对比测试 ===\n');

  // 1. 注册
  const r1 = await api('/api/auth/register', 'POST', { email: EMAIL, password: 'test123', name: '对比测试' });
  const d1 = JSON.parse(r1.b);
  const regToken = d1.data && d1.data.token;
  const regUserId = d1.data && d1.data.user && d1.data.user.id;
  console.log('注册: ' + r1.s + ' | userId: ' + regUserId);

  // 解码token
  if (regToken) {
    const parts = regToken.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('注册token payload:', JSON.stringify(payload));
  }

  // 2. 立即用注册token测试
  const r2 = await api('/api/membership/create', 'POST', { plan: 'basic' }, regToken);
  console.log('\n注册token → membership: ' + r2.s + ' | ' + r2.b.slice(0, 150));

  // 3. 用同一账号登录
  const r3 = await api('/api/auth/login', 'POST', { email: EMAIL, password: 'test123' });
  const d3 = JSON.parse(r3.b);
  const loginToken = d3.data && d3.data.token;
  console.log('\n登录: ' + r3.s + ' | userId: ' + (d3.data && d3.data.user && d3.data.user.id));

  if (loginToken) {
    const parts = loginToken.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('登录token payload:', JSON.stringify(payload));
  }

  // 4. 用登录token测试
  const r4 = await api('/api/membership/create', 'POST', { plan: 'basic' }, loginToken);
  console.log('\n登录token → membership: ' + r4.s + ' | ' + r4.b.slice(0, 200));

  // 5. 检查 authMiddleware 对注册token的判断
  console.log('\n--- authMiddleware 逻辑分析 ---');
  console.log('注册token的userId = 登录token的userId? ' + (regUserId === (d3.data && d3.data.user && d3.data.user.id)));
})().catch(e => console.error(e));
