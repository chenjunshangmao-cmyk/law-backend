const https = require('https');
const fs = require('fs');
const path = require('path');

function mkdirp(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function fetch(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : require('http');
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, text: () => d }));
    }).on('error', e => resolve({ status: 0, text: () => '' }));
  });
}

function download(url, dest) {
  return new Promise((resolve) => {
    mkdirp(path.dirname(dest));
    const file = fs.createWriteStream(dest);
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(true); });
      } else {
        file.close(); resolve(false);
      }
    }).on('error', () => { file.close(); resolve(false); });
  });
}

async function main() {
  const OUT = 'C:/Users/Administrator/WorkBuddy/Claw/complete-deploy';
  const PATCHED_JS = 'C:/Users/Administrator/WorkBuddy/Claw/frontend-bundle.js';
  const RENDER_FE = 'https://claw-frontend.onrender.com';

  mkdirp(OUT);
  mkdirp(OUT + '/assets');

  console.log('Step 1: Download HTML from claw-app...');
  await download('https://claw-app-2026.pages.dev/', OUT + '/index.html');
  let html = fs.readFileSync(OUT + '/index.html', 'utf8');
  console.log('HTML length:', html.length);

  // Find JS reference
  const jsRefMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);
  const cssRefMatch = html.match(/href="(\/assets\/[^"]+\.css)"/);
  const jsName = jsRefMatch ? jsRefMatch[1].split('/').pop() : 'index.js';
  const cssName = cssRefMatch ? cssRefMatch[1].split('/').pop() : 'index.css';
  console.log('JS file:', jsName, 'CSS file:', cssName);

  // Step 2: Copy patched JS to correct filename
  console.log('\nStep 2: Copy patched JS...');
  fs.copyFileSync(PATCHED_JS, OUT + '/assets/' + jsName);
  console.log('Patched JS copied, size:', fs.statSync(OUT + '/assets/' + jsName).size);

  // Step 3: Get CSS from onrender frontend
  console.log('\nStep 3: Get CSS...');
  const renderHtml = await fetch(RENDER_FE + '/').then(r => r.text());
  const renderCssMatch = renderHtml.match(/href="([^"]+\.css)"/);
  let cssFound = false;

  if (renderCssMatch) {
    let cssUrl = renderCssMatch[1];
    if (!cssUrl.startsWith('http')) cssUrl = RENDER_FE + cssUrl;
    console.log('Downloading CSS from:', cssUrl);
    const ok = await download(cssUrl, OUT + '/assets/' + cssName);
    if (ok && fs.existsSync(OUT + '/assets/' + cssName) && fs.statSync(OUT + '/assets/' + cssName).size > 0) {
      cssFound = true;
      console.log('CSS OK, size:', fs.statSync(OUT + '/assets/' + cssName).size);
    }
  }

  // If CSS not found, try other paths
  if (!cssFound) {
    const paths = ['/static/css/main.css', '/static/css/index.css', '/assets/index.css', '/static/style.css'];
    for (const p of paths) {
      const ok = await download(RENDER_FE + p, OUT + '/assets/' + cssName);
      if (ok && fs.existsSync(OUT + '/assets/' + cssName) && fs.statSync(OUT + '/assets/' + cssName).size > 0) {
        cssFound = true;
        console.log('CSS found at:', p);
        break;
      }
    }
  }

  if (!cssFound) {
    console.log('Creating minimal CSS...');
    fs.writeFileSync(OUT + '/assets/' + cssName, `
/* Claw App Styles */
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff}
#root{min-height:100vh;padding:20px}
.app{text-align:center;padding:20px}
`);
  }

  // Step 4: List files
  console.log('\nDeploy contents:');
  const files = [];
  function walk(d) {
    const items = fs.readdirSync(d);
    items.forEach(i => {
      const full = d + '/' + i;
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else files.push({ path: full.replace(OUT, ''), size: stat.size });
    });
  }
  walk(OUT);
  files.forEach(f => console.log(' ', f.path, f.size, 'bytes'));
  console.log('\nReady to deploy!');
}

main().catch(e => console.error(e));
