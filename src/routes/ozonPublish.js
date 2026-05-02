/**
 * OZON AI 发布路由
 * 复用通用产品抓取逻辑，文案生成针对 OZON 俄文优化
 * 
 * 接口：
 * POST /api/ozon-publish/ai/fetch-product - 抓取产品信息
 * POST /api/ozon-publish/ai/competitive-analysis - 竞品分析+俄语listing
 * POST /api/ozon-publish/ai/generate-content - AI生成俄语文案
 * POST /api/ozon-publish/api/publish - API直接发布商品到OZON
 * POST /api/ozon-publish/api/publish-status - 查询发布任务状态
 * GET  /api/ozon-publish/api/categories - 获取OZON商品类目树
 * POST /api/ozon-publish/api/update-prices - 更新商品价格
 * POST /api/ozon-publish/api/update-stocks - 更新商品库存
 */
import express from 'express';
import { createOzonClient, importProduct, importPictures, getImportInfo, getCategoryTree, getCategoryAttributes, updatePrices, updateStocks } from '../services/ozonApi.js';
import { authenticateToken } from '../middleware/auth.js';
import { getAccountById } from '../services/dbService.js';

// 1688 产品数据提取脚本（注入到页面 DOM 读取）
const JINHUO1688_SCRIPT = `
() => {
  const tryExtract = () => {
    // 方式1：从 __INIT_DATA__ 等全局变量提取
    const keys = Object.keys(window).filter(k => k.includes('data') || k.includes('D') || k.includes('init'));
    for (const k of keys) {
      try {
        const v = window[k];
        if (v && typeof v === 'object') {
          const str = JSON.stringify(v);
          if (str.includes('price') && str.includes('offer') && str.length < 500000) {
            const parsed = JSON.parse(str);
            // 尝试找 offer 列表
            const offers = parsed.data?.offerList || parsed.offerList || parsed.result?.offerList || [];
            if (offers.length > 0) {
              const o = offers[0];
              return {
                title: o.subject || o.title || o.name || '',
                price: parseFloat(o.price || o.amount || '0') || null,
                description: o.description || '',
                images: (o.imageList || o.images || []).map(i => typeof i === 'string' ? i : (i.url || i.src || i.originalUrl || '')).filter(Boolean),
                skuId: o.id || o.offerId || '',
              };
            }
          }
        }
      } catch(e) {}
    }

    // 方式2：从 meta og:title 等标签提取（兜底）
    const getMeta = (prop) => {
      const el = document.querySelector(\`meta[property="\${prop}"], meta[name="\${prop}"]\`);
      return el ? el.getAttribute('content') : '';
    };

    const title = getMeta('og:title') || document.title.replace(/.*1688.*/, '').trim() || document.title.split('-')[0].trim();
    const price = (() => {
      const el = document.querySelector('.price-value, .ma-spec-price, #mod-detail-price, .price');
      if (el) {
        const txt = el.textContent;
        const m = txt.match(/[\\d,.]+/);
        return m ? parseFloat(m[0].replace(/,/g, '')) : null;
      }
      return null;
    })();
    const description = getMeta('description');
    const images = [...document.querySelectorAll('img')]
      .map(img => img.src || img.getAttribute('data-src') || img.getAttribute('data-original'))
      .filter(s => s && !s.includes('icon') && !s.includes('logo') && s.length > 60 && (s.includes('alicdn') || s.includes('1688') || s.includes('taobao')))
      .slice(0, 15);

    return { title, price, description, images, skuId: '' };
  };

  return tryExtract();
}
`;

// Playwright 渲染抓取（1688 等动态页面必须）
async function fetchWithPlaywright(url) {
  const playwright = await import('playwright');
  let browser;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-CN,zh;q=0.9' });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000); // 等待 JS 渲染
    const data = await page.evaluate(JINHUO1688_SCRIPT);
    return data;
  } catch (err) {
    console.error('[OZON] Playwright fetch error:', err.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

// 普通 fetch（静态页面）
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

// 从 HTML 提取产品信息（静态页面）
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

/**
 * 解密辅助函数（与 accounts.db.js 中的 encrypt/decrypt 对应）
 */
import crypto from 'crypto';

/**
 * 解密辅助函数（与 accounts.db.js 中的 encrypt/decrypt 对应）
 * 加密密钥必须与 accounts.db.js 一致：JWT_SECRET || 'claw-secret-key'
 */
const ENCRYPTION_KEY = process.env.JWT_SECRET || 'claw-secret-key';

function decrypt(text) {
  if (!text) return '';
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const parts = text.split(':');
    if (parts.length !== 2) return text; // 不是加密格式，返回原文
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return text; // 解密失败返回原文
  }
}

/**
 * 从 accountId 获取 OZON API 凭证
 */
async function getOzonCredentials(accountId) {
  const account = await getAccountById(accountId);
  if (!account || account.platform !== 'ozon') {
    throw new Error('账号不存在或不是 OZON 平台账号');
  }
  const data = account.account_data || {};
  const clientId = data.clientId || data.client_id;
  const apiKey = data.apiKey ? decrypt(data.apiKey) : null;

  if (!clientId || !apiKey) {
    throw new Error('账号缺少 OZON API 凭证（Client ID / API Key）');
  }

  return { clientId, apiKey, account };
}

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


// 1. 产品链接抓取
// POST /api/ozon-publish/ai/fetch-product
// =============================================================
router.post('/ai/fetch-product', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ success: false, error: '请提供商品链接' });
    }

    let product;
    let imageUrls = [];

    // 1688 / 动态渲染页面 → 先尝试 Playwright，失败降级到静态抓取
    if (url.includes('1688.com') || url.includes('yiwugo.com')) {
      try {
        product = await fetchWithPlaywright(url);
      } catch (pwErr) {
        console.warn('[OZON] Playwright failed, falling back to static fetch:', pwErr.message);
        product = null;
      }
      if (!product) {
        // 降级：静态抓取
        console.log('[OZON] Falling back to static fetch for', url);
        const html = await fetchUrlContent(url);
        product = extractProductFromHtml(html, url);
      }
      imageUrls = product?.images || [];
      if (!product?.title) {
        return res.status(400).json({
          success: false,
          error: '无法从该1688页面提取商品信息，请手动填写商品信息。',
          hint: '支持：1688商品链接，或手动填写商品标题/价格/图片'
        });
      }
    } else {
      // 静态页面 → 普通 fetch
      const html = await fetchUrlContent(url);
      product = extractProductFromHtml(html, url);
      product.sourceUrl = url;
      imageUrls = product.images || [];
    }

    // 兜底：仍未提取到标题
    if (!product.title) {
      return res.status(400).json({
        success: false,
        error: '无法从该页面提取商品信息，可能是动态渲染页面或需要登录。请尝试直接填写商品信息，或粘贴1688商品页面。',
        hint: '支持：1688/淘宝/天猫/京东/亚马逊/速卖通/Shein/Temu 等平台'
      });
    }

    // 图片转 base64（最多15张）
    const base64Images = [];
    for (const imgUrl of imageUrls.slice(0, 15)) {
      if (!imgUrl) continue;
      const b64 = await downloadImageToBase64(imgUrl);
      if (b64) base64Images.push(b64);
    }

    res.json({
      success: true,
      data: {
        title: product.title,
        description: product.description || '',
        price: product.price,
        platform: product.platform || 'unknown',
        sourceUrl: url,
        images: base64Images,
        imageUrls,
        skuId: product.skuId || '',
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

// =============================================================
// 4. API 直接发布商品到 OZON
// POST /api/ozon-publish/api/publish
// =============================================================
router.post('/api/publish', authenticateToken, async (req, res) => {
  try {
    const {
      accountId,
      // 兼容：也支持直接传 clientId/apiKey（用于未保存的临时账号）
      clientId: directClientId,
      apiKey: directApiKey,
      // 商品信息
      name,
      offer_id,
      price,
      old_price,
      currency_code,
      vat,
      barcode,
      description_category_id,
      type_id,
      images,
      primary_image,
      attributes,
      weight,
      weight_unit,
      height,
      width,
      depth,
      dimension_unit,
    } = req.body || {};

    // 获取 OZON API 凭证
    let clientId, apiKey;
    if (accountId) {
      try {
        const creds = await getOzonCredentials(accountId);
        clientId = creds.clientId;
        apiKey = creds.apiKey;
      } catch (credErr) {
        return res.status(400).json({ success: false, error: credErr.message });
      }
    } else if (directClientId && directApiKey) {
      clientId = directClientId;
      apiKey = directApiKey;
    } else {
      return res.status(400).json({ success: false, error: '请提供 accountId 或 clientId + apiKey' });
    }

    if (!name || !offer_id || !price) {
      return res.status(400).json({
        success: false,
        error: '缺少必要字段：name（商品名称）、offer_id（卖家SKU）、price（价格）',
      });
    }

    // 如果有图片URL，先上传图片到 OZON CDN
    let uploadedImages = [];
    if (images && images.length > 0) {
      try {
        const picsRes = await importPictures(createOzonClient(clientId, apiKey), images);
        if (picsRes?.result?.pictures) {
          uploadedImages = picsRes.result.pictures
            .filter(p => p.state === 'uploaded' || p.state === 'processing')
            .map(p => p.url);
          console.log(`[OZON API] 图片上传：${uploadedImages.length}/${images.length} 成功`);
        }
      } catch (picErr) {
        console.warn('[OZON API] 图片上传失败，使用原始URL：', picErr.message);
        // 图片上传失败时降级：直接使用原始URL（OZON 也支持外部URL）
        uploadedImages = images;
      }
    }

    // 调用 OZON API 导入商品
    const client = createOzonClient(clientId, apiKey);
    const result = await importProduct(client, {
      name,
      offer_id,
      price,
      old_price,
      currency_code: currency_code || 'RUB',
      vat: vat || '0',
      barcode,
      description_category_id,
      type_id,
      images: uploadedImages,
      primary_image: primary_image || '',
      attributes: attributes || [],
      weight: weight || 100,
      weight_unit: weight_unit || 'g',
      height: height || 100,
      width: width || 100,
      depth: depth || 100,
      dimension_unit: dimension_unit || 'mm',
    });

    console.log(`[OZON API] 商品导入成功：task_id=${result?.result?.task_id}`);

    res.json({
      success: true,
      data: {
        task_id: result?.result?.task_id,
        items: result?.result?.items,
        message: '商品已提交到 OZON，等待审核（通常1-3天）',
      },
    });
  } catch (error) {
    console.error('[OZON Publish] API publish failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 5. 查询商品发布状态
// POST /api/ozon-publish/api/publish-status
// =============================================================
router.post('/api/publish-status', authenticateToken, async (req, res) => {
  try {
    const { accountId, taskId, clientId: directClientId, apiKey: directApiKey } = req.body || {};

    let clientId, apiKey;
    if (accountId) {
      try {
        const creds = await getOzonCredentials(accountId);
        clientId = creds.clientId;
        apiKey = creds.apiKey;
      } catch (credErr) {
        return res.status(400).json({ success: false, error: credErr.message });
      }
    } else if (directClientId && directApiKey) {
      clientId = directClientId;
      apiKey = directApiKey;
    } else {
      return res.status(400).json({ success: false, error: '请提供 accountId 或 clientId + apiKey' });
    }

    if (!taskId) {
      return res.status(400).json({ success: false, error: '请提供 taskId' });
    }

    const client = createOzonClient(clientId, apiKey);
    const result = await getImportInfo(client, taskId);

    res.json({
      success: true,
      data: result?.result,
    });
  } catch (error) {
    console.error('[OZON Publish] Import status check failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 6. 获取 OZON 商品类目树
// GET /api/ozon-publish/api/categories
// =============================================================
router.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const { accountId, clientId: directClientId, apiKey: directApiKey, categoryId, language } = req.query;

    let clientId, apiKey;
    if (accountId) {
      try {
        const creds = await getOzonCredentials(accountId);
        clientId = creds.clientId;
        apiKey = creds.apiKey;
      } catch (credErr) {
        return res.status(400).json({ success: false, error: credErr.message });
      }
    } else if (directClientId && directApiKey) {
      clientId = directClientId;
      apiKey = directApiKey;
    } else {
      return res.status(400).json({ success: false, error: '请提供 accountId 或 clientId + apiKey' });
    }

    const client = createOzonClient(clientId, apiKey);
    const result = await getCategoryTree(client, parseInt(categoryId) || 0, language || 'ru');

    res.json({
      success: true,
      data: result?.result,
    });
  } catch (error) {
    console.error('[OZON Publish] Get categories failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 7. 更新商品价格
// POST /api/ozon-publish/api/update-prices
// =============================================================
router.post('/api/update-prices', authenticateToken, async (req, res) => {
  try {
    const { accountId, prices, clientId: directClientId, apiKey: directApiKey } = req.body || {};

    let clientId, apiKey;
    if (accountId) {
      try {
        const creds = await getOzonCredentials(accountId);
        clientId = creds.clientId;
        apiKey = creds.apiKey;
      } catch (credErr) {
        return res.status(400).json({ success: false, error: credErr.message });
      }
    } else if (directClientId && directApiKey) {
      clientId = directClientId;
      apiKey = directApiKey;
    } else {
      return res.status(400).json({ success: false, error: '请提供 accountId 或 clientId + apiKey' });
    }

    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      return res.status(400).json({ success: false, error: '请提供 prices 数组' });
    }

    const client = createOzonClient(clientId, apiKey);
    const result = await updatePrices(client, prices);

    res.json({
      success: true,
      data: result?.result,
    });
  } catch (error) {
    console.error('[OZON Publish] Update prices failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 8. 更新商品库存
// POST /api/ozon-publish/api/update-stocks
// =============================================================
router.post('/api/update-stocks', authenticateToken, async (req, res) => {
  try {
    const { accountId, stocks, clientId: directClientId, apiKey: directApiKey } = req.body || {};

    let clientId, apiKey;
    if (accountId) {
      try {
        const creds = await getOzonCredentials(accountId);
        clientId = creds.clientId;
        apiKey = creds.apiKey;
      } catch (credErr) {
        return res.status(400).json({ success: false, error: credErr.message });
      }
    } else if (directClientId && directApiKey) {
      clientId = directClientId;
      apiKey = directApiKey;
    } else {
      return res.status(400).json({ success: false, error: '请提供 accountId 或 clientId + apiKey' });
    }

    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({ success: false, error: '请提供 stocks 数组' });
    }

    const client = createOzonClient(clientId, apiKey);
    const result = await updateStocks(client, stocks);

    res.json({
      success: true,
      data: result?.result,
    });
  } catch (error) {
    console.error('[OZON Publish] Update stocks failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 9. AI 场景图生成（复制小红书 wan2.7-image）
// POST /api/ozon-publish/ai/generate-images
// =============================================================
const DASHSCOPE_API_KEY = process.env.BAILIAN_API_KEY || 'sk-8a07c75081df49ac877d6950a95b06ec';

async function callWanxImageToImage(imageSource, prompt) {
  const submitResp = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/image-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: 'wan2.7-image',
      input: {
        messages: [{ role: 'user', content: [{ image: imageSource }, { text: prompt }] }],
      },
      parameters: { n: 1, size: '1K' },
    }),
  });
  if (!submitResp.ok) throw new Error(`Wanx提交失败: ${submitResp.status}`);
  const submitData = await submitResp.json();
  const taskId = submitData.output?.task_id;
  if (!taskId) throw new Error('Wanx未返回任务ID');

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const pollResp = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${DASHSCOPE_API_KEY}` },
    });
    const pollData = await pollResp.json();
    if (pollData.output?.task_status === 'SUCCEEDED') {
      return pollData.output?.choices?.[0]?.message?.content?.[0]?.image
        || pollData.output?.results?.[0]?.url;
    }
    if (pollData.output?.task_status === 'FAILED') {
      throw new Error('Wanx任务失败');
    }
  }
  throw new Error('Wanx任务超时');
}

const OZON_IMAGE_STYLES = {
  model: '电商模特展示图，俄罗斯模特穿着/使用产品，自然姿态，户外或室内场景，真实感强，适合OZON平台',
  scene: '电商生活场景图，产品融入真实家居/生活场景，温馨自然光，氛围感强，适合OZON商品详情',
  detail: '电商细节特写图，放大产品材质/工艺细节，微距镜头质感，突出品质感，白底或浅灰背景',
  flatlay: '电商平铺摆拍图，俯视角度，产品与配饰精心摆放，简洁高级ins风布景',
  whitebg: '电商白底图，纯白背景，产品居中，专业影棚灯光，高清质感，适合OZON平台主图',
};

router.post('/ai/generate-images', authenticateToken, async (req, res) => {
  try {
    const { images, style = 'model', count = 4, productName } = req.body || {};
    if (!images || images.length === 0) {
      return res.status(400).json({ success: false, error: '请提供产品图片' });
    }

    const prompt = OZON_IMAGE_STYLES[style] || OZON_IMAGE_STYLES.model;
    const fullPrompt = productName ? `${productName} - ${prompt}` : prompt;
    const results = [];

    for (let i = 0; i < Math.min(count, 8); i++) {
      const sourceImage = images[i % images.length];
      try {
        let imageSource = sourceImage;
        if (sourceImage.startsWith('http')) {
          const imgResp = await fetch(sourceImage);
          if (!imgResp.ok) continue;
          const buf = await imgResp.buffer();
          const ct = imgResp.headers.get('content-type') || 'image/jpeg';
          imageSource = `data:${ct};base64,${buf.toString('base64')}`;
        }
        const resultUrl = await callWanxImageToImage(imageSource, fullPrompt);
        results.push(resultUrl);
      } catch (e) {
        console.error(`[OZON AI] 图生图 #${i} 失败:`, e.message);
      }
    }

    res.json({ success: true, data: { images: results, style, count: results.length } });
  } catch (error) {
    console.error('[OZON AI] 生成图片失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
