// 前端构建脚本 - 直接使用 esbuild
// 用法: node build-frontend.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'frontend');
const deployDir = path.join(rootDir, 'complete-deploy');

console.log('📦 Claw 前端构建脚本');
console.log('='.repeat(50));

// Step 1: 安装依赖
console.log('\n📥 Step 1: 安装前端依赖...');
try {
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit', timeout: 120000 });
  console.log('✅ 依赖安装完成');
} catch (e) {
  console.log('⚠️  npm install 失败，尝试继续...');
}

// Step 2: 检查 esbuild
console.log('\n📦 Step 2: 检查构建工具...');
try {
  execSync('npx esbuild --version', { cwd: frontendDir, stdio: 'pipe' });
  console.log('✅ esbuild 可用');
} catch (e) {
  console.log('📦 安装 esbuild...');
  try {
    execSync('npm install esbuild --save-dev', { cwd: frontendDir, stdio: 'inherit' });
  } catch {}
}

// Step 3: 清理 deploy 目录
console.log('\n🧹 Step 3: 清理输出目录...');
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });
console.log('✅ 清理完成');

// Step 4: 构建
console.log('\n🔨 Step 4: 构建前端...');
try {
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit', timeout: 120000 });
  console.log('✅ 构建完成');
} catch (e) {
  console.log('❌ 构建失败:', e.message);
  process.exit(1);
}

// Step 5: 检查结果
console.log('\n📂 Step 5: 检查构建结果...');
const deployFiles = fs.readdirSync(deployDir);
console.log(`✅ 输出目录包含 ${deployFiles.length} 个文件/目录:`);
deployFiles.forEach(f => {
  const stat = fs.statSync(path.join(deployDir, f));
  if (stat.isDirectory()) {
    const count = fs.readdirSync(path.join(deployDir, f)).length;
    console.log(`  📁 ${f}/ (${count} 文件)`);
  } else {
    console.log(`  📄 ${f} (${(stat.size/1024).toFixed(1)} KB)`);
  }
});

console.log('\n🎉 构建完成！文件已输出到 complete-deploy/');
console.log('下一步: 提交代码并推送到 Gitee 触发部署');
