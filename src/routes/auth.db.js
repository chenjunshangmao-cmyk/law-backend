// 用户认证路由 - 数据库版本
import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { 
  findUserByEmail, 
  createUser, 
  findUserById,
  getQuotaByUserId,
  updateLastLogin
} from '../services/dbService.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register - 用户注册
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
      plan: 'free'
    });

    if (!user) {
      return res.status(500).json({
        success: false,
        error: '创建用户失败'
      });
    }

    // 生成JWT
    const token = generateToken(user.id);

    // 返回用户信息（不含密码）
    const userData = user.toJSON();
    delete userData.password;

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

// POST /api/auth/login - 用户登录
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

    // 更新最后登录时间
    await updateLastLogin(user.id);

    // 生成JWT
    const token = generateToken(user.id);

    // 返回用户信息（不含密码）
    const userData = user.toJSON();
    delete userData.password;

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

// GET /api/auth/profile - 获取用户信息
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    const userData = user.toJSON();
    delete userData.password;
    
    res.json({
      success: true,
      data: { user: userData }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

// GET /api/auth/quota - 获取用户额度
router.get('/quota', authMiddleware, async (req, res) => {
  try {
    const quota = await getQuotaByUserId(req.userId);
    
    res.json({
      success: true,
      data: {
        quota: {
          plan: quota.plan,
          textGenerations: quota.textGenerations,
          textLimit: quota.textLimit,
          textRemaining: quota.textLimit - quota.textGenerations,
          imageGenerations: quota.imageGenerations,
          imageLimit: quota.imageLimit,
          imageRemaining: quota.imageLimit - quota.imageGenerations,
          productsLimit: quota.productsLimit,
          tasksLimit: quota.tasksLimit,
          updatedAt: quota.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('获取额度错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器错误'
    });
  }
});

export default router;
