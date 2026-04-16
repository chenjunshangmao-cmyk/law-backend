// 简化版认证路由 - 结合数据库API和简化认证
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// 尝试导入数据库服务，如果失败则使用内存存储
let dbService;
let useDatabase = false;

try {
  dbService = await import('../services/dbService.js');
  useDatabase = true;
  console.log('✅ 数据库服务可用，使用数据库认证');
} catch (error) {
  console.log('⚠️ 数据库服务不可用，使用内存认证');
}

const router = express.Router();

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'claw-secret-key-2026';

// 内存用户存储（后备方案）
const memoryUsers = [
  {
    id: 'user-admin-001',
    email: 'admin@claw.com',
    password: '$2a$10$TBy2Jt7QtDF5jB9kg6o0He3S0MXUc6vV71hPq8trbGVwXqT8zBkfK', // admin123
    name: '管理员',
    role: 'admin',
    plan: 'enterprise',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-test-001',
    email: 'test@claw.com',
    password: '$2a$10$TBy2Jt7QtDF5jB9kg6o0He3S0MXUc6vV71hPq8trbGVwXqT8zBkfK', // test123456
    name: '测试用户',
    role: 'user',
    plan: 'premium',
    created_at: new Date().toISOString()
  }
];

// 查找用户函数
async function findUserByEmail(email) {
  if (useDatabase && dbService.findUserByEmail) {
    return await dbService.findUserByEmail(email);
  }
  return memoryUsers.find(user => user.email === email);
}

async function createUser(userData) {
  if (useDatabase && dbService.createUser) {
    return await dbService.createUser(userData);
  }
  
  const user = {
    id: 'user-' + uuidv4(),
    ...userData,
    created_at: new Date().toISOString()
  };
  memoryUsers.push(user);
  return user;
}

// 生成JWT令牌
function generateToken(userId, email, role = 'user') {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/login - 用户登录（简化版）
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '邮箱和密码不能为空'
      });
    }

    // 查找用户
    const user = await findUserByEmail(email);
    if (!user) {
      // 检查是否使用预定义用户
      const predefinedUser = memoryUsers.find(u => u.email === email);
      if (predefinedUser) {
        // 验证密码
        const isValid = await bcrypt.compare(password, predefinedUser.password);
        if (isValid) {
          const token = generateToken(predefinedUser.id, email, predefinedUser.role);
          return res.json({
            success: true,
            data: {
              user: {
                id: predefinedUser.id,
                email: predefinedUser.email,
                name: predefinedUser.name,
                role: predefinedUser.role,
                plan: predefinedUser.plan
              },
              token
            }
          });
        }
      }
      
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误'
      });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误'
      });
    }

    // 获取用户角色和计划
    const role = user.role || 'user';
    const plan = user.plan || 'free';

    // 生成JWT
    const token = generateToken(user.id, email, role);

    // 返回用户信息（不含密码）
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name || email.split('@')[0],
      role,
      plan,
      created_at: user.created_at
    };

    res.json({
      success: true,
      data: {
        user: userData,
        token
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

// POST /api/auth/register - 用户注册（简化版）
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '邮箱和密码不能为空'
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '该邮箱已被注册'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await createUser({
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: 'user',
      plan: 'free'
    });

    // 生成JWT
    const token = generateToken(user.id, email, 'user');

    // 返回用户信息（不含密码）
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      plan: user.plan || 'free',
      created_at: user.created_at
    };

    res.status(201).json({
      success: true,
      data: {
        user: userData,
        token
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

// GET /api/auth/profile - 获取用户信息
router.get('/profile', (req, res) => {
  try {
    // 这个端点需要token验证，由中间件处理
    // 返回简化信息
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: '未提供认证令牌'
      });
    }

    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // 这里应该查询用户信息，但简化版直接返回
      res.json({
        success: true,
        data: {
          user: {
            id: decoded.userId,
            email: decoded.email,
            name: decoded.email.split('@')[0],
            role: decoded.role || 'user',
            plan: 'premium'
          }
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: '无效的令牌'
      });
    }
  } catch (error) {
    console.error('获取个人资料错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// GET /api/auth/status - 认证状态检查
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      authenticated: false,
      message: '请先登录',
      authMode: useDatabase ? 'database' : 'memory'
    }
  });
});

export default router;