// 小说管理系统 API
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool, { useMemoryMode, memoryStore } from '../config/database.js';

const router = express.Router();

// ==================== 小说 CRUD ====================

/**
 * GET /api/novels - 获取所有小说列表
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!pool) {
      // 内存模式
      const novels = memoryStore?.novels || [];
      return res.json({ novels });
    }
    const result = await pool.query(
      'SELECT * FROM novels WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ novels: result.rows });
  } catch (err) {
    console.error('[Novels] 查询失败:', err.message);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * POST /api/novels - 创建新小说
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, genre, total_chapters = 300 } = req.body;
    if (!title) return res.status(400).json({ error: '标题必填' });

    if (!pool) {
      const novel = {
        id: Date.now().toString(),
        user_id: req.userId,
        title, description, genre,
        total_chapters: parseInt(total_chapters),
        status: 'planning',
        created_at: new Date().toISOString()
      };
      if (!memoryStore.novels) memoryStore.novels = [];
      memoryStore.novels.push(novel);
      return res.json({ novel });
    }

    const result = await pool.query(
      `INSERT INTO novels (user_id, title, description, genre, total_chapters, status)
       VALUES ($1, $2, $3, $4, $5, 'planning')
       RETURNING *`,
      [req.userId, title, description, genre, parseInt(total_chapters)]
    );
    res.json({ novel: result.rows[0] });
  } catch (err) {
    console.error('[Novels] 创建失败:', err.message);
    res.status(500).json({ error: '创建失败' });
  }
});

/**
 * GET /api/novels/:id - 获取单部小说详情（含章节统计）
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (!pool) {
      const novel = memoryStore?.novels?.find(n => n.id === req.params.id);
      if (!novel) return res.status(404).json({ error: '未找到' });
      return res.json({ novel });
    }

    const novelResult = await pool.query(
      'SELECT * FROM novels WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (novelResult.rows.length === 0) return res.status(404).json({ error: '未找到' });

    // 章节统计
    const countResult = await pool.query(
      `SELECT status, COUNT(*)::int as count FROM chapters
       WHERE novel_id = $1 GROUP BY status`,
      [req.params.id]
    );

    const stats = { planning: 0, writing: 0, review: 0, published: 0, failed: 0 };
    countResult.rows.forEach(r => { stats[r.status] = r.count; });

    res.json({ novel: novelResult.rows[0], stats });
  } catch (err) {
    console.error('[Novels] 查询失败:', err.message);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * PUT /api/novels/:id - 更新小说信息
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, genre, status, total_chapters } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    if (title) { fields.push(`title = $${idx++}`); values.push(title); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (genre) { fields.push(`genre = $${idx++}`); values.push(genre); }
    if (status) { fields.push(`status = $${idx++}`); values.push(status); }
    if (total_chapters) { fields.push(`total_chapters = $${idx++}`); values.push(parseInt(total_chapters)); }

    if (fields.length === 0) return res.status(400).json({ error: '无更新字段' });

    values.push(req.params.id);
    values.push(req.userId);

    const result = await pool.query(
      `UPDATE novels SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${idx++} AND user_id = $${idx}
       RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '未找到' });
    res.json({ novel: result.rows[0] });
  } catch (err) {
    console.error('[Novels] 更新失败:', err.message);
    res.status(500).json({ error: '更新失败' });
  }
});

// ==================== 章节 CRUD ====================

/**
 * GET /api/novels/:id/chapters - 获取章节列表
 */
router.get('/:id/chapters', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 300, offset = 0 } = req.query;
    let sql = 'SELECT id, novel_id, chapter_no, title, status, word_count, created_at, updated_at FROM chapters WHERE novel_id = $1';
    const params = [req.params.id];

    if (status) {
      sql += ' AND status = $2';
      params.push(status);
    }
    sql += ' ORDER BY chapter_no ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(sql, params);
    res.json({ chapters: result.rows });
  } catch (err) {
    console.error('[Chapters] 查询失败:', err.message);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * GET /api/novels/:id/chapters/:chapterId - 获取单章内容
 */
router.get('/:id/chapters/:chapterId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM chapters WHERE id = $1 AND novel_id = $2',
      [req.params.chapterId, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '未找到' });
    res.json({ chapter: result.rows[0] });
  } catch (err) {
    console.error('[Chapters] 查询失败:', err.message);
    res.status(500).json({ error: '查询失败' });
  }
});

/**
 * POST /api/novels/:id/chapters - 创建/保存章节
 */
router.post('/:id/chapters', authenticateToken, async (req, res) => {
  try {
    const { chapter_no, title, content, status = 'writing' } = req.body;
    if (!chapter_no || !title) return res.status(400).json({ error: '章号和标题必填' });

    const word_count = content ? content.length : 0;

    // 检查是否已存在同章号
    const existing = await pool.query(
      'SELECT id FROM chapters WHERE novel_id = $1 AND chapter_no = $2',
      [req.params.id, chapter_no]
    );

    if (existing.rows.length > 0) {
      // 更新已有章节
      const result = await pool.query(
        `UPDATE chapters SET title=$1, content=$2, word_count=$3, status=$4, updated_at=NOW()
         WHERE id=$5 RETURNING *`,
        [title, content, word_count, status, existing.rows[0].id]
      );
      return res.json({ chapter: result.rows[0], updated: true });
    }

    const result = await pool.query(
      `INSERT INTO chapters (novel_id, chapter_no, title, content, word_count, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, chapter_no, title, content, word_count, status]
    );
    res.json({ chapter: result.rows[0] });
  } catch (err) {
    console.error('[Chapters] 保存失败:', err.message);
    res.status(500).json({ error: '保存失败' });
  }
});

/**
 * PUT /api/novels/:id/chapters/:chapterId - 更新章节状态/内容
 */
router.put('/:id/chapters/:chapterId', authenticateToken, async (req, res) => {
  try {
    const { title, content, status } = req.body;
    const fields = [];
    const values = [];
    let idx = 1;

    if (title) { fields.push(`title = $${idx++}`); values.push(title); }
    if (content !== undefined) { fields.push(`content = $${idx++}`); values.push(content); fields.push(`word_count = $${idx++}`); values.push(content.length); }
    if (status) { fields.push(`status = $${idx++}`); values.push(status); }

    if (fields.length === 0) return res.status(400).json({ error: '无更新字段' });

    fields.push(`updated_at = NOW()`);

    values.push(req.params.chapterId);
    values.push(req.params.id);

    const result = await pool.query(
      `UPDATE chapters SET ${fields.join(', ')} WHERE id = $${idx++} AND novel_id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '未找到' });
    res.json({ chapter: result.rows[0] });
  } catch (err) {
    console.error('[Chapters] 更新失败:', err.message);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * POST /api/novels/:id/outline - 保存大纲（JSON格式的300章标题）
 */
router.post('/:id/outline', authenticateToken, async (req, res) => {
  try {
    const { outline } = req.body;
    if (!outline) return res.status(400).json({ error: '大纲必填' });

    const result = await pool.query(
      `UPDATE novels SET outline = $1, status = 'outlined', updated_at = NOW()
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [JSON.stringify(outline), req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '未找到' });
    res.json({ novel: result.rows[0] });
  } catch (err) {
    console.error('[Outline] 保存失败:', err.message);
    res.status(500).json({ error: '保存失败' });
  }
});

export default router;
