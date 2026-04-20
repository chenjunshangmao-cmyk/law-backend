/**
 * 浏览器自动化 API 路由 v3.0 (Phase 1 修复版)
 * 核心流程：客户手动登录 → 自动保存Session → 后续自动复用
 *
 * Phase 1 新增：
 * - accountId 支持（多账号不冲突）
 * - 系统状态检查 /api/browser/system-status
 * - Session 验证（检测是否过期）
 * - 环境自动检测（服务器 vs 本地）
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  TikTokShopAutomation,
  YouTubeAutomation,
  OzonAutomation,
  getBrowserSystemStatus,
} from '../services/browserAutomation.js';

const router = express.Router();

// 初始化自动化实例（全局复用）
const tiktok = new TikTokShopAutomation();
const youtube = new YouTubeAutomation();
const ozon = new OzonAutomation();

// 确保目录存在
const browserStateDir = path.join(process.cwd(), 'browser-states');
if (!fs.existsSync(browserStateDir)) {
  fs.mkdirSync(browserStateDir, { recursive: true });
}

// ============================================================
// 通用中间件：解析 accountId
// ============================================================

function parseAccountId(req, res, next) {
  req.accountId = req.body?.accountId || req.query?.accountId || req.headers['x-account-id'] || null;
  next();
}

// ============================================================
// TikTok Shop 接口
// ============================================================

/**
 * POST /api/browser/tiktok/login
 * 打开浏览器让客户手动登录 TikTok
 */
router.post('/tiktok/login', parseAccountId, async (req, res) => {
  try {
    const { email, accountId } = req.body;

    if (!email) {
      return res.json({
        success: false,
        error: '请提供邮箱参数：{ email: "your@email.com", accountId?: "optional" }',
      });
    }

    const systemInfo = getBrowserSystemStatus();
    console.log(`📱 TikTok 登录请求：${email}${accountId ? ` (accountId: ${accountId})` : ''}`);
    console.log(`   环境: ${systemInfo.environment}, headless: ${systemInfo.headless}`);

    const result = await tiktok.openLoginPage(email, accountId);

    if (systemInfo.environment === 'server') {
      return res.json({
        ...result,
        environment: 'server',
        note: '服务器环境，浏览器在后台运行，登录后请等待自动保存',
        nextStep: result.success
          ? '调用 GET /api/browser/tiktok/status?email=' + email + ' 确认登录状态'
          : '请重新尝试登录',
      });
    }

    res.json({
      ...result,
      note: '本地环境，浏览器窗口已打开，请手动登录后关闭窗口',
      nextStep: result.success
        ? '调用 GET /api/browser/tiktok/status?email=' + email + ' 确认登录状态'
        : '登录未完成，请重试',
    });

  } catch (error) {
    console.error('❌ TikTok 登录失败:', error);
    res.json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/browser/tiktok/status
 * 检查 TikTok 登录状态
 */
router.get('/tiktok/status', parseAccountId, async (req, res) => {
  try {
    const email = req.query.email;
    const accountId = req.accountId;

    if (!email) {
      return res.json({
        success: false,
        error: '请提供邮箱参数：?email=your@email.com',
      });
    }

    const status = await tiktok.checkLogin(email, accountId);
    const systemInfo = getBrowserSystemStatus();

    let message = '未登录';
    if (status.loggedIn) {
      if (status.sessionValid === true) {
        message = '已登录（Session有效）';
      } else if (status.sessionValid === false) {
        message = 'Session存在但已过期，请重新登录';
      } else {
        message = '已登录（未验证）';
      }
    }

    res.json({
      success: true,
      data: {
        platform: 'tiktok',
        email,
        accountId: accountId || null,
        ...status,
        message,
        system: systemInfo,
        instructions: {
          login: 'POST /api/browser/tiktok/login',
          publish: 'POST /api/browser/tiktok/publish',
        },
      },
    });

  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

/**
 * POST /api/browser/tiktok/publish
 * 发布产品到 TikTok Shop
 */
router.post('/tiktok/publish', parseAccountId, async (req, res) => {
  try {
    const { email, title, description, price, stock, images } = req.body;
    const accountId = req.accountId;

    if (!email || !title) {
      return res.json({
        success: false,
        error: '缺少必要参数：email, title',
        example: {
          email: 'user@example.com',
          title: 'Kids Fashion Dress Summer 2026',
          description: 'High quality summer dress',
          price: 19.99,
          stock: 100,
          images: ['./uploads/product1.jpg'],
        },
      });
    }

    const result = await tiktok.publishProduct({
      email,
      accountId,
      title,
      description: description || '',
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 100,
      images,
    });

    res.json({
      ...result,
      instructions: result.needLogin
        ? { login: 'POST /api/browser/tiktok/login', params: { email, accountId } }
        : null,
    });

  } catch (error) {
    console.error('❌ TikTok 发布失败:', error);
    res.json({ success: false, error: error.message });
  }
});

// ============================================================
// YouTube 接口
// ============================================================

/**
 * POST /api/browser/youtube/login
 */
router.post('/youtube/login', parseAccountId, async (req, res) => {
  try {
    const { email, accountId } = req.body;

    if (!email) {
      return res.json({
        success: false,
        error: '请提供邮箱参数：{ email: "your@email.com" }',
      });
    }

    const systemInfo = getBrowserSystemStatus();
    const result = await youtube.openLoginPage(email, accountId);

    if (systemInfo.environment === 'server') {
      return res.json({
        ...result,
        environment: 'server',
        note: '服务器环境，浏览器在后台运行',
        nextStep: result.success
          ? 'GET /api/browser/youtube/status?email=' + email
          : '请重新尝试登录',
      });
    }

    res.json({
      ...result,
      note: '本地环境，浏览器窗口已打开，请手动登录后关闭窗口',
    });

  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

/**
 * GET /api/browser/youtube/status
 */
router.get('/youtube/status', parseAccountId, async (req, res) => {
  try {
    const email = req.query.email;
    const accountId = req.accountId;

    if (!email) {
      return res.json({ success: false, error: '请提供 email 参数' });
    }

    const status = await youtube.checkLogin(email, accountId);
    const systemInfo = getBrowserSystemStatus();

    res.json({
      success: true,
      data: {
        platform: 'youtube',
        email,
        accountId: accountId || null,
        ...status,
        message: status.loggedIn ? '已登录' : '未登录',
        system: systemInfo,
        instructions: {
          login: 'POST /api/browser/youtube/login',
          upload: 'POST /api/browser/youtube/upload',
        },
      },
    });

  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

/**
 * POST /api/browser/youtube/upload
 */
router.post('/youtube/upload', parseAccountId, async (req, res) => {
  try {
    const { email, videoPath, title, description, thumbnail, privacy } = req.body;
    const accountId = req.accountId;

    if (!email || !videoPath || !title) {
      return res.json({
        success: false,
        error: '缺少必要参数：email, videoPath, title',
        example: {
          email: 'user@example.com',
          videoPath: '/app/videos/product_intro.mp4',
          title: 'Kids Fashion Summer 2026',
          description: 'New arrivals',
          privacy: 'public',
        },
      });
    }

    const result = await youtube.uploadVideo({
      email,
      accountId,
      videoPath,
      title,
      description: description || '',
      thumbnail,
      privacy: privacy || 'public',
    });

    res.json({
      ...result,
      instructions: result.needLogin
        ? { login: 'POST /api/browser/youtube/login', params: { email, accountId } }
        : null,
    });

  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ============================================================
// OZON 接口
// ============================================================

router.post('/ozon/login', parseAccountId, async (req, res) => {
  try {
    const { email, accountId } = req.body;
    if (!email) return res.json({ success: false, error: '缺少 email 参数' });

    const result = await ozon.openLoginPage(email, accountId);
    res.json(result);
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

router.get('/ozon/status', parseAccountId, async (req, res) => {
  try {
    const email = req.query.email;
    const accountId = req.accountId;
    if (!email) return res.json({ success: false, error: '缺少 email 参数' });

    const status = await ozon.checkLogin(email, accountId);
    res.json({ success: true, data: { ...status, message: status.loggedIn ? '已登录' : '未登录' } });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ============================================================
// 通用接口
// ============================================================

/**
 * GET /api/browser/system-status
 * Phase 1 新增：获取浏览器自动化系统状态
 */
router.get('/system-status', async (req, res) => {
  try {
    const systemStatus = getBrowserSystemStatus();

    let sessions = [];
    try {
      const files = fs.readdirSync(browserStateDir);
      sessions = files
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const fullPath = path.join(browserStateDir, f);
          const stat = fs.statSync(fullPath);
          const parts = f.replace('.json', '').split('-');
          const platform = parts[0];
          const email = parts.slice(1).join('-');
          return {
            file: f,
            platform,
            email,
            size: stat.size,
            modified: stat.mtime.toISOString(),
            age: Math.floor((Date.now() - stat.mtime.getTime()) / 1000 / 60) + ' 分钟前',
          };
        });
    } catch (e) {}

    res.json({
      success: true,
      data: {
        system: systemStatus,
        sessions: { count: sessions.length, files: sessions },
        endpoints: {
          tiktok: {
            login: 'POST /api/browser/tiktok/login { email, accountId? }',
            status: 'GET /api/browser/tiktok/status?email=&accountId=',
            publish: 'POST /api/browser/tiktok/publish { email, title, description?, price?, stock?, images? }',
          },
          youtube: {
            login: 'POST /api/browser/youtube/login { email, accountId? }',
            status: 'GET /api/browser/youtube/status?email=&accountId=',
            upload: 'POST /api/browser/youtube/upload { email, videoPath, title, description?, thumbnail?, privacy? }',
          },
          ozon: {
            login: 'POST /api/browser/ozon/login { email, accountId? }',
            status: 'GET /api/browser/ozon/status?email=',
          },
        },
      },
    });

  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

/**
 * POST /api/browser/close
 * 关闭所有浏览器
 */
router.post('/close', async (req, res) => {
  try {
    await Promise.all([
      tiktok.close().catch(() => {}),
      youtube.close().catch(() => {}),
      ozon.close().catch(() => {}),
    ]);
    res.json({ success: true, message: '所有浏览器实例已关闭' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

/**
 * GET /api/browser/list-sessions
 * 列出所有已保存的 session
 */
router.get('/list-sessions', async (req, res) => {
  try {
    const files = fs.readdirSync(browserStateDir);
    const sessions = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const fullPath = path.join(browserStateDir, f);
        const stat = fs.statSync(fullPath);
        const parts = f.replace('.json', '').split('-');
        const platform = parts[0];
        const email = parts.slice(1).join('-');
        return { platform, email, file: f, size: stat.size, modified: stat.mtime.toISOString() };
      });

    res.json({ success: true, data: { count: sessions.length, sessions } });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/browser/session
 * 删除指定 session
 */
router.delete('/session', async (req, res) => {
  try {
    const { email, platform, accountId } = req.query;
    if (!email || !platform) {
      return res.json({ success: false, error: '请提供 platform 和 email 参数' });
    }

    const fileName = accountId
      ? `${platform}-${email}-${accountId}.json`
      : `${platform}-${email}.json`;

    const sessionPath = path.join(browserStateDir, fileName);

    if (!fs.existsSync(sessionPath)) {
      return res.json({ success: false, error: 'Session 文件不存在' });
    }

    fs.unlinkSync(sessionPath);
    res.json({ success: true, message: `已删除 Session: ${fileName}` });

  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

export default router;
