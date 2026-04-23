// JWT认证和安全中间件
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { findUserById, findUserByEmail, updateUser } from '../services/dbService.js';

// 安全配置 - 从环境变量读取，使用默认密钥作为后备
const JWT_SECRET = process.env.JWT_SECRET || 'claw-default-secret-key-for-development-only-32chars';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const TOKEN_BLACKLIST_KEY = 'tokenBlacklist';
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCKOUT_DURATION = (parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 15) * 60 * 1000;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1分钟
const RATE_LIMIT_MAX = 100; // 每分钟100个请求

// 安全启动检查 - 只在生产环境强制要求
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error('❌ 安全错误: 生产环境 JWT_SECRET 未设置或太短（至少32字符）');
  console.error('请运行: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  console.error('然后设置环境变量: export JWT_SECRET=<生成的密钥>');
  process.exit(1);
}

// 警告：如果使用默认密钥
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ 警告: 使用默认JWT密钥，请在生产环境设置 JWT_SECRET 环境变量');
}

// 内存缓存
const rateLimitStore = new Map();
const tokenBlacklist = new Set();

// 生成JWT令牌
export const generateToken = (userId, deviceInfo = {}) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    userId: String(userId),
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7天，显式时间戳避免 expiresIn 字符串解析问题
    device: deviceInfo,
    jti: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  return jwt.sign(payload, JWT_SECRET);
};

// 验证JWT令牌
export const verifyToken = (token) => {
  try {
    // 检查令牌是否在黑名单中
    if (tokenBlacklist.has(token)) {
      return null;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token验证失败:', error.message);
    return null;
  }
};

// 吊销令牌（用于登出）
export const revokeToken = (token) => {
  tokenBlacklist.add(token);
  // 定期清理过期的黑名单条目
  setTimeout(() => tokenBlacklist.delete(token), 7 * 24 * 60 * 60 * 1000);
};

// 主认证中间件
export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '未提供认证令牌',
      code: 'AUTH_MISSING_TOKEN'
    });
  }

  const token = authHeader.split(' ')[1];
  
  // 检查令牌长度
  if (token.length < 50) {
    return res.status(401).json({
      success: false,
      error: '无效的令牌格式',
      code: 'AUTH_INVALID_FORMAT'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: '无效或已过期的令牌',
      code: 'AUTH_INVALID_TOKEN'
    });
  }

  // 检查用户状态 (异步) - 已增强 dbService.js 防止数据库错误崩溃
  let user;
  try {
    user = await findUserById(decoded.userId);
  } catch (dbError) {
    console.error('用户查询失败:', dbError.message);
    // findUserById 已内置重试逻辑，这里如果还失败说明真的有问题
    return res.status(401).json({
      success: false,
      error: '用户不存在或会话已失效，请重新登录',
      code: 'AUTH_USER_NOT_FOUND'
    });
  }

  if (!user) {
    // 降级：检查内置用户（不在数据库中，但登录后可获得token）
    // 按 email 匹配，因为内置用户的UUID与数据库中存储的id不同
    const BUILTIN_USERS = {
      'admin@claw.com': { id: 'user-admin-001', email: 'admin@claw.com', name: '管理员', role: 'admin', plan: 'enterprise', password: null },
      'user@claw.com': { id: 'user-demo-001', email: 'user@claw.com', name: '演示用户', role: 'user', plan: 'premium', password: null },
      'test@claw.com': { id: 'user-test-001', email: 'test@claw.com', name: '测试用户', role: 'user', plan: 'basic', password: null },
    };
    // 根据 token 中的 email 找到内置用户（UUID与BUILTIN的id不同，只能靠email匹配）
    const builtinUser = decoded.email ? BUILTIN_USERS[decoded.email] : null;
    if (builtinUser) {
      user = builtinUser;
    } else {
      return res.status(401).json({
        success: false,
        error: '用户不存在或会话已失效，请重新登录',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }
  }

  // 检查用户是否被禁用
  if (user.status === 'suspended' || user.status === 'banned') {
    return res.status(403).json({
      success: false,
      error: '账户已被限制',
      code: 'AUTH_ACCOUNT_SUSPENDED'
    });
  }

  req.user = user;
  req.userId = decoded.userId;
  req.token = token;
  req.tokenPayload = decoded;
  
  next();
};

// 可选认证中间件
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (decoded) {
      const user = await findUserById(decoded.userId);
      if (user && user.status !== 'suspended' && user.status !== 'banned') {
        req.user = user;
        req.userId = decoded.userId;
        req.token = token;
        req.tokenPayload = decoded;
      }
    }
  }
  
  next();
};

// 角色权限中间件
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '需要认证',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userRole = req.user.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: '权限不足',
        code: 'AUTH_INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
};

// 管理员中间件
export const adminMiddleware = requireRole(['admin', 'super_admin']);

// 速率限制中间件
export const rateLimitMiddleware = (windowMs = RATE_LIMIT_WINDOW, max = RATE_LIMIT_MAX) => {
  return (req, res, next) => {
    const key = req.userId ? req.userId : req.ip;
    const now = Date.now();
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    } else {
      const data = rateLimitStore.get(key);
      
      if (now > data.resetTime) {
        data.count = 1;
        data.resetTime = now + windowMs;
      } else {
        data.count++;
        
        if (data.count > max) {
          const waitTime = Math.ceil((data.resetTime - now) / 1000);
          return res.status(429).json({
            success: false,
            error: `请求过于频繁，请${waitTime}秒后再试`,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: waitTime
          });
        }
      }
      
      rateLimitStore.set(key, data);
    }
    
    // 清理过期条目
    if (Math.random() < 0.01) { // 1%概率清理
      const now = Date.now();
      for (const [key, data] of rateLimitStore.entries()) {
        if (now > data.resetTime) {
          rateLimitStore.delete(key);
        }
      }
    }
    
    next();
  };
};

// 防止暴力破解的登录保护
export const loginProtectionMiddleware = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next();
  
  const user = await findUserByEmail(email);
  if (!user) return next();
  
  const now = Date.now();
  const lastAttemptTime = user.lastLoginAttemptTime || 0;
  const attempts = user.loginAttempts || 0;
  
  // 检查是否在锁定期间
  if (user.lockedUntil && now < user.lockedUntil) {
    const remaining = Math.ceil((user.lockedUntil - now) / 1000 / 60);
    return res.status(429).json({
      success: false,
      error: `账户已锁定，${remaining}分钟后重试`,
      code: 'ACCOUNT_LOCKED'
    });
  }

  req.loginUser = user;
  req.loginProtection = {
    attempts,
    lastAttemptTime,
    lockedUntil: user.lockedUntil
  };

  next();
};

// 记录登录尝试
export const recordLoginAttempt = async (email, success) => {
  const user = await findUserByEmail(email);
  if (!user) return;

  const now = Date.now();
  let updates = {};

  if (success) {
    // 登录成功，重置尝试次数
    updates = {
      loginAttempts: 0,
      lastLoginAttemptTime: now,
      lockedUntil: null,
      lastLoginTime: now
    };
  } else {
    // 登录失败，增加尝试次数
    const attempts = (user.loginAttempts || 0) + 1;
    updates = {
      loginAttempts: attempts,
      lastLoginAttemptTime: now
    };
    
    // 超过最大尝试次数，锁定账户
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      updates.lockedUntil = now + LOCKOUT_DURATION;
    }
  }

  await updateUser(user.id, updates);
};

// 别名导出
export const authenticateToken = authMiddleware;

export { JWT_SECRET };
