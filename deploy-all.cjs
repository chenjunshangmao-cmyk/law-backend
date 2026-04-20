const https = require('https');
const fs = require('fs');
const path = require('path');

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
  console.log('=== 部署前检查 ===\n');

  // 1. 检查本地正确文件
  console.log('【本地文件】');
  const localFiles = ['index-DmCeXBoo.js','frontend-bundle.js','index.html','local-browser-launcher.js'];
  for (const f of localFiles) {
    if (fs.existsSync(f)) {
      const c = fs.readFileSync(f,'utf8');
      console.log('  '+f+': '+fs.statSync(f).size+'字节, quick-login:'+c.includes('quick-login')+', claw://:'+c.includes('claw://'));
    } else {
      console.log('  '+f+': ❌ 不存在');
    }
  }

  // 2. 检查wrangler配置的部署目录
  console.log('\n【wrangler部署目录】');
  const deployDir = 'complete-deploy';
  if (fs.existsSync(deployDir)) {
    const items = fs.readdirSync(deployDir);
    for (const item of items) {
      const fp = path.join(deployDir, item);
      const s = fs.statSync(fp);
      if (s.isDirectory()) {
        const sub = fs.readdirSync(fp);
        console.log('  '+item+'/ -> '+sub.join(', '));
      } else {
        console.log('  '+item+': '+s.size+'字节');
      }
    }
  } else {
    console.log('  ❌ '+deployDir+' 不存在，需要创建');
  }

  // 3. 检查wrangler.toml
  console.log('\n【wrangler.toml】');
  if (fs.existsSync('wrangler.toml')) {
    console.log('  ✅ 存在');
    const content = fs.readFileSync('wrangler.toml','utf8');
    console.log(content);
  } else {
    console.log('  ❌ 不存在，需要创建');
  }

  // 4. 检查后端git状态
  console.log('\n【后端Git状态】');
  const {execSync} = require('child_process');
  try {
    const status = execSync('git status --short', {encoding:'utf8'});
    console.log('  改动文件:', status.split('\n').filter(l=>l.trim()).join(', ') || '无');
    const ahead = execSync('git log origin/master..HEAD --oneline', {encoding:'utf8'});
    console.log('  领先origin/master:', ahead.split('\n').filter(l=>l.trim()).length,'个提交');
    if (ahead.trim()) console.log('  提交:', ahead.trim());
  } catch(e) {
    console.log('  Git错误:', e.message);
  }
}
main().catch(console.error);
