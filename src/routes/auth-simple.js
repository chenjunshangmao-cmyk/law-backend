// ==========================================
// 简化认证路由 - 临时解决方案
// 绕过数据库问题，快速实现登录功能
// ==========================================
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 硬编码测试用户
const TEMP_USERS = {
  'admin@claw.com': {
    id: 'admin-001',
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
    id: 'test-001',
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

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'claw-secret-key-2026';

// 查找用户
function findUserByEmail(email) {
  return TEMP_USERS[email] || null;
}

// 查找用户by ID
function findUserById(id) {
  return Object.values(TEMP_USERS).find(user => user.id === id) || null;
}

// 创建用户
function createUser(userData) {
  const id = uuidv4();
  const user = {
    id,
    ...userData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  TEMP_USERS[userData.email] = user;
  return user;
}

// 获取用户额度
function getQuotaByUserId(userId) {
  const user = findUserById(userId);
  if (!user) return null;
  
  return {
    used: user.quota_used || 0,
    total: user.quota_total || 100,
    remaining: (user.quota_total || 100) - (user.quota_used || 0)
  };
}

// 更新用户
function updateUser(userId, updates) {
  const user = findUserById(userId);
  if (!user) return null;
  
  Object.assign(user, updates, { updated_at: new Date().toISOString() });
  return user;
}

// ==========================================
// 路由定义
// ==========================================

// POST /api/auth/register - 用户注册
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 简单验证
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '邮箱和密码不能为空'
      });
    }

    // 检查邮箱是否已存在
    if (TEMP_USERS[email]) {
      return res.status(400).json({
        success: false,
        error: '该邮箱已被注册'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = createUser({
      email,
      password_hash: hashedPassword,
      name: name || email.split('@')[0],
      role: 'user',
      plan: 'free',
      quota_used: 0,
      quota_total: 100
    });

    // 生成token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: '注册成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// POST /api/auth/login - 用户登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 简单验证
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '邮箱和密码不能为空'
      });
    }

    // 查找用户
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误'
      });
    }

    // 生成token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// GET /api/auth/profile - 获取用户信息
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '未提供认证令牌'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = findUserById(decoded.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan,
          created_at: user.created_at
        }
      });

    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: '认证令牌无效'
      });
    }

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// GET /api/auth/quota - 获取用户额度
router.get('/quota', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '未提供认证令牌'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const quota = getQuotaByUserId(decoded.userId);
      
      if (!quota) {
        return res.status(404).json({
          success: false,
          error: '用户不存在'
        });
      }

      res.status(200).json({
        success: true,
        quota
      });

    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: '认证令牌无效'
      });
    }

  } catch (error) {
    console.error('获取额度错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// POST /api/auth/logout - 用户登出
router.post('/logout', async (req, res) => {
  res.status(200).json({
    success: true,
    message: '登出成功'
  });
});

export default router;