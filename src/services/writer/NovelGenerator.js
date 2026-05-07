/**
 * AI小说生成器
 * 利用 LLM API 生成长篇小说、分章节、续写
 * DeepSeek API 作为主引擎（16K+上下文、中文最优、价格最低）
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';

async function callLLM(messages, options = {}) {
  const { temperature = 0.8, maxTokens = 4096 } = options;
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

/**
 * 生成小说大纲
 */
async function generateOutline({ title, genre, synopsis, chapters = 10 }) {
  const prompt = `你是一位专业小说家。请根据以下设定生成一份完整的小说大纲。

标题: ${title}
类型: ${genre || '都市情感'}
简介: ${synopsis || '暂无简介'}
要求章节数: ${chapters}章

请输出：
1. 故事简介（200字）
2. 人物设定（主角×3、配角×3，包含姓名/性格/背景）
3. 章节大纲（每章1-2句话概括剧情）
4. 核心冲突和高潮设计

格式：Markdown`;

  const outline = await callLLM([
    { role: 'system', content: '你是专业小说家，擅长创作吸引人的故事大纲。输出用中文，结构清晰。' },
    { role: 'user', content: prompt }
  ], { maxTokens: 4096 });

  return outline;
}

/**
 * 生成单章内容
 */
async function generateChapter({ outline, chapterNumber, chapterTitle, previousSummary = '', genre = '都市情感' }) {
  const context = previousSummary 
    ? `前情提要：${previousSummary}\n\n` 
    : '';

  const prompt = `${context}请根据以下信息创作第${chapterNumber}章内容：

小说大纲：${outline.substring(0, 1000)}
本章标题：${chapterTitle}
类型：${genre}

要求：
1. 字数：2500-3500字
2. 开头要有钩子，结尾留悬念
3. 对话自然，描写生动
4. 与前后章节情节连贯
5. 本章必须推动主线剧情发展

直接输出本章正文内容。`;

  const content = await callLLM([
    { role: 'system', content: '你是专业小说家。输出中文小说章节，对话用引号，描写生动，节奏紧凑。' },
    { role: 'user', content: prompt }
  ], { temperature: 0.85, maxTokens: 8192 });

  return content;
}

/**
 * 续写下一章
 */
async function continueChapter({ previousChapters, outline, nextChapterTitle, genre }) {
  const summary = previousChapters.map((ch, i) => 
    `第${ch.chapterNumber}章《${ch.title}》概要：${ch.content.substring(0, 200)}...`
  ).join('\n');

  return generateChapter({
    outline,
    chapterNumber: previousChapters.length + 1,
    chapterTitle: nextChapterTitle || `第${previousChapters.length + 1}章`,
    previousSummary: summary,
    genre
  });
}

/**
 * 生成全本小说（多章批量）
 */
async function generateFullNovel(params) {
  const { title, genre, synopsis, chapterCount = 10 } = params;
  
  // Step 1: 生成大纲
  const outline = await generateOutline({ title, genre, synopsis, chapters: chapterCount });
  
  // Step 2: 解析章节标题
  const chapters = [];
  const lines = outline.split('\n');
  let inChapterSection = false;
  for (const line of lines) {
    if (line.includes('章节大纲') || line.includes('章节')) {
      inChapterSection = true;
      continue;
    }
    if (inChapterSection && /^\d+[\.、\s]/.test(line.trim())) {
      const title = line.replace(/^\d+[\.、\s]+/, '').trim();
      if (title && !title.includes('冲突') && !title.includes('高潮')) {
        chapters.push(title);
      }
    }
    if (inChapterSection && line.includes('核心冲突')) break;
  }
  
  // 补齐章节数
  while (chapters.length < chapterCount) {
    chapters.push(`第${chapters.length + 1}章`);
  }
  
  // Step 3: 逐章生成
  const results = [];
  let previousSummary = '';
  
  for (let i = 0; i < Math.min(chapterCount, chapters.length); i++) {
    const chNum = i + 1;
    const content = await generateChapter({
      outline,
      chapterNumber: chNum,
      chapterTitle: chapters[i],
      previousSummary,
      genre
    });
    
    previousSummary += `第${chNum}章：${content.substring(0, 300)}...\n`;
    results.push({ chapterNumber: chNum, title: chapters[i], content, wordCount: content.length });
  }
  
  return { title, genre, outline, chapters: results, totalChapters: results.length };
}

export { generateOutline, generateChapter, continueChapter, generateFullNovel, callLLM };
