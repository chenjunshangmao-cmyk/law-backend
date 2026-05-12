/**
 * 📦 改前快照备份脚本
 * 
 * 每次改动 Claw 代码前执行，备份：
 * 1. 前端代码（git commit hash 记录）
 * 2. 后端代码（git commit hash 记录）
 * 3. 数据库（pg_dump 导出 SQL）
 * 
 * 用法: node scripts/backup-snapshot.js [--comment="改什么"]
 * 
 * 输出:
 *   backups/snapshots/YYYY-MM-DD_HHmmss/
 *     ├── metadata.json   — 时间/描述/git hash
 *     ├── frontend.log    — 前端 git log
 *     ├── backend.log     — 后端 git log
 *     └── database.sql    — PostgreSQL 全量备份
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, 'backups', 'snapshots');

const TS = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const DIR_NAME = TS; // YYYY-MM-DD_HH-mm-ss
const DEST = path.join(BACKUP_DIR, DIR_NAME);

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

/**
 * 从 .env 或 Render 环境读取数据库连接信息
 * 备份脚本读取本地 .env；如果不存在，试试用默认连接
 */
function getDbUrl() {
  const envPath = path.join(ROOT, 'backend', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=(.+)/);
    if (match) return match[1].trim();
  }
  // 回退到 TOOLS.md 中记录的数据库 URL
  return process.env.DATABASE_URL || 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db';
}

function main() {
  const args = process.argv.slice(2);
  const commentIdx = args.findIndex(a => a.startsWith('--comment='));
  const comment = commentIdx >= 0 ? args[commentIdx].split('=')[1] : '改前快照';

  // 创建备份目录
  fs.mkdirSync(DEST, { recursive: true });
  log('📁', `创建备份目录: ${DEST}`, CYAN);
  log('💬', `备份原因: ${comment}`, '');

  // === 1. 记录前端 git 状态 ===
  log('\n📝', '记录前端 git 状态...', '');
  const frontendLog = [
    `时间: ${TS}`,
    `commit: ${run('git rev-parse HEAD')}`,
    `分支: ${run('git rev-parse --abbrev-ref HEAD')}`,
    `最近5条:`,
    run('git log --oneline -5'),
    '',
    `变更文件:`,
    run('git diff --name-status'),
  ].join('\n');
  fs.writeFileSync(path.join(DEST, 'frontend.log'), frontendLog);

  // === 2. 记录后端 git 状态 ===
  log('📝', '记录后端 git 状态...', '');
  const backendDir = path.join(ROOT, 'backend');
  let backendLog = `(backend 在同一个 git repo 中，同上)`;
  if (fs.existsSync(path.join(backendDir, '.git'))) {
    backendLog = [
      `时间: ${TS}`,
      `commit: ${run('git rev-parse HEAD', backendDir)}`,
      `分支: ${run('git rev-parse --abbrev-ref HEAD', backendDir)}`,
      `最近5条:`,
      run('git log --oneline -5', backendDir),
    ].join('\n');
  }
  fs.writeFileSync(path.join(DEST, 'backend.log'), backendLog);

  // === 3. 数据库备份 ===
  log('📝', '备份数据库...', '');
  const dbUrl = getDbUrl();
  const sqlPath = path.join(DEST, 'database.sql');

  try {
    // 优先用 pg_dump（需要在本地安装 PostgreSQL 客户端）
    const output = execSync(
      `pg_dump "${dbUrl}" --no-owner --no-acl --clean --if-exists`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 }
    );
    fs.writeFileSync(sqlPath, output);
    const size = fs.statSync(sqlPath).size;
    log('✅', `数据库备份成功 (${(size / 1024).toFixed(1)} KB)`, GREEN);
  } catch (e) {
    // pg_dump 不可用或网络问题（常见于本地没装 pg 客户端）
    log('⚠️', `pg_dump 不可用 (${e.message.split('\n')[0]})`, YELLOW);
    log('💡', '请在 Render 后台手动导出数据库备份（设置 → 数据库 → Backup）', YELLOW);
    fs.writeFileSync(sqlPath, `-- pg_dump 不可用\n-- 请在 Render 后台手动备份\n-- ${new Date().toISOString()}\n`);
  }

  // === 4. 写入元数据 ===
  const metadata = {
    timestamp: new Date().toISOString(),
    comment,
    frontend: {
      commit: run('git rev-parse HEAD'),
      branch: run('git rev-parse --abbrev-ref HEAD'),
    },
    backend: {
      commit: run('git rev-parse HEAD', backendDir),
    },
    database: {
      backedUp: fs.existsSync(sqlPath) && fs.statSync(sqlPath).size > 100,
      url: dbUrl.replace(/\/\/.*@/, '//***@'), // 隐藏密码
    },
    files: fs.readdirSync(DEST),
  };
  fs.writeFileSync(path.join(DEST, 'metadata.json'), JSON.stringify(metadata, null, 2));

  log('\n✅', `快照完成: ${DEST}`, GREEN);
  console.log(JSON.stringify(metadata, null, 2));
}

main();
