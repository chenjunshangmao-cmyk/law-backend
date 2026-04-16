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
 * 打开浏览器让客户手动登录TikTok
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
      sessionPath: status.sessionPath,
      message: status.loggedIn ? '已登录' : '未登录'
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
      sessionPath: status.sessionPath,
      message: status.loggedIn ? '已登录' : '未登录'
    }
  });
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
 * OZON 接口
 * ============================================
 */

/**
 * POST /api/browser/ozon/login
 * 打开浏览器让客户手动登录OZON
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

    console.log(`📱 正在为 ${email} 打开OZON登录页面...`);
    
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
 * 检查OZON登录状态
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
      sessionPath: status.sessionPath,
      message: status.loggedIn ? '已登录' : '未登录'
    }
  });
});

/**
 * ============================================
 * 通用接口
 * ============================================
 */

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
        const [platform, email] = f.replace('.json', '').split('-');
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

export default router;
