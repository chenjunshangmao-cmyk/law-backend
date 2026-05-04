const http = require('http');
const data = JSON.stringify({ message: '你好，我想问一下你们是做什么的' });

const options = {
  hostname: 'localhost',
  port: 8089,
  path: '/api/customer-service/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  },
  timeout: 15000
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const r = JSON.parse(body);
      console.log('source:', r.source);
      console.log('response:', r.response?.substring(0,200));
    } catch(e) {
      console.log('parse error:', e.message, body.substring(0,100));
    }
  });
});
req.on('error', (e) => console.log('ERROR:', e.message));
req.on('timeout', () => { req.destroy(); console.log('TIMEOUT'); });
req.write(data);
req.end();
