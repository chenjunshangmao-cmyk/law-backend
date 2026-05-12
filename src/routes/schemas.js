// 数据库建表脚本 - 启动时自动执行
import pool from '../config/database.js';

export async function initSchemas() {
  if (!pool) {
    console.log('[DB] 内存模式，跳过建表');
    return;
  }

  try {
    // 小说表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS novels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        genre VARCHAR(50) DEFAULT 'other',
        total_chapters INTEGER DEFAULT 300,
        outline JSONB,
        status VARCHAR(20) DEFAULT 'planning',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 章节表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chapters (
        id SERIAL PRIMARY KEY,
        novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
        chapter_no INTEGER NOT NULL,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        word_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'writing',
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(novel_id, chapter_no)
      )
    `);

    // 索引
    await pool.query('CREATE INDEX IF NOT EXISTS idx_chapters_novel ON chapters(novel_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_novels_user ON novels(user_id)');

    // 给 novels 表加 outline 列（如果老表没有）
    try {
      await pool.query('ALTER TABLE novels ADD COLUMN IF NOT EXISTS outline JSONB');
    } catch (e) { /* 已有 */ }

    // 给 novels 表加 total_chapters 列
    try {
      await pool.query('ALTER TABLE novels ADD COLUMN IF NOT EXISTS total_chapters INTEGER DEFAULT 300');
    } catch (e) { /* 已有 */ }

    console.log('[DB] 小说表结构初始化完成');
  } catch (err) {
    console.error('[DB] 建表失败:', err.message);
  }
}
