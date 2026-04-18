/**
 * 会员管理 API - 数据库版本（修复版）
 * 管理用户会员信息和额度
 */

import express from 'express';
import pool from '../config/database.js';
import {
  findUserById,
  getQuotaByUserId,
  updateQuota
} from '../services/dbService.js';

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
    // 优先从 PostgreSQL 查，降级到 req.user（JSON数据）
    let user = null;
    try {
      user = await getUserById(req.userId);
    } catch (err) {
      console.warn('[会员] PostgreSQL查询失败，使用req.user:', err.message);
    }

    // 降级：从 auth middleware 的 req.user 获取
    if (!user) {
      user = req.user ? {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        plan: req.user.plan || 'free'
      } : null;
    }

    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const plan = user.plan || 'free';
    const planInfo = PLANS[plan] || PLANS.free;

    // 获取额度使用情况（失败不影响主流程）
    let quotaData = {
      userId: req.userId,
      dailyGenerate: 0,
      totalProducts: 0,
      aiCallsToday: 0,
      activeTasks: 0,
      lastReset: getTodayStart()
    };
    try {
      const userQuota = await getQuotaByUser(req.userId);
      quotaData = userQuota ? (userQuota.toJSON ? userQuota.toJSON() : userQuota) : quotaData;
    } catch (err) {
      console.warn('[会员] 额度查询失败，使用默认值:', err.message);
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
          dailyGenerate: quotaData.dailyGenerate || 0,
          totalProducts: quotaData.totalProducts || 0,
          aiCallsToday: quotaData.aiCallsToday || 0,
          activeTasks: quotaData.activeTasks || 0
        },
        expiresAt: user.expiresAt || user.membership_expires_at || null,
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
    // 优先从 PostgreSQL 查，降级到 req.user
    let user = null;
    try {
      user = await getUserById(req.userId);
    } catch (err) {
      console.warn('[额度] PostgreSQL查询失败:', err.message);
    }
    if (!user) {
      user = req.user ? {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        plan: req.user.plan || 'free'
      } : { plan: 'free' };
    }

    const plan = user.plan || 'free';
    const planInfo = PLANS[plan] || PLANS.free;

    let quotaData = {
      userId: req.userId,
      dailyGenerate: 0,
      totalProducts: 0,
      aiCallsToday: 0,
      activeTasks: 0,
      lastReset: getTodayStart()
    };
    try {
      const userQuota = await getQuotaByUser(req.userId);
      if (userQuota) {
        quotaData = userQuota.toJSON ? userQuota.toJSON() : userQuota;
      }
    } catch (err) {
      console.warn('[额度] 额度查询失败:', err.message);
    }

    // 计算剩余额度
    const remaining = {
      dailyGenerate: planInfo.quotas.dailyGenerate === -1 ? -1 : Math.max(0, planInfo.quotas.dailyGenerate - (quotaData.dailyGenerate || 0)),
      totalProducts: planInfo.quotas.totalProducts === -1 ? -1 : Math.max(0, planInfo.quotas.totalProducts - (quotaData.totalProducts || 0)),
      aiCallsToday: planInfo.quotas.aiCallsPerDay === -1 ? -1 : Math.max(0, planInfo.quotas.aiCallsPerDay - (quotaData.aiCallsToday || 0)),
      automationTasks: planInfo.quotas.automationTasks === -1 ? -1 : Math.max(0, planInfo.quotas.automationTasks - (quotaData.activeTasks || 0))
    };

    // 计算使用百分比
    const usagePercent = {
      dailyGenerate: planInfo.quotas.dailyGenerate === -1 ? 0 : Math.round(((quotaData.dailyGenerate || 0) / planInfo.quotas.dailyGenerate) * 100),
      totalProducts: planInfo.quotas.totalProducts === -1 ? 0 : Math.round(((quotaData.totalProducts || 0) / planInfo.quotas.totalProducts) * 100),
      aiCallsToday: planInfo.quotas.aiCallsPerDay === -1 ? 0 : Math.round(((quotaData.aiCallsToday || 0) / planInfo.quotas.aiCallsPerDay) * 100),
      automationTasks: planInfo.quotas.automationTasks === -1 ? 0 : Math.round(((quotaData.activeTasks || 0) / planInfo.quotas.automationTasks) * 100)
    };

    res.json({
      success: true,
      data: {
        plan,
        planName: planInfo.name,
        limits: planInfo.quotas,
        used: {
          dailyGenerate: quotaData.dailyGenerate || 0,
          totalProducts: quotaData.totalProducts || 0,
          aiCallsToday: quotaData.aiCallsToday || 0,
          activeTasks: quotaData.activeTasks || 0
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
      return res.status(400).json({ success: false, error: `无效的额度类型: ${type}` });
    }

    let user = null;
    try { user = await getUserById(req.userId); } catch (_) {}
    if (!user && req.user) user = { plan: req.user.plan || 'free' };
    if (!user) user = { plan: 'free' };

    const plan = user.plan || 'free';
    const planInfo = PLANS[plan] || PLANS.free;
    const limit = planInfo.quotas[type];

    if (limit === -1) {
      return res.json({ success: true, allowed: true, remaining: -1 });
    }

    let quotaData = { userId: req.userId, dailyGenerate: 0, totalProducts: 0, aiCallsToday: 0, activeTasks: 0 };
    try {
      const userQuota = await getQuotaByUser(req.userId);
      if (userQuota) quotaData = userQuota.toJSON ? userQuota.toJSON() : userQuota;
    } catch (_) {}

    const currentVal = quotaData[type] || 0;
    if (currentVal + amount > limit) {
      return res.json({ success: true, allowed: false, error: '额度不足', remaining: limit - currentVal });
    }

    quotaData[type] = currentVal + amount;
    try { await updateUserQuota(req.userId, { [type]: quotaData[type] }); } catch (_) {}

    res.json({ success: true, allowed: true, remaining: limit - quotaData[type], consumed: amount });
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
 * 升级会员（支付成功后调用）
 */
router.post('/upgrade', authenticateToken, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!PLANS[plan]) {
      return res.status(400).json({ success: false, error: `无效的套餐: ${plan}，可用套餐: ${Object.keys(PLANS).join(', ')}` });
    }

    let user = null;
    try { user = await getUserById(req.userId); } catch (_) {}
    if (!user && req.user) user = req.user;

    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

    // 尝试更新 PostgreSQL 中的用户计划
    try {
      await pool.query(
        'UPDATE users SET membership_type = $1, membership_expires_at = $2, updated_at = NOW() WHERE id::text = $3',
        [plan, new Date(expiresAt), String(req.userId)]
      );
    } catch (err) {
      console.warn('[会员] PostgreSQL更新失败:', err.message);
    }

    res.json({
      success: true,
      message: '套餐升级成功',
      data: {
        plan,
        planName: PLANS[plan].name,
        price: PLANS[plan].price,
        features: PLANS[plan].features,
        expiresAt
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