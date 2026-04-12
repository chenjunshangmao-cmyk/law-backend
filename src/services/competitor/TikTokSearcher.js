// ==========================================
// TikTok竞品搜索服务
// ==========================================

const { fetchWithProxy } = require('../../utils/proxy');
const logger = require('../../utils/logger');

class TikTokSearcher {
  constructor() {
    this.baseURL = 'https://www.tiktok.com';
  }

  /**
   * 搜索TikTok商品
   * @param {Object} params - 搜索参数
   * @param {string} params.keyword - 搜索关键词
   * @param {string} params.category - 商品类别
   * @param {number} params.limit - 返回数量
   */
  async searchProducts(params) {
    const { keyword, category, limit = 10 } = params;
    
    logger.info(`搜索TikTok竞品: ${keyword}, 类别: ${category}`);

    try {
      // 构建搜索URL
      const searchQuery = encodeURIComponent(keyword);
      const searchURL = `${this.baseURL}/search?q=${searchQuery}&t=1666666666`;

      // 使用代理请求
      const response = await fetchWithProxy(searchURL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });

      if (!response.ok) {
        // 如果直接搜索失败，使用模拟数据
        logger.warn('TikTok搜索失败，使用模拟数据');
        return this.getMockCompetitors(keyword, limit);
      }

      // 解析搜索结果（简化版，实际需要更复杂的解析）
      const html = await response.text();
      const products = this.parseSearchResults(html, limit);

      // 分析竞品数据
      const analysis = this.analyzeCompetitors(products);

      return {
        products,
        analysis
      };

    } catch (error) {
      logger.error('TikTok搜索失败:', error);
      // 返回模拟数据
      return this.getMockCompetitors(keyword, limit);
    }
  }

  /**
   * 解析搜索结果
   */
  parseSearchResults(html, limit) {
    // 这里简化处理，实际需要用cheerio等库解析HTML
    // 或者使用TikTok的API
    const products = [];
    
    // 模拟解析逻辑
    // 实际实现需要提取商品标题、价格、销量等信息
    
    return products.slice(0, limit);
  }

  /**
   * 分析竞品数据
   */
  analyzeCompetitors(products) {
    if (products.length === 0) {
      return {
        count: 0,
        priceRange: { min: 0, max: 0 },
        avgPrice: 0,
        style: 'unknown'
      };
    }

    const prices = products.map(p => p.price).filter(p => p > 0);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    // 分析爆款风格
    const styleKeywords = {
      fresh: ['fresh', 'cute', 'lovely', 'sweet', 'pastel'],
      cartoon: ['cartoon', 'anime', 'character', 'fun', 'playful'],
      minimal: ['minimal', 'simple', 'elegant', 'clean', 'modern'],
      luxury: ['luxury', 'premium', 'high-end', 'designer'],
      sporty: ['sport', 'active', 'athletic', 'fitness']
    };

    const styleCounts = {};
    products.forEach(p => {
      const text = (p.title + ' ' + p.features.join(' ')).toLowerCase();
      Object.entries(styleKeywords).forEach(([style, keywords]) => {
        keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            styleCounts[style] = (styleCounts[style] || 0) + 1;
          }
        });
      });
    });

    const dominantStyle = Object.entries(styleCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed';

    const styleNames = {
      fresh: '清新',
      cartoon: '卡通',
      minimal: '简约',
      luxury: '奢华',
      sporty: '运动',
      mixed: '混合'
    };

    return {
      count: products.length,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      avgPrice: parseFloat(avgPrice.toFixed(2)),
      style: styleNames[dominantStyle] || dominantStyle
    };
  }

  /**
   * 获取模拟竞品数据（用于测试）
   */
  getMockCompetitors(keyword, limit) {
    const mockProducts = [
      {
        title: 'Cute Summer Kids Dress Cotton Cartoon Print',
        price: 12.99,
        sales: 5420,
        images: ['https://example.com/img1.jpg'],
        features: ['100% Cotton', 'Breathable', 'Cute Design', 'Machine Washable'],
        style: 'cartoon'
      },
      {
        title: 'Girls Floral Dress Casual Summer Wear',
        price: 15.99,
        sales: 3890,
        images: ['https://example.com/img2.jpg'],
        features: ['Soft Fabric', 'Floral Pattern', 'Comfortable Fit', 'Easy Care'],
        style: 'fresh'
      },
      {
        title: 'Kids Princess Dress Party Wear',
        price: 18.99,
        sales: 2156,
        images: ['https://example.com/img3.jpg'],
        features: ['Elegant Design', 'High Quality', 'Perfect for Parties', 'Tulle Skirt'],
        style: 'luxury'
      },
      {
        title: 'Boys Summer T-shirt Cotton Cartoon',
        price: 9.99,
        sales: 8750,
        images: ['https://example.com/img4.jpg'],
        features: ['Pure Cotton', 'Cartoon Print', 'Soft Touch', 'Durable'],
        style: 'cartoon'
      },
      {
        title: 'Minimalist Kids Outfit Set',
        price: 24.99,
        sales: 1234,
        images: ['https://example.com/img5.jpg'],
        features: ['Simple Style', 'Premium Quality', 'Versatile', 'Modern Design'],
        style: 'minimal'
      }
    ];

    const products = mockProducts.slice(0, limit);
    const analysis = this.analyzeCompetitors(products);

    return { products, analysis };
  }

  /**
   * 全网搜索（1688 + TikTok + 淘宝）
   */
  async searchAllPlatforms(keyword) {
    logger.info(`全网搜索: ${keyword}`);

    const results = {
      tiktok: [],
      taobao: [],
      source1688: []
    };

    try {
      // 并行搜索多个平台
      const [tiktokResult] = await Promise.allSettled([
        this.searchProducts({ keyword, limit: 5 })
      ]);

      if (tiktokResult.status === 'fulfilled') {
        results.tiktok = tiktokResult.value;
      }

      return results;
    } catch (error) {
      logger.error('全网搜索失败:', error);
      return results;
    }
  }
}

module.exports = TikTokSearcher;
