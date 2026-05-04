const https = require('https');
const http = require('http');
const data = JSON.stringify({ message: '你好' });

// 测试线上 API
const options = {
  hostname: 'api.chenjuntrading.cn',
  path: '/api/customer-service/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  },
  timeout: 30000
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('status:', res.statusCode);
    try {
      const r = JSON.parse(body);
      console.log('source:', r.source);
      console.log('response:', r.response?.substring(0,200));
    } catch(e) {
      console.log('body:', body.substring(0,200));
    }
  });
});
req.on('error', (e) => console.log('ERROR:', e.message));
req.on('timeout', () => { req.destroy(); console.log('TIMEOUT'); });
req.write(data);
req.end();
