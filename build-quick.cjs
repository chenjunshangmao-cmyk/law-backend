// Direct build script
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const deployDir = path.join(rootDir, 'deploy-package');
const completeDir = path.join(rootDir, 'complete-deploy');

const publishPagePath = path.join(rootDir, 'frontend', 'src', 'pages', 'PublishPage.tsx');
const content = fs.readFileSync(publishPagePath, 'utf8');

if (!content.includes('我已登录')) {
  console.error('❌ PublishPage.tsx missing new code!');
  process.exit(1);
}
console.log('✅ Code verified');

console.log('\n🔨 Vite build...');
try {
  execSync('npx vite build --mode production', {
    cwd: path.join(rootDir, 'frontend'),
    stdio: 'inherit',
    timeout: 120000,
    shell: false,
  });
  console.log('✅ Build done');
} catch(e) {
  console.error('❌ Build failed');
  process.exit(1);
}

// Copy to complete-deploy
console.log('\n📦 Copying...');
const copyDir = (src, dest) => {
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
};
copyDir(deployDir, completeDir);
console.log('✅ Copied to complete-deploy');

const appJs = path.join(completeDir, 'assets', 'app.js');
const jsContent = fs.readFileSync(appJs, 'utf8');
console.log(jsContent.includes('我已登录') ? '✅ Verified: new code present' : '❌ Code not found');
console.log('\n🎉 Done!');
