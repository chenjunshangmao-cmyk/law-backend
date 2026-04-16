// 用户认证路由
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { 
  findUserByEmail, 
  createUser, 
  findUserById,
  getQuotaByUserId,
  updateUser
} from '../services/dataStore.js';
import { 
  generateToken, 
  authMiddleware, 
  optionalAuth,
  loginProtectionMiddleware,
  recordLoginAttempt,
  revokeToken,
  JWT_SECRET
} from '../middleware/auth.js';
import { 
  validateRegister, 
  validateLogin 
} from '../middleware/validation.js';




// ==========================================
// 🚀 快速修复：硬编码测试用户（临时方案）
// ==========================================

// 临时测试用户数据
const TEMP_USERS = {
  'admin@claw.com': {
    id: 'temp-admin-001',
    email: 'admin@claw.com',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhfMZ/iC6CwHvROzYqWbOa', // admin123
    name: '管理员',
    role: 'admin',
    plan: 'pro',
    quota_used: 0,
    quota_total: 1000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  'test@claw.com': {
    id: 'temp-test-001',
    email: 'test@claw.com',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhfMZ/iC6CwHvROzYqWbOa', // admin123
    name: '测试用户',
    role: 'user',
    plan: 'basic',
    quota_used: 0,
    quota_total: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};

// 修改 findUserByEmail 函数（临时）
const originalFindUserByEmail = findUserByEmail;
findUserByEmail = function(email) {
  // 先检查临时用户
  if (TEMP_USERS[email]) {
    console.log('🔧 [临时修复] 使用硬编码用户:', email);
    return TEMP_USERS[email];
  }
  
  // 然后尝试数据库查询
  try {
    return originalFindUserByEmail(email);
  } catch (error) {
    console.log('⚠️ 数据库查询失败，使用临时用户:', error.message);
    return TEMP_USERS[email] || null;
  }
};

// 修改 findUserById 函数（临时）
const originalFindUserById = findUserById;
findUserById = function(id) {
  // 检查临时用户
  const tempUser = Object.values(TEMP_USERS).find(user => user.id === id);
  if (tempUser) {
    return tempUser;
  }
  
  // 尝试数据库查询
  try {
    return originalFindUserById(id);
  } catch (error) {
    console.log('⚠️ 数据库查询失败:', error.message);
    return null;
  }
};

console.log('✅ 临时登录修复已激活');
console.log('   可用账号: admin@claw.com / admin123');
console.log('            test@claw.com / admin123');

const router = express.Router();

// POST /api/auth/register - 用户注册
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 检查邮箱是否已存在
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '该邮箱已被注册',
        code: 'EMAIL_EXISTS'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12); // 提高安全强度

    // 创建用户
    const user = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: 'user',
      plan: 'free',
      status: 'active',
      loginAttempts: 0,
      lastLoginTime: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const createdUser = createUser(user);
    if (!createdUser) {
      return res.status(500).json({
        success: false,
        error: '创建用户失败',
        code: 'USER_CREATION_FAILED'
      });
    }

    // 生成JWT（包含设备信息）
    const deviceInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
      timestamp: new Date().toISOString()
    };
    const token = generateToken(createdUser.id, deviceInfo);

    // 返回用户信息（不含密码）
    const { password: _, ...userWithoutPassword } = createdUser;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        tokenExpiresIn: '7d',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /api/auth/login - 用户登录
router.post('/login', validateLogin, loginProtectionMiddleware, async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    console.log(`[登录尝试] 邮箱: ${email}, 时间: ${new Date().toISOString()}`);

    // 查找用户
    const user = findUserByEmail(email);
    if (!user) {
      console.log(`[登录失败] 用户不存在: ${email}`);
      // 记录失败尝试（针对已存在的用户）
      recordLoginAttempt(email, false);
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    console.log(`[登录信息] 找到用户: ${email}, ID: ${user.id}, 状态: ${user.status}`);

    // 验证密码
    console.log(`[密码验证] 开始验证密码...`);
    const isValid = await bcrypt.compare(password, user.password);
    console.log(`[密码验证] 结果: ${isValid}`);
    
    if (!isValid) {
      console.log(`[登录失败] 密码错误: ${email}`);
      // 记录失败尝试
      recordLoginAttempt(email, false);
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
        code: 'INVALID_CREDENTIALS',
        remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - ((user.loginAttempts || 0) + 1))
      });
    }

    // 检查用户状态
    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({
        success: false,
        error: '账户已被限制，请联系管理员',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // 检查账户是否被锁定
    if (user.lockedUntil && Date.now() < user.lockedUntil) {
      const remaining = Math.ceil((user.lockedUntil - Date.now()) / 1000 / 60);
      return res.status(429).json({
        success: false,
        error: `账户已锁定，${remaining}分钟后重试`,
        code: 'ACCOUNT_LOCKED'
      });
    }

    // 登录成功，重置尝试次数
    recordLoginAttempt(email, true);

    // 更新最后登录时间
    updateUser(user.id, {
      lastLoginTime: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 生成JWT（根据rememberMe设置不同有效期）
    const expiresIn = rememberMe ? '30d' : '7d';
    const deviceInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
      timestamp: new Date().toISOString()
    };
    
    const tokenPayload = {
      userId: user.id,
      iat: Math.floor(Date.now() / 1000),
      device: deviceInfo,
      jti: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn });

    // 返回用户信息（不含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        tokenExpiresIn: expiresIn,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /api/auth/logout - 用户登出
router.post('/logout', authMiddleware, (req, res) => {
  try {
    // 吊销令牌
    if (req.token) {
      revokeToken(req.token);
    }
    
    res.json({
      success: true,
      message: '已成功登出',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      error: '登出失败',
      code: 'LOGOUT_FAILED'
    });
  }
});

// POST /api/auth/refresh - 刷新令牌
router.post('/refresh', optionalAuth, (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '需要重新登录',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }
    
    // 吊销旧令牌（如果存在）
    if (req.token) {
      revokeToken(req.token);
    }
    
    // 生成新令牌
    const deviceInfo = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
      timestamp: new Date().toISOString()
    };
    const newToken = generateToken(req.userId, deviceInfo);
    
    const { password: _, ...userWithoutPassword } = req.user;
    
    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token: newToken,
        tokenExpiresIn: '7d',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('刷新令牌错误:', error);
    res.status(500).json({
      success: false,
      error: '刷新令牌失败',
      code: 'REFRESH_TOKEN_FAILED'
    });
  }
});

// GET /api/auth/profile - 获取用户信息
router.get('/profile', authMiddleware, (req, res) => {
  try {
    const { password: _, ...userWithoutPassword } = req.user;
    
    // 获取用户统计信息
    const quota = getQuotaByUserId(req.userId);
    
    const enhancedUser = {
      ...userWithoutPassword,
      statistics: {
        quotaRemaining: {
          text: quota.textLimit - quota.textGenerations,
          image: quota.imageLimit - quota.imageGenerations,
          products: quota.productsLimit
        },
        lastLoginTime: req.user.lastLoginTime,
        accountAge: Math.floor((new Date() - new Date(req.user.createdAt)) / (1000 * 60 * 60 * 24))
      }
    };
    
    res.json({
      success: true,
      data: {
        user: enhancedUser,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
      code: 'GET_PROFILE_FAILED'
    });
  }
});

// GET /api/auth/quota - 获取用户额度
router.get('/quota', authMiddleware, (req, res) => {
  try {
    const quota = getQuotaByUserId(req.userId);
    const userProducts = getProductsByUser(req.userId);
    
    const quotaDetails = {
      plan: quota.plan,
      limits: {
        text: quota.textLimit,
        image: quota.imageLimit,
        products: quota.productsLimit
      },
      usage: {
        text: quota.textGenerations,
        image: quota.imageGenerations,
        products: userProducts.length
      },
      remaining: {
        text: Math.max(0, quota.textLimit - quota.textGenerations),
        image: Math.max(0, quota.imageLimit - quota.imageGenerations),
        products: Math.max(0, quota.productsLimit - userProducts.length)
      },
      usagePercentages: {
        text: Math.min(100, (quota.textGenerations / quota.textLimit) * 100),
        image: Math.min(100, (quota.imageGenerations / quota.imageLimit) * 100),
        products: Math.min(100, (userProducts.length / quota.productsLimit) * 100)
      },
      updatedAt: quota.updatedAt
    };
    
    // 检查是否接近限制
    const warnings = [];
    if (quotaDetails.usagePercentages.text > 80) {
      warnings.push('文本生成额度即将用完');
    }
    if (quotaDetails.usagePercentages.image > 80) {
      warnings.push('图片生成额度即将用完');
    }
    if (quotaDetails.usagePercentages.products > 80) {
      warnings.push('产品数量即将达到上限');
    }
    
    res.json({
      success: true,
      data: {
        quota: quotaDetails,
        warnings,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取额度错误:', error);
    res.status(500).json({
      success: false,
      error: '获取额度失败',
      code: 'GET_QUOTA_FAILED'
    });
  }
});

// 常量定义（从auth中间件导入）
const MAX_LOGIN_ATTEMPTS = 5;

// 为数据存储函数添加缺失导入
const getProductsByUser = (userId) => {
  const products = getProducts();
  return products.filter(p => p.userId === userId);
};

const getProducts = () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const productsFile = path.join(process.cwd(), 'data', 'products.json');
    if (!fs.existsSync(productsFile)) return [];
    const data = fs.readFileSync(productsFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取产品数据错误:', error);
    return [];
  }
};

export default router;
