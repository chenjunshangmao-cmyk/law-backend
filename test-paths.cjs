// 直接测试两个可能的 JSON 文件路径
const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = { hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET' };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(body) }); } catch { resolve({ status: res.statusCode, data: body }); } });
    });
    req.on('error', reject);
    req.end();
  });
}

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

(async () => {
  // 1. 查看 paths
  const paths = await get('https://claw-backend-2026.onrender.com/api/debug/paths');
  console.log('paths:', JSON.stringify(paths.data, null, 2));

  // 2. 注册新用户
  const email = 'clawtest_' + Date.now() + '@t.com';
  const reg = await post('https://claw-backend-2026.onrender.com/api/auth/register', { email, password: 'Test123456', name: '测试' });
  const token = reg.data && (reg.data.data && reg.data.data.token || reg.data.token);
  const payload = token ? JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) : null;
  const userId = payload && payload.userId;
  console.log('\n注册:', email, '| userId:', userId);

  // 3. 立刻查 debug/users（看注册后是否有新用户）
  await new Promise(r => setTimeout(r, 500));
  const users = await get('https://claw-backend-2026.onrender.com/api/debug/users');
  console.log('JSON文件路径:', users.data && users.data.path);
  console.log('JSON用户数:', users.data && users.data.count);
  if (users.data && users.data.users) {
    users.data.users.forEach(u => console.log(' -', u.id, u.email));
  }

  // 4. 测试 findUserById
  if (userId) {
    const find = await get('https://claw-backend-2026.onrender.com/api/debug/find-user?userId=' + encodeURIComponent(userId));
    console.log('\nfindUserById(' + userId + '):', JSON.stringify(find.data));
  }

  // 5. 测试支付
  if (token) {
    const pay = await post('https://claw-backend-2026.onrender.com/api/payment/create', { plan: 'basic' }, token);
    console.log('\n支付:', pay.status, JSON.stringify(pay.data).slice(0, 200));
  }
})().catch(e => console.error('Error:', e.message));
