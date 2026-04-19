const https = require('https');
const fs = require('fs');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(res.headers['content-length'] || 'unknown'); });
      } else {
        resolve(null); // 404 or other
      }
    }).on('error', (e) => { resolve(null); });
  });
}

async function main() {
  // 下载旧的JS (这个应该还在缓存)
  const js = await download(
    'https://claw-app-2026.pages.dev/assets/index-DmCeXBoo.js',
    'assets/index-DmCeXBoo.js'
  );
  console.log('JS下载:', js ? '成功' : '404');

  // 找旧HTML里的CSS引用
  const https2 = require('https');
  const htmlData = await new Promise((resolve) => {
    https2.get('https://claw-app-2026.pages.dev/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });

  const cssMatch = htmlData.match(/href="(\/assets\/[^"]*\.css)"/);
  if (cssMatch) {
    console.log('找到CSS:', cssMatch[1]);
    const css = await download('https://claw-app-2026.pages.dev' + cssMatch[1], 'assets/' + cssMatch[1].split('/').pop());
    console.log('CSS下载:', css ? '成功' : '404');
  } else {
    console.log('HTML里没有CSS引用（CSS已被移除）');
    // 创建一个最小CSS让页面不白屏
    fs.writeFileSync('assets/index-CP-Zg9Cl.css', 'body{font-family:sans-serif;margin:0;padding:20px;background:#fff}');
    console.log('已创建最小CSS');
  }

  // 检查下载的文件
  const files = fs.readdirSync('assets');
  console.log('assets目录:', files);
}

main();
