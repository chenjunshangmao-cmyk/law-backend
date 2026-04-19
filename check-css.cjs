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
  const html = await fetch('https://claw-app-2026.pages.dev/').then(r => r.body);

  // Find all CSS references
  const matches = html.match(/href="([^"]+\.css)"/g) || [];
  console.log('CSS refs in HTML:', matches);

  for (const m of matches) {
    const url = m.match(/href="([^"]+)"/)[1];
    const r = await fetch('https://claw-app-2026.pages.dev' + url);
    console.log(url, '-> status:', r.status, 'length:', r.body ? r.body.length : 0);
  }

  // Try common CSS paths
  const paths = ['/assets/index.css', '/index.css', '/static/index.css', '/static/css/main.css'];
  for (const p of paths) {
    const r = await fetch('https://claw-app-2026.pages.dev' + p);
    console.log(p, '-> status:', r.status, 'length:', r.body ? r.body.length : 0);
  }
}

main().catch(e => console.error(e));
