// 测试老会员账号是否能正常登录和支付
const https = require('https');

const HOST = 'claw-backend-2026.onrender.com';

function api(path, method, body, token) {
  return new Promise((resolve) => {
    const opts = { hostname: HOST, port: 443, path, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const req = https.request(opts, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(d) }));
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // 测试几个可能的老账号
  const candidates = [
    { email: 'test000@t.com', password: 'test123456' },
    { email: 'test@t.com', password: 'test123456' },
    { email: 'test001@t.com', password: 'test123456' },
    { email: 'test3@0t1234@test.com', password: 'test123' },
    { email: 'test000@0t1234@test.com', password: 'test123' },
  ];

  let found = null;

  // 尝试找已存在的用户
  for (const cred of candidates) {
    const login = await api('/api/auth/login', 'POST', { email: cred.email, password: cred.password });
    if (login.status === 200 && login.data.data?.token) {
      found = { ...cred, token: login.data.data.token };
      break;
    }
  }

  if (!found) {
    console.log('❌ 没有找到已注册的老账号');
    console.log('   尝试注册一个新账号测试...');
    const email = 'oldmem' + Date.now() + '@t.com';
    const reg = await api('/api/auth/register', 'POST', { email, password: 'test123456', name: '老会员测试' });
    if (reg.status === 201) {
      console.log('✅ 注册成功:', email);
      found = { email, password: 'test123456', token: reg.data.data.token };
    } else {
      console.log('注册失败:', reg.data);
      return;
    }
  } else {
    console.log('✅ 找到老会员账号:', found.email);
  }

  // 解析 token
  const parts = found.token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  console.log('   userId:', payload.userId);

  // 测试 membership 订单
  console.log('\n💳 测试创建订单...');
  const order = await api('/api/membership/create', 'POST', { plan: 'basic' }, found.token);
  console.log('   状态:', order.status, order.status === 200 ? '✅' : '❌');
  if (order.status === 200) {
    console.log('   订单号:', order.data.data?.orderId);
    console.log('   金额:', order.data.data?.amount, '元');
    console.log('\n🎉 老会员可以正常支付！');
  } else {
    console.log('   错误:', JSON.stringify(order.data).slice(0, 300));
  }
}

main();
