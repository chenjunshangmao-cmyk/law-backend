// 快速端点测试
const https = require('https');

function get(path) {
  return new Promise((resolve) => {
    const req = https.request({ hostname: 'claw-backend-2026.onrender.com', port: 443, path, method: 'GET' }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, body: d.slice(0, 150) }));
    });
    req.on('error', e => resolve({ error: e.message }));
    req.end();
  });
}

function post(path, body, token) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'claw-backend-2026.onrender.com', port: 443, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, raw: d.slice(0, 100) }); }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.write(JSON.stringify(body)); req.end();
  });
}

(async () => {
  const h = await get('/api/health');
  console.log('health:', h.status, h.body || h.error);

  // 测试 membership/create (不需要认证)
  const m = await post('/api/membership/create', { plan: 'basic' }, null);
  console.log('membership/create:', m.status, m.data ? JSON.stringify(m.data).slice(0,100) : m.raw);

  // 注册获取token
  const email = 'e2e_' + Date.now() + '@test.com';
  const r = await post('/api/auth/register', { email, password: 'test123', name: 'E2E测试' }, null);
  console.log('register:', r.status, r.data ? r.data.success : r.raw);
  if (!r.data?.data?.token) return;

  const token = r.data.data.token;

  // 测试 membership/create (需要认证)
  const m2 = await post('/api/membership/create', { plan: 'basic' }, token);
  console.log('membership/create (auth):', m2.status, m2.data ? JSON.stringify(m2.data).slice(0,200) : m2.raw);

  // 测试 payment/create (需要认证)
  const p = await post('/api/payment/create', { plan: 'basic' }, token);
  console.log('payment/create (auth):', p.status, p.data ? JSON.stringify(p.data).slice(0,200) : p.raw);
})().catch(e => console.error(e));
