/**
 * Novel Engine - AI小说引擎
 * 生成大纲、批量写章节、防AI检测
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getGateway } from '../services/ai/AIGateway.js';
import pool, { useMemoryMode, memoryStore } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const gateway = getGateway();
const DATA_FILE = path.join(__dirname, '../../data/novels_engine.json');

// 读取/写入小说引擎数据
function readEngine() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify({ stories: [], chapters: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch { return { stories: [], chapters: [] }; }
}

function saveEngine(data) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 风格选项（防AI检测）
const STYLE_OPTIONS = [
  { id: 'default', label: '默认风格' },
  { id: 'funny', label: '搞笑风趣', desc: '加入幽默段子、神转折、吐槽' },
  { id: 'suspense', label: '悬疑紧张', desc: '加入悬念设置、反转情节' },
  { id: 'tearjerker', label: '催泪感人', desc: '加入泪点、遗憾、亲情友情' },
  { id: 'passionate', label: '热血燃爆', desc: '加入战斗、爆发、逆袭' },
  { id: 'lifehack', label: '生活细节', desc: '加入日常烟火气、接地气对话' },
];

// ========================================
// 1. AI生成小说大纲
// POST /api/novel-engine/outline
// ========================================
router.post('/outline', authenticateToken, async (req, res) => {
  try {
    const { title, genre, description, totalChapters, style = 'default' } = req.body;
    if (!title) return res.status(400).json({ success: false, error: '标题必填' });

    const styleInfo = STYLE_OPTIONS.find(s => s.id === style);
    const stylePrompt = styleInfo ? `风格要求：${styleInfo.desc}` : '';

    const prompt = `你是一个网络小说作家。请为以下小说撰写详细大纲。

书名：《${title}》
类型：${genre || '都市'}
简介：${description || '无'}
总章节数：${totalChapters || 300}章
${stylePrompt}

请输出：
1. 【核心设定】：世界观、主角人设、金手指/异能/系统
2. 【主要角色】：2-4个配角，姓名+定位
3. 【故事脉络】：前中后三期剧情线（每期10-20章的小高潮点）
4. 【前5章标题列表】：第1章到第5章的章名+一句话简介

格式要求：每条用【】标记，章名用 **第X章：标题** 格式，保持口语化，不要让AI感太重。`;

    const result = await gateway.chat([{ role: 'user', content: prompt }], 'novel-outline');
    const outline = result.content;

    res.json({
      success: true,
      data: {
        outline,
        style,
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ========================================
// 2. AI批量生成章节
// POST /api/novel-engine/generate-chapters
// ========================================
router.post('/generate-chapters', authenticateToken, async (req, res) => {
  try {
    const { title, genre, chapterStart, chapterCount, outline, style = 'default' } = req.body;
    if (!title || !chapterCount) return res.status(400).json({ success: false, error: '参数不全' });

    const count = Math.min(chapterCount, 10); // 一次最多生成10章
    const styleInfo = STYLE_OPTIONS.find(s => s.id === style);
    const stylePrompt = styleInfo ? `风格要求：${styleInfo.desc}` : '';

    const outlineHint = outline ? `已有大纲参考：${outline.substring(0, 500)}` : '';

    // ========== 读取已有章节：取最近2章喂给AI保证连贯性 ==========
    const eng = readEngine();
    const existingChapters = eng.chapters
      .filter(c => c.chapterNo < chapterStart)
      .sort((a, b) => b.chapterNo - a.chapterNo)
      .slice(0, 2)
      .reverse(); // 按顺序：比如第3章、第4章

    let previousContext = '';
    if (existingChapters.length > 0) {
      previousContext = '\n\n## 已有章节内容（请接续写作）\n';
      existingChapters.forEach(ch => {
        const contentPreview = (ch.content || '').substring(0, 1500); // 取前1500字
        previousContext += `=== 第${ch.chapterNo}章：${ch.title} ===\n${contentPreview}\n\n`;
      });
      previousContext += '=== 以上是已有章节，接下来请续写 ===\n\n';
    }

    const prompt = `你是一个网文作家，现在需要写小说的批量章节。

书名：《${title}》
类型：${genre || '都市'}
${stylePrompt}
${outlineHint}
${previousContext}
请生成从第${chapterStart}章到第${chapterStart + count - 1}章，共${count}章。

要求：
1. 每一章包括：章节标题、章节正文（约1500-2000字）
2. 章节之间要有连贯性，剧情要推进
3. 语言要接地气，口语化，避免华丽辞藻
4. 适当加入【${styleInfo?.desc || '日常细节'}】
5. 每一章要有起承转合，结尾留小钩子
6. 一定要像真人写的，不要四字成语堆砌，不要AI味

输出格式（JSON数组）：
[
  {
    "chapterNo": ${chapterStart},
    "title": "章节标题",
    "content": "章节正文内容..."
  },
  ...
]`;

    const result = await gateway.chat([{ role: 'user', content: prompt }], 'novel-chapters');
    let chapters = [];

    try {
      // 尝试解析JSON
      const raw = result.content;
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        chapters = JSON.parse(jsonMatch[0]);
      } else {
        // 不是标准JSON格式，手工分割
        const blocks = raw.split(/第(\d+)章[：:]/);
        for (let i = 1; i < blocks.length; i += 2) {
          const no = parseInt(blocks[i]);
          const rest = blocks[i + 1];
          const titleMatch = rest.match(/^([^\n]+)\n([\s\S]*)/);
          chapters.push({
            chapterNo: no,
            title: titleMatch ? titleMatch[1].trim() : `第${no}章`,
            content: titleMatch ? titleMatch[2].trim() : rest.trim(),
          });
        }
      }
    } catch {
      // 解析失败，返回原始文本
      return res.json({
        success: true,
        data: { chapters: [], rawText: result.content, note: 'AI返回格式异常，需手动调整' }
      });
    }

    // 保存到引擎存储（eng已从上面读取）
    chapters.forEach(ch => {
      ch.id = 'ch_' + Date.now().toString(36) + '_' + ch.chapterNo;
      ch.title = ch.title || `第${ch.chapterNo}章`;
      ch.wordCount = (ch.content || '').length;
      ch.style = style;
      ch.status = 'draft'; // draft | published
      ch.createdAt = new Date().toISOString();
      eng.chapters.push(ch);
    });
    saveEngine(eng);

    res.json({
      success: true,
      data: { chapters: chapters.map(c => ({ ...c, content: c.content?.substring(0, 200) + '...' })), // 预览
        totalChapters: chapters.length }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ========================================
// 3. 获取章节详情
// GET /api/novel-engine/chapter/:id
// ========================================
router.get('/chapter/:id', authenticateToken, async (req, res) => {
  const eng = readEngine();
  const ch = eng.chapters.find(c => c.id === req.params.id);
  if (!ch) return res.status(404).json({ success: false, error: '章节不存在' });
  res.json({ success: true, data: ch });
});

// ========================================
// 4. 更新章节状态（发布/保存）
// PUT /api/novel-engine/chapter/:id
// ========================================
router.put('/chapter/:id', authenticateToken, async (req, res) => {
  const eng = readEngine();
  const idx = eng.chapters.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: '章节不存在' });

  if (req.body.status) eng.chapters[idx].status = req.body.status;
  if (req.body.content) {
    eng.chapters[idx].content = req.body.content;
    eng.chapters[idx].wordCount = req.body.content.length;
  }
  eng.chapters[idx].updatedAt = new Date().toISOString();
  saveEngine(eng);
  res.json({ success: true, data: eng.chapters[idx] });
});

// ========================================
// 5. 获取风格选项
// GET /api/novel-engine/styles
// ========================================
router.get('/styles', (req, res) => {
  res.json({ success: true, data: STYLE_OPTIONS });
});

// ========================================
// 6. 获取所有章节（按小说/故事）
// GET /api/novel-engine/chapters?storyId=xxx
// ========================================
router.get('/chapters', authenticateToken, async (req, res) => {
  const eng = readEngine();
  const { storyId, status } = req.query;

  let chapters = eng.chapters;
  if (storyId) chapters = chapters.filter(c => c.storyId === storyId);
  if (status) chapters = chapters.filter(c => c.status === status);

  // 只返回摘要（不含完整正文）
  const summary = chapters.map(c => ({
    id: c.id,
    chapterNo: c.chapterNo,
    title: c.title,
    status: c.status,
    wordCount: c.wordCount,
    style: c.style,
    createdAt: c.createdAt,
    preview: (c.content || '').substring(0, 80) + '...',
  }));

  res.json({ success: true, data: { chapters: summary, total: chapters.length } });
});

// ========================================
// 7. 一键发布到番茄小说（模拟/浏览器自动）
// POST /api/novel-engine/publish
// ========================================
router.post('/publish', authenticateToken, async (req, res) => {
  try {
    const { chapterId } = req.body;
    if (!chapterId) return res.status(400).json({ success: false, error: '章节ID必填' });

    const eng = readEngine();
    const ch = eng.chapters.find(c => c.id === chapterId);
    if (!ch) return res.status(404).json({ success: false, error: '章节不存在' });

    // 标记为已发布
    const idx = eng.chapters.findIndex(c => c.id === chapterId);
    eng.chapters[idx].status = 'published';
    eng.chapters[idx].publishedAt = new Date().toISOString();
    saveEngine(eng);

    // TODO: 实际对接番茄小说 API 或浏览器自动发布
    res.json({
      success: true,
      data: { chapterId, title: ch.title, status: 'published', note: '已标记发布（需实际配置番茄账号）' }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ========== 兼容路由：/generate ==========
// 先检查前端实际请求了什么
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { action, type, theme, style, title, startFrom, ...rest } = req.body;
    const gateway = getGateway();
    
    if (action === 'outline' || type === 'outline') {
      const prompt = `请为一部${style||'经典'}风格的小说生成大纲，主题：${theme||''}，标题：${title||'未命名'}。\n\n要求：生成详细的大纲，包括：\n1. 故事背景\n2. 主要角色介绍\n3. 核心冲突\n4. 剧情走向（至少10章）`;
      const aiRes = await gateway.generate(prompt);
      let outline = '';
      if (typeof aiRes === 'string') outline = aiRes;
      else outline = aiRes.text || aiRes.content || JSON.stringify(aiRes);
      return res.json({ success: true, data: { title, outline } });
    }
    
    if (action === 'chapters' || type === 'chapters') {
      const count = req.body.count || startFrom;
      const prompt = `请续写小说，主题：${theme||''}，标题：${title||'未命名'}，风格：${style||'经典'}。\n\n要求：写5章，每章500-800字，用自然流畅的中文，段落分明。`;
      const aiRes = await gateway.generate(prompt);
      let text = '';
      if (typeof aiRes === 'string') text = aiRes;
      else text = aiRes.text || aiRes.content || JSON.stringify(aiRes);
      const chapters = [{
        id: Date.now().toString(),
        number: startFrom || 1,
        title: `${title||'第'}${startFrom||1}章`,
        content: text
      }];
      return res.json({ success: true, data: { chapters } });
    }
    
    return res.status(400).json({ success: false, error: '未知的generate类型，请指定 action: outline|chapters' });
  } catch (e) {
    res.status(500).json({ success: false, error: '生成失败: ' + e.message });
  }
});

export default router;
