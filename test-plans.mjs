import https from 'https';

function apiCall(path, method, body, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'claw-backend-2026.onrender.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    };
    const req = https.request(options, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // 注册
  const email = 'final_test_' + Date.now() + '@test.com';
  const reg = await apiCall('/api/auth/register', 'POST', { email, password: 'test123456', name: '测试' });
  const token = JSON.parse(reg.body).data?.token;
  console.log('Token:', token ? token.substring(0, 30) + '...' : '获取失败');
  if (!token) return;

  // 获取可用套餐
  const plans = await apiCall('/api/membership/plans', 'GET', null, token);
  console.log('\n【可用套餐】状态:', plans.status);
  try {
    const planData = JSON.parse(plans.body);
    console.log('套餐:', JSON.stringify(planData, null, 2).substring(0, 500));
  } catch(e) { console.log(plans.body.substring(0, 200)); }

  // 用实际plan名称测试
  const testPlans = ['monthly', 'yearly', '基础版', '月卡', 'basic', 'standard'];
  for (const p of testPlans) {
    const r = await apiCall('/api/membership/create', 'POST', { plan: p }, token);
    console.log('\nplan=' + p + ' => 状态:', r.status, '响应:', r.body.substring(0, 100));
    if (r.status === 200) { console.log('✅ 成功!'); break; }
  }
}

main().catch(console.error);
