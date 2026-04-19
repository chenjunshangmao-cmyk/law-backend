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
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }
    }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(true); });
      } else {
        file.close();
        resolve(false);
      }
    }).on('error', () => { file.close(); resolve(false); });
  });
}

async function main() {
  const BASE = 'https://claw-frontend.onrender.com';
  const OUT = 'C:/Users/Administrator/WorkBuddy/Claw/recovered-frontend';

  mkdirp(OUT);

  // 1. 下载 index.html
  console.log('下载 index.html...');
  const htmlOk = await download(BASE + '/', OUT + '/index.html');
  console.log(htmlOk ? '✅ index.html' : '❌ index.html');

  // 2. 读取HTML找所有资源
  const html = fs.readFileSync(OUT + '/index.html', 'utf8');

  // 提取所有 href/src
  const hrefs = [];
  const srcs = [];
  let m;
  const hrefRe = /href="(\/[^"]+)"/g;
  while ((m = hrefRe.exec(html)) !== null) hrefs.push(m[1]);
  const srcRe = /src="(\/[^"]+)"/g;
  while ((m = srcRe.exec(html)) !== null) srcs.push(m[1]);

  const allUrls = [...new Set([...hrefs, ...srcs])].filter(u => !u.startsWith('data:'));
  console.log('找到资源:', allUrls);

  // 3. 下载所有资源
  let ok = 0, fail = 0;
  for (const u of allUrls) {
    const filename = path.basename(u.split('?')[0]);
    const dest = OUT + '/static/' + filename;
    // 简化路径
    let fullDest = OUT + u.split('?')[0];
    const success = await download(BASE + u, fullDest);
    if (success) { ok++; console.log('✅', u); }
    else { fail++; console.log('❌', u); }
  }

  console.log('\n完成: 成功', ok, '失败', fail);

  // 4. 验证关键文件
  const files = [];
  function walk(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(i => {
      const full = dir + '/' + i;
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else files.push(full.replace(OUT, ''));
    });
  }
  walk(OUT);
  console.log('\n已下载文件:');
  files.forEach(f => console.log(' ', f));
}

main().catch(e => console.error(e));
