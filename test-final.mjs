// 完整测试：会员注册 → 认证 → 支付
const https = require('https');

const TS = Date.now();
const EMAIL = `claw_fix_${TS}@test.com`;
const PASS = 'test123456';

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
  console.log('📝 Step 1: 注册新用户...');
  const r1 = await api('/api/auth/register', 'POST', { email: EMAIL, password: PASS, name: '测试用户' });
  const d1 = JSON.parse(r1.body);
  const token = d1.data?.token;
  console.log('  注册:', r1.status, '| token存在:', !!token);
  if (!token) { console.log('  ❌ 注册失败:', r1.body.slice(0, 200)); return; }

  // 解析token中的userId
  try {
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('  用户ID:', payload.userId, '| 类型:', typeof payload.userId);
  } catch(e) {}

  console.log('\n🔐 Step 2: 测试 /api/membership/create（需认证）...');
  const r2 = await api('/api/membership/create', 'POST', { plan: 'basic' }, token);
  console.log('  状态:', r2.status, '| 响应:', r2.body.slice(0, 300));

  console.log('\n💳 Step 3: 测试 /api/payment/create（需认证）...');
  const r3 = await api('/api/payment/create', 'POST', { plan: 'basic' }, token);
  console.log('  状态:', r3.status, '| 响应:', r3.body.slice(0, 300));
  if (r3.status === 200) {
    const d3 = JSON.parse(r3.body);
    if (d3.success) {
      console.log('\n🎉🎉🎉 支付端点正常！');
      console.log('  订单号:', d3.data?.orderNo);
      console.log('  金额:', (d3.data?.amount / 100).toFixed(2), '元');
    }
  }
})().catch(e => console.error('测试异常:', e.message));
