const http = require('http');

function post(path, data, token = null) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request({
      hostname: 'localhost', port: 8088, path, method: 'POST',
      headers
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 8088, path, method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  console.log('=== Testing APIs ===\n');
  
  // Register
  console.log('1. Register...');
  let res = await post('/api/auth/register', { 
    email: 'expand-test@example.com', password: 'test123', name: 'Expand Test User' 
  });
  console.log(res);
  
  if (!res.success) {
    console.log('Registration failed, trying login...');
    res = await post('/api/auth/login', { email: 'expand-test@example.com', password: 'test123' });
    console.log(res);
  }
  
  // 登录返回的是 { success, data: { user, token } }
  const token = res.data?.token || res.token;
  if (!token) { console.log('No token!'); return; }
  
  console.log('\n2. Add Account...');
  res = await post('/api/accounts', { platform: '1688', name: 'Test 1688', apiKey: 'key1234567890', apiSecret: 'secret1234567890' }, token);
  console.log(res);
  const accountId = res.data?.id;
  
  console.log('\n3. Get Accounts...');
  res = await get('/api/accounts', token);
  console.log(res);
  
  console.log('\n4. Create Task...');
  res = await post('/api/tasks', { type: 'select', params: { keyword: 'test' } }, token);
  console.log(res);
  
  console.log('\n5. Get Tasks...');
  res = await get('/api/tasks', token);
  console.log(res);
  
  console.log('\n6. Get Membership...');
  res = await get('/api/membership', token);
  console.log(res);
  
  console.log('\n7. Get Quota...');
  res = await get('/api/quota', token);
  console.log(res);
  
  console.log('\n8. Get Plans...');
  res = await get('/api/membership/plans');
  console.log(res);
  
  console.log('\n=== All tests complete! ===');
}

test().catch(console.error);
