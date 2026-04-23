// 完整支付流程测试（.cjs = CommonJS）
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
      }
    };
    if (token) options.headers['Authorization'] = 'Bearer ' + token;

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
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(data);
    req.end();
  });
}

async function main() {
  // 1. 注册
  const email = 'clawtest_' + Date.now() + '@test.com';
  console.log('1. 注册用户:', email);
  const reg = await post('https://claw-backend-2026.onrender.com/api/auth/register', {
    email, password: 'Test123456', name: '测试用户'
  });
  console.log('   状态:', reg.status, '| success:', reg.data?.success);
  if (!reg.data?.success) {
    console.log('❌ 注册失败:', JSON.stringify(reg.data));
    return;
  }
  const token = reg.data.data.token;
  console.log('   ✅ token:', token.substring(0, 30) + '...');

  // 2. 创建支付订单
  console.log('\n2. 创建订单 (plan=basic)...');
  const order = await post('https://claw-backend-2026.onrender.com/api/payment/create',
    { plan: 'basic' },
    token
  );
  console.log('   状态:', order.status);
  console.log('   响应:', JSON.stringify(order.data, null, 2));

  if (order.status === 200 && order.data?.success) {
    const d = order.data.data;
    console.log('\n✅ 订单创建成功！');
    console.log('   订单号:', d.orderNo);
    console.log('   金额:', (d.amount / 100).toFixed(2), '元');
    console.log('   测试模式:', d.testMode);
    console.log('   支付链接:', d.payUrl ? d.payUrl.substring(0, 80) + '...' : '无');
    console.log('   二维码:', d.qrCode ? '已生成 ✅' : '未生成 ❌');
  } else {
    console.log('\n❌ 订单创建失败:', order.data?.error || JSON.stringify(order.data));
  }
}

main().catch(e => console.error('网络错误:', e.message));
