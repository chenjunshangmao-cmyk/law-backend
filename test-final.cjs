// 完整测试：注册 → 等3秒 → 支付（验证异步PG同步时序问题）
const https = require('https');

function post(url, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const options = {
      hostname: u.hostname, port: 443, path: u.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...(token ? { 'Authorization': 'Bearer ' + token } : {}) }
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(body) }); } catch { resolve({ status: res.statusCode, data: body }); } });
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const email = 'clawpay_' + Date.now() + '@t.com';

(async () => {
  // 1. 注册
  console.log('1. 注册:', email);
  const reg = await post('https://claw-backend-2026.onrender.com/api/auth/register', { email, password: 'Test123456', name: '支付测试' });
  console.log('   状态:', reg.status);
  const token = reg.data && (reg.data.data && reg.data.data.token || reg.data.token);
  console.log('   token:', token ? token.slice(0, 30) + '...' : '无');

  if (!token) { console.log('注册失败'); return; }

  // 2. 立刻支付（0秒）
  console.log('\n2. 立刻支付（异步PG同步可能未完成）:');
  const pay0 = await post('https://claw-backend-2026.onrender.com/api/payment/create', { plan: 'basic' }, token);
  console.log('   状态:', pay0.status, '| 成功:', pay0.data.success, '| msg:', pay0.data.error || pay0.data.message || '');

  // 3. 等1秒后支付
  await sleep(1000);
  console.log('\n3. 等1秒后支付:');
  const pay1 = await post('https://claw-backend-2026.onrender.com/api/payment/create', { plan: 'basic' }, token);
  console.log('   状态:', pay1.status, '| 成功:', pay1.data.success, '| msg:', pay1.data.error || pay1.data.message || '');
  if (pay1.data && pay1.data.success) {
    console.log('   ✅ 支付创建成功！payUrl:', pay1.data.data && pay1.data.data.payUrl ? pay1.data.data.payUrl.slice(0, 60) : '(测试模式)');
    console.log('   testMode:', pay1.data.data && pay1.data.data.testMode);
  }

  // 4. 等3秒后支付
  await sleep(3000);
  console.log('\n4. 等3秒后支付（PG同步应已完成）:');
  const pay3 = await post('https://claw-backend-2026.onrender.com/api/payment/create', { plan: 'basic' }, token);
  console.log('   状态:', pay3.status, '| 成功:', pay3.data.success, '| msg:', pay3.data.error || pay3.data.message || '');
  if (pay3.data && pay3.data.success) {
    console.log('   ✅ 支付创建成功！');
  }
})().catch(e => console.error('Error:', e.message));
