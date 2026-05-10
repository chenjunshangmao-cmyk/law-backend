/**
 * Articles API — 外贸干货文章管理系统 v1.0
 * 
 * 端点：
 * GET    /api/articles              - 文章列表（分页+分类）
 * GET    /api/articles/:slug        - 文章详情
 * POST   /api/articles              - 创建文章
 * PUT    /api/articles/:id          - 编辑文章
 * DELETE /api/articles/:id          - 删除文章
 * POST   /api/articles/generate     - AI生成外贸干货文章
 * GET    /api/articles/categories   - 获取分类列表
 * POST   /api/articles/:id/publish  - 发布到各平台
 */

import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

async function callLLM(messages, options = {}) {
  const { temperature = 0.7, maxTokens = 4096 } = options;
  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

// 分类定义
const CATEGORIES = [
  { id: 'cross-border', name: '跨境干货', icon: '🌍', color: '#3b82f6', desc: '跨境电商运营技巧' },
  { id: 'tiktok-shop', name: 'TikTok电商', icon: '🎵', color: '#ef4444', desc: 'TikTok Shop选品与投放' },
  { id: 'livestream', name: '直播带货', icon: '📡', color: '#8b5cf6', desc: '直播运营与转化' },
  { id: 'marketing', name: '营销推广', icon: '📢', color: '#f59e0b', desc: '广告投放与获客' },
  { id: 'ai-tools', name: 'AI赋能', icon: '🤖', color: '#10b981', desc: 'AI工具提升效率' },
  { id: 'case-study', name: '实战案例', icon: '📊', color: '#ec4899', desc: '真实卖家成功案例' },
];

// 确保表存在
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id SERIAL PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        slug VARCHAR(300) UNIQUE NOT NULL,
        summary VARCHAR(500),
        content TEXT NOT NULL,
        cover_image VARCHAR(500),
        category VARCHAR(50) DEFAULT 'cross-border',
        tags TEXT[] DEFAULT '{}',
        author VARCHAR(100) DEFAULT 'Claw AI',
        status VARCHAR(20) DEFAULT 'draft',
        view_count INTEGER DEFAULT 0,
        seo_title VARCHAR(300),
        seo_desc VARCHAR(500),
        seo_keywords TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Articles] 📊 数据表就绪');
  } catch (e) {
    console.warn('[Articles] 建表:', e.message);
  }
})();

// slugify
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

// ═══ 公开接口 ═══

/**
 * GET /api/articles
 * 文章列表（支持分页、分类筛选、搜索）
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search, status = 'published' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let where = "WHERE status = $1";
    const params = [status];
    let paramIdx = 2;

    if (category && category !== 'all') {
      where += ` AND category = $${paramIdx++}`;
      params.push(category);
    }
    if (search) {
      where += ` AND (title ILIKE $${paramIdx} OR summary ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM articles ${where}`,
      params
    );
    
    const result = await pool.query(
      `SELECT id, title, slug, summary, cover_image, category, tags, author, 
              status, view_count, created_at, updated_at
       FROM articles ${where}
       ORDER BY created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: {
        articles: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
      },
    });
  } catch (e) {
    console.error('[Articles] 列表查询失败:', e);
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/articles/categories
 */
router.get('/categories', (req, res) => {
  res.json({ success: true, data: CATEGORIES });
});

/**
 * GET /api/articles/:slug
 * 文章详情（按 slug）
 */
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM articles WHERE slug = $1 AND status = 'published'`,
      [req.params.slug]
    );
    
    if (result.rows.length === 0) {
      return res.json({ success: false, error: '文章不存在' });
    }

    // 增加阅读量
    await pool.query(
      'UPDATE articles SET view_count = view_count + 1 WHERE id = $1',
      [result.rows[0].id]
    );
    
    result.rows[0].view_count++;

    // 获取相关文章
    const related = await pool.query(
      `SELECT id, title, slug, summary, cover_image, category, created_at
       FROM articles 
       WHERE category = $1 AND id != $2 AND status = 'published'
       ORDER BY created_at DESC LIMIT 3`,
      [result.rows[0].category, result.rows[0].id]
    );

    res.json({
      success: true,
      data: {
        article: result.rows[0],
        related: related.rows,
      },
    });
  } catch (e) {
    console.error('[Articles] 详情查询失败:', e);
    res.json({ success: false, error: e.message });
  }
});

// ═══ 管理接口（需登录） ═══

/**
 * POST /api/articles
 * 创建文章
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title, content, summary, cover_image, category = 'cross-border',
      tags = [], status = 'draft', seo_title, seo_desc, seo_keywords = [],
    } = req.body;

    if (!title || !content) {
      return res.json({ success: false, error: '标题和内容不能为空' });
    }

    const slug = slugify(title) + '-' + Date.now().toString(36);

    const result = await pool.query(
      `INSERT INTO articles (title, slug, summary, content, cover_image, category, tags, status, seo_title, seo_desc, seo_keywords)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title, slug, summary || content.substring(0, 200), content, cover_image,
       category, tags, status, seo_title || title, seo_desc || (summary || content.substring(0, 200)), seo_keywords]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('[Articles] 创建失败:', e);
    res.json({ success: false, error: e.message });
  }
});

/**
 * PUT /api/articles/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      title, content, summary, cover_image, category, tags, status,
      seo_title, seo_desc, seo_keywords,
    } = req.body;

    const result = await pool.query(
      `UPDATE articles SET 
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        summary = COALESCE($3, summary),
        cover_image = COALESCE($4, cover_image),
        category = COALESCE($5, category),
        tags = COALESCE($6, tags),
        status = COALESCE($7, status),
        seo_title = COALESCE($8, seo_title),
        seo_desc = COALESCE($9, seo_desc),
        seo_keywords = COALESCE($10, seo_keywords),
        updated_at = NOW()
       WHERE id = $11 RETURNING *`,
      [title, content, summary, cover_image, category, tags, status,
       seo_title, seo_desc, seo_keywords, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, error: '文章不存在' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('[Articles] 更新失败:', e);
    res.json({ success: false, error: e.message });
  }
});

/**
 * DELETE /api/articles/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM articles WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: '已删除' });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * POST /api/articles/generate
 * AI生成外贸干货文章
 */
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const {
      topic,
      category = 'cross-border',
      keywords = [],
      style = 'professional',  // professional | casual | tutorial
    } = req.body;

    if (!topic) {
      return res.json({ success: false, error: '请输入文章主题' });
    }

    const catInfo = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
    const keywordsText = keywords.length > 0 ? `关键词: ${keywords.join('、')}` : '';
    const styleMap = {
      professional: '专业人士风格，分析深入，数据支撑',
      casual: '通俗易懂口语化，像朋友分享经验',
      tutorial: '教程风格，逐步教学，实操性强',
    };

    console.log(`[Articles] 🤖 AI生成文章: "${topic}" (${catInfo.name})`);

    const prompt = `你是资深跨境电商运营专家，拥有10年外贸经验。

请写一篇外贸干货文章，要求：
- 主题: ${topic}
- 分类: ${catInfo.name}
- ${keywordsText}
- 风格: ${styleMap[style] || styleMap.professional}
- 篇幅: 1500-2500字
- 必须包含: 引人入胜的开头、3-5个实操要点、真实案例或数据、总结建议
- 去掉AI味：不要用"在当今时代""总而言之""值得注意的是"等套话
- 像真人专家写的经验分享

输出格式（Markdown）:
# [吸引人的标题]
> 一句话摘要（抓眼球）

## 开头（背景+痛点）
...

## 核心内容（分3-5个小标题）
...

## 实战案例
...

## 总结建议
...

最后一行输出 JSON:
{"title":"文章标题","summary":"80字以内的摘要","tags":["标签1","标签2","标签3"]}`;

    const content = await callLLM([
      { role: 'system', content: '你是跨境电商运营专家，写文章干货满满、口语自然、没有AI套话。' },
      { role: 'user', content: prompt }
    ], { temperature: 0.8, maxTokens: 4096 });

    // 提取元数据
    let meta = { title: topic, summary: '', tags: [] };
    const metaMatch = content.match(/\{[\s\S]*"title"[\s\S]*\}/);
    if (metaMatch) {
      try {
        meta = JSON.parse(metaMatch[0]);
      } catch {}
    }

    // 清理文章内容（去掉最后的JSON）
    const cleanContent = content.replace(/\n?\{[\s\S]*"title"[\s\S]*\}/, '').trim();

    // 自动保存为草稿
    const slug = slugify(meta.title || topic) + '-' + Date.now().toString(36);
    const result = await pool.query(
      `INSERT INTO articles (title, slug, summary, content, category, tags, status, seo_title, seo_desc, seo_keywords)
       VALUES ($1,$2,$3,$4,$5,$6,'draft',$7,$8,$9) RETURNING *`,
      [
        meta.title || topic,
        slug,
        meta.summary || cleanContent.substring(0, 200),
        cleanContent,
        category,
        meta.tags,
        meta.title || topic,
        meta.summary || cleanContent.substring(0, 200),
        meta.tags,
      ]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        message: `AI已生成文章: ${meta.title || topic}`,
      },
    });
  } catch (e) {
    console.error('[Articles] AI生成失败:', e);
    res.json({ success: false, error: e.message });
  }
});

export default router;
