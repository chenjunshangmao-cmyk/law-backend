/**
 * TikTok Shop AI 发布路由
 * 复用小红书的产品抓取逻辑，但文案生成针对 TikTok Shop 英文优化
 * 
 * 接口：
 * POST /api/tiktok-publish/ai/fetch-product - 抓取产品信息
 * POST /api/tiktok-publish/ai/competitive-analysis - 竞品分析+英文listing
 * POST /api/tiktok-publish/ai/generate-content - AI生成英文文案
 */
import express from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// AI 配置（与 xiaohongshu.js 共享）
const BAILIAN_API_KEY = process.env.BAILIAN_API_KEY || 'sk-8a07c75081df49ac877d6950a95b06ec';
const BAILIAN_BASE_URL = process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

/**
 * 百炼文本调用（Qwen）
 */
async function callQwen(messages, model = 'qwen-turbo') {
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
    const base64 = `data:${contentType};base64,${buffer.toString('base64')}`;
    return base64;
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
// POST /api/tiktok-publish/ai/fetch-product
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

    // 下载图片转 base64
    const base64Images = [];
    const imageUrls = [];
    for (const imgUrl of product.images.slice(0, 9)) {
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
    console.error('[TikTok Publish] Product fetch failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 2. AI 竞品分析 + 英文 TikTok listing 生成
// POST /api/tiktok-publish/ai/competitive-analysis
// =============================================================
router.post('/ai/competitive-analysis', async (req, res) => {
  try {
    const { productData } = req.body || {};
    if (!productData) {
      return res.status(400).json({ success: false, error: 'Please provide product data' });
    }

    const { title, description, price, platform } = productData;

    const systemPrompt = `You are an expert TikTok Shop product listing optimizer and e-commerce analyst.
Your capabilities:
1. Analyze competitor products on TikTok Shop to identify best-selling patterns
2. Generate high-converting English product listings optimized for TikTok Shop
3. Understand TikTok Shop SEO: keyword placement, trending tags, engaging descriptions

Your strategy:
- Research trending TikTok Shop products in the same category
- Identify key differentiators and selling points
- Create listings that maximize click-through and conversion rates`;

    const userPrompt = `Perform a competitive analysis for this product and generate a complete TikTok Shop listing.

## Product Info
- Product Name: ${title || 'Unknown'}
- Source Platform: ${platform || 'Unknown'}
- Price: ${price ? `$${price}` : 'Unknown'}
- Description: ${description || 'N/A'}

## Tasks

### Part 1: Competitive Analysis (internal)
- TikTok Shop trending products in this category
- Top selling points users care about
- Common listing patterns that work well
- Differentiation opportunities

### Part 2: Generate TikTok Shop Listings

Generate **2 different** TikTok Shop listing plans:

**Plan A: Trendy & Viral** (optimized for TikTok viral appeal)
**Plan B: Professional & Trustworthy** (optimized for credibility)

Each plan includes:
1. **Title**: 80-150 characters, keyword-rich, includes key product attributes
2. **Description**: 200-500 words, benefit-focused, includes bullet points, uses emojis appropriately, SEO-optimized
   - Opening: Hook the buyer in 1-2 sentences
   - Middle: Key features with benefit-driven language, specifications
   - Closing: Urgency/scarcity + CTA
3. **Tags/Keywords**: 15-20 relevant TikTok Shop SEO keywords
4. **Suggested Price (USD)**: Based on market analysis
5. **Category**: Best-fit TikTok Shop category
6. **Top Selling Points**: 3-5 most competitive advantages

Output in strict JSON format:
{
  "analysis": {
    "marketInsight": "Market analysis summary, 2-3 sentences",
    "topSellingPoints": ["Point 1", "Point 2", "Point 3", "Point 4"],
    "priceSuggestion": "e.g. 19.99-24.99",
    "competitorSummary": "Competitor overview, 1-2 sentences"
  },
  "planA": {
    "style": "Trendy & Viral",
    "title": "Product title (80-150 chars)",
    "content": "Full description...",
    "tags": ["keyword1", "keyword2", "...15-20 keywords"],
    "sellingPoints": ["Point 1", "Point 2", "Point 3"],
    "price": "19.99",
    "category": "Women's Clothing"
  },
  "planB": {
    "style": "Professional",
    "title": "Product title",
    "content": "Full description...",
    "tags": ["keyword1", "keyword2"],
    "sellingPoints": ["Point 1", "Point 2"],
    "price": "24.99",
    "category": "Women's Clothing"
  }
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
      result = {
        analysis: { marketInsight: rawContent.slice(0, 300) },
        planA: { title: '', content: rawContent, tags: [], sellingPoints: [] },
        planB: { title: '', content: '', tags: [], sellingPoints: [] },
      };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[TikTok Publish] Competitive analysis failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 3. AI 生成 TikTok 英文文案
// POST /api/tiktok-publish/ai/generate-content
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
      return res.status(400).json({ success: false, error: 'Please provide product name or description' });
    }

    const stylePrompts = {
      professional: 'Write a professional TikTok Shop product listing. Clean, clear, benefit-focused.',
      casual: 'Write a fun and engaging TikTok Shop listing. Use casual tone, trendy language.',
      youth: 'Write a trendy Gen-Z friendly TikTok Shop listing. Use slang, emojis, viral hooks.',
      luxury: 'Write a premium/luxury TikTok Shop listing. Elegant language, emphasize quality.',
    };

    const systemPrompt = `You are a TikTok Shop product listing expert who creates high-converting listings.
SEO optimization, keyword placement, and conversion-focused copy are your strengths.`;

    const userPrompt = `${stylePrompts[style] || stylePrompts.professional}

Product Info:
- Name: ${productName || 'N/A'}
${productDescription ? `- Description: ${productDescription}` : ''}
${category ? `- Category: ${category}` : ''}

Requirements:
1. Title: 80-150 characters, keyword-rich
2. Description: 200-400 words, benefit-focused with bullet points
3. Tags: 15-20 SEO keywords
4. Suggested USD price based on market

Output in JSON:
{
  "title": "Product title",
  "content": "Full description with bullet points",
  "tags": ["keyword1", "keyword2"],
  "price": "19.99"
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
      result = { title: '', content: rawContent, tags: [], price: '' };
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[TikTok Publish] Content generation failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
