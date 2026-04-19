// 测试：注册 → 用新token访问支付端点
import https from 'https';

const hostname = 'claw-backend-2026.onrender.com';
const email = 'fix_test_' + Date.now() + '@test.com';
const password = 'test123456';

function request(path, method, body, token) {
  return new Promise((resolve) => {
    const options = {
      hostname, port: 443, path, method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    };
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d) }));
    });
    req.on('error', e => resolve({ error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  console.log('1. 注册新用户...');
  const reg = await request('/api/auth/register', 'POST', { email, password, name: '认证修复测试' });
  console.log('   状态:', reg.status, 'success:', reg.data.success);
  if (!reg.data.success) { console.log('   失败:', JSON.stringify(reg.data)); return; }

  const token = reg.data.data.token;
  console.log('   token长度:', token.length, '前30字符:', token.substring(0, 30) + '...');

  console.log('\n2. 用新token访问 /api/payment/create...');
  const pay = await request('/api/payment/create', 'POST', { plan: 'basic' }, token);
  console.log('   状态:', pay.status);
  console.log('   响应:', JSON.stringify(pay.data).slice(0, 300));

  if (pay.data.success) {
    console.log('\n🎉 认证+支付全链路成功！');
    console.log('   订单号:', pay.data.data.orderNo);
    console.log('   支付金额:', pay.data.data.amount, '分');
    console.log('   支付链接:', pay.data.data.payUrl?.substring(0, 60) + '...');
  } else {
    console.log('\n❌ 仍然失败:', pay.data.error, '(code:', pay.data.code, ')');
  }
}

test();
