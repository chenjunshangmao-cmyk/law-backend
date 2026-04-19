import https from 'https';

const HOST = 'claw-backend-2026.onrender.com';

function api(path, method, body, token) {
  return new Promise((resolve) => {
    const b = body ? JSON.stringify(body) : '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (b) headers['Content-Length'] = Buffer.byteLength(b);
    const req = https.request({ hostname: HOST, port: 443, path, method, headers }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ s: res.statusCode, b: d }));
    });
    if (b) req.write(b);
    req.end();
  });
}

async function main() {
  console.log('=== 测试老会员账号 test000@t.com ===\n');

  // 1. 登录
  const login = await api('/api/auth/login', 'POST', { email: 'test000@t.com', password: 'test123456' });
  console.log('STEP 1 登录:', login.s === 200 ? '✅ 成功' : '❌ 失败 ' + login.s);
  if (login.s !== 200) { console.log('登录失败:', login.b); return; }

  const loginData = JSON.parse(login.b);
  console.log('登录响应 keys:', Object.keys(loginData));
  console.log('loginData.data:', loginData.data ? '存在' : '不存在');
  if (loginData.data) {
    console.log('loginData.data keys:', Object.keys(loginData.data));
    console.log('typeof loginData.data.token:', typeof loginData.data.token);
    console.log('token值前50:', JSON.stringify(loginData.data.token).slice(0, 50));
  }

  // 2. 如果token是字符串，立即发membership请求
  const token = loginData.data?.token;
  if (typeof token === 'string') {
    console.log('\n✅ token是字符串，准备发membership请求');
    const mem = await api('/api/membership/create', 'POST', { plan: 'basic' }, token);
    console.log('STEP 2 membership:', mem.s, mem.s === 200 ? '✅' : '❌');
    console.log('响应:', mem.b.slice(0, 300));

    if (mem.s === 200) {
      const memData = JSON.parse(mem.b);
      console.log('\n🎉 老会员可以正常支付！');
      console.log('订单号:', memData.data?.orderId);
    }
  } else {
    console.log('\n❌ token不是字符串，无法发membership请求');
    console.log('老会员需要重新注册！');
  }
}

main();
