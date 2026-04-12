/**
 * 会员管理 API
 * 管理用户会员信息和额度
 */

import express from 'express';
import { readData, writeData } from '../services/dataStore.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 会员套餐定义
const PLANS = {
  free: {
    name: '免费版',
    quotas: {
      dailyGenerate: 5,
      totalProducts: 20,
      aiCallsPerDay: 20,
      automationTasks: 2
    }
  },
  basic: {
    name: '基础版',
    quotas: {
      dailyGenerate: 50,
      totalProducts: 200,
      aiCallsPerDay: 200,
      automationTasks: 20
    }
  },
  premium: {
    name: '高级版',
    quotas: {
      dailyGenerate: 200,
      totalProducts: 1000,
      aiCallsPerDay: 1000,
      automationTasks: 100
    }
  },
  enterprise: {
    name: '企业版',
    quotas: {
      dailyGenerate: -1, // 无限制
      totalProducts: -1,
      aiCallsPerDay: -1,
      automationTasks: -1
    }
  }
};

/**
 * GET /api/membership
 * 获取会员信息
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = readData('users') || [];
    const user = users.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    
    const plan = user.plan || 'free';
    const planInfo = PLANS[plan] || PLANS.free;
    
    // 获取额度使用情况
    const quotas = readData('quotas') || [];
    const userQuota = quotas.find(q => q.userId === req.user.userId) || {
      userId: req.user.userId,
      dailyGenerate: 0,
      totalProducts: 0,
      aiCallsToday: 0,
      activeTasks: 0,
      lastReset: getTodayStart()
    };
    
    // 检查是否需要重置每日额度
    if (userQuota.lastReset < getTodayStart()) {
      userQuota.dailyGenerate = 0;
      userQuota.aiCallsToday = 0;
      userQuota.lastReset = getTodayStart();
      saveUserQuota(userQuota);
    }
    
    res.json({
      success: true,
      data: {
        userId: req.user.userId,
        plan,
        planName: planInfo.name,
        quotas: planInfo.quotas,
        used: {
          dailyGenerate: userQuota.dailyGenerate,
          totalProducts: userQuota.totalProducts,
          aiCallsToday: userQuota.aiCallsToday,
          activeTasks: userQuota.activeTasks
        },
        expiresAt: user.expiresAt || null,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('获取会员信息失败:', error);
    res.status(500).json({ success: false, error: '获取会员信息失败' });
  }
});

/**
 * GET /api/membership/plans
 * 获取所有可用套餐
 */
router.get('/plans', async (req, res) => {
  try {
    const plansList = Object.entries(PLANS).map(([key, value]) => ({
      plan: key,
      name: value.name,
      quotas: value.quotas
    }));
    
    res.json({ success: true, data: plansList });
  } catch (error) {
    console.error('获取套餐列表失败:', error);
    res.status(500).json({ success: false, error: '获取套餐列表失败' });
  }
});

/**
 * GET /api/quota
 * 获取用户额度详情
 */
router.get('/quota', authenticateToken, async (req, res) => {
  try {
    const users = readData('users') || [];
    const user = users.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    
    const plan = user.plan || 'free';
    const planInfo = PLANS[plan] || PLANS.free;
    
    // 获取或创建额度记录
    const quotas = readData('quotas') || [];
    let userQuota = quotas.find(q => q.userId === req.user.userId);
    
    if (!userQuota) {
      userQuota = {
        userId: req.user.userId,
        dailyGenerate: 0,
        totalProducts: 0,
        aiCallsToday: 0,
        activeTasks: 0,
        lastReset: getTodayStart()
      };
      quotas.push(userQuota);
      writeData('quotas', quotas);
    }
    
    // 检查是否需要重置每日额度
    if (userQuota.lastReset < getTodayStart()) {
      userQuota.dailyGenerate = 0;
      userQuota.aiCallsToday = 0;
      userQuota.lastReset = getTodayStart();
      saveUserQuota(userQuota);
    }
    
    // 计算剩余额度
    const remaining = {
      dailyGenerate: planInfo.quotas.dailyGenerate === -1 
        ? -1 
        : Math.max(0, planInfo.quotas.dailyGenerate - userQuota.dailyGenerate),
      totalProducts: planInfo.quotas.totalProducts === -1 
        ? -1 
        : Math.max(0, planInfo.quotas.totalProducts - userQuota.totalProducts),
      aiCallsToday: planInfo.quotas.aiCallsPerDay === -1 
        ? -1 
        : Math.max(0, planInfo.quotas.aiCallsPerDay - userQuota.aiCallsToday),
      automationTasks: planInfo.quotas.automationTasks === -1 
        ? -1 
        : Math.max(0, planInfo.quotas.automationTasks - userQuota.activeTasks)
    };
    
    // 计算使用百分比
    const usagePercent = {
      dailyGenerate: planInfo.quotas.dailyGenerate === -1 
        ? 0 
        : Math.round((userQuota.dailyGenerate / planInfo.quotas.dailyGenerate) * 100),
      totalProducts: planInfo.quotas.totalProducts === -1 
        ? 0 
        : Math.round((userQuota.totalProducts / planInfo.quotas.totalProducts) * 100),
      aiCallsToday: planInfo.quotas.aiCallsPerDay === -1 
        ? 0 
        : Math.round((userQuota.aiCallsToday / planInfo.quotas.aiCallsPerDay) * 100),
      automationTasks: planInfo.quotas.automationTasks === -1 
        ? 0 
        : Math.round((userQuota.activeTasks / planInfo.quotas.automationTasks) * 100)
    };
    
    res.json({
      success: true,
      data: {
        plan,
        limits: planInfo.quotas,
        used: {
          dailyGenerate: userQuota.dailyGenerate,
          totalProducts: userQuota.totalProducts,
          aiCallsToday: userQuota.aiCallsToday,
          activeTasks: userQuota.activeTasks
        },
        remaining,
        usagePercent,
        lastReset: userQuota.lastReset,
        nextReset: getTomorrowStart()
      }
    });
  } catch (error) {
    console.error('获取额度详情失败:', error);
    res.status(500).json({ success: false, error: '获取额度详情失败' });
  }
});

/**
 * POST /api/quota/consume
 * 消费额度（内部接口，被其他API调用）
 */
router.post('/consume', authenticateToken, async (req, res) => {
  try {
    const { type, amount = 1 } = req.body;
    const validTypes = ['dailyGenerate', 'totalProducts', 'aiCallsToday', 'activeTasks'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: `无效的额度类型: ${type}` 
      });
    }
    
    const users = readData('users') || [];
    const user = users.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    
    const plan = user.plan || 'free';
    const planInfo = PLANS[plan] || PLANS.free;
    const limit = planInfo.quotas[type];
    
    // -1 表示无限制
    if (limit === -1) {
      return res.json({ success: true, allowed: true, remaining: -1 });
    }
    
    const quotas = readData('quotas') || [];
    let userQuota = quotas.find(q => q.userId === req.user.userId);
    
    if (!userQuota) {
      userQuota = {
        userId: req.user.userId,
        dailyGenerate: 0,
        totalProducts: 0,
        aiCallsToday: 0,
        activeTasks: 0,
        lastReset: getTodayStart()
      };
      quotas.push(userQuota);
    }
    
    // 检查额度
    if (userQuota[type] + amount > limit) {
      return res.json({ 
        success: true, 
        allowed: false, 
        error: '额度不足',
        remaining: limit - userQuota[type]
      });
    }
    
    // 消耗额度
    userQuota[type] += amount;
    saveUserQuota(userQuota);
    
    res.json({ 
      success: true, 
      allowed: true, 
      remaining: limit - userQuota[type],
      consumed: amount
    });
  } catch (error) {
    console.error('消费额度失败:', error);
    res.status(500).json({ success: false, error: '消费额度失败' });
  }
});

/**
 * POST /api/quota/release
 * 释放额度（完成任务时调用）
 */
router.post('/release', authenticateToken, async (req, res) => {
  try {
    const { type, amount = 1 } = req.body;
    const validTypes = ['activeTasks'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: `${type} 类型不支持释放额度` 
      });
    }
    
    const quotas = readData('quotas') || [];
    const userQuota = quotas.find(q => q.userId === req.user.userId);
    
    if (!userQuota) {
      return res.json({ success: true, message: '无额度记录' });
    }
    
    // 释放额度
    userQuota[type] = Math.max(0, userQuota[type] - amount);
    saveUserQuota(userQuota);
    
    res.json({ 
      success: true, 
      released: amount,
      current: userQuota[type]
    });
  } catch (error) {
    console.error('释放额度失败:', error);
    res.status(500).json({ success: false, error: '释放额度失败' });
  }
});

/**
 * POST /api/quota/reset
 * 重置用户额度（管理员）
 */
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    const { userId, type } = req.body;
    
    // 简单的管理员检查（实际应该检查用户角色）
    const isAdmin = req.user.email && req.user.email.includes('admin');
    
    if (!isAdmin) {
      // 非管理员只能重置自己的额度
      if (userId && userId !== req.user.userId) {
        return res.status(403).json({ 
          success: false, 
          error: '无权限重置其他用户的额度' 
        });
      }
    }
    
    const targetUserId = userId || req.user.userId;
    const quotas = readData('quotas') || [];
    const userQuota = quotas.find(q => q.userId === targetUserId);
    
    if (!userQuota) {
      return res.json({ success: true, message: '无额度记录，无需重置' });
    }
    
    if (type && ['dailyGenerate', 'aiCallsToday'].includes(type)) {
      userQuota[type] = 0;
      userQuota.lastReset = getTodayStart();
    } else if (!type) {
      // 重置所有每日额度
      userQuota.dailyGenerate = 0;
      userQuota.aiCallsToday = 0;
      userQuota.lastReset = getTodayStart();
    } else {
      return res.status(400).json({ 
        success: false, 
        error: `无效的额度类型: ${type}` 
      });
    }
    
    saveUserQuota(userQuota);
    
    res.json({ 
      success: true, 
      message: '额度已重置',
      userId: targetUserId,
      type: type || 'all'
    });
  } catch (error) {
    console.error('重置额度失败:', error);
    res.status(500).json({ success: false, error: '重置额度失败' });
  }
});

/**
 * POST /api/membership/upgrade
 * 升级会员（模拟，实际应该对接支付）
 */
router.post('/upgrade', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;
    
    if (!PLANS[plan]) {
      return res.status(400).json({ 
        success: false, 
        error: `无效的套餐: ${plan}，可用套餐: ${Object.keys(PLANS).join(', ')}` 
      });
    }
    
    const users = readData('users') || [];
    const index = users.findIndex(u => u.id === req.user.userId);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    
    // 实际应该对接支付系统
    // 这里只是模拟升级
    users[index].plan = plan;
    users[index].expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30天后过期
    users[index].upgradedAt = Date.now();
    writeData('users', users);
    
    res.json({
      success: true,
      message: '套餐升级成功',
      data: {
        plan,
        planName: PLANS[plan].name,
        expiresAt: users[index].expiresAt
      }
    });
  } catch (error) {
    console.error('升级套餐失败:', error);
    res.status(500).json({ success: false, error: '升级套餐失败' });
  }
});

/**
 * 保存用户额度
 */
function saveUserQuota(userQuota) {
  const quotas = readData('quotas') || [];
  const index = quotas.findIndex(q => q.userId === userQuota.userId);
  
  if (index >= 0) {
    quotas[index] = userQuota;
  } else {
    quotas.push(userQuota);
  }
  
  writeData('quotas', quotas);
}

/**
 * 获取今天开始的毫秒时间戳
 */
function getTodayStart() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

/**
 * 获取明天开始的毫秒时间戳
 */
function getTomorrowStart() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

export default router;
