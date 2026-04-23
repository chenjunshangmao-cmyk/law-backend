// 调试：测试 clawadmin@test.com 登录 + 支付
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

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = { hostname: u.hostname, port: 443, path: u.pathname, method: 'GET', headers: { ...(token ? { 'Authorization': 'Bearer ' + token } : {}) } };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(body) }); } catch { resolve({ status: res.statusCode, data: body }); } });
    });
    req.on('error', reject);
    req.end();
  });
}

const email = 'clawadmin@test.com';
const password = 'Test123456';

(async () => {
  console.log('=== 1. 登录 clawadmin@test.com ===');
  const login = await post('https://claw-backend-2026.onrender.com/api/auth/login', { email, password });
  console.log('登录状态:', login.status);
  console.log('返回:', JSON.stringify(login.data).slice(0, 300));

  if (login.data && login.data.data && login.data.data.token) {
    const token = login.data.data.token;
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('Token payload:', JSON.stringify(payload));

    console.log('\n=== 2. 查 Render JSON 用户 ===');
    const debug = await get('https://claw-backend-2026.onrender.com/api/debug/users', token);
    console.log('debug状态:', debug.status, JSON.stringify(debug.data).slice(0, 500));

    console.log('\n=== 3. 测试支付 ===');
    const pay = await post('https://claw-backend-2026.onrender.com/api/payment/create', { plan: 'basic' }, token);
    console.log('支付状态:', pay.status, JSON.stringify(pay.data).slice(0, 500));
  } else {
    console.log('登录失败，无token');
  }
})().catch(e => console.error('Error:', e.message));
