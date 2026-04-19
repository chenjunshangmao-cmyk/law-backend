/**
 * 平台账号管理 API - 集成版
 * 统一账号管理 + 浏览器登录状态
 *
 * 核心功能：
 * 1. 账号 CRUD（来自数据库）
 * 2. 浏览器登录状态实时查询
 * 3. 一键登录（触发浏览器自动化）
 * 4. 账号仪表盘（汇总所有平台状态）
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  getAccountsByUser,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount
} from '../services/dbService.js';
import { authenticateToken } from '../middleware/auth.js';
import { TikTokShopAutomation, YouTubeAutomation, OzonAutomation } from '../services/browserAutomation.js';

const router = express.Router();

// 初始化浏览器自动化实例
const tiktok = new TikTokShopAutomation();
const youtube = new YouTubeAutomation();
const ozon = new OzonAutomation();

// 浏览器状态目录
const browserStateDir = path.join(process.cwd(), 'browser-states');
if (!fs.existsSync(browserStateDir)) {
  fs.mkdirSync(browserStateDir, { recursive: true });
}

// 平台映射：平台名 → 自动化实例
const platformAutomation = {
  tiktok,
  youtube,
  ozon,
};

// ============================================================
// 辅助函数
// ============================================================

/**
 * 获取浏览器 session 文件路径
 */
function getSessionPath(platform, userId) {
  return path.join(browserStateDir, `${platform}_${userId}.json`);
}

/**
 * 检查浏览器登录状态（异步，不阻塞）
 */
async function checkBrowserLogin(platform, userId) {
  try {
    const automation = platformAutomation[platform];
    if (!automation) {
      return { loggedIn: false, loginType: null, error: `${platform} 暂不支持` };
    }

    const sessionPath = getSessionPath(platform, userId);
    const hasSession = fs.existsSync(sessionPath);

    if (!hasSession) {
      return { loggedIn: false, loginType: null, hasSession: false };
    }

    // 使用 checkLogin 方法验证
    // 由于 checkLogin 需要 email，我们用 sessionPath 直接检查
    const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    const hasCookies = sessionData.cookies && sessionData.cookies.length > 0;
    const hasLocalStorage = sessionData.origins && sessionData.origins.some(
      o => o.localStorage && o.localStorage.length > 0
    );

    if (hasCookies || hasLocalStorage) {
      return {
        loggedIn: true,
        loginType: hasCookies ? 'cookies' : 'session',
        hasSession: true,
        sessionPath,
        sessionAge: Date.now() - (sessionData._savedAt || Date.now())
      };
    }

    return { loggedIn: false, loginType: null, hasSession: false };
  } catch (error) {
    return { loggedIn: false, loginType: null, error: error.message };
  }
}

/**
 * 获取账号的浏览器 session 状态（兼容旧格式：使用 username/email 作为 key）
 */
async function checkBrowserLoginByEmail(platform, email) {
  try {
    const automation = platformAutomation[platform];
    if (!automation) {
      return { loggedIn: false, loginType: null, error: `${platform} 暂不支持` };
    }
    return await automation.checkLogin(email);
  } catch (error) {
    return { loggedIn: false, loginType: null, error: error.message };
  }
}

// ============================================================
// 中间件
// ============================================================

router.use(authenticateToken);

// 速率限制（每分钟 30 请求）
const ACCOUNT_RATELIMIT = 30;
const requestCounts = new Map();

function rateLimit(req, res, next) {
  const key = req.userId;
  const now = Date.now();
  const record = requestCounts.get(key) || { count: 0, resetAt: now + 60000 };

  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + 60000;
  }

  if (record.count >= ACCOUNT_RATELIMIT) {
    return res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试'
    });
  }

  record.count++;
  requestCounts.set(key, record);
  next();
}

router.use(rateLimit);

// ============================================================
// 账号管理（CRUD）
// ============================================================

/**
 * GET /api/platform-accounts
 * 获取当前用户的全部账号 + 实时浏览器登录状态
 *
 * 查询参数：
 *   platform - 可选，筛选平台（如 tiktok/youtube）
 *   status   - 可选，筛选状态（logged_in / logged_out / error）
 *
 * 响应数据示例：
 * {
 *   "success": true,
 *   "data": {
 *     "accounts": [
 *       {
 *         "id": "uuid",
 *         "platform": "tiktok",
 *         "name": "我的TikTok店",
 *         "username": "seller@example.com",
 *         "status": "logged_in",
 *         "loginType": "cookies",
 *         "browserStatus": { "loggedIn": true, "loginType": "cookies" },
 *         "lastLoginAt": "2026-04-19T10:00:00Z",
 *         "createdAt": "2026-04-10T00:00:00Z"
 *       }
 *     ],
 *     "summary": {
 *       "total": 4,
 *       "logged_in": 2,
 *       "logged_out": 1,
 *       "error": 1
 *     }
 *   }
 * }
 */
router.get('/', async (req, res) => {
  try {
    const { platform, status } = req.query;
    const accounts = await getAccountsByUser(req.userId);

    // 并行检查所有账号的浏览器登录状态
    const accountsWithStatus = await Promise.all(
      accounts.map(async (account) => {
        const accountData = account.toJSON ? account.toJSON() : account;

        // 跳过非浏览器平台
        if (!platformAutomation[accountData.platform]) {
          return {
            ...accountData,
            credentials: undefined,
            cookies: undefined,
            status: 'not_supported',
            browserStatus: null,
            message: `${accountData.platform} 暂不支持浏览器自动化`
          };
        }

        // 使用 username 或 name 作为邮箱查询
        const email = accountData.username || accountData.name || req.userId;
        const browserStatus = await checkBrowserLoginByEmail(accountData.platform, email);

        const loggedIn = browserStatus.loggedIn || false;
        const accountStatus = browserStatus.error ? 'error' : (loggedIn ? 'logged_in' : 'logged_out');

        return {
          id: accountData.id,
          platform: accountData.platform,
          name: accountData.name,
          username: accountData.username,
          status: accountStatus,
          loginType: browserStatus.loginType || null,
          browserStatus: {
            loggedIn: browserStatus.loggedIn || false,
            loginType: browserStatus.loginType || null,
            hasSession: browserStatus.hasSession || false,
            hasToken: browserStatus.hasToken || false,
            isTokenExpired: browserStatus.isTokenExpired || false,
            error: browserStatus.error || null,
            sessionPath: browserStatus.sessionPath || null
          },
          lastLoginAt: browserStatus.sessionAge
            ? new Date(Date.now() - browserStatus.sessionAge).toISOString()
            : null,
          createdAt: accountData.created_at || accountData.createdAt,
          updatedAt: accountData.updated_at || accountData.updatedAt
        };
      })
    );

    // 过滤
    let filtered = accountsWithStatus;
    if (platform) {
      filtered = filtered.filter(a => a.platform === platform);
    }
    if (status) {
      filtered = filtered.filter(a => a.status === status);
    }

    // 汇总统计
    const summary = {
      total: filtered.length,
      logged_in: filtered.filter(a => a.status === 'logged_in').length,
      logged_out: filtered.filter(a => a.status === 'logged_out').length,
      error: filtered.filter(a => a.status === 'error').length,
      not_supported: filtered.filter(a => a.status === 'not_supported').length
    };

    res.json({
      success: true,
      data: {
        accounts: filtered,
        summary
      }
    });

  } catch (error) {
    console.error('获取平台账号失败:', error);
    res.status(500).json({ success: false, error: '获取账号列表失败' });
  }
});

/**
 * GET /api/platform-accounts/dashboard
 * 账号仪表盘：简洁的跨平台状态概览
 *
 * 响应数据：
 * {
 *   "success": true,
 *   "data": {
 *     "platforms": [
 *       {
 *         "platform": "tiktok",
 *         "displayName": "TikTok Shop",
 *         "total": 2,
 *         "loggedIn": 1,
 *         "loggedOut": 1,
 *         "status": "partial"  // all / partial / all_offline / not_supported
 *       }
 *     ],
 *     "overall": {
 *       "totalAccounts": 4,
 *       "totalLoggedIn": 2,
 *       "totalLoggedOut": 2
 *     }
 *   }
 * }
 */
router.get('/dashboard', async (req, res) => {
  try {
    const accounts = await getAccountsByUser(req.userId);

    // 按平台分组
    const platformGroups = {};
    for (const account of accounts) {
      const data = account.toJSON ? account.toJSON() : account;
      if (!platformGroups[data.platform]) {
        platformGroups[data.platform] = [];
      }
      platformGroups[data.platform].push(data);
    }

    const platformSummary = await Promise.all(
      Object.entries(platformGroups).map(async ([platform, platformAccounts]) => {
        const results = await Promise.all(
          platformAccounts.map(async (acc) => {
            const email = acc.username || acc.name || req.userId;
            return await checkBrowserLoginByEmail(platform, email);
          })
        );

        const loggedIn = results.filter(r => r.loggedIn).length;
        const loggedOut = results.filter(r => !r.loggedIn && !r.error).length;
        const errors = results.filter(r => r.error).length;

        let status = 'not_supported';
        if (platformAutomation[platform]) {
          if (loggedIn === platformAccounts.length && errors === 0) {
            status = 'all';
          } else if (loggedIn === 0 && loggedOut === platformAccounts.length) {
            status = 'all_offline';
          } else if (loggedIn > 0 && loggedOut === 0 && errors === 0) {
            status = 'all';
          } else {
            status = 'partial';
          }
        }

        return {
          platform,
          displayName: {
            tiktok: 'TikTok Shop',
            youtube: 'YouTube Studio',
            ozon: 'OZON',
            amazon: 'Amazon Seller',
            shopee: 'Shopee',
            lazada: 'Lazada'
          }[platform] || platform,
          total: platformAccounts.length,
          loggedIn,
          loggedOut,
          errors,
          status
        };
      })
    );

    const overall = {
      totalAccounts: accounts.length,
      totalLoggedIn: platformSummary.reduce((sum, p) => sum + p.loggedIn, 0),
      totalLoggedOut: platformSummary.reduce((sum, p) => sum + p.loggedOut, 0)
    };

    res.json({
      success: true,
      data: {
        platforms: platformSummary,
        overall
      }
    });

  } catch (error) {
    console.error('获取仪表盘失败:', error);
    res.status(500).json({ success: false, error: '获取仪表盘失败' });
  }
});

/**
 * POST /api/platform-accounts
 * 添加平台账号
 *
 * 请求体：
 * {
 *   "platform": "tiktok",       // 必填：tiktok/youtube/ozon/amazon/shopee/lazada
 *   "name": "我的TikTok店",     // 必填：账号名称（用于显示）
 *   "username": "seller@...",  // 可选：登录邮箱/用户名
 *   "settings": {}             // 可选：自定义设置
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { platform, name, username, settings } = req.body;

    // 验证必填字段
    if (!platform || !name) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：platform 和 name'
      });
    }

    // 验证平台
    const validPlatforms = ['tiktok', 'youtube', 'ozon', 'amazon', 'shopee', 'lazada', '1688', 'taobao', 'pdd'];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `不支持的平台: ${platform}，支持的平台: ${validPlatforms.join(', ')}`
      });
    }

    // 检查是否支持浏览器自动化
    const supportsBrowser = !!platformAutomation[platform.toLowerCase()];

    const newAccount = await createAccount({
      userId: req.userId,
      platform: platform.toLowerCase(),
      name,
      username: username || null,
      credentials: null,
      settings: {
        ...settings,
        supportsBrowser
      },
      status: 'active'
    });

    const accountData = newAccount.toJSON ? newAccount.toJSON() : newAccount;

    res.status(201).json({
      success: true,
      data: {
        id: accountData.id,
        platform: accountData.platform,
        name: accountData.name,
        username: accountData.username,
        status: 'logged_out',
        supportsBrowser,
        browserStatus: null,
        createdAt: accountData.created_at || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('添加账号失败:', error);
    res.status(500).json({ success: false, error: '添加账号失败' });
  }
});

/**
 * DELETE /api/platform-accounts/:id
 * 删除平台账号（同时清理浏览器 session）
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 获取账号信息
    const account = await getAccountById(id);
    if (!account) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }

    const accountData = account.toJSON ? account.toJSON() : account;

    // 验证所属用户
    if (accountData.user_id !== req.userId && accountData.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权限删除此账号' });
    }

    // 清理浏览器 session
    const email = accountData.username || accountData.name || req.userId;
    const sessionPath = getSessionPath(accountData.platform, email.replace(/[^a-zA-Z0-9]/g, '_'));
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
    }

    // 删除数据库记录
    await deleteAccount(id);

    res.json({
      success: true,
      message: '账号已删除，浏览器 session 已清理'
    });

  } catch (error) {
    console.error('删除账号失败:', error);
    res.status(500).json({ success: false, error: '删除账号失败' });
  }
});

// ============================================================
// 浏览器操作（登录/登出/状态）
// ============================================================

/**
 * GET /api/platform-accounts/:id/status
 * 查询指定账号的实时浏览器登录状态
 */
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    const account = await getAccountById(id);
    if (!account) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }

    const accountData = account.toJSON ? account.toJSON() : account;

    if (accountData.user_id !== req.userId && accountData.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权限查看此账号' });
    }

    if (!platformAutomation[accountData.platform]) {
      return res.json({
        success: true,
        data: {
          id: accountData.id,
          platform: accountData.platform,
          name: accountData.name,
          status: 'not_supported',
          message: `${accountData.platform} 暂不支持浏览器自动化`
        }
      });
    }

    const email = accountData.username || accountData.name || req.userId;
    const browserStatus = await checkBrowserLoginByEmail(accountData.platform, email);

    const loggedIn = browserStatus.loggedIn || false;
    const accountStatus = browserStatus.error ? 'error' : (loggedIn ? 'logged_in' : 'logged_out');

    res.json({
      success: true,
      data: {
        id: accountData.id,
        platform: accountData.platform,
        name: accountData.name,
        username: accountData.username,
        status: accountStatus,
        loginType: browserStatus.loginType || null,
        browserStatus,
        sessionPath: browserStatus.sessionPath || null,
        message: loggedIn
          ? `已登录 (${browserStatus.loginType === 'token' ? 'Token' : browserStatus.loginType === 'cookies' ? 'Cookies' : 'Session'})`
          : (browserStatus.error ? `错误: ${browserStatus.error}` : '未登录')
      }
    });

  } catch (error) {
    console.error('查询状态失败:', error);
    res.status(500).json({ success: false, error: '查询状态失败' });
  }
});

/**
 * POST /api/platform-accounts/:id/login
 * 触发浏览器登录（打开真实浏览器让用户手动登录）
 *
 * 响应：
 * - 立即返回 { success: true, message: "浏览器已打开，请手动登录" }
 * - 用户完成登录后关闭窗口，session 自动保存
 */
router.post('/:id/login', async (req, res) => {
  try {
    const { id } = req.params;

    const account = await getAccountById(id);
    if (!account) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }

    const accountData = account.toJSON ? account.toJSON() : account;

    if (accountData.user_id !== req.userId && accountData.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权限操作此账号' });
    }

    const platform = accountData.platform.toLowerCase();
    const automation = platformAutomation[platform];

    if (!automation) {
      return res.status(400).json({
        success: false,
        error: `${platform} 暂不支持浏览器自动化登录`
      });
    }

    // 使用 username 或 name 作为 email key
    const email = accountData.username || accountData.name || `${platform}_${accountData.id}@user`;

    console.log(`🔑 触发 ${platform} 浏览器登录: ${email}`);

    // 异步启动登录（不等待用户完成）
    // 用户在浏览器中完成登录后，openLoginPage 会自动保存 session
    automation.openLoginPage(email).catch(err => {
      console.error(`❌ ${platform} 登录失败:`, err.message);
    });

    // 立即返回，用户可在另一端调用 status 接口查询进度
    const loginUrl = automation.loginUrl;

    res.json({
      success: true,
      message: `✅ 浏览器已打开，请在弹出的窗口中完成 ${platform} 账号登录，登录成功后关闭浏览器窗口即可`,
      accountId: id,
      platform,
      email,
      loginUrl,
      tip: '关闭浏览器窗口后，系统会自动保存登录状态，下次无需重新登录',
      statusCheckUrl: `/api/platform-accounts/${id}/status`
    });

  } catch (error) {
    console.error('触发登录失败:', error);
    res.status(500).json({ success: false, error: '触发登录失败: ' + error.message });
  }
});

/**
 * POST /api/platform-accounts/:id/logout
 * 登出平台账号（清理浏览器 session）
 */
router.post('/:id/logout', async (req, res) => {
  try {
    const { id } = req.params;

    const account = await getAccountById(id);
    if (!account) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }

    const accountData = account.toJSON ? account.toJSON() : account;

    if (accountData.user_id !== req.userId && accountData.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权限操作此账号' });
    }

    const email = accountData.username || accountData.name || `${accountData.platform}_${accountData.id}@user`;
    const automation = platformAutomation[accountData.platform.toLowerCase()];

    if (automation) {
      await automation.logout(email);
    }

    res.json({
      success: true,
      message: '已登出，浏览器 session 已清理'
    });

  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json({ success: false, error: '登出失败' });
  }
});

// ============================================================
// 导出路由
// ============================================================

export default router;
