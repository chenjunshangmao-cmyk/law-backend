// 账号管理 API - 数据库版本（增强版）
import express from 'express';
import crypto from 'crypto';
import {
  getAccountsByUser,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getSyncDataByAccount,
  createOrUpdateSyncData
} from '../services/dbService.js';
import { authenticateToken, rateLimitMiddleware } from '../middleware/auth.js';
import {
  validateAccountCreate,
  validateAccountUpdate,
  validateAccountTest,
  validateCookies
} from '../middleware/validateAccounts.js';
import { syncAccountData as syncOzonData, createOzonClient, getSellerInfo } from '../services/ozonApi.js';
import axios from 'axios';

// YouTube OAuth 配置
const YT_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const YT_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const YT_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const YT_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const router = express.Router();

// 支持的平台列表
const PLATFORMS = ['1688', 'amazon', 'tiktok', 'ozon', 'lazada', 'shopee', 'youtube', 'taobao', 'pdd', 'xiaohongshu'];

// 应用速率限制（每分钟50个请求）
const accountRateLimit = rateLimitMiddleware(60 * 1000, 50); // 1分钟，50个请求
router.use(accountRateLimit);

/**
 * GET /api/accounts
 * 获取用户账号列表
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accounts = await getAccountsByUser(req.userId);
    
    // 返回时隐藏敏感信息，但保留 accountId（浏览器自动化需要）
    const sanitizedAccounts = accounts.map(a => {
      // 解密 credentials，提取 accountId
      let accountId = null;
      if (a.account_data?.credentials) {
        try {
          const decrypted = decrypt(a.account_data.credentials);
          const creds = JSON.parse(decrypted);
          accountId = creds?.accountId || null;
        } catch {
          // ignore
        }
      }
      return {
        id: a.id,
        platform: a.platform,
        name: a.account_name,
        username: a.account_data?.username || null,
        accountId,  // ✅ 修复：返回 accountId 供浏览器自动化使用
        status: a.account_data?.status || 'active',
        createdAt: a.created_at,
        updatedAt: a.updated_at
      };
    });
    
    res.json({ success: true, data: sanitizedAccounts });
  } catch (error) {
    console.error('获取账号列表失败:', error);
    res.status(500).json({ success: false, error: '获取账号列表失败' });
  }
});

/**
 * POST /api/accounts
 * 添加平台账号
 */
router.post('/', authenticateToken, validateAccountCreate, async (req, res) => {
  try {
    const { platform, name, username, credentials, settings } = req.body;
    
    // 验证必填字段
    if (!platform || !name) {
      return res.status(400).json({ 
        success: false, 
        error: '缺少必填字段：platform 和 name' 
      });
    }
    
    // 验证平台
    if (!PLATFORMS.includes(platform.toLowerCase())) {
      return res.status(400).json({ 
        success: false, 
        error: `不支持的平台: ${platform}，支持的平台: ${PLATFORMS.join(', ')}` 
      });
    }
    
    // 加密敏感信息，合并到 account_data
    const accountDataPayload = {
      ...(credentials ? { credentials: encrypt(JSON.stringify(credentials)) } : {}),
      ...(settings || {}),
      username: username || null,
      status: 'active'
    };
    
    const newAccount = await createAccount({
      user_id: req.userId,
      platform: platform.toLowerCase(),
      account_name: name,
      account_data: accountDataPayload
    });
    
    if (!newAccount) {
      return res.status(500).json({ success: false, error: '创建账号失败' });
    }

    // pg 返回的是普通对象，直接使用
    const safeAccount = {
      id: newAccount.id,
      platform: newAccount.platform,
      name: newAccount.account_name,
      username: newAccount.account_data?.username || null,
      status: newAccount.account_data?.status || 'active',
      createdAt: newAccount.created_at
    };
    
    res.status(201).json({ success: true, data: safeAccount });
  } catch (error) {
    console.error('添加账号失败:', error);
    res.status(500).json({ success: false, error: '添加账号失败' });
  }
});

/**
 * GET /api/accounts/:id
 * 获取单个账号详情
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const account = await getAccountById(req.params.id);
    
    if (!account || account.user_id !== req.userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    const safeAccount = {
      id: account.id,
      platform: account.platform,
      name: account.account_name,
      username: account.account_data?.username || null,
      status: account.account_data?.status || 'active',
      createdAt: account.created_at
    };
    
    res.json({ success: true, data: safeAccount });
  } catch (error) {
    console.error('获取账号详情失败:', error);
    res.status(500).json({ success: false, error: '获取账号详情失败' });
  }
});

/**
 * PUT /api/accounts/:id
 * 更新账号
 */
router.put('/:id', authenticateToken, validateAccountUpdate, async (req, res) => {
  try {
    const { platform, name, username, credentials, settings, status, cookies } = req.body;
    
    const account = await getAccountById(req.params.id);
    if (!account || account.user_id !== req.userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    const updates = {};
    if (platform) updates.platform = platform.toLowerCase();
    if (name) updates.account_name = name;
    // 更新 account_data 中的字段
    const newAccountData = { ...(account.account_data || {}) };
    if (username !== undefined) newAccountData.username = username;
    if (credentials) {
      newAccountData.credentials = encrypt(JSON.stringify(credentials));
    }
    if (settings) Object.assign(newAccountData, settings);
    if (status && ['active', 'inactive', 'expired', 'error'].includes(status)) {
      newAccountData.status = status;
    }
    if (cookies) newAccountData.cookies = cookies;
    updates.account_data = newAccountData;
    
    const updatedAccount = await updateAccount(req.params.id, updates);
    
    const safeAccount = {
      id: updatedAccount.id,
      platform: updatedAccount.platform,
      name: updatedAccount.account_name,
      username: updatedAccount.account_data?.username || null,
      status: updatedAccount.account_data?.status || 'active'
    };
    
    res.json({ success: true, data: safeAccount });
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
    const account = await getAccountById(req.params.id);
    if (!account || account.user_id !== req.userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    await deleteAccount(req.params.id);
    
    res.json({ success: true, message: '账号已删除' });
  } catch (error) {
    console.error('删除账号失败:', error);
    res.status(500).json({ success: false, error: '删除账号失败' });
  }
});

/**
 * POST /api/accounts/:id/cookies
 * 更新账号cookies（浏览器自动化专用）
 */
router.post('/:id/cookies', authenticateToken, validateCookies, async (req, res) => {
  try {
    const { cookies } = req.body;
    
    const account = await getAccountById(req.params.id);
    if (!account || account.user_id !== req.userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }

    // cookies 存在 account_data 中
    const newAccountData = { ...(account.account_data || {}), cookies };
    const updatedAccount = await updateAccount(req.params.id, { account_data: newAccountData });
    
    res.json({ 
      success: true, 
      message: 'cookies已更新',
      data: {
        id: updatedAccount.id,
        platform: updatedAccount.platform,
        name: updatedAccount.account_name,
        cookiesUpdated: true
      }
    });
  } catch (error) {
    console.error('更新cookies失败:', error);
    res.status(500).json({ success: false, error: '更新cookies失败' });
  }
});

/**
 * POST /api/accounts/:id/test
 * 测试账号连接
 */
router.post('/:id/test', authenticateToken, validateAccountTest, async (req, res) => {
  try {
    const account = await getAccountById(req.params.id);
    
    if (!account || account.user_id !== req.userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    // 模拟连接测试（实际应该调用各平台的API进行验证）
    const testResult = await testPlatformConnection(account);
    
    // 更新账号状态（存入 account_data）
    const newAccountData = { ...(account.account_data || {}), status: testResult.success ? 'active' : 'error' };
    await updateAccount(req.params.id, { account_data: newAccountData });
    
    res.json({ 
      success: true, 
      data: {
        platform: account.platform,
        name: account.account_name,
        connected: testResult.success,
        message: testResult.message,
        testedAt: new Date()
      }
    });
  } catch (error) {
    console.error('测试账号连接失败:', error);
    res.status(500).json({ success: false, error: '测试账号连接失败' });
  }
});

/**
 * 模拟平台连接测试
 * 实际应该调用各平台的API
 */
async function testPlatformConnection(account) {
  // 模拟测试延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 验证账号数据
  const data = account.account_data || {};
  
  // 扩展同步的账号：检查 cookies 和 status
  if (data.authMethod === 'extension') {
    const hasCookies = data.cookies && Object.keys(data.cookies).length > 0;
    const isActive = data.status === 'active';
    return {
      success: hasCookies && isActive,
      message: hasCookies && isActive 
        ? `连接成功（扩展同步于 ${data.lastSyncAt ? new Date(data.lastSyncAt).toLocaleString('zh-CN') : '未知时间'}）`
        : (isActive ? 'Cookie 已过期，请重新扩展登录' : '账号未激活')
    };
  }
  
  // 手动添加的账号：检查 username
  const username = data.username;
  const isValid = username && username.length >= 3;
  
  return {
    success: isValid,
    message: isValid ? '连接成功' : '账号信息不完整（缺少用户名）'
  };
}

/**
 * POST /api/accounts/:id/sync
 * 同步账号数据（产品+订单）
 */
router.post('/:id/sync', authenticateToken, async (req, res) => {
  try {
    const account = await getAccountById(req.params.id);
    
    if (!account || account.user_id !== req.userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    // 检查账号平台类型
    const platform = account.platform?.toLowerCase();
    
    if (platform === 'ozon') {
      // OZON 平台 - 调用 OZON API
      const accountData = account.account_data || {};
      const clientId = accountData.clientId || accountData.client_id;
      const apiKey = accountData.apiKey || accountData.api_key;
      
      if (!clientId || !apiKey) {
        return res.status(400).json({ 
          success: false, 
          error: '缺少 OZON API 凭证，请先配置 Client ID 和 API Key' 
        });
      }
      
      // 调用 OZON API 同步数据
      const syncResult = await syncOzonData(clientId, apiKey);
      
      if (!syncResult.success) {
        // 同步失败，更新状态
        await createOrUpdateSyncData(account.id, {
          products_count: 0,
          orders_count: 0,
          sync_status: 'failed',
          sync_data: { error: syncResult.error }
        });
        
        return res.status(500).json({ 
          success: false, 
          error: syncResult.error || '同步失败' 
        });
      }
      
      // 同步成功，保存数据（含统计）
      await createOrUpdateSyncData(account.id, {
        products_count: syncResult.productsCount,
        orders_count: syncResult.ordersCount,
        sync_status: 'success',
        sync_data: {
          stats: syncResult.stats || { total: syncResult.productsCount, active: 0, archived: 0, awaiting_approval: 0, rejected: 0 },
          ordersSummary: syncResult.ordersSummary || { total: 0, pending: 0, awaiting_delivery: 0, delivered: 0, cancelled: 0 },
          products: (syncResult.products || []).slice(0, 10),
          orders: (syncResult.orders || []).slice(0, 10),
          syncTime: syncResult.syncTime
        }
      });
      
      // 更新账号最后同步时间
      await updateAccount(account.id, {
        account_data: {
          ...accountData,
          lastSync: new Date().toISOString(),
          productsCount: syncResult.productsCount,
          ordersCount: syncResult.ordersCount,
          stats: syncResult.stats,
          ordersSummary: syncResult.ordersSummary
        }
      });
      
      return res.json({
        success: true,
        message: '同步成功',
        data: {
          accountId: account.id,
          platform: 'ozon',
          productsCount: syncResult.productsCount,
          ordersCount: syncResult.ordersCount,
          stats: syncResult.stats,
          ordersSummary: syncResult.ordersSummary,
          syncTime: syncResult.syncTime
        }
      });
    } else {
      // 其他平台 - 模拟同步（后续可扩展）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据
      const mockData = {
        products_count: Math.floor(Math.random() * 50),
        orders_count: Math.floor(Math.random() * 20),
        sync_status: 'success',
        sync_data: { note: '模拟数据' }
      };
      
      await createOrUpdateSyncData(account.id, mockData);
      
      return res.json({
        success: true,
        message: '同步成功（模拟数据）',
        data: {
          accountId: account.id,
          platform: platform,
          productsCount: mockData.products_count,
          ordersCount: mockData.orders_count,
          syncTime: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('同步账号数据失败:', error);
    res.status(500).json({ success: false, error: '同步失败: ' + error.message });
  }
});

/**
 * POST /api/accounts/youtube-authorize
 * YouTube OAuth 授权：开始 OAuth 流程，返回 Google 授权 URL
 */
router.post('/youtube-authorize', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!YT_CLIENT_ID || !YT_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Google OAuth 未配置（GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET）',
        code: 'OAUTH_NOT_CONFIGURED'
      });
    }

    // 生成回调 URL
    const host = req.get('host') || '';
    const isSecure = req.secure || req.get('x-forwarded-proto') === 'https'
      || host.includes('.onrender.com') || host.includes('chenjuntrading.cn');
    const protocol = isSecure ? 'https' : 'http';

    let callbackBase;
    if (host.includes('chenjuntrading.cn')) {
      callbackBase = 'https://api.chenjuntrading.cn';
    } else if (host.includes('localhost') || host.includes('127.0.0.1')) {
      callbackBase = `${protocol}://localhost:${process.env.PORT || 9000}`;
    } else if (host.includes('.onrender.com')) {
      callbackBase = `https://${host}`;
    } else {
      callbackBase = `${protocol}://${host}`;
    }

    const callbackUrl = `${callbackBase}/api/accounts/youtube-callback`;

    // state 中存储用户信息
    const state = Buffer.from(JSON.stringify({
      userId: req.userId,
      name: name || 'YouTube 账号',
      ts: Date.now()
    })).toString('base64url');

    const params = new URLSearchParams({
      client_id: YT_CLIENT_ID,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.email',
      access_type: 'offline',
      prompt: 'consent',
      state
    });

    const authUrl = `${YT_AUTH_URL}?${params}`;

    res.json({
      success: true,
      data: { authUrl, callbackUrl }
    });
  } catch (error) {
    console.error('[YouTube] 发起授权失败:', error);
    res.status(500).json({ success: false, error: '发起授权失败: ' + error.message });
  }
});

/**
 * GET /api/accounts/youtube-callback
 * YouTube OAuth 回调（接收 Google 重定向）
 */
router.get('/youtube-callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error('[YouTube] 用户拒绝授权:', error);
    return res.redirect(`/?error=${encodeURIComponent('YouTube 授权被拒绝')}`);
  }

  if (!code) {
    return res.status(400).send('缺少授权码');
  }

  // 解析 state
  let stateData = { userId: null, name: 'YouTube 账号' };
  try {
    stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
  } catch { /* ignore */ }

  // 构建回调 URL（与请求中一致）
  const host = req.get('host') || '';
  const isSecure = req.secure || req.get('x-forwarded-proto') === 'https'
    || host.includes('.onrender.com') || host.includes('chenjuntrading.cn');
  const protocol = isSecure ? 'https' : 'http';
  let callbackBase;
  if (host.includes('chenjuntrading.cn')) callbackBase = 'https://api.chenjuntrading.cn';
  else if (host.includes('localhost') || host.includes('127.0.0.1')) callbackBase = `${protocol}://localhost:${process.env.PORT || 9000}`;
  else if (host.includes('.onrender.com')) callbackBase = `https://${host}`;
  else callbackBase = `${protocol}://${host}`;

  const callbackUrl = `${callbackBase}/api/accounts/youtube-callback`;

  try {
    // 换取 token
    const tokenRes = await axios.post(YT_TOKEN_URL, new URLSearchParams({
      code,
      client_id: YT_CLIENT_ID,
      client_secret: YT_CLIENT_SECRET,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code'
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // 获取频道信息
    let channelTitle = '', channelId = '';
    try {
      const ytRes = await axios.get(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true',
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      const channel = ytRes.data.items?.[0];
      if (channel) {
        channelId = channel.id;
        channelTitle = channel.snippet.title;
      }
    } catch { /* ignore */ }

    // 获取用户邮箱
    let email = '';
    try {
      const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      email = userRes.data.email || '';
    } catch { /* ignore */ }

    // 保存到 accounts 表
    if (stateData.userId) {
      const accountData = {
        user_id: stateData.userId,
        platform: 'youtube',
        account_name: stateData.name || channelTitle || 'YouTube 账号',
        account_data: {
          username: email || channelTitle,
          email,
          channelTitle,
          channelId,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000).toISOString(),
          authMethod: 'oauth',
          status: 'active',
          lastAuthCheck: new Date().toISOString()
        }
      };

      // 检查是否已存在同 channelId 的账号
      const existing = await getAccountsByUser(stateData.userId);
      const dup = existing.find(a => {
        if (a.platform !== 'youtube') return false;
        try { return a.account_data?.channelId === channelId && channelId; } catch { return false; }
      });

      if (!dup) {
        await createAccount(accountData);
        console.log(`[YouTube] 账号已绑定: ${channelTitle} (${email})`);
      } else {
        // 更新已有的
        await updateAccount(dup.id, {
          account_data: {
            ...dup.account_data,
            ...accountData.account_data
          }
        });
        console.log(`[YouTube] 账号已更新: ${channelTitle}`);
      }
    }

    // popup 模式返回 HTML
    const html = `<!DOCTYPE html><html><body>
    <script>
      try {
        window.opener.postMessage({
          type: 'youtube_auth_success',
          data: {
            channelTitle: ${JSON.stringify(channelTitle)},
            email: ${JSON.stringify(email)},
            channelId: ${JSON.stringify(channelId)}
          }
        }, '*');
        window.close();
      } catch(e) {}
    </script>
    <p>YouTube 授权成功！正在关闭...</p>
    </body></html>`;
    res.type('html').send(html);

  } catch (err) {
    console.error('[YouTube] OAuth 回调失败:', err.response?.data || err.message);
    res.status(500).send('授权失败，请重试');
  }
});

/**
 * POST /api/accounts/ozon-authorize
 * OZON API 授权：验证 Client ID + API Key → 自动创建账号
 */
router.post('/ozon-authorize', authenticateToken, async (req, res) => {
  try {
    const { name, clientId, apiKey } = req.body;

    if (!name || !clientId || !apiKey) {
      return res.status(400).json({
        success: false,
        error: '缺少必填字段：name（账号名称）、clientId、apiKey',
      });
    }

    // 1. 调用 OZON API 验证凭证有效性
    let sellerInfo;
    try {
      const client = createOzonClient(clientId, apiKey);
      sellerInfo = await getSellerInfo(client);
      console.log(`✅ OZON API 验证成功，店铺名: ${sellerInfo.seller?.company_name || '未知'}`);
    } catch (apiError) {
      return res.status(401).json({
        success: false,
        error: `OZON API 验证失败：${apiError.message}，请检查 Client ID 和 API Key 是否正确`,
        code: 'OZON_AUTH_FAILED',
      });
    }

    // 2. 检查是否已存在同 clientId 的账号（防重复）
    const existingAccounts = await getAccountsByUser(req.userId);
    const duplicate = existingAccounts.find(a => {
      if (a.platform !== 'ozon') return false;
      try {
        const data = a.account_data || {};
        return data.clientId === clientId || data.client_id === clientId;
      } catch { return false; }
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: `已存在相同 Client ID 的 OZON 账号「${duplicate.account_name}」`,
        code: 'DUPLICATE_ACCOUNT',
        existingAccountId: duplicate.id,
      });
    }

    // 3. 创建账号（加密保存 API 凭证）
    const accountDataPayload = {
      username: sellerInfo?.seller?.email || sellerInfo?.seller?.login || name,
      status: 'active',
      clientId,
      apiKey: encrypt(apiKey),  // 加密存储
      sellerInfo: {
        company_name: sellerInfo?.seller?.company_name,
        email: sellerInfo?.seller?.email,
        login: sellerInfo?.seller?.login,
      },
      authMethod: 'api',
      lastAuthCheck: new Date().toISOString(),
    };

    const newAccount = await createAccount({
      user_id: req.userId,
      platform: 'ozon',
      account_name: name,
      account_data: accountDataPayload,
    });

    if (!newAccount) {
      return res.status(500).json({ success: false, error: '创建账号失败' });
    }

    console.log(`🆕 OZON 账号已创建: ${newAccount.id} - ${name}`);

    res.status(201).json({
      success: true,
      message: `OZON 账号授权成功！${sellerInfo?.seller?.company_name ? `店铺：${sellerInfo.seller.company_name}` : ''}`,
      data: {
        id: newAccount.id,
        platform: 'ozon',
        name: newAccount.account_name,
        status: 'active',
        company: sellerInfo?.seller?.company_name || null,
        email: sellerInfo?.seller?.email || null,
        authedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ OZON 授权失败:', error);
    res.status(500).json({ success: false, error: 'OZON 授权失败: ' + error.message });
  }
});

/**
 * GET /api/accounts/:id/sync
 * 获取账号同步数据
 */
router.get('/:id/sync', authenticateToken, async (req, res) => {
  try {
    const account = await getAccountById(req.params.id);
    
    if (!account || account.user_id !== req.userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    const syncData = await getSyncDataByAccount(account.id);
    
    if (!syncData) {
      return res.json({
        success: true,
        data: {
          productsCount: 0,
          ordersCount: 0,
          syncStatus: 'pending',
          lastSync: null
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        productsCount: syncData.products_count,
        ordersCount: syncData.orders_count,
        syncStatus: syncData.sync_status,
        lastSync: syncData.sync_time,
        details: syncData.sync_data
      }
    });
  } catch (error) {
    console.error('获取同步数据失败:', error);
    res.status(500).json({ success: false, error: '获取同步数据失败' });
  }
});

/**
 * 加密函数
 */
function encrypt(text) {
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
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.JWT_SECRET || 'claw-secret-key', 'salt', 32);
  const parts = text.split(':');
  if (parts.length !== 2) return '';
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
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
    const { getXiaohongshuInstance } = await import('../services/xiaohongshuAutomation.js');
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
    const { getXiaohongshuInstance } = await import('../services/xiaohongshuAutomation.js');
    const xhs = getXiaohongshuInstance();
    const loggedIn = await xhs.waitForLogin(timeout);

    if (loggedIn) {
      await xhs.saveSession(accountId);

      // 自动在统一账号系统中创建/更新记录
      const existingAccounts = await getAccountsByUser(req.userId);
      const existing = existingAccounts.find(
        a => a.platform === 'xiaohongshu' && (a.account_data?.username === accountId || a.account_name === accountId)
      );

      if (!existing) {
        // 新建账号记录
        await createAccount({
          user_id: req.userId,
          platform: 'xiaohongshu',
          account_name: accountId === 'default' ? '小红书默认账号' : `小红书-${accountId}`,
          account_data: {
            username: accountId,
            status: 'active',
            authMethod: 'qrcode',
            lastAuthCheck: new Date().toISOString()
          }
        });
      } else {
        // 更新已有记录状态
        await updateAccount(existing.id, {
          account_data: {
            ...(existing.account_data || {}),
            status: 'active',
            lastAuthCheck: new Date().toISOString()
          }
        });
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
    const { getXiaohongshuInstance } = await import('../services/xiaohongshuAutomation.js');
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
 * POST /api/accounts/extension-sync
 * Chrome 扩展同步平台 cookie/session 到云端
 */
router.post('/extension-sync', authenticateToken, async (req, res) => {
  try {
    const { platform, cookies, connectedAt } = req.body || {};

    if (!platform) {
      return res.status(400).json({ success: false, error: '缺少 platform 参数' });
    }

    // 查找或创建该平台的账号记录
    const existingAccounts = await getAccountsByUser(req.userId);
    const existing = existingAccounts.find(a => a.platform === platform);

    if (existing) {
      // 更新已有记录
      await updateAccount(existing.id, {
        account_data: {
          ...(existing.account_data || {}),
          cookies: cookies,
          connectedAt: connectedAt,
          authMethod: 'extension',
          status: 'active',
          lastSyncAt: new Date().toISOString()
        }
      });
    } else {
      // 新建账号记录
      const platformNames = {
        xiaohongshu: '小红书',
        tiktok: 'TikTok Shop',
        ozon: 'OZON',
        alibaba1688: '1688'
      };

      await createAccount({
        user_id: req.userId,
        platform: platform,
        account_name: platformNames[platform] || platform,
        account_data: {
          cookies: cookies,
          connectedAt: connectedAt,
          authMethod: 'extension',
          status: 'active',
          lastSyncAt: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      data: {
        platform,
        message: `${platform} cookie 同步成功`,
        syncedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[扩展同步] 失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
