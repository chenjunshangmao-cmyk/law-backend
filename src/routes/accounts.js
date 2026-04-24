/**
 * 账号管理 API
 * 管理用户的平台账号（1688/Amazon/TikTok等）
 */

import express from 'express';
import crypto from 'crypto';
import { readData, writeData, generateId } from '../services/dataStore.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 支持的平台列表
const PLATFORMS = ['1688', 'amazon', 'tiktok', 'ozon', 'lazada', 'shopee'];

/**
 * GET /api/accounts
 * 获取用户账号列表
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accounts = readData('accounts') || [];
    const userAccounts = accounts.filter(a => a.userId === req.user.userId);
    
    // 返回时隐藏敏感信息
    const sanitizedAccounts = userAccounts.map(a => ({
      ...a,
      apiKey: a.apiKey ? '***' + a.apiKey.slice(-4) : '',
      apiSecret: a.apiSecret ? '***' : ''
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
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { platform, name, apiKey, apiSecret } = req.body;
    
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
    
    const accounts = readData('accounts') || [];
    
    // 加密敏感信息
    const encryptedKey = apiKey ? encrypt(apiKey) : '';
    const encryptedSecret = apiSecret ? encrypt(apiSecret) : '';
    
    const newAccount = {
      id: generateId(),
      userId: req.user.userId,
      platform: platform.toLowerCase(),
      name,
      apiKey: encryptedKey,
      apiSecret: encryptedSecret,
      status: 'active',
      lastSync: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    accounts.push(newAccount);
    writeData('accounts', accounts);
    
    res.status(201).json({ 
      success: true, 
      data: {
        ...newAccount,
        apiKey: apiKey ? '***' + apiKey.slice(-4) : '',
        apiSecret: apiSecret ? '***' : ''
      }
    });
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
    const accounts = readData('accounts') || [];
    const account = accounts.find(a => 
      a.id === req.params.id && a.userId === req.user.userId
    );
    
    if (!account) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    res.json({ 
      success: true, 
      data: {
        ...account,
        apiKey: account.apiKey ? '***' + account.apiKey.slice(-4) : '',
        apiSecret: account.apiSecret ? '***' : ''
      }
    });
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
    const accounts = readData('accounts') || [];
    const index = accounts.findIndex(a => 
      a.id === req.params.id && a.userId === req.user.userId
    );
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    // 更新字段
    if (platform) accounts[index].platform = platform.toLowerCase();
    if (name) accounts[index].name = name;
    if (apiKey) accounts[index].apiKey = encrypt(apiKey);
    if (apiSecret) accounts[index].apiSecret = encrypt(apiSecret);
    if (status && ['active', 'inactive', 'error'].includes(status)) {
      accounts[index].status = status;
    }
    accounts[index].updatedAt = Date.now();
    
    writeData('accounts', accounts);
    
    res.json({ 
      success: true, 
      data: {
        ...accounts[index],
        apiKey: accounts[index].apiKey ? '***' + accounts[index].apiKey.slice(-4) : '',
        apiSecret: accounts[index].apiSecret ? '***' : ''
      }
    });
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
    const accounts = readData('accounts') || [];
    const index = accounts.findIndex(a => 
      a.id === req.params.id && a.userId === req.user.userId
    );
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    accounts.splice(index, 1);
    writeData('accounts', accounts);
    
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
    const accounts = readData('accounts') || [];
    const account = accounts.find(a => 
      a.id === req.params.id && a.userId === req.user.userId
    );
    
    if (!account) {
      return res.status(404).json({ success: false, error: '账号不存在' });
    }
    
    // 模拟连接测试（实际应该调用各平台的API进行验证）
    const testResult = await testPlatformConnection(account);
    
    // 更新账号状态
    const index = accounts.findIndex(a => a.id === req.params.id);
    accounts[index].status = testResult.success ? 'active' : 'error';
    accounts[index].lastSync = testResult.success ? Date.now() : accounts[index].lastSync;
    accounts[index].updatedAt = Date.now();
    writeData('accounts', accounts);
    
    res.json({ 
      success: true, 
      data: {
        platform: account.platform,
        name: account.name,
        connected: testResult.success,
        message: testResult.message,
        testedAt: Date.now()
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
  // 解密获取原始凭证
  const apiKey = decrypt(account.apiKey);
  const apiSecret = decrypt(account.apiSecret);
  
  if (!apiKey || !apiSecret) {
    return { success: false, message: '缺少API凭证' };
  }
  
  // 模拟测试延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 简单的凭证格式验证（实际应该调用平台API）
  const isValid = apiKey.length >= 10 && apiSecret.length >= 10;
  
  return {
    success: isValid,
    message: isValid ? '连接成功' : 'API凭证格式不正确'
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

/**
 * POST /api/accounts/ozon-authorize
 * OZON API授权：保存 Client ID + API Key
 */
router.post('/ozon-authorize', authenticateToken, async (req, res) => {
  try {
    const { name, clientId, apiKey } = req.body;
    if (!name || !clientId || !apiKey) {
      return res.status(400).json({ success: false, error: '缺少必要参数: name, clientId, apiKey' });
    }

    // 先测试 OZON API 连通性
    const testResponse = await fetch('https://api-seller.ozon.ru/v1/ping', {
      method: 'GET',
      headers: {
        'Client-Id': clientId,
        'Api-Key': apiKey
      }
    });

    if (testResponse.status !== 200) {
      const text = await testResponse.text();
      if (testResponse.status === 403) {
        return res.status(400).json({ success: false, error: 'OZON API 认证失败 (403)：Client ID 或 API Key 不正确。请检查 OZON Seller 后台 → 设置 → API 密钥 中的凭证' });
      } else {
        return res.status(400).json({ success: false, error: 'OZON API 请求失败 (' + testResponse.status + ')：可能是网络不可达或被墙', detail: text?.substring(0, 200) });
      }
    }

    // 加密存储
    const accounts = readData('accounts') || [];
    const newAccount = {
      id: 'ozon-' + Date.now(),
      platform: 'ozon',
      name,
      clientId: encrypt(clientId),
      apiKey: encrypt(apiKey),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    accounts.push(newAccount);
    writeData('accounts', accounts);

    console.log(`[OZON] API授权成功: ${name}`);
    res.json({ success: true, message: 'OZON API授权成功', data: { id: newAccount.id, name } });
  } catch (error) {
    console.error('[OZON] 授权失败:', error);
    res.status(500).json({ success: false, error: 'OZON API授权失败: ' + error.message });
  }
});

/**
 * POST /api/accounts/ozon-test
 * 测试 OZON API 连接
 */
router.post('/ozon-test', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.body;
    const accounts = readData('accounts') || [];
    const account = accounts.find(a => a.id === accountId && a.platform === 'ozon');
    if (!account) {
      return res.status(404).json({ success: false, error: 'OZON账号不存在' });
    }

    const clientId = decrypt(account.clientId);
    const apiKey = decrypt(account.apiKey);

    // 测试 OZON API — 用 /v1/ping 检查连通性
    const response = await fetch('https://api-seller.ozon.ru/v1/ping', {
      method: 'GET',
      headers: {
        'Client-Id': clientId,
        'Api-Key': apiKey
      }
    });

    const text = await response.text();
    if (response.status === 200) {
      res.json({ success: true, message: 'OZON API连接成功' });
    } else if (response.status === 403) {
      res.status(400).json({ success: false, error: 'OZON API 认证失败 (403)：Client ID 或 API Key 不正确。请检查 OZON Seller 后台 → 设置 → API 密钥 中的凭证' });
    } else {
      res.status(400).json({ success: false, error: 'OZON API 请求失败 (' + response.status + ')：可能是网络不可达或被墙，请确认服务器可以访问 api-seller.ozon.ru', detail: text?.substring(0, 200) });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'OZON API测试失败: ' + error.message });
  }
});

export default router;
