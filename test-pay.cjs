// 模拟前端完整调用链路
const https = require('https');

function httpReq(method, hostname, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = { hostname, path, method, headers };
    const req = https.request(opts, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve({ status: res.statusCode, body: b, headers: res.headers }));
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const BE = 'claw-backend-2026.onrender.com';
  const BASE = 'https://claw-backend-2026.onrender.com';

  console.log('=== Step 1: 健康检查 ===');
  const health = await httpReq('GET', BE, '/health');
  console.log('Health:', health.status, health.body.substring(0, 100));

  console.log('\n=== Step 2: 终端状态 ===');
  const status = await httpReq('GET', BE, '/api/shouqianba/status');
  console.log('Status:', status.status, status.body);

  console.log('\n=== Step 3: 激活终端 ===');
  const activate = await httpReq('POST', BE, '/api/shouqianba/activate', {});
  console.log('Activate:', activate.status, activate.body);

  console.log('\n=== Step 4: 创建订单 ===');
  const clientSn = 'claw-test-full-' + Date.now();
  const createBody = JSON.stringify({
    clientSn,
    totalAmount: 199,
    subject: 'Claw-test',
    deviceId: 'claw-web-new3'
  });
  const create = await httpReq('POST', BE, '/api/shouqianba/create-order', createBody, {
    'Content-Type': 'application/json'
  });
  console.log('CreateOrder:', create.status);
  let payUrl = '';
  try {
    const parsed = JSON.parse(create.body);
    payUrl = parsed.data?.payUrl || parsed.payUrl || '';
    console.log('payUrl present:', !!payUrl, 'length:', payUrl.length);
    console.log('clientSn:', clientSn);
  } catch(e) {
    console.log('Raw body:', create.body.substring(0, 300));
  }

  console.log('\n=== Step 5: 查询订单（轮询模拟） ===');
  // 先等2秒
  await new Promise(r => setTimeout(r, 2000));
  const query = await httpReq('GET', BE, '/api/shouqianba/query?sn=' + clientSn);
  console.log('Query (before pay):', query.status, query.body);

  // 检查 return_url 是否正确
  if (payUrl) {
    const u = new URL(payUrl);
    console.log('\n=== PayUrl 参数分析 ===');
    console.log('notify_url:', u.searchParams.get('notify_url'));
    console.log('return_url:', u.searchParams.get('return_url'));
    console.log('client_sn:', u.searchParams.get('client_sn'));
  }
}

main().catch(console.error);
