// 调试：注册用户并查看返回的ID格式
const https = require('https');

function post(path, body, token) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'claw-backend-2026.onrender.com', port: 443, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, raw: d.slice(0, 200) }); }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    req.write(JSON.stringify(body)); req.end();
  });
}

// 注册时显示完整返回
post('/api/auth/register', { email: 'debug_' + Date.now() + '@t.com', password: 'test123', name: '调试' }, null)
  .then(r => {
    console.log('注册状态:', r.status);
    console.log('完整响应:', JSON.stringify(r.data, null, 2));
    if (r.data?.data?.user) {
      console.log('\n=== 用户数据 ===');
      console.log('id:', r.data.data.user.id, '(type:', typeof r.data.data.user.id, ')');
      console.log('email:', r.data.data.user.email);
    }
    if (r.data?.data?.token) {
      console.log('\ntoken payload:');
      const parts = r.data.data.token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('userId:', payload.userId, '(type:', typeof payload.userId, ')');
    }
  })
  .catch(e => console.error(e));
