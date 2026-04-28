/**
 * OZON AI 发布路由
 * 复用通用产品抓取逻辑，文案生成针对 OZON 俄文优化
 * 
 * 接口：
 * POST /api/ozon-publish/ai/fetch-product - 抓取产品信息
 * POST /api/ozon-publish/ai/competitive-analysis - 竞品分析+俄语listing
 * POST /api/ozon-publish/ai/generate-content - AI生成俄语文案
 */
import express from 'express';

const router = express.Router();

// AI 配置
const BAILIAN_API_KEY = process.env.BAILIAN_API_KEY || 'sk-8a07c75081df49ac877d6950a95b06ec';
const BAILIAN_BASE_URL = process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

/**
 * 百炼文本调用（Qwen）
 */
async function callQwen(messages, model = 'qwen-plus') {
  const response = await fetch(`${BAILIAN_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BAILIAN_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Qwen API error: ${response.status} - ${errText}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 下载网络图片转 base64
 */
async function downloadImageToBase64(imageUrl) {
  try {
    const resp = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': new URL(imageUrl).origin,
      },
    });
    if (!resp.ok) return null;
    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await resp.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}

/**
 * 通用网页抓取
 */
async function fetchUrlContent(url) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
  });
  return await resp.text();
}

/**
 * 从 HTML 提取产品信息
 */
function extractProductFromHtml(html, url) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const title = (ogTitleMatch?.[1] || titleMatch?.[1] || '').replace(/[-_|–].*$/, '').trim();

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const description = (ogDescMatch?.[1] || descMatch?.[1] || '').trim();

  const images = [];
  const imgRegex = /(?:src|data-src|data-original)=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null && images.length < 15) {
    const imgUrl = imgMatch[1];
    if (imgUrl.includes('icon') || imgUrl.includes('logo') || imgUrl.includes('avatar')) continue;
    if (imgUrl.length < 40) continue;
    if (!images.some(i => i.replace(/\?.*$/, '') === imgUrl.replace(/\?.*$/, ''))) {
      images.push(imgUrl);
    }
  }

  const priceText = html.match(/(?:price| Price|价格|优惠价)["'\s:]*[>"]?\s*(?:¥|￥|\$)?\s*([\d,.]+)/i);
  const price = priceText ? parseFloat(priceText[1].replace(/,/g, '')) : null;

  let platform = 'unknown';
  if (url.includes('1688.com')) platform = '1688';
  else if (url.includes('taobao.com') || url.includes('tmall.com')) platform = 'taobao';
  else if (url.includes('jd.com')) platform = 'jd';
  else if (url.includes('pinduoduo.com') || url.includes('yangkeduo.com')) platform = 'pdd';
  else if (url.includes('amazon.')) platform = 'amazon';
  else if (url.includes('aliexpress.com')) platform = 'aliexpress';
  else if (url.includes('shein.com')) platform = 'shein';
  else if (url.includes('temu.com')) platform = 'temu';
  else if (url.includes('etsy.com')) platform = 'etsy';

  return { title, description, images, price, platform };
}

// =============================================================
// 1. 产品链接抓取
// POST /api/ozon-publish/ai/fetch-product
// =============================================================
router.post('/ai/fetch-product', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ success: false, error: 'Please provide a product URL' });
    }

    const html = await fetchUrlContent(url);
    const product = extractProductFromHtml(html, url);
    product.sourceUrl = url;

    if (!product.title) {
      return res.status(400).json({ success: false, error: 'Cannot extract product info' });
    }

    const base64Images = [];
    const imageUrls = [];
    for (const imgUrl of product.images.slice(0, 15)) {
      const b64 = await downloadImageToBase64(imgUrl);
      if (b64) {
        base64Images.push(b64);
        imageUrls.push(imgUrl);
      }
    }

    res.json({
      success: true,
      data: {
        title: product.title,
        description: product.description,
        price: product.price,
        platform: product.platform,
        sourceUrl: url,
        images: base64Images,
        imageUrls: imageUrls,
      },
    });
  } catch (error) {
    console.error('[OZON Publish] Product fetch failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 2. AI 竞品分析 + 俄语 OZON listing 生成
// POST /api/ozon-publish/ai/competitive-analysis
// =============================================================
router.post('/ai/competitive-analysis', async (req, res) => {
  try {
    const { productData } = req.body || {};
    if (!productData) {
      return res.status(400).json({ success: false, error: 'Please provide product data' });
    }

    const { title, description, price, platform } = productData;

    const systemPrompt = `Вы — эксперт по оптимизации карточек товаров на OZON и аналитик электронной коммерции.
Ваши возможности:
1. Анализ конкурентов на OZON для выявления паттернов бестселлеров
2. Создание конверсионных карточек товаров на русском языке для OZON
3. Понимание SEO на OZON: ключевые слова, характеристики, описания

Стратегия:
- Исследуйте трендовые товары в этой же категории на OZON
- Определите ключевые дифференциаторы
- Создавайте карточки, максимизирующие конверсию`;

    const userPrompt = `Проведите конкурентный анализ товара и создайте полную карточку товара для OZON.

## Информация о товаре
- Название: ${title || 'Неизвестно'}
- Платформа-источник: ${platform || 'Неизвестно'}
- Цена: ${price ? `${price} CNY` : 'Неизвестно'}
- Описание: ${description || 'Нет данных'}

## Задачи

### Часть 1: Конкурентный анализ (внутренний)
- Трендовые товары на OZON в этой категории
- Ключевые преимущества, которые ценят покупатели
- Распространенные паттерны успешных карточек
- Возможности для дифференциации

### Часть 2: Создание карточки товара OZON

Создайте **2 варианта** карточки товара:

**План А: Дружелюбный и продающий** (эмоциональный подход)
**План Б: Профессиональный и информативный** (рациональный подход)

Каждый план включает:
1. **Название**: до 250 символов, с ключевыми словами, характеристики товара
2. **Описание**: 300-600 слов, акцент на выгоды, маркированный список, SEO-оптимизировано
   - Введение: зацепите покупателя в 1-2 предложениях
   - Середина: ключевые характеристики с описанием выгод
   - Конец: призыв к действию + гарантия качества
3. **Ключевые слова**: 15-20 SEO-ключевых слов для OZON
4. **Рекомендуемая цена (RUB)**: на основе анализа рынка (коэффициент ~5-7x от CNY)
5. **Старая цена (RUB)**: для зачёркивания (на 30-50% выше)
6. **Категория OZON**: наиболее подходящая категория
7. **Ключевые преимущества**: 3-5 главных конкурентных преимуществ

Выведите в формате JSON:
{
  "analysis": {
    "marketInsight": "Сводка анализа рынка",
    "topSellingPoints": ["Преимущество 1", "Преимущество 2", "Преимущество 3"],
    "priceSuggestion": "например: 1990-2490",
    "competitorSummary": "Обзор конкурентов"
  },
  "planA": {
    "style": "Дружелюбный и продающий",
    "title": "Название товара (до 250 символов)",
    "content": "Полное описание...",
    "tags": ["ключевое1", "ключевое2"],
    "sellingPoints": ["Преимущество 1", "Преимущество 2"],
    "price": "1990",
    "oldPrice": "2990",
    "category": "Одежда",
    "sku": "SKU-генерация"
  },
  "planB": {
    "style": "Профессиональный",
    "title": "Название товара",
    "content": "Полное описание...",
    "tags": ["ключевое1", "ключевое2"],
    "sellingPoints": ["Преимущество 1", "Преимущество 2"],
    "price": "2490",
    "oldPrice": "3990",
    "category": "Одежда",
    "sku": "SKU-генерация"
  }
}`;

    const rawContent = await callQwen([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 'qwen-plus');

    let result;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      result = null;
    }

    if (!result) {
      result = {
        analysis: { marketInsight: rawContent.slice(0, 300) },
        planA: { title: '', content: rawContent, tags: [], sellingPoints: [] },
        planB: { title: '', content: '', tags: [], sellingPoints: [] },
      };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[OZON Publish] Competitive analysis failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 3. AI 生成 OZON 俄语文案
// POST /api/ozon-publish/ai/generate-content
// =============================================================
router.post('/ai/generate-content', async (req, res) => {
  try {
    const {
      productName,
      productDescription,
      style = 'professional',
      category,
    } = req.body || {};

    if (!productName && !productDescription) {
      return res.status(400).json({ success: false, error: 'Укажите название или описание товара' });
    }

    const stylePrompts = {
      professional: 'Напишите профессиональную карточку товара для OZON. Строгий, информативный стиль.',
      casual: 'Напишите дружелюбную карточку товара для OZON. Тёплый, доступный язык.',
      premium: 'Напишите премиальную карточку товара для OZON. Элегантный стиль, акцент на качество.',
      value: 'Напишите карточку товара для OZON с акцентом на выгоду и скидки.',
    };

    const systemPrompt = `Вы — эксперт по созданию карточек товаров на OZON.
Владеете SEO-оптимизацией, умением расставлять ключевые слова и создавать продающие тексты на русском.`;

    const userPrompt = `${stylePrompts[style] || stylePrompts.professional}

Информация о товаре:
- Название: ${productName || 'Н/Д'}
${productDescription ? `- Описание: ${productDescription}` : ''}
${category ? `- Категория: ${category}` : ''}

Требования:
1. Название: до 250 символов, с ключевыми словами
2. Описание: 300-500 слов, с маркированным списком, акцент на выгоды
3. Ключевые слова: 15-20 SEO-ключевых слов
4. Рекомендуемая цена в рублях
5. Старая цена (для зачёркивания)

Выведите в JSON:
{
  "title": "Название товара",
  "content": "Полное описание",
  "tags": ["ключевое1", "ключевое2"],
  "price": "1990",
  "oldPrice": "2990"
}`;

    const rawContent = await callQwen([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    let result;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      result = null;
    }

    if (!result) {
      result = { title: '', content: rawContent, tags: [], price: '', oldPrice: '' };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[OZON Publish] Content generation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
