// AI生成路由
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

// POST /api/generate/text - 调用OpenClaw生成文案
router.post('/text', authMiddleware, async (req, res) => {
  try {
    const { productName, productDescription, platform, style } = req.body;

    // 检查额度
    if (!checkQuota(req.userId, 'text')) {
      const quota = getQuotaByUserId(req.userId);
      return res.status(403).json({
        success: false,
        error: `文案生成额度已用完（${quota.textLimit}次），请升级套餐`
      });
    }

    // 验证必填字段
    if (!productName) {
      return res.status(400).json({
        success: false,
        error: '产品名称不能为空'
      });
    }

    // 构建提示词
    const prompt = buildTextPrompt(productName, productDescription, platform, style);

    // 调用OpenClaw API
    const result = await callOpenClaw(prompt);

    // 更新使用量
    incrementUsage(req.userId, 'text');

    res.json({
      success: true,
      data: {
        text: result.text || result,
        usage: {
          type: 'text',
          generated: true
        }
      }
    });
  } catch (error) {
    console.error('文案生成错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '文案生成失败'
    });
  }
});

// POST /api/generate/image - 使用百炼千问生成AI图片
router.post('/image', authMiddleware, async (req, res) => {
  try {
    const { productName, productDescription, style, size = '1024x1024' } = req.body;

    // 检查额度
    if (!checkQuota(req.userId, 'image')) {
      const quota = getQuotaByUserId(req.userId);
      return res.status(403).json({
        success: false,
        error: `图片生成额度已用完（${quota.imageLimit}次），请升级套餐`
      });
    }

    // 验证必填字段
    if (!productName) {
      return res.status(400).json({
        success: false,
        error: '产品名称不能为空'
      });
    }

    // 构建图片生成提示词
    const prompt = buildImageGenerationPrompt(productName, productDescription, style);

    // 调用百炼千问图像生成API
    const result = await generateImageWithBailian(prompt, size);

    // 更新使用量
    incrementUsage(req.userId, 'image');

    res.json({
      success: true,
      data: {
        ...result,
        prompt,
        usage: {
          type: 'image',
          generated: true,
          provider: 'bailian-wanx'
        }
      }
    });
  } catch (error) {
    console.error('图片生成错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '图片生成失败'
    });
  }
});

// 构建文案提示词
function buildTextPrompt(productName, description, platform, style) {
  const platformMap = {
    tiktok: 'TikTok Shop',
    shopee: 'Shopee',
    ozon: 'OZON',
    amazon: 'Amazon',
    default: '跨境电商平台'
  };

  const styleMap = {
    professional: '专业简洁',
    casual: '轻松活泼',
    luxury: '高端奢华',
    youth: '年轻潮流',
    default: '专业简洁'
  };

  return `请为以下产品生成跨境电商平台的英文商品文案：

产品名称：${productName}
产品描述：${description || '无'}
目标平台：${platformMap[platform] || platformMap.default}
文案风格：${styleMap[style] || styleMap.default}

要求：
1. 生成吸引人的产品标题（50字符以内）
2. 生成详细的产品描述（150-200词）
3. 生成5-8个产品特点bullet points
4. 包含SEO关键词
5. 适合在${platformMap[platform] || platformMap.default}上展示

请以JSON格式输出：
{
  "title": "产品标题",
  "description": "产品描述",
  "features": ["特点1", "特点2", ...],
  "keywords": ["关键词1", "关键词2", ...]
}`;
}

// 构建图片描述提示词
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

// 调用OpenClaw
async function callOpenClaw(prompt) {
  // 优先使用百炼（阿里云）API
  if (BAILIAN_API_KEY) {
    try {
      const response = await fetch(`${BAILIAN_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BAILIAN_API_KEY}`
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的跨境电商文案专家，专门为电商平台生成产品标题、描述和关键词。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`百炼API错误: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        try {
          return { text: JSON.parse(content) };
        } catch {
          return { text: content };
        }
      }

      throw new Error('百炼返回内容为空');
    } catch (error) {
      console.error('百炼调用失败:', error);
      // 尝试使用 DeepSeek 作为备用
    }
  }

  // 使用 DeepSeek API
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
              content: '你是一个专业的跨境电商文案专家，专门为电商平台生成产品标题、描述和关键词。'
            },
            {
              role: 'user',
              content: prompt
            }
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
        try {
          return { text: JSON.parse(content) };
        } catch {
          return { text: content };
        }
      }

      throw new Error('DeepSeek返回内容为空');
    } catch (error) {
      console.error('DeepSeek调用失败:', error);
      throw new Error(`AI生成失败: ${error.message}`);
    }
  }

  // 如果没有配置OpenClaw，返回模拟数据
  if (!OPENCLAW_TOKEN) {
    return {
      text: {
        title: "Premium Children's Summer Dress - Soft Cotton",
        description: "This adorable children's summer dress is perfect for any occasion. Made from 100% organic cotton, it's soft, breathable, and gentle on sensitive skin. The breathable fabric keeps your little one cool during hot summer days. Features a cute print pattern that kids love. Easy to care for and machine washable. Available in multiple sizes for children aged 2-8 years.",
        features: [
          "100% organic cotton material",
          "Breathable and comfortable",
          "Cute cartoon print pattern",
          "Machine washable",
          "Multiple sizes available",
          "Perfect for summer wear"
        ],
        keywords: [
          "children dress",
          "summer outfit",
          "cotton dress",
          "kids clothing",
          "girls dress"
        ]
      }
    };
  }

  try {
    const response = await fetch(`${OPENCLAW_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`
      },
      body: JSON.stringify({
        prompt,
        model: 'claude',
        maxTokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenClaw API错误: ${response.status}`);
    }

    const data = await response.json();
    
    // 尝试解析返回的JSON
    try {
      return { text: JSON.parse(data.text || data.content) };
    } catch {
      return { text: data.text || data.content };
    }
  } catch (error) {
    console.error('OpenClaw调用失败:', error);
    throw new Error('AI服务暂时不可用');
  }
}

// 构建图片生成提示词（用于AI图像生成）
function buildImageGenerationPrompt(productName, description, style) {
  const styleMap = {
    clean: 'clean white background, professional product photography',
    lifestyle: 'lifestyle scene, natural lighting, real environment',
    studio: 'professional studio lighting, gradient background',
    minimal: 'minimalist style, simple background, focus on product',
    luxury: 'luxury style, elegant lighting, premium feel',
    default: 'clean white background, professional e-commerce style'
  };

  const stylePrompt = styleMap[style] || styleMap.default;

  return `Professional e-commerce product photo of "${productName}". 
${description ? `Product details: ${description}.` : ''}
Style: ${stylePrompt}. 
High quality, sharp focus, commercial photography, suitable for online marketplace listing.`;
}

// 调用百炼千问图像生成API
async function generateImageWithBailian(prompt, size = '1024x1024') {
  if (!BAILIAN_API_KEY) {
    throw new Error('百炼API密钥未配置，请在环境变量中设置 BAILIAN_API_KEY');
  }

  // 解析尺寸
  const [width, height] = size.split('x').map(Number);

  try {
    const response = await fetch(`${BAILIAN_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BAILIAN_API_KEY}`
      },
      body: JSON.stringify({
        model: 'wanx-v1',  // 通义万生图像生成模型
        prompt: prompt,
        n: 1,
        size: size,
        response_format: 'url'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`百炼图像生成API错误: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      return {
        imageUrl: data.data[0].url,
        description: prompt,
        revised_prompt: data.data[0].revised_prompt || prompt
      };
    }

    throw new Error('百炼返回的图片数据为空');
  } catch (error) {
    console.error('百炼图像生成失败:', error);
    
    // 如果wanx-v1失败，尝试使用其他模型
    try {
      console.log('尝试使用备用模型...');
      const fallbackResponse = await fetch(`${BAILIAN_BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BAILIAN_API_KEY}`
        },
        body: JSON.stringify({
          model: 'flux-dev',  // 备用模型
          prompt: prompt,
          n: 1,
          size: size
        })
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.data && fallbackData.data.length > 0) {
          return {
            imageUrl: fallbackData.data[0].url,
            description: prompt,
            revised_prompt: fallbackData.data[0].revised_prompt || prompt
          };
        }
      }
    } catch (fallbackError) {
      console.error('备用模型也失败:', fallbackError);
    }

    throw new Error(`图片生成失败: ${error.message}`);
  }
}

export default router;
