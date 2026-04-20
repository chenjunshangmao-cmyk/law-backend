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
import { getAccountById, updateAccount, getProxyById } from '../services/dbService.js';
import { authenticateToken } from '../middleware/auth.js';

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

    // 读取账号绑定的代理配置（per-account 代理）
    let proxyConfig = null;
    if (accountId) {
      const account = await getAccountById(accountId);
      if (account && account.proxy_id) {
        const proxy = await getProxyById(account.proxy_id);
        if (proxy && proxy.is_active) {
          proxyConfig = {
            protocol: proxy.protocol,
            host: proxy.host,
            port: proxy.port,
            username: proxy.username,
            password: proxy.password,
          };
          console.log(`🌐 使用账号代理: ${proxy.protocol}://${proxy.host}:${proxy.port}`);
        }
      }
    }

    const systemInfo = getBrowserSystemStatus();
    console.log(`📱 TikTok 登录请求：${email}${accountId ? ` (accountId: ${accountId})` : ''}`);
    console.log(`   环境: ${systemInfo.environment}, headless: ${systemInfo.headless}`);

    const result = await tiktok.openLoginPage(email, accountId, proxyConfig);

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

    // 读取账号绑定的代理配置
    let proxyConfig = null;
    if (accountId) {
      const account = await getAccountById(accountId);
      if (account && account.proxy_id) {
        const proxy = await getProxyById(account.proxy_id);
        if (proxy && proxy.is_active) {
          proxyConfig = { protocol: proxy.protocol, host: proxy.host, port: proxy.port, username: proxy.username, password: proxy.password };
        }
      }
    }

    const result = await tiktok.publishProduct({
      email,
      accountId,
      proxyConfig,
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

    // 读取账号绑定的代理配置
    let proxyConfig = null;
    if (accountId) {
      const account = await getAccountById(accountId);
      if (account && account.proxy_id) {
        const proxy = await getProxyById(account.proxy_id);
        if (proxy && proxy.is_active) {
          proxyConfig = { protocol: proxy.protocol, host: proxy.host, port: proxy.port, username: proxy.username, password: proxy.password };
        }
      }
    }

    const systemInfo = getBrowserSystemStatus();
    const result = await youtube.openLoginPage(email, accountId, proxyConfig);

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

    // 读取账号绑定的代理配置
    let proxyConfig = null;
    if (accountId) {
      const account = await getAccountById(accountId);
      if (account && account.proxy_id) {
        const proxy = await getProxyById(account.proxy_id);
        if (proxy && proxy.is_active) {
          proxyConfig = { protocol: proxy.protocol, host: proxy.host, port: proxy.port, username: proxy.username, password: proxy.password };
        }
      }
    }

    const result = await youtube.uploadVideo({
      email,
      accountId,
      proxyConfig,
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

    // 读取账号绑定的代理配置
    let proxyConfig = null;
    if (accountId) {
      const account = await getAccountById(accountId);
      if (account && account.proxy_id) {
        const proxy = await getProxyById(account.proxy_id);
        if (proxy && proxy.is_active) {
          proxyConfig = { protocol: proxy.protocol, host: proxy.host, port: proxy.port, username: proxy.username, password: proxy.password };
        }
      }
    }

    const result = await ozon.openLoginPage(email, accountId, proxyConfig);
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

// ============================================================
// 账号代理绑定接口
// ============================================================

/**
 * GET /api/browser/tiktok/account/:id
 * 获取账号信息（含 proxyId）
 */
router.get('/tiktok/account/:id', authenticateToken, async (req, res) => {
  try {
    const account = await getAccountById(req.params.id);
    if (!account) return res.status(404).json({ success: false, error: '账号不存在' });
    if (account.user_id !== req.user.userId) return res.status(403).json({ success: false, error: '无权访问' });

    let proxy = null;
    if (account.proxy_id) {
      proxy = await getProxyById(account.proxy_id);
    }

    res.json({
      success: true,
      data: {
        id: account.id,
        user_id: account.user_id,
        platform: account.platform,
        name: account.name,
        username: account.username,
        status: account.status,
        proxy_id: account.proxy_id || null,
        proxy: proxy ? {
          id: proxy.id,
          name: proxy.name,
          protocol: proxy.protocol,
          host: proxy.host,
          port: proxy.port,
          is_active: proxy.is_active,
        } : null,
        created_at: account.created_at,
        updated_at: account.updated_at,
      },
    });
  } catch (error) {
    console.error('获取账号信息失败:', error);
    res.status(500).json({ success: false, error: '获取账号信息失败' });
  }
});

/**
 * PUT /api/browser/tiktok/account/:id/proxy
 * 给账号绑定/解绑代理
 * body: { proxyId: string | null }
 */
router.put('/tiktok/account/:id/proxy', authenticateToken, async (req, res) => {
  try {
    const { proxyId } = req.body;
    const account = await getAccountById(req.params.id);
    if (!account) return res.status(404).json({ success: false, error: '账号不存在' });
    if (account.user_id !== req.user.userId) return res.status(403).json({ success: false, error: '无权访问' });

    // 验证 proxyId 合法性（null表示解除绑定）
    if (proxyId !== null) {
      const proxy = await getProxyById(proxyId);
      if (!proxy) return res.status(404).json({ success: false, error: '代理不存在' });
      if (proxy.user_id !== req.user.userId) return res.status(403).json({ success: false, error: '无权使用此代理' });
      if (!proxy.is_active) return res.status(400).json({ success: false, error: '代理已禁用，请先启用' });
    }

    await updateAccount(req.params.id, { proxy_id: proxyId || null });

    res.json({
      success: true,
      message: proxyId ? '代理绑定成功' : '代理已解除',
    });
  } catch (error) {
    console.error('绑定代理失败:', error);
    res.status(500).json({ success: false, error: '绑定代理失败' });
  }
});

/**
 * GET /api/browser/youtube/account/:id
 * 获取 YouTube 账号信息（含 proxyId）
 */
router.get('/youtube/account/:id', authenticateToken, async (req, res) => {
  try {
    const account = await getAccountById(req.params.id);
    if (!account) return res.status(404).json({ success: false, error: '账号不存在' });
    if (account.user_id !== req.user.userId) return res.status(403).json({ success: false, error: '无权访问' });

    let proxy = null;
    if (account.proxy_id) {
      proxy = await getProxyById(account.proxy_id);
    }

    res.json({
      success: true,
      data: {
        id: account.id,
        user_id: account.user_id,
        platform: account.platform,
        name: account.name,
        username: account.username,
        status: account.status,
        proxy_id: account.proxy_id || null,
        proxy: proxy ? { id: proxy.id, name: proxy.name, protocol: proxy.protocol, host: proxy.host, port: proxy.port, is_active: proxy.is_active } : null,
        created_at: account.created_at,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取账号信息失败' });
  }
});

/**
 * PUT /api/browser/youtube/account/:id/proxy
 * YouTube 账号绑定代理
 */
router.put('/youtube/account/:id/proxy', authenticateToken, async (req, res) => {
  try {
    const { proxyId } = req.body;
    const account = await getAccountById(req.params.id);
    if (!account) return res.status(404).json({ success: false, error: '账号不存在' });
    if (account.user_id !== req.user.userId) return res.status(403).json({ success: false, error: '无权访问' });

    if (proxyId !== null) {
      const proxy = await getProxyById(proxyId);
      if (!proxy) return res.status(404).json({ success: false, error: '代理不存在' });
      if (proxy.user_id !== req.user.userId) return res.status(403).json({ success: false, error: '无权使用此代理' });
      if (!proxy.is_active) return res.status(400).json({ success: false, error: '代理已禁用' });
    }

    await updateAccount(req.params.id, { proxy_id: proxyId || null });
    res.json({ success: true, message: proxyId ? '代理绑定成功' : '代理已解除' });
  } catch (error) {
    res.status(500).json({ success: false, error: '绑定代理失败' });
  }
});
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
