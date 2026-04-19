const http = require('http');
http.get('http://localhost:3002/browser', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const title = d.match(/<title>(.*?)<\/title>/);
    console.log('状态:', res.statusCode);
    console.log('标题:', title ? title[1] : '无');
    console.log('内容长度:', d.length, 'bytes');
    console.log('embedded-browser链接:', d.includes('localhost:3002') ? '✅ 包含' : '❌ 不包含');
  });
}).on('error', (e) => console.log('错误:', e.message));
