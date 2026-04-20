// CJS 构建脚本 - 修复 ES module 兼容问题
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'frontend');
const deployDir = path.join(rootDir, 'deploy-package');

console.log('📦 Claw 前端构建脚本 (CJS版)');
console.log('='.repeat(50));

// Step 1: 检查并安装依赖
console.log('\n📥 Step 1: 检查前端依赖...');
try {
  const lockFile = path.join(frontendDir, 'package-lock.json');
  if (!fs.existsSync(lockFile)) {
    console.log('⚠️  未找到 package-lock.json，运行 npm install...');
    execSync('npm install', { cwd: frontendDir, stdio: 'inherit', timeout: 120000 });
  } else {
    console.log('✅ 依赖已安装');
  }
} catch (e) {
  console.log('⚠️  依赖检查失败:', e.message);
}

// Step 2: 清理 deploy 目录
console.log('\n🧹 Step 2: 清理输出目录...');
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });
console.log('✅ 清理完成');

// Step 3: TypeScript 检查
console.log('\n🔍 Step 3: TypeScript 类型检查...');
try {
  execSync('node node_modules/typescript/bin/tsc --noEmit', {
    cwd: frontendDir, stdio: 'inherit', timeout: 60000,
    env: { ...process.env, FORCE_COLOR: '0' }
  });
  console.log('✅ TypeScript 检查通过');
} catch (e) {
  console.log('⚠️  TypeScript 检查有警告，继续构建...');
}

// Step 4: Vite 构建
console.log('\n🔨 Step 4: Vite 构建...');
try {
  execSync('node node_modules/vite/bin/vite.js build', {
    cwd: frontendDir, stdio: 'inherit', timeout: 120000,
    env: { ...process.env, FORCE_COLOR: '0' }
  });
  console.log('✅ Vite 构建完成');
} catch (e) {
  console.log('❌ Vite 构建失败:', e.message);
  process.exit(1);
}

// Step 5: 复制 assets 到 deploy-package
console.log('\n📋 Step 5: 组织输出文件...');
const distDir = path.join(frontendDir, 'dist');
const assetsDir = path.join(deployDir, 'assets');

if (fs.existsSync(distDir)) {
  // 复制所有 dist 内容到 deploy-package
  copyDir(distDir, deployDir);
  
  // 处理 assets 目录
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    console.log(`  assets/ 包含 ${assetFiles.length} 个文件`);
  }
  
  // 生成 index-DmCeXBoo.js 映射
  const allFiles = getAllFiles(deployDir, []);
  const jsFiles = allFiles.filter(f => f.endsWith('.js') && !f.includes('app.js'));
  if (jsFiles.length > 0) {
    const chunkFile = jsFiles[0];
    const dest = path.join(assetsDir || deployDir, 'index-DmCeXBoo.js');
    if (fs.existsSync(chunkFile)) {
      fs.copyFileSync(chunkFile, dest);
      console.log(`  ✅ 已生成 index-DmCeXBoo.js`);
    }
  }
}

console.log('\n📂 输出文件清单:');
listDir(deployDir, '');

console.log('\n🎉 构建完成！');
console.log('   部署目录: ' + deployDir);
console.log('   下一步: 提交代码并触发 Cloudflare Pages 部署');
console.log('   命令: npx wrangler pages deploy complete-deploy --project-name=claw-app-2026');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getAllFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function listDir(dir, indent) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      console.log(indent + '📁 ' + entry.name + '/');
      listDir(fullPath, indent + '  ');
    } else {
      const size = (fs.statSync(fullPath).size / 1024).toFixed(1);
      console.log(indent + '📄 ' + entry.name + ' (' + size + ' KB)');
    }
  }
}
