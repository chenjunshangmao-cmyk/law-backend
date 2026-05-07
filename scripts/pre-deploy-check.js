/**
 * CODELOCK 部署前门禁检查
 * 
 * 解析 CODELOCK.md → 提取锁定文件列表 → git diff 检测变更
 * 变更了 → 中止部署（除非设置 FORCE_DEPLOY 环境变量）
 * 
 * 用法: node scripts/pre-deploy-check.js
 * 环境变量: FORCE_DEPLOY=whatsapp,payment 跳过指定模块
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CODELOCK_FILE = path.join(ROOT, 'CODELOCK.md');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function log(emoji, msg, color = '') {
  console.log(`${color}${emoji} ${msg}${RESET}`);
}

// 解析 CODELOCK.md 提取锁定文件列表
function parseCodelock() {
  if (!fs.existsSync(CODELOCK_FILE)) {
    console.log('CODELOCK.md 不存在，跳过检查');
    return [];
  }

  const content = fs.readFileSync(CODELOCK_FILE, 'utf8');
  const locked = [];

  // 匹配表格中的文件路径: | `path/to/file` | 说明 | 日期 |
  const lines = content.split('\n');
  let inTable = false;

  for (const line of lines) {
    // 检测表格开始
    if (line.includes('| 文件 | 说明 | 锁定日期 |')) {
      inTable = true;
      continue;
    }

    // 表格分隔线或空行
    if (line.startsWith('|---') || line.trim() === '') {
      continue;
    }

    // 新的 section 标题（### 开头），结束当前表格
    if (line.startsWith('##') || line.startsWith('>')) {
      inTable = false;
      continue;
    }

    if (inTable && line.includes('|')) {
      // 解析表格行: | `path` | description | date |
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 1) {
        const filePath = cells[0].replace(/`/g, '').trim();
        if (filePath && !filePath.startsWith('--')) {
          locked.push({ file: filePath, desc: cells[1] || '', date: cells[2] || '' });
        }
      }
    }
  }

  return locked;
}

// 检查锁定文件是否被修改
function checkLockedFiles(lockedFiles) {
  const changed = [];
  const notFound = [];

  for (const { file, desc } of lockedFiles) {
    const fullPath = path.join(ROOT, file);

    if (!fs.existsSync(fullPath)) {
      notFound.push({ file, desc });
      continue;
    }

    try {
      // 检查 git diff: 该文件在工作区或暂存区是否有变更
      const diff = execSync(`git diff HEAD -- "${file}"`, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (diff.trim()) {
        changed.push({
          file,
          desc,
          diffSummary: diff.split('\n').filter(l => l.startsWith('+') || l.startsWith('-')).slice(0, 6).join('\n'),
        });
      }
    } catch (err) {
      // git diff 失败（比如文件从未提交过），当作变更处理
      changed.push({ file, desc, diffSummary: '(新文件或 git 错误: ' + err.message + ')' });
    }
  }

  return { changed, notFound };
}

// 主流程
function main() {
  console.log(`\n${CYAN}${BOLD}🔒 CODELOCK 部署前检查${RESET}\n`);

  const lockedFiles = parseCodelock();

  if (lockedFiles.length === 0) {
    log('✅', '没有锁定文件，检查通过', GREEN);
    process.exit(0);
  }

  console.log(`锁定文件数: ${lockedFiles.length}\n`);
  lockedFiles.forEach(({ file, desc }) => {
    console.log(`  📁 ${file}${desc ? ` — ${desc}` : ''}`);
  });
  console.log('');

  const { changed, notFound } = checkLockedFiles(lockedFiles);

  // 检查 FORCE_DEPLOY 环境变量
  const forceModules = (process.env.FORCE_DEPLOY || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

  if (notFound.length > 0) {
    console.log(`${YELLOW}⚠️  以下锁定文件不存在（可能已移动或删除）:${RESET}`);
    notFound.forEach(({ file, desc }) => {
      console.log(`  📁 ${file} — ${desc}`);
    });
  }

  if (changed.length === 0) {
    log('✅', '所有锁定文件未被修改，检查通过！', GREEN);
    process.exit(0);
  }

  // 检查是否所有变更都在 FORCE_DEPLOY 白名单内
  const unauthorizedChanges = changed.filter(({ file }) => {
    // 从文件路径提取模块名（如 frontend/src/pages/WhatsAppPage.tsx → whatsapp）
    const moduleName = file.toLowerCase();
    return !forceModules.some(m => moduleName.includes(m));
  });

  if (unauthorizedChanges.length === 0 && forceModules.length > 0) {
    log('⚠️', `FORCE_DEPLOY 已授权: ${forceModules.join(', ')} → 放行`, YELLOW);
    changed.forEach(({ file }) => {
      console.log(`  🔓 ${file} (已授权)`);
    });
    process.exit(0);
  }

  // 有未授权的锁定文件变更 → 中止！
  console.log(`\n${RED}${BOLD}⛔ ============================================================${RESET}`);
  console.log(`${RED}${BOLD}   部署中止！以下 CODELOCK 锁定文件被修改：${RESET}`);
  console.log(`${RED}${BOLD}============================================================${RESET}\n`);

  unauthorizedChanges.forEach(({ file, desc, diffSummary }) => {
    console.log(`${RED}  🔒 ${file}${RESET}`);
    console.log(`     说明: ${desc || '(无)'}`);
    if (diffSummary) {
      console.log(`     变更摘要:\n${diffSummary.split('\n').map(l => `       ${l}`).join('\n')}`);
    }
    console.log('');
  });

  console.log(`${YELLOW}  如需强制部署，请设置:${RESET}`);
  const moduleNames = unauthorizedChanges.map(({ file }) => {
    const parts = file.replace(/\\/g, '/').split('/');
    const fileName = parts[parts.length - 1].replace(/\.(tsx?|jsx?|js|md|bat)$/, '').toLowerCase();
    return fileName;
  }).join(',');
  console.log(`  ${CYAN}FORCE_DEPLOY=${moduleNames} node scripts/pre-deploy-check.js${RESET}`);
  console.log(`  ${CYAN}或在 deploy.bat 中: set FORCE_DEPLOY=${moduleNames}${RESET}\n`);

  process.exit(1);
}

main();
