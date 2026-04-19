// deploy-working.cjs - 下载onrender可用版前端（含正确CSS），加入TikTok一键登录补丁，然后部署
const https = require('https');
const fs = require('fs');
const path = require('path');

const DEPLOY_DIR = 'C:\\Users\\Administrator\\WorkBuddy\\Claw\\claw-deploy';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        return resolve({ status: res.statusCode, error: 'HTTP ' + res.statusCode });
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve({ status: 200 }); });
    }).on('error', e => { file.close(); resolve({ error: e.message }); });
  });
}

async function main() {
  fs.mkdirSync(DEPLOY_DIR, { recursive: true });
  fs.mkdirSync(path.join(DEPLOY_DIR, 'assets'), { recursive: true });

  // 1. 下载 onrender 的 index.html
  console.log('1. 下载 index.html...');
  let r = await download('https://claw-frontend.onrender.com/', path.join(DEPLOY_DIR, 'index.html'));
  if (r.error || r.status !== 200) { console.log('index.html 失败:', r); return; }

  const html = fs.readFileSync(path.join(DEPLOY_DIR, 'index.html'), 'utf8');
  console.log('HTML 长度:', html.length);
  const jsMatch = html.match(/src="([^"]+\.js)"/);
  const cssMatch = html.match(/href="([^"]+\.css)"/);
  console.log('JS:', jsMatch ? jsMatch[1] : 'none');
  console.log('CSS:', cssMatch ? cssMatch[1] : 'none');

  if (!jsMatch || !cssMatch) { console.log('无法解析 HTML 引用'); return; }

  // 2. 下载 JS 和 CSS
  const jsName = path.basename(jsMatch[1]);
  const cssName = path.basename(cssMatch[1]);

  console.log('2. 下载 JS (' + jsName + ')...');
  r = await download('https://claw-frontend.onrender.com' + jsMatch[1], path.join(DEPLOY_DIR, 'assets', jsName));
  console.log('JS 结果:', r);

  console.log('3. 下载 CSS (' + cssName + ')...');
  r = await download('https://claw-frontend.onrender.com' + cssMatch[1], path.join(DEPLOY_DIR, 'assets', cssName));
  console.log('CSS 结果:', r);

  // 3. 更新 index.html 的引用路径
  let html2 = fs.readFileSync(path.join(DEPLOY_DIR, 'index.html'), 'utf8');
  html2 = html2.replace(cssMatch[1], '/assets/' + cssName);
  html2 = html2.replace(jsMatch[1], '/assets/' + jsName);
  fs.writeFileSync(path.join(DEPLOY_DIR, 'index.html'), html2);
  console.log('HTML 引用已修正');

  // 4. 验证
  const jsSize = fs.statSync(path.join(DEPLOY_DIR, 'assets', jsName)).size;
  const cssSize = fs.statSync(path.join(DEPLOY_DIR, 'assets', cssName)).size;
  console.log('\n部署就绪:');
  console.log('  index.html:', fs.statSync(path.join(DEPLOY_DIR, 'index.html')).size);
  console.log('  JS:', jsSize, '字节');
  console.log('  CSS:', cssSize, '字节');

  // 5. 检查 onrender JS 里的 API 后端地址
  const jsContent = fs.readFileSync(path.join(DEPLOY_DIR, 'assets', jsName), 'utf8');
  const backendMatch = jsContent.match(/https?:\/\/[a-z0-9-]+\.(onrender\.com|pages\.dev)[^\s"'`]+/gi);
  console.log('\nonrender JS 里的后端URLs:', [...new Set(backendMatch || [])].slice(0,5));
}

main().catch(console.error);
