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
import { syncAccountData as syncOzonData } from '../services/ozonApi.js';

const router = express.Router();

// 支持的平台列表
const PLATFORMS = ['1688', 'amazon', 'tiktok', 'ozon', 'lazada', 'shopee', 'youtube', 'taobao', 'pdd'];

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
  
  // 简单验证（实际应该调用平台API）
  const username = account.account_data?.username;
  const isValid = username && username.length >= 3;
  
  return {
    success: isValid,
    message: isValid ? '连接成功' : '账号信息不完整'
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
      
      // 同步成功，保存数据
      await createOrUpdateSyncData(account.id, {
        products_count: syncResult.productsCount,
        orders_count: syncResult.ordersCount,
        sync_status: 'success',
        sync_data: {
          products: syncResult.products.slice(0, 10), // 只保存前10个产品详情
          orders: syncResult.orders.slice(0, 10), // 只保存前10个订单详情
          syncTime: syncResult.syncTime
        }
      });
      
      // 更新账号最后同步时间
      await updateAccount(account.id, {
        account_data: {
          ...accountData,
          lastSync: new Date().toISOString(),
          productsCount: syncResult.productsCount,
          ordersCount: syncResult.ordersCount
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

export default router;
