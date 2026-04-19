const h = require('http');
h.get('http://localhost:3002/browser/', r => {
  console.log('Status:', r.statusCode);
  let d = '';
  r.on('data', c => d += c);
  r.on('end', () => {
    const title = d.match(/<title>(.*?)<\/title>/);
    console.log('Title:', title ? title[1] : 'no title');
  });
}).on('error', e => console.log('Error:', e.message));
