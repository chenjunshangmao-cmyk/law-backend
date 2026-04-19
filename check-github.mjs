import https from 'https';

const req = https.get({
  hostname: 'api.github.com',
  port: 443,
  path: '/repos/chenjunshangmao-cmyk/law-backend/commits/71b1a33',
  headers: {'User-Agent': 'node'}
}, res => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => {
    console.log('GitHub状态:', res.statusCode);
    try {
      const j = JSON.parse(d);
      console.log('SHA:', j.sha);
      console.log('Message:', j.commit.message.split('\n')[0]);
    } catch (e) {
      console.log('响应:', d.slice(0, 200));
    }
  });
});
req.on('error', e => console.log('错误:', e.message));
