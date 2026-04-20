// 选择性提交脚本 - 只提交必要文件
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = __dirname;

// 需要提交的文件
const toAdd = [
  // 后端核心修改
  'browserAutomation.js',
  'package.json',
  'src/config/database.js',
  'src/middleware/auth.js',
  'src/routes/accounts.db.js',
  'src/routes/auth.min.js',
  'src/routes/browser.js',
  'src/routes/membership.db.js',
  'src/services/browserAutomation.js',
  'src/services/dbService.js',
  // 前端（新源码）
  'frontend/',
  // 前端构建产物
  'complete-deploy/',
  // 构建配置
  'wrangler.toml',
  // 文档和脚本
  '.env.example',
  'CHANGELOG-2026-04-19.md',
  'CHANGELOG-2026-04-20.md',
  'PLATFORM-ROADMAP-2026-04-20.md',
  'quick-build.cjs',
  // 工作内存（可选）
  '.workbuddy/',
  // GitHub Actions（如果有）
];

// 需要排除的
const toExclude = [
  'backend', 'browser-states', 'deploy-package', 'deploy-package-2026',
  'find-chat', 'verify-deploy', 'deploy-all', 'check-sites', 'check-users',
  'start-server', 'start-with-env', 'test-env', 'init-database', 'fix-device-id',
  'add-missing', 'add-membership', 'complete-deploy/backend',
  '~/', '~',
];

function run(cmd) {
  console.log(`$ git ${cmd.replace('--no-pager', '')}`);
  try {
    execSync(`git ${cmd}`, { cwd: root, encoding: 'utf8', stdio: 'inherit' });
  } catch (e) {
    console.error('Git error:', e.message);
    process.exit(1);
  }
}

// Stage files one by one
console.log('📋 正在添加文件...\n');
for (const item of toAdd) {
  const fullPath = path.join(root, item);
  if (fs.existsSync(fullPath)) {
    try {
      run(`add --force "${item}"`);
    } catch {}
  }
}

console.log('\n✅ 文件已添加');
console.log('\n下一步: 执行以下命令提交并推送:\n');
console.log('  git commit -m "feat: 前后端重大更新 - Bug修复+AI直播+新前端页面"');
console.log('  git push gitee master\n');
