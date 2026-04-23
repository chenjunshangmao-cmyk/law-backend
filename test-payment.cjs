// 测试支付接口
const https = require('https');

function post(url, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('1. 测试登录...');
  const login = await post('https://claw-backend-2026.onrender.com/api/auth/login', {
    email: 'clawadmin@test.com',
    password: 'Test123456'
  });
  console.log('登录结果:', JSON.stringify(login));

  if (login.status !== 200 || !login.data?.data?.token) {
    console.log('❌ 登录失败');
    return;
  }

  const token = login.data.data.token;
  console.log('✅ 登录成功，token:', token.substring(0, 30) + '...');

  console.log('\n2. 测试创建订单 (plan=basic)...');
  const order = await post('https://claw-backend-2026.onrender.com/api/payment/create',
    { plan: 'basic' },
    token
  );
  console.log('创建订单结果:');
  console.log('  状态码:', order.status);
  console.log('  响应:', JSON.stringify(order.data, null, 2));

  if (order.status === 200 && order.data?.success) {
    console.log('✅ 订单创建成功');
    console.log('  orderNo:', order.data.data.orderNo);
    console.log('  payUrl:', order.data.data.payUrl ? '(已生成)' : '(无)');
    console.log('  qrCode:', order.data.data.qrCode ? '(已生成)' : '(无)');
    console.log('  testMode:', order.data.data.testMode);
  } else {
    console.log('❌ 订单创建失败:', order.data?.error || order.data);
  }
}

main().catch(console.error);
