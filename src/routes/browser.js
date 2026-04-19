/**
 * 浏览器自动化 API 路由 v2.0
 * 核心流程：客户手动登录 → 自动保存Session → 后续自动复用
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { TikTokShopAutomation, YouTubeAutomation, OzonAutomation } from '../services/browserAutomation.js';

const router = express.Router();

// 初始化自动化实例
const tiktok = new TikTokShopAutomation();
const youtube = new YouTubeAutomation();
const ozon = new OzonAutomation();

// 确保目录存在
const browserStateDir = path.join(process.cwd(), 'browser-states');
if (!fs.existsSync(browserStateDir)) {
  fs.mkdirSync(browserStateDir, { recursive: true });
}

/**
 * ============================================
 * TikTok Shop 接口
 * ============================================
 */

/**
 * POST /api/browser/tiktok/login
 * 打开浏览器让客户手动登录TikTok（真实浏览器登录）
 */
router.post('/tiktok/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.json({
        success: false,
        error: '请提供邮箱参数：{ email: "your@email.com" }'
      });
    }

    console.log(`📱 正在为 ${email} 打开TikTok登录页面...`);
    
    // 打开浏览器让客户手动登录
    const result = await tiktok.openLoginPage(email);
    
    res.json(result);

  } catch (error) {
    console.error('登录失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/tiktok/login-cookies
 * 通过导入 Cookies 登录 TikTok（虚拟登录方式 B）
 */
router.post('/tiktok/login-cookies', async (req, res) => {
  try {
    const { email, cookies } = req.body;
    
    if (!email || !cookies) {
      return res.json({
        success: false,
        error: '请提供邮箱和 cookies：{ email: "your@email.com", cookies: [...] }'
      });
    }

    console.log(`🍪 正在为 ${email} 导入 Cookies 登录 TikTok...`);
    
    const result = await tiktok.loginWithCookies(email, cookies);
    
    res.json(result);

  } catch (error) {
    console.error('Cookie 登录失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/tiktok/login-token
 * 通过 Access Token 登录 TikTok（虚拟登录方式 C）
 */
router.post('/tiktok/login-token', async (req, res) => {
  try {
    const { email, accessToken, refreshToken, expiresIn } = req.body;
    
    if (!email || !accessToken) {
      return res.json({
        success: false,
        error: '请提供邮箱和 accessToken：{ email: "your@email.com", accessToken: "..." }'
      });
    }

    console.log(`🔑 正在为 ${email} 使用 Token 登录 TikTok...`);
    
    const result = await tiktok.loginWithToken(email, { 
      accessToken, 
      refreshToken, 
      expiresIn 
    });
    
    res.json(result);

  } catch (error) {
    console.error('Token 登录失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/browser/tiktok/status
 * 检查TikTok登录状态
 */
router.get('/tiktok/status', async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.json({
      success: false,
      error: '请提供邮箱参数：?email=your@email.com'
    });
  }

  const status = await tiktok.checkLogin(email);
  
  res.json({
    success: true,
    data: {
      platform: 'tiktok',
      email,
      loggedIn: status.loggedIn,
      loginType: status.loginType,
      hasSession: status.hasSession,
      hasToken: status.hasToken,
      isTokenExpired: status.isTokenExpired,
      sessionPath: status.sessionPath,
      tokenPath: status.tokenPath,
      tokenInfo: status.tokenInfo,
      message: status.loggedIn 
        ? `已登录 (${status.loginType === 'token' ? 'Token' : status.loginType === 'cookies' ? 'Cookies' : 'Session'})` 
        : (status.isTokenExpired ? 'Token 已过期' : '未登录')
    }
  });
});

/**
 * POST /api/browser/tiktok/publish
 * 发布产品到TikTok Shop
 */
router.post('/tiktok/publish', async (req, res) => {
  try {
    const { email, title, description, price, stock, images } = req.body;

    if (!email || !title) {
      return res.json({
        success: false,
        error: '缺少必要参数：email, title'
      });
    }

    const result = await tiktok.publishProduct({
      email,
      title,
      description: description || '',
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 100,
      images
    });

    res.json(result);

  } catch (error) {
    console.error('发布失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ============================================
 * YouTube 接口
 * ============================================
 */

/**
 * POST /api/browser/youtube/login
 * 打开浏览器让客户手动登录YouTube
 */
router.post('/youtube/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.json({
        success: false,
        error: '请提供邮箱参数：{ email: "your@email.com" }'
      });
    }

    console.log(`📱 正在为 ${email} 打开YouTube登录页面...`);
    
    const result = await youtube.openLoginPage(email);
    
    res.json(result);

  } catch (error) {
    console.error('登录失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/browser/youtube/status
 * 检查YouTube登录状态
 */
router.get('/youtube/status', async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.json({
      success: false,
      error: '请提供邮箱参数：?email=your@email.com'
    });
  }

  const status = await youtube.checkLogin(email);
  
  res.json({
    success: true,
    data: {
      platform: 'youtube',
      email,
      loggedIn: status.loggedIn,
      loginType: status.loginType,
      hasSession: status.hasSession,
      hasToken: status.hasToken,
      isTokenExpired: status.isTokenExpired,
      sessionPath: status.sessionPath,
      tokenPath: status.tokenPath,
      tokenInfo: status.tokenInfo,
      message: status.loggedIn 
        ? `已登录 (${status.loginType === 'token' ? 'Token' : 'Session'})` 
        : (status.isTokenExpired ? 'Token 已过期' : '未登录')
    }
  });
});

/**
 * POST /api/browser/youtube/login-cookies
 * 通过导入 Cookies 登录 YouTube（虚拟登录方式 B）
 */
router.post('/youtube/login-cookies', async (req, res) => {
  try {
    const { email, cookies } = req.body;
    
    if (!email || !cookies) {
      return res.json({
        success: false,
        error: '请提供邮箱和 cookies：{ email: "your@email.com", cookies: [...] }'
      });
    }

    console.log(`🍪 正在为 ${email} 导入 Cookies 登录...`);
    
    const result = await youtube.loginWithCookies(email, cookies);
    
    res.json(result);

  } catch (error) {
    console.error('Cookie 登录失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/youtube/login-token
 * 通过 Access Token 登录 YouTube（虚拟登录方式 C）
 */
router.post('/youtube/login-token', async (req, res) => {
  try {
    const { email, accessToken, refreshToken, expiresIn } = req.body;
    
    if (!email || !accessToken) {
      return res.json({
        success: false,
        error: '请提供邮箱和 accessToken：{ email: "your@email.com", accessToken: "..." }'
      });
    }

    console.log(`🔑 正在为 ${email} 使用 Token 登录...`);
    
    const result = await youtube.loginWithToken(email, { 
      accessToken, 
      refreshToken, 
      expiresIn 
    });
    
    res.json(result);

  } catch (error) {
    console.error('Token 登录失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/youtube/upload
 * 上传视频到YouTube
 */
router.post('/youtube/upload', async (req, res) => {
  try {
    const { email, videoPath, title, description, thumbnail } = req.body;

    if (!email || !videoPath || !title) {
      return res.json({
        success: false,
        error: '缺少必要参数：email, videoPath, title'
      });
    }

    const result = await youtube.uploadVideo({
      email,
      videoPath,
      title,
      description: description || '',
      thumbnail
    });

    res.json(result);

  } catch (error) {
    console.error('上传失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ============================================
 * 通用接口
 * ============================================
 */

/**
 * POST /api/browser/test-login
 * 测试登录状态（验证登录是否有效）
 */
router.post('/test-login', async (req, res) => {
  try {
    const { platform, email } = req.body;
    
    if (!platform || !email) {
      return res.json({
        success: false,
        error: '请提供 platform 和 email：{ platform: "youtube|tiktok", email: "your@email.com" }'
      });
    }

    console.log(`🧪 测试 ${platform} 登录状态: ${email}`);
    
    let result;
    if (platform === 'youtube') {
      result = await youtube.checkLogin(email);
    } else if (platform === 'tiktok') {
      result = await tiktok.checkLogin(email);
    } else {
      return res.json({
        success: false,
        error: '不支持的 platform，请使用 youtube 或 tiktok'
      });
    }

    res.json({
      success: true,
      data: {
        platform,
        email,
        loggedIn: result.loggedIn,
        loginType: result.loginType,
        hasSession: result.hasSession,
        hasToken: result.hasToken,
        isTokenExpired: result.isTokenExpired,
        message: result.loggedIn 
          ? `✅ 登录状态有效 (${result.loginType})` 
          : (result.isTokenExpired ? '⚠️ Token 已过期' : '❌ 未登录')
      }
    });

  } catch (error) {
    console.error('测试登录失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/test-publish
 * 测试发布功能（模拟发布，不实际操作）
 */
router.post('/test-publish', async (req, res) => {
  try {
    const { platform, email } = req.body;
    
    if (!platform || !email) {
      return res.json({
        success: false,
        error: '请提供 platform 和 email'
      });
    }

    console.log(`🧪 测试 ${platform} 发布功能: ${email}`);
    
    let loginStatus;
    if (platform === 'youtube') {
      loginStatus = await youtube.checkLogin(email);
    } else if (platform === 'tiktok') {
      loginStatus = await tiktok.checkLogin(email);
    } else {
      return res.json({
        success: false,
        error: '不支持的 platform'
      });
    }

    if (!loginStatus.loggedIn) {
      return res.json({
        success: false,
        error: '未登录，无法测试发布功能',
        needLogin: true,
        loginStatus
      });
    }

    res.json({
      success: true,
      message: '✅ 发布功能测试通过',
      data: {
        platform,
        email,
        loginType: loginStatus.loginType,
        canPublish: true,
        note: '登录状态有效，可以正常发布'
      }
    });

  } catch (error) {
    console.error('测试发布失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/close
 * 关闭所有浏览器
 */
router.post('/close', async (req, res) => {
  try {
    await tiktok.close();
    await youtube.close();
    await ozon.close();
    
    res.json({
      success: true,
      message: '所有浏览器已关闭'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/browser/list-sessions
 * 列出所有已保存的session
 */
router.get('/list-sessions', async (req, res) => {
  try {
    const files = fs.readdirSync(browserStateDir);
    const sessions = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const parts = f.replace('.json', '').split('-');
        const platform = parts[0];
        const email = parts.slice(1).join('-');
        return { platform, email, file: f };
      });

    res.json({
      success: true,
      data: {
        count: sessions.length,
        sessions
      }
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * ============================================
 * OZON 接口
 * ============================================
 */

/**
 * POST /api/browser/ozon/login
 * 打开浏览器让客户手动登录 OZON Seller Center
 */
router.post('/ozon/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({
        success: false,
        error: '请提供邮箱参数：{ email: "your@email.com" }'
      });
    }

    console.log(`📱 正在为 ${email} 打开 OZON Seller Center...`);

    const result = await ozon.openLoginPage(email);

    res.json(result);

  } catch (error) {
    console.error('登录失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/browser/ozon/status
 * 检查 OZON 登录状态
 */
router.get('/ozon/status', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.json({
      success: false,
      error: '请提供邮箱参数：?email=your@email.com'
    });
  }

  const status = await ozon.checkLogin(email);

  res.json({
    success: true,
    data: {
      platform: 'ozon',
      email,
      loggedIn: status.loggedIn,
      loginType: status.loginType,
      hasSession: status.hasSession,
      hasToken: status.hasToken,
      isTokenExpired: status.isTokenExpired,
      sessionPath: status.sessionPath,
      tokenPath: status.tokenPath,
      message: status.loggedIn
        ? `已登录 (${status.loginType === 'token' ? 'Token' : 'Cookies'})`
        : (status.isTokenExpired ? 'Token 已过期' : '未登录')
    }
  });
});

/**
 * POST /api/browser/ozon/publish
 * 发布产品到 OZON
 */
router.post('/ozon/publish', async (req, res) => {
  try {
    const { email, title, description, price, sku, images } = req.body;

    if (!email || !title) {
      return res.json({
        success: false,
        error: '缺少必要参数：email, title'
      });
    }

    const result = await ozon.publishProduct({
      email,
      title,
      description: description || '',
      price: parseFloat(price) || 0,
      sku,
      images
    });

    res.json(result);

  } catch (error) {
    console.error('发布失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/ozon/login-cookies
 * 通过导入 Cookies 登录 OZON
 */
router.post('/ozon/login-cookies', async (req, res) => {
  try {
    const { email, cookies } = req.body;

    if (!email || !cookies) {
      return res.json({
        success: false,
        error: '请提供邮箱和 cookies：{ email: "your@email.com", cookies: [...] }'
      });
    }

    const result = await ozon.loginWithCookies(email, cookies);

    res.json(result);

  } catch (error) {
    console.error('Cookie 登录失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/ozon/login-token
 * 通过 Access Token 登录 OZON
 */
router.post('/ozon/login-token', async (req, res) => {
  try {
    const { email, accessToken, refreshToken, expiresIn } = req.body;

    if (!email || !accessToken) {
      return res.json({
        success: false,
        error: '请提供邮箱和 accessToken：{ email: "your@email.com", accessToken: "..." }'
      });
    }

    const result = await ozon.loginWithToken(email, {
      accessToken,
      refreshToken,
      expiresIn
    });

    res.json(result);

  } catch (error) {
    console.error('Token 登录失败:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/browser/ozon/test-api
 * 通过 OZON API Key 测试账号连接（无需浏览器）
 * OZON API 文档: https://api-seller.ozon.ru/
 */
router.post('/ozon/test-api', async (req, res) => {
  try {
    const { clientId, apiKey } = req.body;

    if (!clientId || !apiKey) {
      return res.json({
        success: false,
        error: '请提供 clientId 和 apiKey：{ clientId: "...", apiKey: "..." }'
      });
    }

    // 动态导入 ozonApi（避免循环依赖）
    const { createOzonClient, getSellerInfo } = await import('../services/ozonApi.js');
    const client = createOzonClient(clientId, apiKey);

    console.log('🔍 正在测试 OZON API 连接...');
    const sellerInfo = await getSellerInfo(client);

    res.json({
      success: true,
      message: 'API 连接成功！',
      clientId,
      sellerInfo,
    });

  } catch (error) {
    console.error('OZON API 测试失败:', error.response?.data || error.message);
    res.json({
      success: false,
      error: error.response?.data?.message || error.message,
      hint: '请检查 Client-Id 和 Api-Key 是否正确，可在 OZON Seller Center > Settings > API 获取',
    });
  }
});

export default router;
