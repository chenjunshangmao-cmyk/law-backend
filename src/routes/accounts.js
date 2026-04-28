/**
 * 账号管理 API
 * 管理用户的平台账号（OZON/Amazon/TikTok等）
 * 存储在后端的 PostgreSQL（线上）或 JSON 文件（本地）
 */

import express from 'express';
import crypto from 'crypto';
import { generateId } from '../services/dataStore.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  getAccountsByUser, getAllAccounts, getAccountById,
  createAccount, updateAccount, deleteAccount, initAccountsTable
} from '../services/accountsDb.js';
import { getXiaohongshuInstance } from '../services/xiaohongshuAutomation.js';

const router = express.Router();

// 支持的平台列表
const PLATFORMS = ['1688', 'amazon', 'tiktok', 'ozon', 'lazada', 'shopee', 'youtube', 'xiaohongshu'];

/**
 * 加密函数
 */
function encrypt(text) {
  if (!text) return '';
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.JWT_SECRET || 'claw-secret-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * 解密函数
 */
function decrypt(text) {
  if (!text) return '';
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.JWT_SECRET || 'claw-secret-key', 'salt', 32);
    const parts = text.split(':');
    if (parts.length !== 2) return text; // 未加密直接返回
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return text;
  }
}

/**
 * 脱敏显示
 */
function sanitize(account) {
  if (!account) return account;
  const obj = { ...account };
  if (obj.client_id) obj.client_id = obj.client_id.substring(0, 8) + '***';
  if (obj.api_key) obj.api_key = '***' + obj.api_key.slice(-4);
  if (obj.api_secret) obj.api_secret = '***';
  if (obj.password) obj.password = '***';
  if (obj.credentials) obj.credentials = '***';
  return obj;
}

/**
 * GET /api/accounts
 * 获取用户账号列表
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accounts = await getAccountsByUser(req.user.userId);
    res.json({ success: true, data: accounts.map(sanitize) });
  } catch (error) {
    console.error('获取账号列表失败:', error);
    res.status(500).json({ success: false, error: '获取账号列表失败' });
  }
});

/**
 * POST /api/accounts
 * 添加平台账号
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { platform, name, username, credentials, clientId, apiKey, apiSecret, email, password } = req.body;

    if (!platform || !name) {
      return res.status(400).json({ success: false, error: '缺少必填字段：platform 和 name' });
    }

    if (!PLATFORMS.includes(platform.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `不支持的平台: ${platform}，支持的平台: ${PLATFORMS.join(', ')}`
      });
    }

    // 支持来自 credentials 的敏感信息
    const safeEmail = credentials?.email || email || '';
    const safePassword = credentials?.password || password || '';
    const safeClientId = clientId || credentials?.clientId || '';
    const safeApiKey = apiKey || credentials?.apiKey || '';
    const safeApiSecret = apiSecret || credentials?.apiSecret || '';

    const newAccount = {
      id: generateId(),
      user_id: req.user.userId,
      platform: platform.toLowerCase(),
      name,
      username: username || '',
      email: encrypt(safeEmail),
      password: encrypt(safePassword),
      client_id: encrypt(safeClientId),
      api_key: encrypt(safeApiKey),
      api_secret: encrypt(safeApiSecret),
      status: 'active',
      credentials: credentials ? { masked: true } : null
    };

    const saved = await createAccount(newAccount);
    res.status(201).json({ success: true, data: sanitize(saved) });
  } catch (error) {
    console.error('添加账号失败:', error);
    res.status(500).json({ success: false, error: '添加账号失败: ' + error.message });
  }
});

/**
 * GET /api/accounts/:id
 * 获取单个账号详情
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const account = await getAccountById(req.params.id, req.user.userId);
    if (!account) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    res.json({ success: true, data: sanitize(account) });
  } catch (error) {
    console.error('获取账号详情失败:', error);
    res.status(500).json({ success: false, error: '获取账号详情失败' });
  }
});

/**
 * PUT /api/accounts/:id
 * 更新账号
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { platform, name, apiKey, apiSecret, status } = req.body;
    const updates = {};
    if (platform) updates.platform = platform.toLowerCase();
    if (name) updates.name = name;
    if (apiKey) updates.api_key = encrypt(apiKey);
    if (apiSecret) updates.api_secret = encrypt(apiSecret);
    if (status && ['active', 'inactive', 'error'].includes(status)) updates.status = status;
    if (req.body.clientId) updates.client_id = encrypt(req.body.clientId);
    if (req.body.email) updates.email = encrypt(req.body.email);
    if (req.body.password) updates.password = encrypt(req.body.password);

    const updated = await updateAccount(req.params.id, req.user.userId, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }

    res.json({ success: true, data: sanitize(updated) });
  } catch (error) {
    console.error('更新账号失败:', error);
    res.status(500).json({ success: false, error: '更新账号失败' });
  }
});

/**
 * DELETE /api/accounts/:id
 * 删除账号
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await deleteAccount(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    res.json({ success: true, message: '账号已删除' });
  } catch (error) {
    console.error('删除账号失败:', error);
    res.status(500).json({ success: false, error: '删除账号失败' });
  }
});

/**
 * POST /api/accounts/:id/test
 * 测试账号连接
 */
router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const account = await getAccountById(req.params.id, req.user.userId);
    if (!account) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }

    const testResult = await testPlatformConnection(account);

    // 更新状态
    await updateAccount(req.params.id, req.user.userId, {
      status: testResult.success ? 'active' : 'error',
      last_sync: testResult.success ? new Date().toISOString() : null
    });

    res.json({
      success: true,
      data: {
        platform: account.platform,
        name: account.name,
        connected: testResult.success,
        message: testResult.message,
        testedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('测试账号连接失败:', error);
    res.status(500).json({ success: false, error: '测试账号连接失败' });
  }
});

/**
 * POST /api/accounts/ozon-authorize
 * OZON API授权：不验证 API 连通性，直接保存凭证
 */
router.post('/ozon-authorize', authenticateToken, async (req, res) => {
  try {
    const { name, clientId, apiKey } = req.body;
    if (!name || !clientId || !apiKey) {
      return res.status(400).json({ success: false, error: '缺少必要参数: name, clientId, apiKey' });
    }

    const newAccount = {
      id: 'ozon-' + Date.now(),
      user_id: req.user.userId,
      platform: 'ozon',
      name,
      client_id: encrypt(clientId),
      api_key: encrypt(apiKey),
      status: 'active'
    };

    const saved = await createAccount(newAccount);
    console.log(`[OZON] API授权成功: ${name}`);
    res.json({ success: true, message: 'OZON API授权成功', data: { id: saved.id, name } });
  } catch (error) {
    console.error('[OZON] 授权失败:', error);
    res.status(500).json({ success: false, error: 'OZON API授权失败: ' + error.message });
  }
});

/**
 * POST /api/accounts/ozon-test
 * 测试已保存的 OZON API 连接
 */
router.post('/ozon-test', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.body;
    const account = await getAccountById(accountId);
    if (!account || account.platform !== 'ozon') {
      return res.status(404).json({ success: false, error: 'OZON账号不存在' });
    }

    const clientId = decrypt(account.client_id);
    const apiKey = decrypt(account.api_key);

    if (!clientId || !apiKey) {
      return res.status(400).json({ success: false, error: 'OZON 凭证缺失，请重新绑定' });
    }

    try {
      const response = await fetch('https://api-seller.ozon.ru/v1/ping', {
        method: 'GET',
        headers: { 'Client-Id': clientId, 'Api-Key': apiKey }
      });

      if (response.status === 200) {
        await updateAccount(accountId, req.user.userId, { status: 'active' });
        res.json({ success: true, message: 'OZON API连接成功' });
      } else if (response.status === 403) {
        res.status(400).json({ success: false, error: 'OZON API 认证失败 (403)：请检查 OZON Seller 后台 → 设置 → API 密钥 中的凭证' });
      } else {
        res.status(400).json({ success: false, error: `OZON API 请求失败 (${response.status})` });
      }
    } catch (e) {
      res.status(500).json({ success: false, error: 'OZON API不可达（服务器网络限制）', detail: e.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'OZON API测试失败: ' + error.message });
  }
});

/**
 * POST /api/accounts/:id/sync
 * 同步平台数据（如 OZON 产品列表）
 */
router.post('/:id/sync', authenticateToken, async (req, res) => {
  try {
    const account = await getAccountById(req.params.id, req.user.userId);
    if (!account) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }

    const platform = account.platform;

    if (platform === 'ozon') {
      const clientId = decrypt(account.client_id);
      const apiKey = decrypt(account.api_key);

      if (!clientId || !apiKey) {
        return res.json({ success: false, error: 'OZON 凭证缺失，请重新授权' });
      }

      try {
        // 并发获取产品列表 + 统计数据 + 订单数据
        const [productRes, statRes, orderRes] = await Promise.allSettled([
          fetch('https://api-seller.ozon.ru/v2/product/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Client-Id': clientId, 'Api-Key': apiKey },
            body: JSON.stringify({ filter: { visibility: 'ALL' }, limit: 100, offset: 0 })
          }),
          fetch('https://api-seller.ozon.ru/v1/analytics/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Client-Id': clientId, 'Api-Key': apiKey },
            body: JSON.stringify({ date_from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], date_to: new Date().toISOString().split('T')[0], metrics: ['revenue', 'orders_count', 'products_sold'] })
          }),
          fetch('https://api-seller.ozon.ru/v3/order/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Client-Id': clientId, 'Api-Key': apiKey },
            body: JSON.stringify({ filter: { since: new Date(Date.now() - 7 * 86400000).toISOString(), status: '' }, page: 1, page_size: 50 })
          })
        ]);

        let products = [];
        let totalProducts = 0;
        let stats = { total: 0, active: 0, archived: 0, awaiting_approval: 0, rejected: 0 };
        let ordersSummary = { total: 0, pending: 0, awaiting_delivery: 0, delivered: 0, cancelled: 0 };

        // 解析产品数据
        if (productRes.status === 'fulfilled' && productRes.value.ok) {
          const productData = await productRes.value.json();
          products = productData.result?.items || [];
          totalProducts = productData.result?.total || products.length;

          // 统计产品状态
          products.forEach(p => {
            const status = (p.state?.name || p.status || '').toLowerCase();
            if (status.includes('approved') || status.includes('published') || status.includes('active') || status.includes('for_sale')) {
              stats.active++;
            } else if (status.includes('archived') || status.includes('inactive')) {
              stats.archived++;
            } else if (status.includes('pending') || status.includes('moderation') || status.includes('new')) {
              stats.awaiting_approval++;
            } else if (status.includes('rejected') || status.includes('failed')) {
              stats.rejected++;
            } else {
              stats.total++;
            }
          });
          stats.total = totalProducts;
        }

        // 解析订单数据
        if (orderRes.status === 'fulfilled' && orderRes.value.ok) {
          const orderData = await orderRes.value.json();
          const orders = orderData.orders || orderData.result?.orders || [];
          orders.forEach(o => {
            const status = (o.status || '').toLowerCase();
            if (status.includes('pending') || status.includes('awaiting_payment') || status.includes('unpaid')) {
              ordersSummary.pending++;
            } else if (status.includes('awaiting_delivery') || status.includes('shipped') || status.includes('delivering')) {
              ordersSummary.awaiting_delivery++;
            } else if (status.includes('delivered') || status.includes('complete')) {
              ordersSummary.delivered++;
            } else if (status.includes('cancelled') || status.includes('refund')) {
              ordersSummary.cancelled++;
            }
          });
          ordersSummary.total = orders.length;
        }

        await updateAccount(req.params.id, req.user.userId, {
          last_sync: new Date().toISOString()
        });

        res.json({
          success: true,
          message: '同步完成',
          data: {
            total: totalProducts,
            stats,
            ordersSummary,
            products: products.map(p => ({
              id: p.offer_id || p.product_id,
              name: p.name,
              price: p.price,
              stock: p.stocks?.present || 0,
              status: p.state?.name || p.status
            }))
          }
        });
      } catch (e) {
        res.json({ success: false, error: 'OZON API不可达: ' + e.message });
      }
    } else {
      res.json({ success: false, error: `平台 ${platform} 暂不支持数据同步` });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '同步失败: ' + error.message });
  }
});

/**
 * 测试平台连接
 */
async function testPlatformConnection(account) {
  const platform = account.platform;

  if (platform === 'ozon') {
    const clientId = decrypt(account.client_id);
    const apiKey = decrypt(account.api_key);
    if (!clientId || !apiKey) {
      return { success: false, message: '缺少 OZON Client ID 或 API Key' };
    }
    try {
      const response = await fetch('https://api-seller.ozon.ru/v1/ping', {
        method: 'GET',
        headers: { 'Client-Id': clientId, 'Api-Key': apiKey }
      });
      return { success: response.status === 200, message: response.status === 200 ? 'OZON API连接成功' : 'OZON API认证失败' };
    } catch {
      return { success: false, message: 'OZON API不可达（网络问题或服务器被限）' };
    }
  }

  // 其他平台
  await new Promise(r => setTimeout(r, 500));
  return { success: true, message: '账号已配置' };
}

/**
 * =============================================================
 * 小红书扫码登录（通过统一账号系统）
 * =============================================================
 */

/**
 * POST /api/accounts/xiaohongshu-login/qrcode
 * 获取小红书登录二维码
 */
router.post('/xiaohongshu-login/qrcode', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.body || {};
    const xhs = getXiaohongshuInstance();
    await xhs.createContext(accountId, { headless: false });
    const qrData = await xhs.getLoginQRCode();

    res.json({
      success: true,
      data: {
        qrImage: qrData.screenshot,
        loginUrl: qrData.loginUrl,
        accountId: accountId || 'default',
        tip: '请使用小红书App扫码登录',
      },
    });
  } catch (error) {
    console.error('[小红书] 获取二维码失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/accounts/xiaohongshu-login/wait
 * 等待扫码登录完成，成功后自动创建统一账号记录
 */
router.post('/xiaohongshu-login/wait', authenticateToken, async (req, res) => {
  try {
    const { accountId = 'default', timeout = 120000 } = req.body || {};
    const xhs = getXiaohongshuInstance();
    const loggedIn = await xhs.waitForLogin(timeout);

    if (loggedIn) {
      await xhs.saveSession(accountId);

      // 自动在统一账号系统中创建/更新记录
      const existingAccounts = await getAccountsByUser(req.user.userId);
      const existing = existingAccounts.find(
        a => a.platform === 'xiaohongshu' && a.username === accountId
      );

      if (!existing) {
        // 新建账号记录
        const newAccount = {
          id: 'xhs-' + Date.now(),
          user_id: req.user.userId,
          platform: 'xiaohongshu',
          name: accountId === 'default' ? '小红书默认账号' : `小红书-${accountId}`,
          username: accountId,
          status: 'active',
        };
        await createAccount(newAccount);
      } else {
        // 更新已有记录状态
        await updateAccount(existing.id, req.user.userId, { status: 'active' });
      }

      res.json({ success: true, data: { loggedIn: true, accountId } });
    } else {
      res.json({ success: false, error: '登录超时', code: 'TIMEOUT' });
    }
  } catch (error) {
    console.error('[小红书] 等待登录失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/accounts/xiaohongshu-login/status
 * 检查小红书账号登录状态
 */
router.get('/xiaohongshu-login/status', authenticateToken, async (req, res) => {
  try {
    const accountId = req.query.accountId || 'default';
    const xhs = getXiaohongshuInstance();
    const hasSession = xhs.hasSavedSession(accountId);

    let isValid = false;
    if (hasSession) {
      isValid = await xhs.validateSession(accountId);
    }

    res.json({
      success: true,
      data: {
        hasSession,
        loggedIn: isValid,
        accountId,
      },
    });
  } catch (error) {
    console.error('[小红书] 检查状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 初始化数据库表
 */
export async function initAccountsRoutes(app) {
  await initAccountsTable();
  app.use('/api/accounts', router);
  console.log('[accounts] 账号路由已注册（数据库模式）');
}

export default router;
