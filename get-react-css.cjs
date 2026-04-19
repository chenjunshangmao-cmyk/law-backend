const https = require('https');
const fs = require('fs');

function mkdirp(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function fetch(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', e => resolve({ status: 0, body: '' }));
  });
}

function download(url, dest) {
  return new Promise((resolve) => {
    mkdirp(path.dirname(dest));
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(true); });
      } else { file.close(); resolve(false); }
    }).on('error', () => { file.close(); resolve(false); });
  });
}

const path = require('path');

async function main() {
  const RENDER_FE = 'https://claw-frontend.onrender.com';
  const OUT = 'C:/Users/Administrator/WorkBuddy/Claw/complete-deploy/assets';

  // Get onrender HTML
  const html = await fetch(RENDER_FE + '/').then(r => r.body);
  console.log('onrender HTML length:', html.length);

  // Find ALL asset references
  const allRefs = html.match(/href="[^"]+"|src="[^"]+"/g) || [];
  console.log('All refs:', allRefs.slice(0, 20));

  // Download the onrender's JS
  const onrenderJs = await fetch(RENDER_FE + '/static/js/main.0126e647.js').then(r => r.body);
  console.log('onrender JS size:', onrenderJs.length);

  // Try to find CSS URL in onrender HTML
  const cssLinks = html.match(/href="([^"]+\.css)"/g) || [];
  console.log('CSS links:', cssLinks);

  for (const link of cssLinks) {
    const url = link.match(/href="([^"]+)"/)[1];
    const fullUrl = url.startsWith('http') ? url : RENDER_FE + url;
    const filename = fullUrl.split('/').pop();
    const dest = OUT + '/' + filename;
    const ok = await download(fullUrl, dest);
    console.log((ok ? 'OK' : 'FAIL'), fullUrl, '->', dest, ok ? '(' + fs.statSync(dest).size + 'b)' : '');
  }

  // Try common React CSS paths
  const reactCssPaths = [
    '/static/css/main.css',
    '/static/css/index.css',
    '/static/css/chunk.css',
    '/assets/index.css',
    '/build/static/css/main.css'
  ];
  for (const p of reactCssPaths) {
    const r = await fetch(RENDER_FE + p);
    console.log(p, '-> status:', r.status, 'size:', r.body.length);
    if (r.status === 200 && r.body.length > 100) {
      const filename = p.split('/').pop();
      fs.writeFileSync(OUT + '/' + filename, r.body);
      console.log('Saved CSS to:', filename, r.body.length, 'bytes');
    }
  }

  // Check what we have now
  const files = fs.readdirSync(OUT);
  console.log('\nCSS files available:', files);
}

main().catch(e => console.error(e));
