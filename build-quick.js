// Direct build script - builds PublishPage.tsx changes into deploy-package
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const deployDir = path.join(rootDir, 'deploy-package');
const completeDir = path.join(rootDir, 'complete-deploy');

// 1. Check if PublishPage.tsx has the new code
const publishPagePath = path.join(rootDir, 'frontend', 'src', 'pages', 'PublishPage.tsx');
const content = fs.readFileSync(publishPagePath, 'utf8');

if (!content.includes('我已登录')) {
  console.error('❌ PublishPage.tsx does not have the new code!');
  process.exit(1);
}
console.log('✅ PublishPage.tsx has new code');

// 2. Run vite build using npx (non-interactive)
console.log('\n🔨 Running vite build...');
const { execSync } = require('child_process');

try {
  execSync('npx vite build --mode production', {
    cwd: path.join(rootDir, 'frontend'),
    stdio: 'inherit',
    timeout: 120000,
    shell: false,
  });
  console.log('✅ Vite build complete');
} catch(e) {
  console.error('❌ Build failed:', e.message);
  process.exit(1);
}

// 3. Copy deploy-package to complete-deploy
console.log('\n📦 Copying to complete-deploy...');
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
console.log('✅ Copy complete');

// 4. Verify
const appJs = path.join(completeDir, 'assets', 'app.js');
if (fs.existsSync(appJs)) {
  const jsContent = fs.readFileSync(appJs, 'utf8');
  if (jsContent.includes('我已登录')) {
    console.log('✅ Verified: new code in complete-deploy/assets/app.js');
  } else {
    console.error('❌ New code NOT found in app.js');
  }
}
console.log('\n🎉 Done!');
