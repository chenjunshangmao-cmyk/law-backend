import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = 'https://e5549ccf.claw-app-2026.pages.dev';
const OUT = 'c:/Users/Administrator/WorkBuddy/Claw/complete-deploy';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = Buffer.alloc(0);
      res.on('data', d => { data = Buffer.concat([data, d]); });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function downloadFile(url, destPath) {
  try {
    const data = await fetchUrl(url);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, data);
    console.log('OK:', destPath);
  } catch(e) {
    console.log('FAIL:', url, e.message);
  }
}

async function main() {
  // Get HTML to find all asset references
  const html = await fetchUrl(BASE + '/');
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
  console.log('Downloaded index.html');

  // Find all asset references in HTML
  const srcMatches = html.toString('utf8').match(/src="([^"]+)"/g) || [];
  const hrefMatches = html.toString('utf8').match(/href="([^"]+)"/g) || [];
  const assets = new Set();
  
  [...srcMatches, ...hrefMatches].forEach(m => {
    const u = m.match(/"(.*)"/)[1];
    if (u.startsWith('/') && !u.startsWith('//')) {
      assets.add(u.substring(1));
    }
  });

  console.log('Assets from HTML:', assets.size);
  
  // Download each asset
  for (const asset of assets) {
    await downloadFile(BASE + '/' + asset, path.join(OUT, asset));
  }
  
  console.log('Done!');
}

main().catch(e => { console.error(e.message); process.exit(1); });
