import https from 'https';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', err => reject(err));
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function test() {
  console.log('[1] 测试后端 /api/auth/test');
  try {
    const r1 = await makeRequest('https://claw-backend-2026.onrender.com/api/auth/test');
    console.log('    状态:', r1.status);
    console.log('    内容:', r1.body.substring(0, 200));
  } catch(e) {
    console.log('    错误:', e.message);
  }

  console.log('\n[2] 测试注册新用户');
  try {
    const email = 'api_test_' + Date.now() + '@test.com';
    const r2 = await makeRequest('https://claw-backend-2026.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'test123456', name: 'API Test' })
    });
    console.log('    状态:', r2.status);
    const body = JSON.parse(r2.body);
    console.log('    响应:', JSON.stringify(body).substring(0, 300));
    if (body.token) {
      console.log('\n[3] 测试购买套餐（带Token）');
      const r3 = await makeRequest('https://claw-backend-2026.onrender.com/api/membership/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + body.token },
        body: JSON.stringify({ plan: 'basic' })
      });
      console.log('    状态:', r3.status);
      console.log('    响应:', r3.body.substring(0, 500));
    }
  } catch(e) {
    console.log('    错误:', e.message);
  }
}

test().catch(console.error);
