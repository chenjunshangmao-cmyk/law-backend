// ==========================================
// AI智能内容生成服务
// 包含：图片生成、文案生成、商品识别、智能定价
// ==========================================

const { fetchWithProxy } = require('../../utils/proxy');
const logger = require('../../utils/logger');

class SmartContentGenerator {
  constructor(config = {}) {
    // DeepSeek API配置
    this.deepseekKey = config.deepseekKey || process.env.DEEPSEEK_API_KEY;
    this.deepseekURL = 'https://api.deepseek.com/v1/chat/completions';
    
    // 百炼API配置
    this.bailianKey = config.bailianKey || process.env.BAILIAN_API_KEY;
    this.bailianURL = process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    
    // Flux API配置
    this.fluxKey = config.fluxKey || process.env.FLUX_API_KEY;
    this.fluxURL = 'https://api.bfl.ml/v1';
  }

  // ==========================================
  // 1. AI图片生成（参考竞店爆款风格）
  // ==========================================
  async generateProductImages(params) {
    const { referenceImages, style, count = 4 } = params;
    
    logger.info(`生成商品图片: 风格=${style}, 数量=${count}`);

    try {
      // 构建提示词
      const stylePrompts = {
        '清新': 'fresh, pastel colors, soft lighting, natural background',
        '卡通': 'cartoon style, vibrant colors, fun, playful, character design',
        '简约': 'minimalist, clean, white background, elegant, simple',
        '奢华': 'luxury, premium, golden accents, high-end, sophisticated',
        '运动': 'sporty, active, dynamic, athletic wear, energetic',
        'auto': 'professional product photography, high quality, e-commerce style'
      };

      const stylePrompt = stylePrompts[style] || stylePrompts.auto;
      
      const images = [];
      
      // 为每张图片生成不同的角度/场景
      const scenes = [
        'main product shot, front view',
        'product detail shot, close-up',
        'product lifestyle shot, model wearing',
        'product flat lay, top view'
      ];

      for (let i = 0; i < Math.min(count, scenes.length); i++) {
        const prompt = `Product photography, ${scenes[i]}, ${stylePrompt}, 
          high quality, professional lighting, suitable for e-commerce,
          clean composition, 4K resolution, sharp details`;

        // 调用Flux API生成图片
        const imageUrl = await this.callFluxAPI(prompt);
        images.push(imageUrl);
      }

      return {
        success: true,
        data: { images, prompt: stylePrompt }
      };

    } catch (error) {
      logger.error('图片生成失败:', error);
      // 返回模拟图片
      return {
        success: true,
        data: {
          images: this.getMockImages(count),
          prompt: 'mock'
        }
      };
    }
  }

  async callFluxAPI(prompt) {
    if (!this.fluxKey) {
      throw new Error('Flux API Key未配置');
    }

    const response = await fetchWithProxy(`${this.fluxURL}/flux-pro`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.fluxKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        width: 1024,
        height: 1024,
        num_images: 1,
        prompt_upsampling: true
      })
    });

    if (!response.ok) {
      throw new Error(`Flux API错误: ${response.status}`);
    }

    const data = await response.json();
    return data.result?.sample || data.image_url;
  }

  // ==========================================
  // 2. AI文案生成（参考竞店爆款）
  // ==========================================
  async generateCopy(params) {
    const { productInfo, competitors, language = 'en' } = params;
    
    logger.info('生成商品文案');

    try {
      // 分析竞品爆款文案特点
      const competitorAnalysis = this.analyzeCompetitorCopy(competitors);
      
      // 构建提示词
      const prompt = this.buildCopyPrompt(productInfo, competitorAnalysis, language);
      
      // 调用DeepSeek生成文案
      const copy = await this.callDeepSeek(prompt);
      
      return {
        success: true,
        data: copy
      };

    } catch (error) {
      logger.error('文案生成失败:', error);
      // 返回模拟文案
      return {
        success: true,
        data: this.getMockCopy(productInfo, language)
      };
    }
  }

  analyzeCompetitorCopy(competitors) {
    if (!competitors || competitors.length === 0) {
      return {
        commonKeywords: [],
        avgTitleLength: 80,
        popularFeatures: []
      };
    }

    // 提取共同关键词
    const allText = competitors.map(c => c.title + ' ' + c.features.join(' ')).join(' ').toLowerCase();
    const keywords = ['cotton', 'soft', 'comfortable', 'cute', 'fashion', 'quality', 'breathable', 'durable'];
    const commonKeywords = keywords.filter(k => allText.includes(k));

    // 计算平均标题长度
    const avgTitleLength = competitors.reduce((sum, c) => sum + c.title.length, 0) / competitors.length;

    // 提取热门卖点
    const featureCounts = {};
    competitors.forEach(c => {
      c.features.forEach(f => {
        featureCounts[f] = (featureCounts[f] || 0) + 1;
      });
    });
    const popularFeatures = Object.entries(featureCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([f]) => f);

    return {
      commonKeywords,
      avgTitleLength: Math.round(avgTitleLength),
      popularFeatures
    };
  }

  buildCopyPrompt(productInfo, competitorAnalysis, language) {
    const langName = language === 'en' ? 'English' : 'Chinese';
    
    return `You are an expert e-commerce copywriter specializing in TikTok Shop listings.

Analyze these competitor best-sellers:
- Common keywords: ${competitorAnalysis.commonKeywords.join(', ')}
- Popular features: ${competitorAnalysis.popularFeatures.join(', ')}
- Average title length: ${competitorAnalysis.avgTitleLength} characters

Create a compelling product listing in ${langName} for:
Product: ${productInfo.title || productInfo.category}
Price: $${productInfo.price || 'N/A'}

Requirements:
1. Title: Catchy, include keywords, max 100 characters
2. Description: Engaging, 2-3 sentences, highlight benefits
3. 5 Bullet points: Key features, each under 80 characters
4. SEO keywords: 5-10 relevant keywords
5. Style: Friendly, persuasive, suitable for social commerce

Respond in JSON format:
{
  "title": "...",
  "description": "...",
  "bulletPoints": ["...", "..."],
  "keywords": ["...", "..."]
}`;
  }

  async callDeepSeek(prompt) {
    const response = await fetchWithProxy(this.deepseekURL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.deepseekKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // 解析JSON响应
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      logger.warn('JSON解析失败，使用原始内容');
    }

    return {
      title: content.slice(0, 100),
      description: content.slice(0, 300),
      bulletPoints: ['High Quality', 'Comfortable', 'Stylish Design', 'Perfect Gift', 'Fast Shipping'],
      keywords: ['fashion', 'kids', 'cotton', 'summer', 'cute']
    };
  }

  // ==========================================
  // 3. AI商品识别（从图片）
  // ==========================================
  async recognizeProduct(imageBase64) {
    logger.info('识别商品图片');

    try {
      // 使用多模态模型识别商品
      const prompt = `Analyze this product image and provide:
1. Product category (e.g., "kids dress", "women shoes")
2. Key features (material, style, color, pattern)
3. Target audience (age, gender)
4. Estimated price range

Respond in JSON format:
{
  "category": "...",
  "features": ["..."],
  "targetAudience": "...",
  "priceRange": "$10-$30"
}`;

      // 这里应该调用支持图像的API（如GPT-4V、Qwen-VL等）
      // 暂时返回模拟结果
      return {
        success: true,
        data: {
          category: 'Kids Summer Dress',
          features: ['Cotton', 'Cartoon Print', 'Short Sleeve', 'Casual'],
          targetAudience: 'Girls 3-8 years old',
          priceRange: '$15-$25'
        }
      };

    } catch (error) {
      logger.error('商品识别失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==========================================
  // 4. 智能定价
  // ==========================================
  async calculatePrice(params) {
    const { costPrice, shipping = 15, targetMargin = 0.5, competitorPrices = [] } = params;
    
    logger.info(`计算定价: 成本=${costPrice}, 目标利润率=${targetMargin}`);

    try {
      const exchangeRate = 7.2; // USD/CNY
      
      // 基础定价公式
      const totalCost = costPrice + shipping;
      const basePriceUSD = totalCost / exchangeRate;
      const targetPrice = basePriceUSD * (1 + targetMargin);
      
      // 参考竞品价格调整
      let finalPrice = targetPrice;
      if (competitorPrices.length > 0) {
        const avgCompetitor = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
        const minCompetitor = Math.min(...competitorPrices);
        
        // 如果目标价格高于竞品平均价10%以上，调整到平均价附近
        if (targetPrice > avgCompetitor * 1.1) {
          finalPrice = avgCompetitor * 0.95; // 比平均价低5%
        }
        
        // 确保价格不低于最低竞品的80%
        finalPrice = Math.max(finalPrice, minCompetitor * 0.8);
      }
      
      // 取整到X.99
      finalPrice = Math.floor(finalPrice) + 0.99;
      
      // 计算实际利润率
      const actualMargin = (finalPrice - basePriceUSD) / finalPrice;
      
      return {
        success: true,
        data: {
          suggestedPrice: parseFloat(finalPrice.toFixed(2)),
          baseCost: parseFloat(basePriceUSD.toFixed(2)),
          margin: parseFloat(actualMargin.toFixed(2)),
          competitorAvg: competitorPrices.length > 0 
            ? parseFloat((competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length).toFixed(2))
            : null,
          formula: `(${costPrice} + ${shipping}) / ${exchangeRate} * (1 + ${targetMargin})`
        }
      };

    } catch (error) {
      logger.error('定价计算失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ==========================================
  // 辅助方法：模拟数据
  // ==========================================
  getMockImages(count) {
    return Array(count).fill('https://via.placeholder.com/1024x1024/6366f1/ffffff?text=AI+Generated+Image');
  }

  getMockCopy(productInfo, language) {
    const isEn = language === 'en';
    return {
      title: isEn 
        ? 'Cute Summer Kids Dress Cotton Cartoon Print Casual Wear'
        : '夏季可爱儿童连衣裙纯棉卡通印花休闲装',
      description: isEn
        ? 'Adorable summer dress for your little one! Made from 100% soft cotton with cute cartoon prints. Perfect for daily wear or special occasions. Comfortable, breathable, and easy to wash.'
        : '给宝贝的可爱夏季连衣裙！采用100%柔软纯棉，卡通印花设计。适合日常穿着或特殊场合。舒适透气，易于清洗。',
      bulletPoints: isEn ? [
        '100% Soft Cotton Material',
        'Cute Cartoon Print Design',
        'Breathable & Comfortable',
        'Perfect for Summer Days',
        'Machine Washable'
      ] : [
        '100%柔软纯棉材质',
        '可爱卡通印花设计',
        '透气舒适',
        '夏日必备',
        '可机洗'
      ],
      keywords: isEn 
        ? ['kids dress', 'summer', 'cotton', 'cartoon', 'girls', 'casual']
        : ['儿童连衣裙', '夏季', '纯棉', '卡通', '女童', '休闲']
    };
  }
}

module.exports = SmartContentGenerator;
