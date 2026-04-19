import https from 'https';

const BASE = 'https://claw-backend-2026.onrender.com';

function req(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url.startsWith('http') ? url : BASE + url);
    const req = https.request({
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function main() {
  // 1. 注册
  const email = 'paytest_' + Date.now() + '@t.com';
  const reg = await req('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'test123', name: 'PayTest' })
  });
  console.log('[注册]', reg.status, reg.body.substring(0, 200));
  
  if (!reg.body.includes('"token"')) return;
  const token = JSON.parse(reg.body).data.token;

  // 2. 测试 /api/membership/info
  const info = await req('/api/membership/info', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('[会员信息]', info.status, info.body.substring(0, 200));

  // 3. 创建支付订单
  const pay = await req('/api/membership/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ plan: 'basic' })
  });
  console.log('[创建订单]', pay.status, pay.body.substring(0, 500));

  // 4. 直接测 payment/create
  const pay2 = await req('/api/payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ plan: 'basic' })
  });
  console.log('[payment/create]', pay2.status, pay2.body.substring(0, 500));
}

main().catch(e => console.error('错误:', e.message));
