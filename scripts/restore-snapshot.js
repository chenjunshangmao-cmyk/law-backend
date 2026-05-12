/**
 * 🔄 改前快照恢复脚本
 * 
 * 从备份快照恢复代码 + 数据库到某一时刻的状态。
 * 
 * 用法:
 *   node scripts/restore-snapshot.js              # 列出所有快照
 *   node scripts/restore-snapshot.js --list       # 列出所有快照
 *   node scripts/restore-snapshot.js <目录名>      # 恢复到指定快照
 * 
 * 示例:
 *   node scripts/restore-snapshot.js 2026-05-12T09-40-00
 * 
 * 注意:
 *   - 代码恢复通过 git reset --hard（危险！仅适用于前端/后端代码回滚）
 *   - 数据库恢复需要手动在 Render 后台操作（自动备份可能时间要求紧迫）
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, 'backups', 'snapshots');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function log(emoji, msg, color = '') {
  console.log(`${color}${emoji} ${msg}${RESET}`);
}

function run(cmd, cwd = ROOT) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return `(错误: ${e.message.split('\n')[0]})`;
  }
}

function listSnapshots() {
  if (!fs.existsSync(BACKUP_DIR)) {
    log('📭', '还没有任何快照', YELLOW);
    return [];
  }

  const snapshots = fs.readdirSync(BACKUP_DIR)
    .filter(d => fs.statSync(path.join(BACKUP_DIR, d)).isDirectory())
    .sort()
    .reverse();

  if (snapshots.length === 0) {
    log('📭', '还没有任何快照', YELLOW);
    return [];
  }

  console.log(`\n${CYAN}${BOLD}📦 可用快照 (共 ${snapshots.length} 个)${RESET}\n`);
  snapshots.forEach((name, i) => {
    const metaPath = path.join(BACKUP_DIR, name, 'metadata.json');
    let comment = '(无描述)';
    let hasDb = '❌';
    let codeCommit = '';

    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        comment = meta.comment || '(无描述)';
        hasDb = meta.database?.backedUp ? '✅' : '⚠️';
        codeCommit = meta.frontend?.commit?.slice(0, 8) || '';
      } catch (e) {}
    }

    console.log(`  ${i + 1}. ${name}`);
    console.log(`     描述: ${comment}`);
    console.log(`     代码: ${codeCommit ? `commit ${codeCommit}` : '无记录'}`);
    console.log(`     数据库: ${hasDb}`);
    console.log('');
  });

  return snapshots;
}

function restoreSnapshot(snapshotName) {
  const snapshotDir = path.join(BACKUP_DIR, snapshotName);

  if (!fs.existsSync(snapshotDir)) {
    log('❌', `快照 "${snapshotName}" 不存在`, RED);
    log('💡', '使用 --list 查看可用快照', YELLOW);
    process.exit(1);
  }

  const metaPath = path.join(snapshotDir, 'metadata.json');
  if (!fs.existsSync(metaPath)) {
    log('❌', `快照 "${snapshotName}" 缺少 metadata.json`, RED);
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const targetCommit = meta.frontend?.commit;

  console.log(`\n${YELLOW}${BOLD}⚠️  即将恢复到快照: ${snapshotName}${RESET}`);
  console.log(`${YELLOW}   描述: ${meta.comment}${RESET}`);
  console.log(`${YELLOW}   目标 commit: ${targetCommit?.slice(0, 12)}${RESET}\n`);

  // 检查当前 git 状态
  const status = run('git status --short');
  if (status && status !== '(错误: ...)') {
    console.log(`${YELLOW}⚠️  当前有未提交的变更:${RESET}`);
    console.log(status);
    console.log(`${YELLOW}建议先 stash 或提交当前变更再恢复。${RESET}\n`);
  }

  // ========== 恢复代码 ==========
  log('🔄', '恢复前端代码...', '');
  if (targetCommit) {
    run(`git reset --hard ${targetCommit}`);
    log('✅', `代码已恢复到 commit ${targetCommit.slice(0, 12)}`, GREEN);
  } else {
    log('⚠️', 'metadata 中没有前端 commit 记录，跳过代码恢复', YELLOW);
  }

  // ========== 恢复数据库（仅提醒，不自动执行） ==========
  const sqlPath = path.join(snapshotDir, 'database.sql');
  if (fs.existsSync(sqlPath) && fs.statSync(sqlPath).size > 100) {
    const sizeKB = (fs.statSync(sqlPath).size / 1024).toFixed(1);
    console.log(`\n${CYAN}📋 数据库备份可用 (${sizeKB} KB):${RESET}`);
    console.log(`   ${sqlPath}`);
    console.log(`${YELLOW}   数据库恢复需要手动执行:${RESET}`);
    console.log(`   psql "${meta.database?.url || '<DATABASE_URL>'}" < "${sqlPath}"`);
    console.log(`${YELLOW}   或者在 Render 后台 → Database → Restore${RESET}`);
  } else {
    log('❌', '数据库备份不可用，需要手动处理', RED);
  }

  console.log(`\n${GREEN}${BOLD}✅ 恢复完成！${RESET}`);
  console.log(`${YELLOW}   ⚠️  检查以下事项:${RESET}`);
  console.log(`   1. 数据库是否已恢复 (见上方说明)`);
  console.log(`   2. 如需推送到 Render: git push --force origin master (注意！会覆盖线上)`);
  console.log(`   3. 因为回滚了代码，后续修改前先 git pull 确认是最新状态`);
}

// Main
const args = process.argv.slice(2);

if (args.includes('--list') || args.includes('--help') || args.length === 0) {
  listSnapshots();
  process.exit(0);
}

const snapshotName = args.find(a => !a.startsWith('--'));
if (snapshotName) {
  restoreSnapshot(snapshotName);
} else {
  listSnapshots();
}
