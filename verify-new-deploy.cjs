const https = require('https');

function fetch(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'curl/7.88.1' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', e => resolve({ error: e.message }));
  });
}

async function main() {
  const BASE = 'https://eedae2d8.claw-app-2026.pages.dev';
  const r = await fetch(BASE + '/');
  console.log('New deploy HTML status:', r.status, 'len:', r.body.length);

  const jsMatch = r.body.match(/src="([^"]+\.js)"/);
  const cssMatch = r.body.match(/href="([^"]+\.css)"/);
  console.log('JS ref:', jsMatch ? jsMatch[1] : 'none');
  console.log('CSS ref:', cssMatch ? cssMatch[1] : 'none');

  if (jsMatch) {
    const jsR = await fetch(BASE + jsMatch[1]);
    console.log('JS status:', jsR.status, 'size:', jsR.body.length, 'quick-login:', jsR.body.includes('quick-login'));
  }

  if (cssMatch) {
    const cssR = await fetch(BASE + cssMatch[1]);
    console.log('CSS status:', cssR.status, 'size:', cssR.body.length);
  }
}

main().catch(e => console.error(e));
