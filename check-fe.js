const https = require('https');
const urls = [
  'claw-app-2026.pages.dev',
  '069118d5.claw-app-2026.pages.dev',
  '4d12215a.claw-app-2026.pages.dev'
];

function check(url) {
  return new Promise(resolve => {
    const req = https.get({hostname: url, path: '/', timeout: 8000}, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => {
        const scripts = (b.match(/assets\/[^"']+\.js/g) || []).slice(0,3);
        resolve({ url, status: res.statusCode, scripts, hasSq: b.includes('shouqianba') });
      });
    });
    req.on('error', e => resolve({ url, error: e.message }));
    req.on('timeout', () => resolve({ url, error: 'timeout' }));
  });
}

Promise.all(urls.map(check)).then(results => {
  results.forEach(r => console.log(JSON.stringify(r)));
});
