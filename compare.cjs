const https = require('https');

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== 对比分析报告 ===\n');

  // 获取 deploy-package 本地 app.js 版本
  const fs = require('fs');
  let localVersion = '未知';
  let localBuildTime = '未知';
  try {
    const localApp = fs.readFileSync('c:/Users/Administrator/WorkBuddy/Claw/deploy-package/assets/app.js', 'utf8');
    const vMatch = localApp.match(/v(\d+\.\d+\.\d+)/);
    const tMatch = localApp.match(/buildTime[:\s"']+([^"']+)/);
    localVersion = vMatch ? vMatch[0] : '未找到';
    localBuildTime = tMatch ? tMatch[1] : '未找到';
    console.log('本地 deploy-package/app.js:');
    console.log('  版本:', localVersion);
    console.log('  构建时间:', localBuildTime);
  } catch(e) {
    console.log('本地 deploy-package/app.js: 读取失败');
  }

  // 获取 e5549ccf 部署版 app.js 版本
  try {
    const remoteApp = await fetchText('https://e5549ccf.claw-app-2026.pages.dev/assets/app.js');
    const vMatch = remoteApp.match(/v(\d+\.\d+\.\d+)/);
    const tMatch = remoteApp.match(/buildTime[:\s"']+([^"']+)/);
    console.log('\n已部署 e5549ccf/app.js:');
    console.log('  大小:', remoteApp.length, '字节');
    console.log('  版本:', vMatch ? vMatch[0] : '未找到');
    console.log('  构建时间:', tMatch ? tMatch[1] : '未找到');
  } catch(e) {
    console.log('\ne5549ccf: 读取失败 -', e.message);
  }

  // 后端版本
  try {
    const backend = await fetchText('https://claw-backend-2026.onrender.com/api/version');
    console.log('\n后端 Render:');
    console.log('  ', backend);
  } catch(e) {
    console.log('\n后端 Render: 获取失败');
  }

  // 检查 e5549ccf 的文件列表（通过 index.html）
  console.log('\n=== e5549ccf 包含的文件 ===');
  try {
    const html = await fetchText('https://e5549ccf.claw-app-2026.pages.dev/');
    const jsFiles = (html.match(/src="(assets\/[^"]+\.js)"/g) || []).map(m => m.match(/"([^"]+)"/)[1]);
    const cssFiles = (html.match(/href="(assets\/[^"]+\.css)"/g) || []).map(m => m.match(/"([^"]+)"/)[1]);
    console.log('JS 文件数:', jsFiles.length);
    console.log('CSS 文件数:', cssFiles.length);
    console.log('文件列表:', [...jsFiles, ...cssFiles].join('\n  '));
  } catch(e) {
    console.log('HTML 获取失败');
  }
}

main().catch(console.error);
