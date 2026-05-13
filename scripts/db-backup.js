/**
 * 数据库自动备份脚本
 * 运行方式: node scripts/db-backup.js
 * 备份 PostgreSQL 所有重要表到 backups/ 目录
 */
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.resolve(__dirname, '..', 'backups', 'auto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com:5432/claw_db',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  max: 1,
});

const TABLES = ['users', 'products', 'accounts', 'payment_orders', 'articles', 'quotas', 'whatsapp_links', 'publish_tasks'];

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const data = { timestamp: new Date().toISOString(), tables: {} };

  for (const table of TABLES) {
    try {
      const result = await pool.query(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 1000`);
      data.tables[table] = { count: result.rows.length, rows: result.rows };
      console.log(`  ✅ ${table}: ${result.rows.length} 条`);
    } catch (e) {
      data.tables[table] = { count: 0, error: e.message };
      console.log(`  ⚠️ ${table}: ${e.message}`);
    }
  }

  fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
  console.log(`\n📦 备份完成: ${backupFile} (${(fs.statSync(backupFile).size / 1024).toFixed(1)} KB)`);

  // 只保留最近 7 天的备份
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-'))
    .sort()
    .reverse();
  for (const f of files.slice(7)) {
    fs.unlinkSync(path.join(BACKUP_DIR, f));
    console.log(`  🗑️ 清理旧备份: ${f}`);
  }

  await pool.end();
}

backup().catch(e => { console.error('备份失败:', e); pool.end(); process.exit(1); });
