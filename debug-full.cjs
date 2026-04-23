// 精确测试：找出 JSON 文件路径差异
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
    const options = { hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET', headers: { ...(token ? { 'Authorization': 'Bearer ' + token } : {}) } };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(body) }); } catch { resolve({ status: res.statusCode, data: body }); } });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  // 注册新用户
  const email = 'clawtest_' + Date.now() + '@t.com';
  console.log('1. 注册:', email);
  const reg = await post('https://claw-backend-2026.onrender.com/api/auth/register', { email, password: 'Test123456', name: '测试' });
  const token = reg.data && (reg.data.data && reg.data.data.token || reg.data.token);
  const payload = token ? JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()) : null;
  const userId = payload && payload.userId;
  console.log('   userId:', userId);

  if (!userId) { console.log('注册失败'); return; }

  // 尝试不同路径的 findUserById
  console.log('\n2. 测试 findUserById 各路径:');
  
  // 路径1: 尝试直接用 userId (无前缀)
  const r1 = await get('https://claw-backend-2026.onrender.com/api/debug/find-user?userId=' + encodeURIComponent(userId));
  console.log('   直接 userId:', JSON.stringify(r1.data).slice(0, 200));
  
  // 路径2: 查看 debug/users 的路径
  const r2 = await get('https://claw-backend-2026.onrender.com/api/debug/users', token);
  console.log('   JSON路径:', r2.data && r2.data.path);
  console.log('   用户数:', r2.data && r2.data.count);
  
  // 路径3: auth.min.js 可能用的路径 (上一级)
  console.log('\n3. 添加更多调试路径...');
  
  // 试支付看详细错误
  console.log('\n4. 支付测试:');
  const pay = await post('https://claw-backend-2026.onrender.com/api/payment/create', { plan: 'basic' }, token);
  console.log('   状态:', pay.status, JSON.stringify(pay.data).slice(0, 200));
})().catch(e => console.error('Error:', e.message));
