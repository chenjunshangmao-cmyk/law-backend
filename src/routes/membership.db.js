/**
 * 会员管理 API - 数据库版本
 * 管理用户会员信息和额度
 */

import express from 'express';
import {
  findUserById,
  getQuotaByUserId,
  updateQuota
} from '../services/dbService.js';

// 别名，保持代码兼容性
const getUserById = findUserById;
const getQuotaByUser = getQuotaByUserId;
const updateUserQuota = updateQuota;
import { authenticateToken, rateLimitMiddleware, requireRole } from '../middleware/auth.js';

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
    },
    price: 0,
    features: ['基础产品管理', '每天5次AI生成', '最多20个产品', '2个自动化任务']
  },
  basic: {
    name: '基础版',
    quotas: {
      dailyGenerate: 50,
      totalProducts: 200,
      aiCallsPerDay: 200,
      automationTasks: 20
    },
    price: 199,
    features: ['高级产品管理', '每天50次AI生成', '最多200个产品', '20个自动化任务', '浏览器自动化']
  },
  premium: {
    name: '高级版',
    quotas: {
      dailyGenerate: 200,
      totalProducts: 1000,
      aiCallsPerDay: 1000,
      automationTasks: 100
    },
    price: 499,
    features: ['无限制产品管理', '每天200次AI生成', '最多1000个产品', '100个自动化任务', '浏览器自动化', '数字人视频生成']
  },
  enterprise: {
    name: '企业版',
    quotas: {
      dailyGenerate: -1, // 无限制
      totalProducts: -1,
      aiCallsPerDay: -1,
      automationTasks: -1
    },
    price: 1999,
    features: ['所有功能无限制', '专属技术支持', '定制开发', '私有化部署', 'API调用权限']
  }
};

// 应用速率限制（每分钟60个请求）
const membershipRateLimit = rateLimitMiddleware(60 * 1000, 60);
router.use(membershipRateLimit);

/**
 * GET /api/membership
 * 获取会员信息
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    
    const plan = user.plan || 'free';
    const planInfo = PLANS[plan] || PLANS.free;
    
    // 获取额度使用情况
    const userQuota = await getQuotaByUser(req.userId);
    const quotaData = userQuota ? userQuota.toJSON() : {
      userId: req.userId,
      dailyGenerate: 0,
      totalProducts: 0,
      aiCallsToday: 0,
      activeTasks: 0,
      lastReset: getTodayStart()
    };
    
    // 检查是否需要重置每日额度
    if (quotaData.lastReset < getTodayStart()) {
      quotaData.dailyGenerate = 0;
      quotaData.aiCallsToday = 0;
      quotaData.lastReset = getTodayStart();
      await updateUserQuota(req.userId, {
        dailyGenerate: 0,
        aiCallsToday: 0,
        lastReset: getTodayStart()
      });
    }
    
    res.json({
      success: true,
      data: {
        userId: req.userId,
        plan,
        planName: planInfo.name,
        price: planInfo.price,
        features: planInfo.features,
        quotas: planInfo.quotas,
        used: {
          dailyGenerate: quotaData.dailyGenerate,
          totalProducts: quotaData.totalProducts,
          aiCallsToday: quotaData.aiCallsToday,
          activeTasks: quotaData.activeTasks
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
      price: value.price,
      quotas: value.quotas,
      features: value.features
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
    const user = await getUserById(req.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    
    const plan = user.plan || 'free';
    const planInfo = PLANS[plan] || PLANS.free;
    
    // 获取或创建额度记录
    let userQuota = await getQuotaByUser(req.userId);
    let quotaData;
    
    if (!userQuota) {
      quotaData = {
        userId: req.userId,
        dailyGenerate: 0,
        totalProducts: 0,
        aiCallsToday: 0,
        activeTasks: 0,
        lastReset: getTodayStart()
      };
      userQuota = await updateUserQuota(req.userId, quotaData);
    } else {
      quotaData = userQuota.toJSON();
    }
    
    // 检查是否需要重置每日额度
    if (quotaData.lastReset < getTodayStart()) {
      quotaData.dailyGenerate = 0;
      quotaData.aiCallsToday = 0;
      quotaData.lastReset = getTodayStart();
      await updateUserQuota(req.userId, {
        dailyGenerate: 0,
        aiCallsToday: 0,
        lastReset: getTodayStart()
      });
    }
    
    // 计算剩余额度
    const remaining = {
      dailyGenerate: planInfo.quotas.dailyGenerate === -1 
        ? -1 
        : Math.max(0, planInfo.quotas.dailyGenerate - quotaData.dailyGenerate),
      totalProducts: planInfo.quotas.totalProducts === -1 
        ? -1 
        : Math.max(0, planInfo.quotas.totalProducts - quotaData.totalProducts),
      aiCallsToday: planInfo.quotas.aiCallsPerDay === -1 
        ? -1 
        : Math.max(0, planInfo.quotas.aiCallsPerDay - quotaData.aiCallsToday),
      automationTasks: planInfo.quotas.automationTasks === -1 
        ? -1 
        : Math.max(0, planInfo.quotas.automationTasks - quotaData.activeTasks)
    };
    
    // 计算使用百分比
    const usagePercent = {
      dailyGenerate: planInfo.quotas.dailyGenerate === -1 
        ? 0 
        : Math.round((quotaData.dailyGenerate / planInfo.quotas.dailyGenerate) * 100),
      totalProducts: planInfo.quotas.totalProducts === -1 
        ? 0 
        : Math.round((quotaData.totalProducts / planInfo.quotas.totalProducts) * 100),
      aiCallsToday: planInfo.quotas.aiCallsPerDay === -1 
        ? 0 
        : Math.round((quotaData.aiCallsToday / planInfo.quotas.aiCallsPerDay) * 100),
      automationTasks: planInfo.quotas.automationTasks === -1 
        ? 0 
        : Math.round((quotaData.activeTasks / planInfo.quotas.automationTasks) * 100)
    };
    
    res.json({
      success: true,
      data: {
        plan,
        planName: planInfo.name,
        limits: planInfo.quotas,
        used: {
          dailyGenerate: quotaData.dailyGenerate,
          totalProducts: quotaData.totalProducts,
          aiCallsToday: quotaData.aiCallsToday,
          activeTasks: quotaData.activeTasks
        },
        remaining,
        usagePercent,
        lastReset: quotaData.lastReset,
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
    
    const user = await getUserById(req.userId);
    
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
    
    const userQuota = await getQuotaByUser(req.userId);
    let quotaData;
    
    if (!userQuota) {
      quotaData = {
        userId: req.userId,
        dailyGenerate: 0,
        totalProducts: 0,
        aiCallsToday: 0,
        activeTasks: 0,
        lastReset: getTodayStart()
      };
    } else {
      quotaData = userQuota.toJSON();
    }
    
    // 检查额度
    if (quotaData[type] + amount > limit) {
      return res.json({ 
        success: true, 
        allowed: false, 
        error: '额度不足',
        remaining: limit - quotaData[type]
      });
    }
    
    // 消耗额度
    quotaData[type] += amount;
    await updateUserQuota(req.userId, { [type]: quotaData[type] });
    
    res.json({ 
      success: true, 
      allowed: true, 
      remaining: limit - quotaData[type],
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
    
    const userQuota = await getQuotaByUser(req.userId);
    
    if (!userQuota) {
      return res.json({ success: true, message: '无额度记录' });
    }
    
    const quotaData = userQuota.toJSON();
    
    // 释放额度
    const newValue = Math.max(0, quotaData[type] - amount);
    await updateUserQuota(req.userId, { [type]: newValue });
    
    res.json({ 
      success: true, 
      released: amount,
      current: newValue
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
router.post('/reset', requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { userId, type } = req.body;
    
    const targetUserId = userId || req.userId;
    
    if (type && ['dailyGenerate', 'aiCallsToday'].includes(type)) {
      await updateUserQuota(targetUserId, { [type]: 0 });
    } else if (!type) {
      // 重置所有每日额度
      await resetDailyQuota(targetUserId);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: `无效的额度类型: ${type}` 
      });
    }
    
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
    
    const user = await getUserById(req.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    
    // 实际应该对接支付系统
    // 这里只是模拟升级
    // 注意：实际实现需要调用数据库更新函数
    // 这里为了演示，假设数据库模型支持直接更新
    
    res.json({
      success: true,
      message: '套餐升级成功（模拟）',
      data: {
        plan,
        planName: PLANS[plan].name,
        price: PLANS[plan].price,
        features: PLANS[plan].features,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30天后过期
      }
    });
  } catch (error) {
    console.error('升级套餐失败:', error);
    res.status(500).json({ success: false, error: '升级套餐失败' });
  }
});

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

/**
 * 重置每日额度
 */
async function resetDailyQuota(userId) {
  return await updateUserQuota(userId, {
    dailyGenerate: 0,
    aiCallsToday: 0,
    lastReset: getTodayStart()
  });
}

export default router;