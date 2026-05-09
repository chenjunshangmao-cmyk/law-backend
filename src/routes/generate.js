/**
 * AI生成路由 - 多语言文案生成 + 翻译
 * 支持语言：中文(zh)、英文(en)、俄文(ru)、日文(ja)
 * 接入 AI: 百炼 → DeepSeek → 模拟数据
 */
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getQuotaByUserId, incrementUsage, checkQuota } from '../services/dataStore.js';

const router = express.Router();

// OpenClaw API配置
const OPENCLAW_URL = process.env.OPENCLAW_URL || 'http://localhost:18789';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '';

// DeepSeek API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 百炼（阿里云）API配置
const BAILIAN_API_KEY = process.env.BAILIAN_API_KEY || '';
const BAILIAN_BASE_URL = process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// ============================================================
// 支持的语言配置（可按平台自动匹配）
// ============================================================
const LANGUAGES = {
  zh: { name: '中文', locale: 'zh-CN', defaultPlatforms: ['1688', 'taobao', 'pdd', 'domestic'] },
  en: { name: 'English', locale: 'en-US', defaultPlatforms: ['tiktok', 'amazon', 'shopee', 'lazada', 'youtube'] },
  ru: { name: 'Русский', locale: 'ru-RU', defaultPlatforms: ['ozon'] },
  ja: { name: '日本語', locale: 'ja-JP', defaultPlatforms: [] },
};

/** 根据平台推断目标语言 */
function detectLanguage(platform, requestedLang) {
  if (requestedLang && LANGUAGES[requestedLang]) return requestedLang;
  for (const [lang, config] of Object.entries(LANGUAGES)) {
    if (config.defaultPlatforms.includes(platform)) return lang;
  }
  return 'en'; // 默认英文
}

// ============================================================
// 1. 文案生成 POST /api/generate/text
// ============================================================
router.post('/text', authMiddleware, async (req, res) => {
  try {
    const { productName, productDescription, platform, style, language } = req.body;

    if (!checkQuota(req.userId, 'text')) {
      const quota = getQuotaByUserId(req.userId);
      return res.status(403).json({
        success: false,
        error: `文案生成额度已用完（${quota.textLimit}次），请升级套餐`
      });
    }

    if (!productName) {
      return res.status(400).json({ success: false, error: '产品名称不能为空' });
    }

    const targetLang = detectLanguage(platform, language);
    const prompt = buildTextPrompt(productName, productDescription, platform, style, targetLang);
    const result = await callAI(prompt);

    incrementUsage(req.userId, 'text');

    res.json({
      success: true,
      data: {
        text: result.text || result,
        language: targetLang,
        usage: { type: 'text', generated: true }
      }
    });
  } catch (error) {
    console.error('文案生成错误:', error);
    res.status(500).json({ success: false, error: error.message || '文案生成失败' });
  }
});

// ============================================================
// 2. 翻译 POST /api/generate/translate
// ============================================================
router.post('/translate', authMiddleware, async (req, res) => {
  try {
    const { text, sourceLang, targetLang, platform } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: '请提供需要翻译的文本' });
    }

    const from = sourceLang || 'zh';
    const to = targetLang || detectLanguage(platform, targetLang);

    const prompt = `请将以下商品文案从${LANGUAGES[from]?.name || from}翻译成${LANGUAGES[to]?.name || to}。

原文：
${typeof text === 'string' ? text : JSON.stringify(text, null, 2)}

要求：
1. 保留专业电商文案的语气和吸引力
2. 符合${LANGUAGES[to]?.locale || 'en-US'}的语言习惯
3. SEO关键词做本地化适配，不要直译
4. 标题长度控制在50字符以内
5. 保持JSON结构不变（如果输入是JSON）

请直接返回翻译后的结果，如果输入是JSON则保持同结构输出JSON，如果是纯文本则返回纯文本。`;

    const result = await callAI(prompt);

    // 尝试解析JSON
    let translated = result.text || result;
    if (typeof translated === 'string') {
      try { translated = JSON.parse(translated); } catch { /* 纯文本 */ }
    }

    res.json({
      success: true,
      data: {
        original: text,
        translated,
        sourceLang: from,
        targetLang: to,
        platform,
        usage: { type: 'text', generated: true }
      }
    });
  } catch (error) {
    console.error('翻译失败:', error);
    res.status(500).json({ success: false, error: error.message || '翻译失败' });
  }
});

// ============================================================
// 3. 批量翻译 POST /api/generate/batch-translate
// ============================================================
router.post('/batch-translate', authMiddleware, async (req, res) => {
  try {
    const { items, targetLanguages, platform } = req.body;
    // items: [{ title, description, features, keywords }]
    // targetLanguages: ['en', 'ru', 'ja']

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: '请提供待翻译的商品列表' });
    }

    const langs = targetLanguages || [detectLanguage(platform, null)];
    const results = [];

    for (const item of items) {
      const translations = {};
      for (const lang of langs) {
        const prompt = `将以下商品信息翻译成${LANGUAGES[lang]?.name || lang}（${LANGUAGES[lang]?.locale || ''}）。

商品标题：${item.title}
商品描述：${item.description || ''}
特点：${(item.features || []).join('; ')}
关键词：${(item.keywords || []).join(', ')}

请以JSON格式输出：
{
  "title": "翻译后的标题",
  "description": "翻译后的描述",
  "features": ["特点1", "特点2", ...],
  "keywords": ["关键词1", "关键词2", ...]
}`;
        const result = await callAI(prompt);
        let parsed = result.text || result;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch { /* keep raw */ }
        }
        translations[lang] = parsed;
      }
      results.push({ original: item, translations });
    }

    res.json({
      success: true,
      data: { results, languages: langs },
      usage: { type: 'text', generated: true }
    });
  } catch (error) {
    console.error('批量翻译失败:', error);
    res.status(500).json({ success: false, error: error.message || '批量翻译失败' });
  }
});

// ============================================================
// 4. 获取支持的语言列表 GET /api/generate/languages
// ============================================================
router.get('/languages', (_req, res) => {
  res.json({
    success: true,
    data: Object.entries(LANGUAGES).map(([code, config]) => ({
      code,
      name: config.name,
      locale: config.locale,
      defaultPlatforms: config.defaultPlatforms,
    }))
  });
});

// ============================================================
// 5. 生成图片描述（保持不变）
// ============================================================
router.post('/image', authMiddleware, async (req, res) => {
  try {
    const { productName, productDescription, style } = req.body;

    if (!checkQuota(req.userId, 'image')) {
      const quota = getQuotaByUserId(req.userId);
      return res.status(403).json({
        success: false,
        error: `图片生成额度已用完（${quota.imageLimit}次），请升级套餐`
      });
    }

    if (!productName) {
      return res.status(400).json({ success: false, error: '产品名称不能为空' });
    }

    const prompt = buildImagePrompt(productName, productDescription, style);
    const result = {
      text: prompt,
      imageUrl: `https://placeholder.com/generated/${Date.now()}.jpg`,
      description: `为${productName}生成的电商主图描述，风格：${style || '简洁专业'}`
    };

    incrementUsage(req.userId, 'image');

    res.json({
      success: true,
      data: { ...result, usage: { type: 'image', generated: true } }
    });
  } catch (error) {
    console.error('图片描述生成错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '图片描述生成失败'
    });
  }
});

// ============================================================
// 提示词构建函数
// ============================================================
function buildTextPrompt(productName, description, platform, style, language = 'en') {
  const platformMap = {
    tiktok: 'TikTok Shop',
    shopee: 'Shopee',
    ozon: 'OZON',
    amazon: 'Amazon',
    lazada: 'Lazada',
    youtube: 'YouTube Shopping',
    '1688': '1688',
    taobao: '淘宝',
    pdd: '拼多多',
    default: '跨境电商平台'
  };

  const styleMap = {
    professional: '专业简洁',
    casual: '轻松活泼',
    luxury: '高端奢华',
    youth: '年轻潮流',
    default: '专业简洁'
  };

  const langName = LANGUAGES[language]?.name || 'English';
  const langLocale = LANGUAGES[language]?.locale || 'en-US';

  // 各语言独有的SEO/文案要求
  const langInstructions = {
    zh: `1. 生成吸引人的产品标题（30字以内）
2. 写详细的产品描述（200-300字）
3. 列出5-8个产品卖点
4. 包含适合${platformMap[platform] || platformMap.default}的搜索热词
5. 语气亲切自然，适合国内消费者`,
    en: `1. Generate an attractive product title (within 50 characters)
2. Write detailed product description (150-200 words)
3. Create 5-8 bullet points for product features
4. Include SEO keywords optimized for ${platformMap[platform] || platformMap.default}
5. Use persuasive, professional e-commerce copywriting style`,
    ru: `1. Создайте привлекательный заголовок товара (до 50 символов)
2. Напишите подробное описание товара (150-200 слов)
3. Составьте 5-8 пунктов с характеристиками товара
4. Включите SEO-ключевые слова для ${platformMap[platform] || platformMap.default}
5. Используйте убедительный, профессиональный стиль электронной коммерции`,
    ja: `1. 魅力的な商品タイトルを生成（50文字以内）
2. 詳細な商品説明を作成（150-200語）
3. 商品の特徴を5-8個の箇条書きで作成
4. ${platformMap[platform] || platformMap.default}向けのSEOキーワードを含める
5. 説得力のあるプロフェッショナルなECコピーライティングスタイル`,
  };

  const instructions = langInstructions[language] || langInstructions.en;

  return `请为以下产品生成${langName}（${langLocale}）的商品文案，目标平台：${platformMap[platform] || platformMap.default}，风格：${styleMap[style] || styleMap.default}

产品名称：${productName}
产品描述：${description || '无'}

要求：
${instructions}

请严格以JSON格式输出：
{
  "title": "产品标题",
  "description": "产品描述",
  "features": ["特点1", "特点2", ...],
  "keywords": ["关键词1", "关键词2", ...]
}`;
}

function buildImagePrompt(productName, description, style) {
  return `为跨境电商产品"${productName}"生成图片描述：

产品详情：${description || '无'}
风格要求：${style || '简洁专业'}

请生成：
1. ALT文字（用于SEO）
2. 图片标题
3. 简短描述（50词以内）
4. 背景/场景建议`;
}

// ============================================================
// AI 调用（统一入口）
// 优先 DeepSeek → 百炼（备用）→ 模拟数据
// ============================================================
async function callAI(prompt) {
  // 1. DeepSeek（主模型）
  if (DEEPSEEK_API_KEY) {
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的跨境电商文案专家，精通中/英/俄/日多语言商品文案撰写和翻译。'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`DeepSeek API错误: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try { return { text: JSON.parse(content) }; } catch { return { text: content }; }
      }
      throw new Error('DeepSeek返回内容为空');
    } catch (error) {
      console.error('DeepSeek调用失败:', error.message);
      throw new Error(`AI生成失败: ${error.message}`);
    }
  }

  // 3. OpenClaw
  if (OPENCLAW_TOKEN) {
    try {
      const response = await fetch(`${OPENCLAW_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENCLAW_TOKEN}`
        },
        body: JSON.stringify({ prompt, model: 'claude', maxTokens: 1000 })
      });

      if (!response.ok) throw new Error(`OpenClaw API错误: ${response.status}`);
      const data = await response.json();
      try { return { text: JSON.parse(data.text || data.content) }; } catch { return { text: data.text || data.content }; }
    } catch (error) {
      console.error('OpenClaw调用失败:', error.message);
      throw new Error('AI服务暂时不可用');
    }
  }

  // 4. 模拟数据（无API Key时的fallback）
  return {
    text: {
      title: "Premium Children's Summer Dress - Soft Cotton",
      description: "This adorable children's summer dress is perfect for any occasion. Made from 100% organic cotton, it's soft, breathable, and gentle on sensitive skin.",
      features: [
        "100% organic cotton material",
        "Breathable and comfortable",
        "Cute cartoon print pattern",
        "Machine washable",
        "Multiple sizes available"
      ],
      keywords: ["children dress", "summer outfit", "cotton dress", "kids clothing"]
    }
  };
}

export default router;
