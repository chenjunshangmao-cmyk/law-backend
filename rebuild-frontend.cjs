const https = require('https');
const fs = require('fs');

function download(url, dest) {
  return new Promise((resolve) => {
    // Ensure directory exists
    const dir = dest.substring(0, dest.lastIndexOf('/'));
    if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = fs.createWriteStream(dest);
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }
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
  const OUT = 'C:/Users/Administrator/WorkBuddy/Claw/deploy-site';

  // 1. Create output directory
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(OUT + '/assets')) fs.mkdirSync(OUT + '/assets', { recursive: true });

  // 2. Download the OLD working JS (from claw-app-2026 cache - this has ALL the features)
  // We know this works because the HTML served it
  console.log('Downloading JS from cached URL...');
  const jsOk = await download(
    'https://claw-app-2026.pages.dev/assets/index-DmCeXBoo.js',
    OUT + '/assets/index-DmCeXBoo.js'
  );
  console.log(jsOk ? 'JS downloaded OK' : 'JS download failed');

  // 3. Download the HTML to see what CSS it needs
  console.log('Downloading HTML...');
  const htmlOk = await download('https://claw-app-2026.pages.dev/', OUT + '/index.html');
  console.log(htmlOk ? 'HTML downloaded OK' : 'HTML download failed');

  const html = fs.readFileSync(OUT + '/index.html', 'utf8');
  console.log('HTML preview:', html.substring(0, 300));

  // 4. Find all assets in HTML
  const links = html.match(/href="(\/assets\/[^"]+)"/g) || [];
  const scripts = html.match(/src="(\/assets\/[^"]+)"/g) || [];
  const allAssets = [...new Set([...links, ...scripts])].map(s => {
    const m = s.match(/["']([^"']+)["']/);
    return m ? m[1] : null;
  }).filter(Boolean);

  console.log('Assets to download:', allAssets);

  for (const asset of allAssets) {
    if (asset.includes('.js')) continue; // already downloaded
    const filename = asset.split('/').pop();
    const ok = await download('https://claw-app-2026.pages.dev' + asset, OUT + '/assets/' + filename);
    console.log((ok ? 'OK' : 'FAIL'), asset, '->', filename);
  }

  // 5. If no CSS, create a basic one
  const cssFile = OUT + '/assets/index-CP-Zg9Cl.css';
  if (!fs.existsSync(cssFile)) {
    // Check what CSS file the HTML references
    const cssMatch = html.match(/href="([^"]*\.css)"/);
    if (cssMatch) {
      const cssName = cssMatch[1].split('/').pop();
      const cssPath = OUT + '/assets/' + cssName;
      // Try downloading
      const ok = await download('https://claw-app-2026.pages.dev' + cssMatch[1], cssPath);
      if (ok) {
        console.log('CSS downloaded:', cssName);
      } else {
        // CSS missing from server - create minimal CSS
        fs.writeFileSync(cssPath, '/* minimal CSS */\nbody{margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif}');
        console.log('Created minimal CSS:', cssName);
      }
    }
  }

  // 6. Summary
  const files = [];
  function walk(d) {
    const items = fs.readdirSync(d);
    items.forEach(i => {
      const full = d + '/' + i;
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else files.push(full.replace(OUT, ''));
    });
  }
  walk(OUT);
  console.log('\nDeploy directory contents:');
  files.forEach(f => {
    const size = fs.statSync(OUT + f).size;
    console.log(' ', f, '—', size, 'bytes');
  });
}

main().catch(e => console.error(e));
