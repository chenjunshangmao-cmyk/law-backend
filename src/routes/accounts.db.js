// 账号管理 API - 数据库版本（增强版）
import express from 'express';
import crypto from 'crypto';
import {
  getAccountsByUser,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount
} from '../services/dbService.js';
import { authenticateToken, rateLimitMiddleware } from '../middleware/auth.js';
import {
  validateAccountCreate,
  validateAccountUpdate,
  validateAccountTest,
  validateCookies
} from '../middleware/validateAccounts.js';

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
    
    // 返回时隐藏敏感信息
    const sanitizedAccounts = accounts.map(a => ({
      ...a.toJSON(),
      credentials: a.credentials ? { ...a.credentials, password: '***' } : null,
      cookies: a.cookies ? '***' : null
    }));
    
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
    
    // 加密敏感信息
    const encryptedCredentials = credentials ? encrypt(JSON.stringify(credentials)) : null;
    
    const newAccount = await createAccount({
      userId: req.userId,
      platform: platform.toLowerCase(),
      name,
      username: username || null,
      credentials: encryptedCredentials ? { encrypted: encryptedCredentials } : null,
      settings: settings || {},
      status: 'active'
    });
    
    const accountData = newAccount.toJSON();
    if (accountData.credentials) {
      accountData.credentials = { ...accountData.credentials, password: '***' };
    }
    
    res.status(201).json({ success: true, data: accountData });
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
    
    if (!account || account.userId !== req.userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    const accountData = account.toJSON();
    if (accountData.credentials) {
      accountData.credentials = { ...accountData.credentials, password: '***' };
    }
    if (accountData.cookies) {
      accountData.cookies = '***';
    }
    
    res.json({ success: true, data: accountData });
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
    if (!account || account.userId !== req.userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    const updates = {};
    if (platform) updates.platform = platform.toLowerCase();
    if (name) updates.name = name;
    if (username !== undefined) updates.username = username;
    if (credentials) {
      updates.credentials = { encrypted: encrypt(JSON.stringify(credentials)) };
    }
    if (settings) updates.settings = settings;
    if (status && ['active', 'inactive', 'expired', 'error'].includes(status)) {
      updates.status = status;
    }
    if (cookies) updates.cookies = cookies;
    
    const updatedAccount = await updateAccount(req.params.id, updates);
    
    const accountData = updatedAccount.toJSON();
    if (accountData.credentials) {
      accountData.credentials = { ...accountData.credentials, password: '***' };
    }
    if (accountData.cookies) {
      accountData.cookies = '***';
    }
    
    res.json({ success: true, data: accountData });
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
    if (!account || account.userId !== req.userId) {
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
    if (!account || account.userId !== req.userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }

    const updates = { cookies };
    const updatedAccount = await updateAccount(req.params.id, updates);
    
    res.json({ 
      success: true, 
      message: 'cookies已更新',
      data: {
        id: updatedAccount.id,
        platform: updatedAccount.platform,
        name: updatedAccount.name,
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
    
    if (!account || account.userId !== req.userId) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    // 模拟连接测试（实际应该调用各平台的API进行验证）
    const testResult = await testPlatformConnection(account);
    
    // 更新账号状态
    await updateAccount(req.params.id, {
      status: testResult.success ? 'active' : 'error',
      lastUsedAt: testResult.success ? new Date() : account.lastUsedAt
    });
    
    res.json({ 
      success: true, 
      data: {
        platform: account.platform,
        name: account.name,
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
  const isValid = account.username && account.username.length >= 3;
  
  return {
    success: isValid,
    message: isValid ? '连接成功' : '账号信息不完整'
  };
}

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
