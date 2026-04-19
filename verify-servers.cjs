const http = require('http');
const checks = [
  { port: 3002, path: '/api/health', name: '内置浏览器Launcher' },
  { port: 3002, path: '/browser', name: '内置浏览器页面' },
  { port: 8787, path: '/', name: '本地前端' },
];
let done = 0;
checks.forEach(({ port, path, name }) => {
  http.get(`http://localhost:${port}${path}`, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      const title = d.match(/<title>(.*?)<\/title>/);
      const status = res.statusCode === 200 ? '✅' : '❌';
      console.log(`${status} ${name} (${port}): ${res.statusCode} ${title ? '| ' + title[1] : ''}`);
      if (++done === checks.length) console.log('\n所有服务就绪!');
    });
  }).on('error', (e) => {
    console.log('❌ ' + name + ': ' + e.message);
    if (++done === checks.length) console.log('\n检查完成');
  });
});
