const https = require('https');
const fs = require('fs');
const path = require('path');

function mkdirp(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve) => {
    mkdirp(path.dirname(dest));
    const file = fs.createWriteStream(dest);
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
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
  const OUT = 'C:/Users/Administrator/WorkBuddy/Claw/fresh-deploy';
  const CLAW = 'https://claw-app-2026.pages.dev';
  const RENDER = 'https://claw-frontend.onrender.com';

  mkdirp(OUT);
  mkdirp(OUT + '/assets');

  console.log('Step 1: Download HTML from claw-app (current deployment)...');
  const htmlOk = await download(CLAW + '/', OUT + '/index.html');
  console.log(htmlOk ? 'HTML OK' : 'HTML FAILED');

  if (!htmlOk) {
    // Create minimal HTML
    fs.writeFileSync(OUT + '/index.html', '<!doctype html><html><head><meta charset="UTF-8"><title>Claw</title></head><body><div id="root"></div></body></html>');
    console.log('Created minimal HTML');
  }

  // Read HTML to find assets
  const html = fs.readFileSync(OUT + '/index.html', 'utf8');
  const cssMatch = html.match(/href="(\/assets\/[^"]+\.css)"/);
  const jsMatch = html.match(/src="(\/assets\/[^"]+\.js)"/);
  console.log('HTML needs CSS:', cssMatch ? cssMatch[1] : 'none');
  console.log('HTML needs JS:', jsMatch ? jsMatch[1] : 'none');

  // Step 2: Copy our PATCHED JS (frontend-bundle.js) to the correct JS filename
  const jsFilename = jsMatch ? jsMatch[1].split('/').pop() : 'index.js';
  const srcJs = 'C:/Users/Administrator/WorkBuddy/Claw/frontend-bundle.js';
  if (fs.existsSync(srcJs)) {
    fs.copyFileSync(srcJs, OUT + '/assets/' + jsFilename);
    console.log('Copied patched JS to', jsFilename, '(size:', fs.statSync(OUT + '/assets/' + jsFilename).size + ')');
  } else {
    console.log('ERROR: frontend-bundle.js not found!');
    return;
  }

  // Step 3: Get the CSS from onrender frontend
  const cssFilename = cssMatch ? cssMatch[1].split('/').pop() : 'index.css';
  console.log('\nStep 3: Fetching CSS from onrender frontend...');

  // Try onrender frontend
  const renderJs = await fetch(RENDER + '/static/js/main.0126e647.js').then(r => r.text()).catch(() => '');
  if (renderJs) {
    // onrender frontend has its own CSS - extract it
    // Actually, the onrender frontend has inline CSS via style tags or separate CSS file
    // Let's try to find the CSS
  }

  // Try to download CSS from onrender's HTML
  const renderHtml = await fetch(RENDER + '/').then(r => r.text()).catch(() => '');
  if (renderHtml) {
    const renderCssMatch = renderHtml.match(/href="([^"]+\.css)"/);
    if (renderCssMatch) {
      const cssUrl = renderCssMatch[1].startsWith('http') ? renderCssMatch[1] : RENDER + renderCssMatch[1];
      const ok = await download(cssUrl, OUT + '/assets/' + cssFilename);
      console.log('CSS from onrender:', ok ? 'OK' : 'FAILED');
    }
  }

  // If CSS still missing, create a minimal one
  const cssPath = OUT + '/assets/' + cssFilename;
  if (!fs.existsSync(cssPath) || fs.statSync(cssPath).size === 0) {
    // Try other paths from onrender
    const otherPaths = [
      '/static/css/main.css',
      '/static/css/index.css',
      '/assets/index.css'
    ];
    for (const p of otherPaths) {
      const ok = await download(RENDER + p, OUT + '/assets/' + cssFilename);
      if (ok && fs.existsSync(cssPath) && fs.statSync(cssPath).size > 0) {
        console.log('Found CSS at:', p);
        break;
      }
    }
  }

  // Still missing? Create minimal CSS
  if (!fs.existsSync(cssPath) || fs.statSync(cssPath).size === 0) {
    console.log('Creating minimal CSS...');
    fs.writeFileSync(cssPath, `
/* Claw App Minimal Styles */
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;color:#333}
#root{min-height:100vh}
`);
  }

  // Step 4: List final files
  console.log('\nFinal deploy directory:');
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
  files.forEach(f => console.log(' ', f.path, '-', f.size, 'bytes'));

  console.log('\nDeploy directory ready at:', OUT);
}

async function fetch(url) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ text: () => d, status: res.statusCode }));
    }).on('error', reject);
  });
}

main().catch(e => console.error(e));
