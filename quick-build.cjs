// 快速构建脚本 - 同步执行，有超时保护
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');
const deployDir = path.join(__dirname, 'complete-deploy');
const distDir = path.join(frontendDir, 'dist');

function run(cmd, cwd) {
  console.log(`$ ${cmd}`);
  try {
    const result = execSync(cmd, {
      cwd,
      encoding: 'utf8',
      timeout: 120000,
      maxBuffer: 50 * 1024 * 1024,
    });
    console.log(result);
    return result;
  } catch (e) {
    console.error('ERROR:', e.message);
    if (e.stdout) console.error('STDOUT:', e.stdout);
    if (e.stderr) console.error('STDERR:', e.stderr);
    return null;
  }
}

console.log('=== Claw 前端构建 ===\n');

// 1. 安装依赖
console.log('[1/4] 安装依赖...');
if (!fs.existsSync(path.join(frontendDir, 'node_modules'))) {
  run('npm install --prefer-offline', frontendDir);
} else {
  console.log('(已安装，跳过)');
}

// 2. 清理旧构建
console.log('\n[2/4] 清理旧构建...');
if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
if (fs.existsSync(deployDir)) fs.rmSync(deployDir, { recursive: true, force: true });
fs.mkdirSync(deployDir, { recursive: true });
console.log('(完成)');

// 3. 构建
console.log('\n[3/4] 运行 vite build...');
const buildResult = run('npx vite build --outDir ../complete-deploy --emptyOutDir', frontendDir);

if (!buildResult && !fs.existsSync(distDir) && !fs.existsSync(deployDir)) {
  console.log('\n尝试替代方案: esbuild...');
  try {
    execSync('npm install esbuild --save-dev', { cwd: frontendDir, stdio: 'pipe', timeout: 60000 });
    execSync('node -e "require(\'esbuild\').build({entryPoints:[\'src/main.tsx\'],bundle:true,outfile:\'../complete-deploy/app.js\',jsx:\'automatic\',loader:{\'.tsx\':\'tsx\',\".ts\":\"ts\"},define:{\"import.meta.env.VITE_API_URL\":\"\\\"https://claw-backend-2026.onrender.com\\\"\"}}).then(()=>console.log(\"done\")).catch(e=>console.error(e))"', {
      cwd: frontendDir, encoding: 'utf8', timeout: 60000, maxBuffer: 20*1024*1024
    });
  } catch (e) {
    console.error('esbuild 失败:', e.message);
  }
}

// 4. 复制 index.html
console.log('\n[4/4] 准备部署文件...');
const srcHtml = path.join(frontendDir, 'index.html');
const dstHtml = path.join(deployDir, 'index.html');
if (fs.existsSync(srcHtml)) {
  let html = fs.readFileSync(srcHtml, 'utf8');
  // 移除对 /src/main.tsx 的引用（用打包后的 JS 替代）
  if (fs.existsSync(path.join(deployDir, 'assets'))) {
    const assets = fs.readdirSync(path.join(deployDir, 'assets'));
    const jsFiles = assets.filter(f => f.endsWith('.js') && !f.includes('chunk'));
    const cssFiles = assets.filter(f => f.endsWith('.css'));
    if (jsFiles.length > 0) {
      html = html.replace('<script type="module" src="/src/main.tsx"></script>',
        `<script type="module" src="/assets/${jsFiles[0]}"></script>`);
    }
    if (cssFiles.length > 0) {
      html = html.replace('</head>', `<link rel="stylesheet" href="/assets/${cssFiles[0]}"></head>`);
    }
  }
  fs.writeFileSync(dstHtml, html);
  console.log('✅ index.html 已处理');
}

// 检查结果
console.log('\n=== 构建结果 ===');
if (fs.existsSync(deployDir)) {
  const files = fs.readdirSync(deployDir, { recursive: true });
  console.log(`✅ 成功！输出目录共 ${files.length} 个文件/目录`);
  files.slice(0, 20).forEach(f => console.log('  ' + f));
  if (files.length > 20) console.log(`  ... 还有 ${files.length - 20} 个`);
} else if (fs.existsSync(distDir)) {
  const files = fs.readdirSync(distDir, { recursive: true });
  console.log(`✅ 成功！dist 目录共 ${files.length} 个文件`);
  console.log('💡 请手动复制 dist/* 到 complete-deploy/');
} else {
  console.log('❌ 构建失败，请检查上方错误信息');
  process.exit(1);
}
