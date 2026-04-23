const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const rootDir = 'C:\\Users\\Administrator\\WorkBuddy\\Claw';
const outDir = path.join(rootDir, 'deploy-package');
const assetsDir = path.join(outDir, 'assets');

// 构建 JS
esbuild.build({
  entryPoints: [path.join(rootDir, 'frontend', 'src', 'main.tsx')],
  bundle: true,
  outfile: path.join(assetsDir, 'app.js'),
  platform: 'browser',
  format: 'iife',
  minify: false,
  sourcemap: false,
  loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'css' },
  define: { 'process.env.NODE_ENV': '"production"' },
}).then(() => {
  console.log('app.js built OK');
}).catch(e => {
  console.error('app.js FAILED:', e.message);
  process.exit(1);
});
