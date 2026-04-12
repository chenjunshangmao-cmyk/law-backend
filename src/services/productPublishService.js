// ==========================================
// Claw - 产品发布服务
// 支持链接发布和素材发布两种模式
// ==========================================

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据存储路径
const DATA_DIR = path.join(process.cwd(), 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ==========================================
// 1. 产品链接抓取服务
// ==========================================

/**
 * 从1688等平台抓取产品信息
 * @param {string} url - 产品链接
 * @returns {Promise<ProductData>}
 */
export async function scrapeProductFromUrl(url) {
  try {
    console.log(`[Scraper] 正在抓取: ${url}`);
    
    // 判断平台类型
    const platform = detectPlatform(url);
    
    if (platform === '1688') {
      return await scrape1688Product(url);
    } else if (platform === 'taobao') {
      return await scrapeTaobaoProduct(url);
    } else if (platform === 'alibaba') {
      return await scrapeAlibabaProduct(url);
    } else {
      // 通用抓取尝试
      return await scrapeGenericProduct(url);
    }
  } catch (error) {
    console.error('[Scraper] 抓取失败:', error);
    throw new Error(`抓取失败: ${error.message}`);
  }
}

/**
 * 检测平台类型
 */
function detectPlatform(url) {
  if (url.includes('1688.com')) return '1688';
  if (url.includes('taobao.com')) return 'taobao';
  if (url.includes('alibaba.com')) return 'alibaba';
  if (url.includes('temu.com')) return 'temu';
  if (url.includes('shein.com')) return 'shein';
  return 'unknown';
}

/**
 * 1688产品抓取
 * 注意：1688有反爬机制，这里提供结构化抓取逻辑
 */
async function scrape1688Product(url) {
  // 由于1688有严格反爬，这里返回结构化的数据采集请求
  // 实际实现需要使用浏览器自动化或API
  
  return {
    success: true,
    platform: '1688',
    originalUrl: url,
    data: {
      // 这些字段需要通过页面解析或API获取
      productId: extractProductId(url, '1688'),
      title: '', // 需要抓取
      price: null, // 需要抓取
      images: [], // 需要抓取
      description: '', // 需要抓取
      specs: [], // 需要抓取
      category: '', // 需要抓取
    },
    message: '1688抓取需要浏览器自动化支持，请使用OpenClaw',
    requireBrowserAutomation: true
  };
}

/**
 * 淘宝产品抓取
 */
async function scrapeTaobaoProduct(url) {
  return {
    success: true,
    platform: 'taobao',
    originalUrl: url,
    data: {
      productId: extractProductId(url, 'taobao'),
      title: '',
      price: null,
      images: [],
      description: '',
      specs: [],
      category: '',
    },
    message: '淘宝抓取需要浏览器自动化支持，请使用OpenClaw',
    requireBrowserAutomation: true
  };
}

/**
 * 阿里巴巴国际站抓取
 */
async function scrapeAlibabaProduct(url) {
  return {
    success: true,
    platform: 'alibaba',
    originalUrl: url,
    data: {
      productId: extractProductId(url, 'alibaba'),
      title: '',
      price: null,
      images: [],
      description: '',
      specs: [],
      category: '',
    },
    message: '阿里巴巴抓取需要浏览器自动化支持，请使用OpenClaw',
    requireBrowserAutomation: true
  };
}

/**
 * 通用产品抓取（适用于无反爬的网站）
 */
async function scrapeGenericProduct(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      }
    }, (res) => {
      let data = '';
      
      // 处理重定向
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        console.log(`[Scraper] 重定向到: ${redirectUrl}`);
        scrapeGenericProduct(redirectUrl).then(resolve).catch(reject);
        return;
      }
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // 提取基本信息（简单的HTML解析）
          const result = parseGenericHtml(data, url);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

/**
 * 通用HTML解析
 */
function parseGenericHtml(html, url) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const priceMatch = html.match(/price["\s:]+["\']?([\d.]+)/i);
  
  return {
    success: true,
    platform: detectPlatform(url),
    originalUrl: url,
    data: {
      productId: extractProductId(url, detectPlatform(url)),
      title: titleMatch ? titleMatch[1].trim() : '',
      price: priceMatch ? parseFloat(priceMatch[1]) : null,
      images: ogImageMatch ? [ogImageMatch[1]] : [],
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      specs: [],
      category: '',
    },
    message: '抓取完成（通用模式，部分数据可能不完整）'
  };
}

/**
 * 从URL提取产品ID
 */
function extractProductId(url, platform) {
  const patterns = {
    '1688': /item\.html\?id=(\d+)/,
    'taobao': /id=(\d+)/,
    'alibaba': /product-detail\/([^\/]+)/,
    'temu': /goods\/(\d+)/,
    'shein': /p\/(\d+)/,
  };
  
  const pattern = patterns[platform] || /\/([^\/]+)\/?$/;
  const match = url.match(pattern);
  return match ? match[1] : '';
}

// ==========================================
// 2. AI生成多种文案服务
// ==========================================

/**
 * 生成多种产品文案供选择
 * @param {Object} productData - 产品数据
 * @param {Object} options - 生成选项
 * @returns {Promise<GeneratedContent[]>}
 */
export async function generateMultipleContents(productData, options = {}) {
  const {
    targetPlatform = 'tiktok',
    language = 'en',
    count = 3, // 生成几条供选择
    styles = ['casual', 'professional', 'trendy'] // 文案风格
  } = options;
  
  console.log(`[AI Content] 生成 ${count} 种文案，风格: ${styles.join(', ')}`);
  
  const results = [];
  
  for (let i = 0; i < Math.min(count, styles.length); i++) {
    const style = styles[i];
    
    // 生成对应风格的文案
    const content = await generateContentByStyle(productData, style, targetPlatform, language);
    
    results.push({
      id: uuidv4(),
      style,
      styleLabel: getStyleLabel(style),
      title: content.title,
      description: content.description,
      features: content.features,
      keywords: content.keywords,
      hashtags: content.hashtags,
      estimatedEngagement: calculateEngagementScore(content, targetPlatform),
    });
  }
  
  // 按预估互动率排序
  results.sort((a, b) => b.estimatedEngagement - a.estimatedEngagement);
  
  return results;
}

/**
 * 根据风格生成文案
 */
async function generateContentByStyle(productData, style, platform, language) {
  // 这里调用实际的AI服务
  // 暂时使用模板生成，后续接入OpenClaw或百炼API
  
  const templates = {
    casual: {
      title: generateCasualTitle(productData.name || productData.title),
      description: generateCasualDescription(productData),
      features: extractFeatures(productData),
      keywords: generateKeywords(productData, 5),
      hashtags: generateHashtags(productData, style),
    },
    professional: {
      title: generateProfessionalTitle(productData.name || productData.title),
      description: generateProfessionalDescription(productData),
      features: extractFeatures(productData),
      keywords: generateKeywords(productData, 8),
      hashtags: generateHashtags(productData, style),
    },
    trendy: {
      title: generateTrendyTitle(productData.name || productData.title),
      description: generateTrendyDescription(productData),
      features: extractFeatures(productData),
      keywords: generateKeywords(productData, 10),
      hashtags: generateHashtags(productData, style),
    },
  };
  
  return templates[style] || templates.casual;
}

/**
 * 生成多种图片描述/Prompts
 */
export async function generateMultipleImagePrompts(productData, options = {}) {
  const {
    count = 4,
    styles = ['clean-white', 'lifestyle', 'studio', 'minimalist']
  } = options;
  
  console.log(`[AI Image] 生成 ${count} 种图片风格`);
  
  const results = [];
  
  for (let i = 0; i < Math.min(count, styles.length); i++) {
    const style = styles[i];
    const prompt = await generateImagePromptByStyle(productData, style);
    
    results.push({
      id: uuidv4(),
      style,
      styleLabel: getImageStyleLabel(style),
      prompt,
      negativePrompt: 'blurry, low quality, watermark, text overlay, busy background',
      recommendedSize: getRecommendedImageSize(style),
    });
  }
  
  return results;
}

/**
 * 根据风格生成图片Prompt
 */
async function generateImagePromptByStyle(productData, style) {
  const productName = productData.name || productData.title || 'Product';
  const basePrompt = productData.description || '';
  
  const prompts = {
    'clean-white': `${productName}, clean white background, professional product photography, soft lighting, high detail, 4k, commercial photography`,
    'lifestyle': `${productName} in a modern ${getLifestyleScene(productData.category)}, warm natural lighting, lifestyle photography, inviting atmosphere, 4k`,
    'studio': `${productName}, professional studio photography, dramatic lighting, dark background, fashion editorial style, high contrast, 8k`,
    'minimalist': `${productName}, minimalist design, pastel background, soft shadows, clean aesthetic, modern product photography, 4k`,
  };
  
  return prompts[style] || prompts['clean-white'];
}

// ==========================================
// 3. 全网相似商品采集
// ==========================================

/**
 * 采集全网相似商品信息
 * @param {Object} productData - 产品数据
 * @returns {Promise<SimilarProduct[]>}
 */
export async function findSimilarProducts(productData) {
  console.log(`[Similar Products] 搜索相似商品: ${productData.name || productData.title}`);
  
  // 这里应该调用实际的电商API或爬虫
  // 目前返回结构化的模拟数据
  
  const searchKeywords = generateSearchKeywords(productData);
  
  // 模拟多平台搜索结果
  const results = await Promise.all([
    searchPlatform('tiktok', searchKeywords, productData),
    searchPlatform('amazon', searchKeywords, productData),
    searchPlatform('shopee', searchKeywords, productData),
    searchPlatform('ozon', searchKeywords, productData),
  ]);
  
  // 合并并去重
  const allProducts = results.flat().filter(p => p !== null);
  
  // 按相关性排序
  allProducts.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return allProducts.slice(0, 20); // 返回前20个最相关的
}

/**
 * 搜索指定平台
 */
async function searchPlatform(platform, keywords, productData) {
  // 模拟搜索结果
  // 实际应该调用各平台的搜索API
  
  const platformConfig = {
    tiktok: { name: 'TikTok Shop', icon: '🎵' },
    amazon: { name: 'Amazon', icon: '📦' },
    shopee: { name: 'Shopee', icon: '🛒' },
    ozon: { name: 'OZON', icon: '🛍️' },
  };
  
  const config = platformConfig[platform] || { name: platform, icon: '🛍️' };
  
  // 生成模拟数据
  return Array.from({ length: 3 }, (_, i) => ({
    platform,
    platformName: config.name,
    platformIcon: config.icon,
    title: `${productData.name || 'Product'} - ${getPlatformVariant(i)}`,
    price: generateSimilarPrice(productData.price || 100),
    currency: platform === 'ozon' ? 'RUB' : 'USD',
    url: `https://${platform}.com/product/${uuidv4()}`,
    image: productData.images?.[0] || '',
    rating: (3.5 + Math.random() * 1.5).toFixed(1),
    reviews: Math.floor(Math.random() * 5000),
    relevanceScore: Math.floor(Math.random() * 40) + 60,
    source: 'search_api',
    lastUpdated: new Date().toISOString(),
  }));
}

// ==========================================
// 4. 产品规格生成
// ==========================================

/**
 * AI生成产品规格
 */
export async function generateProductSpecs(productData) {
  console.log(`[Specs] 生成产品规格`);
  
  const category = productData.category || 'general';
  const baseSpecs = getBaseSpecsForCategory(category);
  
  return {
    dimensions: baseSpecs.dimensions,
    weight: baseSpecs.weight,
    material: baseSpecs.material,
    colors: generateColorOptions(productData),
    sizes: generateSizeOptions(category),
    packaging: generatePackagingInfo(productData),
    certifications: generateCertifications(category),
    customFields: generateCustomFields(productData),
  };
}

// ==========================================
// 辅助函数
// ==========================================

function getStyleLabel(style) {
  const labels = {
    casual: '休闲日常',
    professional: '专业商务',
    trendy: '潮流时尚',
    emotional: '情感营销',
    promotional: '促销推广',
  };
  return labels[style] || style;
}

function getImageStyleLabel(style) {
  const labels = {
    'clean-white': '纯白背景',
    'lifestyle': '生活场景',
    'studio': '专业影棚',
    'minimalist': '简约设计',
  };
  return labels[style] || style;
}

function getRecommendedImageSize(style) {
  const sizes = {
    'clean-white': '800x800',
    'lifestyle': '1200x1200',
    'studio': '1000x1500',
    'minimalist': '800x1000',
  };
  return sizes[style] || '800x800';
}

function generateCasualTitle(name) {
  return `✨ ${name} | Must-Have for Daily Life!`;
}

function generateProfessionalTitle(name) {
  return `${name} - Premium Quality Professional Grade`;
}

function generateTrendyTitle(name) {
  return `🔥 ${name} | Viral Trend Alert! You Need This!`;
}

function generateCasualDescription(product) {
  return `Hey everyone! Check out this amazing ${product.name}!

Perfect for everyday use, great quality at an affordable price. 

Why you'll love it:
• Super durable & long-lasting
• Easy to use, perfect for beginners
• Makes life so much easier!

Order now and thank me later! 💕`;
}

function generateProfessionalDescription(product) {
  return `${product.name}

Product Overview:
Professional-grade quality designed for optimal performance and reliability.

Specifications:
${product.specs?.map(s => `• ${s}`).join('\n') || '• Premium materials\n• Expert craftsmanship\n• Industry-compliant standards'}

Applications:
Ideal for professional use and high-demand environments.

Quality Assurance:
Backed by our satisfaction guarantee.`;
}

function generateTrendyDescription(product) {
  return `OMG look at THIS! 😍

Everyone's talking about ${product.name} and I had to try it...

And girl... I GET IT NOW! 

✨ Why it's blowing up:
• Totally Instagrammable
• Sold out everywhere
• Limited stock alert!

Don't sleep on this one! Tap to shop NOW! ⚡`;
}

function extractFeatures(product) {
  return product.features || [
    'Premium Quality Materials',
    'Durable & Long-lasting',
    'Easy to Clean',
    'Multi-purpose Design',
    'Perfect Gift Choice'
  ];
}

function generateKeywords(product, count) {
  const base = ['product', 'shop', 'buy', 'sale', 'best', 'top', 'popular', 'trending'];
  const productKeywords = (product.keywords || []).slice(0, count);
  return productKeywords.length >= count 
    ? productKeywords 
    : [...productKeywords, ...base.slice(0, count - productKeywords.length)];
}

function generateHashtags(product, style) {
  const base = {
    casual: ['#ProductFind', '#DailyEssentials', '#HomeGoods', '#ShopSmart', '#BudgetFriendly'],
    professional: ['#ProfessionalGrade', '#QualityFirst', '#B2B', '#Wholesale', '#BulkOrder'],
    trendy: ['#Trending', '#MustHave', '#Viral', '#TikTokMadeMeBuyIt', '#ShopTok'],
  };
  return base[style] || base.casual;
}

function calculateEngagementScore(content, platform) {
  // 简化计算：基于关键词密度和hashtag数量
  const titleLength = content.title?.length || 0;
  const hashtagCount = content.hashtags?.length || 0;
  const keywordCount = content.keywords?.length || 0;
  
  let score = 50;
  if (titleLength > 30 && titleLength < 60) score += 20;
  if (hashtagCount >= 3 && hashtagCount <= 8) score += 15;
  if (keywordCount >= 5) score += 15;
  
  return Math.min(100, score);
}

function generateSearchKeywords(product) {
  const name = product.name || product.title || '';
  const category = product.category || '';
  
  // 提取关键词
  const words = name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  return [...new Set([...words, category])].slice(0, 5);
}

function getLifestyleScene(category) {
  const scenes = {
    clothing: 'cozy living room setting',
    accessories: 'modern bedroom with natural lighting',
    home: 'stylish apartment interior',
    electronics: 'modern home office setup',
  };
  return scenes[category] || 'modern lifestyle setting';
}

function getPlatformVariant(index) {
  const variants = ['Standard', 'Premium', 'Limited Edition'];
  return variants[index] || 'Variant';
}

function generateSimilarPrice(basePrice) {
  const factor = 0.7 + Math.random() * 0.6;
  return Math.round((basePrice || 50) * factor * 100) / 100;
}

function getBaseSpecsForCategory(category) {
  const specs = {
    clothing: {
      dimensions: 'Variable (S-3XL)',
      weight: '200-350g',
      material: 'Cotton/Polyester Blend',
    },
    accessories: {
      dimensions: 'Various sizes available',
      weight: '50-200g',
      material: 'Mixed materials',
    },
    home: {
      dimensions: 'Standard sizes',
      weight: '500g-5kg',
      material: 'Durable materials',
    },
    general: {
      dimensions: 'Standard',
      weight: 'N/A',
      material: 'Quality materials',
    },
  };
  return specs[category] || specs.general;
}

function generateColorOptions(product) {
  return product.colors || ['Black', 'White', 'Navy Blue', 'Gray', 'Custom colors available'];
}

function generateSizeOptions(category) {
  if (category === 'clothing') {
    return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  }
  return ['One Size', 'Small', 'Medium', 'Large'];
}

function generatePackagingInfo(product) {
  return {
    type: 'Retail Box / Polybag',
    dimensions: '30x20x10 cm',
    weight: '100-300g',
    included: ['Product', 'User Manual', 'Warranty Card'],
  };
}

function generateCertifications(category) {
  const certs = {
    clothing: ['CE', 'OEKO-TEX', 'BSCI'],
    electronics: ['CE', 'FCC', 'RoHS'],
    general: ['CE', 'ISO 9001'],
  };
  return certs[category] || certs.general;
}

function generateCustomFields(product) {
  return {
    brand: product.brand || 'Generic',
    model: product.model || 'Standard',
    sku: `SKU-${Date.now()}`,
    barcode: `${Math.floor(Math.random() * 1000000000000)}`,
  };
}

// 导出数据类型
export const ProductPublishTypes = {
  ProductData: {},
  GeneratedContent: {},
  ImagePrompt: {},
  SimilarProduct: {},
  ProductSpecs: {},
};
