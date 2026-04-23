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
  console.log('=== 部署版本检查 ===\n');

  // 1. 前端已部署版本
  try {
    const appJs = await fetchText('https://e5549ccf.claw-app-2026.pages.dev/assets/app.js');
    console.log('前端 e5549ccf:');
    console.log('  app.js 大小:', appJs.length, '字节');
    const v = appJs.match(/v(\d+\.\d+\.\d+)/);
    console.log('  版本号:', v ? v[0] : '未找到');
  } catch(e) {
    console.log('前端 e5549ccf: 获取失败 -', e.message);
  }

  // 2. 后端版本
  try {
    const backend = await fetchText('https://claw-backend-2026.onrender.com/api/version');
    console.log('\n后端 Render:');
    console.log('  版本信息:', backend);
  } catch(e) {
    console.log('\n后端 Render: 获取失败 -', e.message);
  }
}

main().catch(console.error);
