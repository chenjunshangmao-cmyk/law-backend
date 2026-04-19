import https from 'https';

const req = https.request({
  hostname: 'claw-backend-2026.onrender.com',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {'Content-Type': 'application/json', 'Content-Length': '54'}
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('登录状态:', res.statusCode);
    console.log('原始响应字符串前500字符:');
    console.log(d.slice(0, 500));
    console.log('\n---解析后---');
    const r = JSON.parse(d);
    console.log('typeof r.data:', typeof r.data);
    if (r.data) {
      console.log('r.data keys:', Object.keys(r.data));
      console.log('typeof r.data.token:', typeof r.data.token);
      console.log('r.data.token value:', r.data.token);
      const token = r.data.token;
      if (token && typeof token === 'string') {
        console.log('✅ token是字符串!');
        // 发membership请求
        const req2 = https.request({
          hostname: 'claw-backend-2026.onrender.com', port: 443,
          path: '/api/membership/create', method: 'POST',
          headers: {'Content-Type': 'application/json', 'Content-Length': '17', 'Authorization': 'Bearer ' + token}
        }, res2 => {
          let d2 = ''; res2.on('data', c => d2 += c);
          res2.on('end', () => console.log('membership状态:', res2.statusCode, d2.slice(0, 200)));
        });
        req2.write('{"plan":"basic"}'); req2.end();
      } else {
        console.log('❌ token不是字符串! 是:', typeof token);
        console.log('r.data.token 完整值:', JSON.stringify(token));
      }
    }
  });
});
req.write('{"email":"test000@t.com","password":"test123456"}');
req.end();
