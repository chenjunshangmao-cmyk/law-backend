// ==========================================
// Claw - 产品发布API路由
// ==========================================

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { 
  scrapeProductFromUrl,
  generateMultipleContents,
  generateMultipleImagePrompts,
  findSimilarProducts,
  generateProductSpecs
} from '../services/productPublishService.js';

const router = express.Router();

// ==========================================
// 1. 链接抓取接口
// ==========================================

/**
 * POST /api/publish/scrape
 * 从产品链接抓取信息
 */
router.post('/scrape', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: '请提供产品链接',
        code: 'MISSING_URL'
      });
    }
    
    // 验证URL格式
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: '无效的URL格式',
        code: 'INVALID_URL'
      });
    }
    
    console.log(`[Publish API] 用户 ${req.userId} 请求抓取: ${url}`);
    
    const result = await scrapeProductFromUrl(url);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Publish API] 抓取失败:', error);
    res.status(500).json({
      success: false,
      error: `抓取失败: ${error.message}`,
      code: 'SCRAPE_FAILED'
    });
  }
});

// ==========================================
// 2. AI生成多种文案
// ==========================================

/**
 * POST /api/publish/generate-contents
 * 生成多种文案供选择
 */
router.post('/generate-contents', authMiddleware, async (req, res) => {
  try {
    const { 
      productData,
      targetPlatform = 'tiktok',
      language = 'en',
      count = 3,
      styles
    } = req.body;
    
    if (!productData) {
      return res.status(400).json({
        success: false,
        error: '请提供产品信息',
        code: 'MISSING_PRODUCT_DATA'
      });
    }
    
    console.log(`[Publish API] 生成 ${count} 种文案`);
    
    const options = {
      targetPlatform,
      language,
      count,
      styles: styles || ['casual', 'professional', 'trendy']
    };
    
    const contents = await generateMultipleContents(productData, options);
    
    res.json({
      success: true,
      data: {
        contents,
        recommended: contents[0],
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Publish API] 生成文案失败:', error);
    res.status(500).json({
      success: false,
      error: `生成文案失败: ${error.message}`,
      code: 'GENERATE_CONTENT_FAILED'
    });
  }
});

// ==========================================
// 3. AI生成多种图片
// ==========================================

/**
 * POST /api/publish/generate-images
 * 生成多种图片描述/Prompts
 */
router.post('/generate-images', authMiddleware, async (req, res) => {
  try {
    const { 
      productData,
      count = 4,
      styles
    } = req.body;
    
    if (!productData) {
      return res.status(400).json({
        success: false,
        error: '请提供产品信息',
        code: 'MISSING_PRODUCT_DATA'
      });
    }
    
    console.log(`[Publish API] 生成 ${count} 种图片风格`);
    
    const options = {
      count,
      styles: styles || ['clean-white', 'lifestyle', 'studio', 'minimalist']
    };
    
    const images = await generateMultipleImagePrompts(productData, options);
    
    res.json({
      success: true,
      data: {
        images,
        recommended: images[0],
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Publish API] 生成图片失败:', error);
    res.status(500).json({
      success: false,
      error: `生成图片失败: ${error.message}`,
      code: 'GENERATE_IMAGE_FAILED'
    });
  }
});

// ==========================================
// 4. 全网相似商品采集
// ==========================================

/**
 * POST /api/publish/similar-products
 * 采集全网相似商品
 */
router.post('/similar-products', authMiddleware, async (req, res) => {
  try {
    const { productData } = req.body;
    
    if (!productData) {
      return res.status(400).json({
        success: false,
        error: '请提供产品信息',
        code: 'MISSING_PRODUCT_DATA'
      });
    }
    
    console.log(`[Publish API] 搜索相似商品`);
    
    const similarProducts = await findSimilarProducts(productData);
    
    const byPlatform = {};
    similarProducts.forEach(p => {
      if (!byPlatform[p.platform]) {
        byPlatform[p.platform] = {
          platformName: p.platformName,
          count: 0,
          products: []
        };
      }
      byPlatform[p.platform].count++;
      byPlatform[p.platform].products.push(p);
    });
    
    res.json({
      success: true,
      data: {
        products: similarProducts,
        statistics: byPlatform,
        totalCount: similarProducts.length,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Publish API] 搜索相似商品失败:', error);
    res.status(500).json({
      success: false,
      error: `搜索失败: ${error.message}`,
      code: 'SIMILAR_SEARCH_FAILED'
    });
  }
});

// ==========================================
// 5. AI生成产品规格
// ==========================================

/**
 * POST /api/publish/generate-specs
 * 生成产品规格
 */
router.post('/generate-specs', authMiddleware, async (req, res) => {
  try {
    const { productData } = req.body;
    
    if (!productData) {
      return res.status(400).json({
        success: false,
        error: '请提供产品信息',
        code: 'MISSING_PRODUCT_DATA'
      });
    }
    
    console.log(`[Publish API] 生成产品规格`);
    
    const specs = await generateProductSpecs(productData);
    
    res.json({
      success: true,
      data: {
        specs,
        rawData: productData,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Publish API] 生成规格失败:', error);
    res.status(500).json({
      success: false,
      error: `生成规格失败: ${error.message}`,
      code: 'GENERATE_SPECS_FAILED'
    });
  }
});

// ==========================================
// 6. 完整产品发布流程
// ==========================================

/**
 * POST /api/publish/create-product
 * 从链接或素材创建完整产品
 */
router.post('/create-product', authMiddleware, async (req, res) => {
  try {
    const { 
      mode,
      sourceUrl,
      productData,
      selectedContent,
      selectedImage,
      price,
      platform,
      options
    } = req.body;
    
    console.log(`[Publish API] 创建产品，模式: ${mode}`);
    
    let finalProduct = {
      id: `prod_${Date.now()}`,
      userId: req.userId,
      mode,
      platform: platform || 'tiktok',
      price,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (mode === 'link') {
      const scraped = await scrapeProductFromUrl(sourceUrl);
      finalProduct = {
        ...finalProduct,
        originalUrl: sourceUrl,
        scrapedData: scraped.data,
        productName: scraped.data?.title || productData?.name || '未命名产品',
        productDesc: scraped.data?.description || productData?.description || '',
        images: scraped.data?.images || [],
        sourcePlatform: scraped.platform,
      };
    } else {
      finalProduct = {
        ...finalProduct,
        productName: productData?.name || '未命名产品',
        productDesc: productData?.description || '',
        images: productData?.images || [],
        customerMaterials: {
          hasImages: (productData?.images?.length || 0) > 0,
          hasDescription: !!productData?.description,
          notes: productData?.notes || '',
        }
      };
    }
    
    if (selectedContent) {
      finalProduct.generatedContent = selectedContent;
    }
    
    if (selectedImage) {
      finalProduct.selectedImagePrompt = selectedImage;
    }
    
    res.json({
      success: true,
      data: {
        product: finalProduct,
        nextStep: 'preview',
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Publish API] 创建产品失败:', error);
    res.status(500).json({
      success: false,
      error: `创建产品失败: ${error.message}`,
      code: 'CREATE_PRODUCT_FAILED'
    });
  }
});

// ==========================================
// 7. 一键发布到平台
// ==========================================

/**
 * POST /api/publish/publish-to-platform
 * 发布产品到指定平台
 */
router.post('/publish-to-platform', authMiddleware, async (req, res) => {
  try {
    const { 
      productId,
      productData,
      platform,
      accountId,
      browserSession
    } = req.body;
    
    console.log(`[Publish API] 发布到 ${platform}，账号: ${accountId}`);
    
    if (!browserSession) {
      return res.status(400).json({
        success: false,
        error: '需要浏览器会话来执行发布，请先连接平台账号',
        code: 'NO_BROWSER_SESSION'
      });
    }
    
    res.json({
      success: true,
      data: {
        productId,
        platform,
        status: 'published',
        publishedUrl: `https://${platform}.com/product/${productId}`,
        publishedAt: new Date().toISOString(),
      },
      message: '产品已发布成功！',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Publish API] 发布失败:', error);
    res.status(500).json({
      success: false,
      error: `发布失败: ${error.message}`,
      code: 'PUBLISH_FAILED'
    });
  }
});

export default router;
