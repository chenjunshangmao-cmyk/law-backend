const https = require('https');
const fs = require('fs');

function fetch(url) {
  return new Promise(resolve => {
    const mod = url.startsWith('https') ? https : require('http');
    mod.get(url, {headers:{'User-Agent':'Mozilla/5.0'}}, res => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:d}));
    }).on('error',e=>resolve({error:e.message}));
  });
}

async function main() {
  console.log('=== Claw 网站系统完整检查 ===\n');

  // 1. 前端状态
  console.log('【前端 - Cloudflare Pages】');
  const fe = await fetch('https://claw-app-2026.pages.dev/');
  console.log('  claw-app-2026.pages.dev 状态:', fe.status || fe.error);
  if (fe.body) {
    const js = fe.body.match(/src="([^"]+\.js)"/);
    const css = fe.body.match(/href="([^"]+\.css)"/);
    console.log('  HTML引用JS:', js ? js[1] : 'none');
    console.log('  HTML引用CSS:', css ? css[1] : 'none');
  }

  // 2. JS和CSS实际状态
  console.log('\n【静态资源状态】');
  const jsR = await fetch('https://claw-app-2026.pages.dev/assets/index-DmCeXBoo.js');
  const cssR = await fetch('https://claw-app-2026.pages.dev/assets/index-CP-Zg9Cl.css');
  console.log('  index-DmCeXBoo.js:', jsR.status, '长度:', jsR.body ? jsR.body.length : 0);
  console.log('  index-CP-Zg9Cl.css:', cssR.status, '长度:', cssR.body ? cssR.body.length : 0);
  if (cssR.body && cssR.body.length > 0) {
    console.log('  CSS前100字符:', cssR.body.substring(0,100));
  }

  // 3. 后端状态
  console.log('\n【后端 - Render】');
  const be = await fetch('https://claw-backend-2026.onrender.com/api/health');
  console.log('  claw-backend-2026.onrender.com:', be.status || be.error);
  if (be.body) {
    try { const d=JSON.parse(be.body); console.log('  Health数据:', JSON.stringify(d)); } catch(e) { console.log('  Health内容:', be.body.substring(0,200)); }
  }

  // 4. Render前端（旧版）
  console.log('\n【旧版前端 - Render】');
  const old = await fetch('https://claw-frontend.onrender.com/');
  console.log('  claw-frontend.onrender.com:', old.status || old.error);

  // 5. 本地文件
  console.log('\n【本地文件】');
  const files = ['index.html','index-DmCeXBoo.js','frontend-bundle.js'];
  for (const f of files) {
    if (fs.existsSync(f)) {
      const c = fs.readFileSync(f,'utf8');
      console.log('  '+f+':', fs.statSync(f).size, '字节');
      console.log('    quick-login:', c.includes('quick-login'));
      console.log('    claw://:', c.includes('claw://'));
    } else {
      console.log('  '+f+': 不存在');
    }
  }

  // 6. 内置浏览器启动器
  console.log('\n【内置浏览器启动器】');
  const bl = await fetch('http://localhost:3002/api/quick-login');
  console.log('  localhost:3002 /api/quick-login:', bl.status || bl.error);

  // 7. wrangler部署历史
  console.log('\n【Wrangler部署历史】');
  console.log('  wrangler pages project: claw-app-2026');
  console.log('  连接Git: No (纯手动部署)');
  console.log('  Build command: None (纯静态)');
  console.log('  环境变量: 需在Cloudflare Pages设置');
}
main().catch(console.error);
