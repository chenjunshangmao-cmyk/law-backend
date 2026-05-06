/**
 * 会员管理 API - 数据库版本（修复版）
 * 管理用户会员信息和额度
 */

import express from 'express';
import https from 'https';
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

// 会员套餐定义（2026-04-25 更新：价格单位统一为分/fen，最终版配置）
const PLANS = {
  free: {
    name: '免费会员',
    price: 0,           // ¥0
    color: 'gray',
    storeLimit: 2,         // 绑定店铺上限（仅国内平台）
    storePlatforms: ['taobao', 'pinduoduo', 'douyin'],
    aiCopyMonthly: 0,       // AI文案 月度（次）
    aiImageMonthly: 0,      // AI图片 月度（次）
    aiVideoDaily: 0,       // AI视频 每日（次）
    agentCountries: 0,      // 代理服务国家数
    customDev: false,
    prioritySupport: false,
    features: [
      '绑定店铺：2个（国内平台）',
      '产品上架：无限次（手动）',
      '智能定价：无限次（手动）',
      'AI功能：0次',
      '代理服务：不可用',
      '适合：国内卖家试用'
    ]
  },
  basic: {
    name: '基础版',
    price: 10,              // 🔧 测试：0.1元，正式改回19900
    color: 'blue',
    storeLimit: 5,
    storePlatforms: ['taobao', 'pinduoduo', 'douyin'],
    aiCopyMonthly: 50,
    aiImageMonthly: 20,
    aiVideoDaily: 1,
    agentCountries: 0,
    customDev: false,
    prioritySupport: false,
    features: [
      '绑定店铺：5个（仅限国内平台）',
      'AI文案：50次/月',
      'AI图片：20次/月',
      'AI视频：1次/天',
      '代理服务：不可用',
      '适合：国内卖家（淘宝/拼多多/抖音）'
    ]
  },
  premium: {
    name: '专业版',
    price: 49900,        // ¥499/月
    color: 'purple',
    popular: true,
    storeLimit: 10,
    storePlatforms: ['taobao', 'pinduoduo', 'douyin', 'tiktok', 'youtube'],
    aiCopyMonthly: -1,      // 无限
    aiImageMonthly: 100,
    aiVideoDaily: 2,
    agentCountries: 1,
    customDev: false,
    prioritySupport: false,
    features: [
      '绑定店铺：10个',
      'AI文案：无限次',
      'AI图片：100次/月',
      'AI视频：2次/天',
      '代理服务：1个国家',
      '适合：做1个海外平台（TikTok或YouTube）'
    ]
  },
  enterprise: {
    name: '企业版',
    price: 159900,       // ¥1599/月
    color: 'amber',
    storeLimit: -1,         // 无限
    storePlatforms: ['taobao', 'pinduoduo', 'douyin', 'tiktok', 'youtube'],
    aiCopyMonthly: -1,
    aiImageMonthly: 500,
    aiVideoDaily: 10,
    agentCountries: 6,
    customDev: false,
    prioritySupport: false,
    features: [
      '绑定店铺：无限个',
      'AI文案：无限次',
      'AI图片：500次/月',
      'AI视频：10次/天',
      '代理服务：6个国家',
      '适合：TikTok多店铺运营'
    ]
  },
  flagship: {
    name: '旗舰版',
    price: 588800,       // ¥5888/月
    color: 'red',
    storeLimit: -1,
    storePlatforms: ['taobao', 'pinduoduo', 'douyin', 'tiktok', 'youtube'],
    aiCopyMonthly: -1,
    aiImageMonthly: -1,      // 无限
    aiVideoDaily: -1,       // 无限
    agentCountries: 12,
    customDev: true,
    prioritySupport: true,  // 7x24
    features: [
      '绑定店铺：无限个',
      'AI文案：无限次',
      'AI图片：无限次',
      'AI视频：无限次',
      '代理服务：12个国家',
      '专属客服：7×24小时',
      '定制开发：支持'
    ]
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
      // 如果找不到用户，使用默认值
      console.warn('[会员] 未找到用户记录，使用默认值，userId:', req.userId);
      
      // 使用默认的企业版（对于admin用户）
      const plan = 'enterprise';
      const planInfo = PLANS[plan] || PLANS.free;
      
      return res.json({
        success: true,
        data: {
          userId: req.userId,
          plan: plan,
          planName: planInfo.name,
          quotas: planInfo.quotas,
          features: planInfo.features || [],
          expiresAt: null,
          isTrial: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
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
        color: planInfo.color,
        storeLimit: planInfo.storeLimit,
        storePlatforms: planInfo.storePlatforms,
        aiCopyMonthly: planInfo.aiCopyMonthly,
        aiImageMonthly: planInfo.aiImageMonthly,
        aiVideoDaily: planInfo.aiVideoDaily,
        agentCountries: planInfo.agentCountries,
        customDev: planInfo.customDev,
        prioritySupport: planInfo.prioritySupport,
        features: planInfo.features,
        used: {
          aiCopyUsed: quotaData.aiCopyUsed || 0,
          aiImageUsed: quotaData.aiImageUsed || 0,
          aiVideoUsed: quotaData.aiVideoUsed || 0,
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
 * 获取所有可用套餐（2026-04-23 新版）
 */
router.get('/plans', async (req, res) => {
  try {
    const plansList = Object.entries(PLANS).map(([key, value]) => ({
      plan: key,
      name: value.name,
      price: value.price,
      color: value.color,
      popular: value.popular || false,
      storeLimit: value.storeLimit,
      storePlatforms: value.storePlatforms,
      aiCopyMonthly: value.aiCopyMonthly,
      aiImageMonthly: value.aiImageMonthly,
      aiVideoDaily: value.aiVideoDaily,
      agentCountries: value.agentCountries,
      customDev: value.customDev,
      prioritySupport: value.prioritySupport,
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
 * 支持新额度类型：aiCopyMonthly, aiImageMonthly, aiVideoDaily
 */
router.post('/consume', authenticateToken, async (req, res) => {
  try {
    const { type, amount = 1 } = req.body;
    // 支持新类型 + 兼容旧类型
    const typeMap = {
      aiCopyMonthly: 'aiCopyUsed',
      aiImageMonthly: 'aiImageUsed',
      aiVideoDaily: 'aiVideoUsed',
      dailyGenerate: 'aiCopyUsed',
      textGenerations: 'aiCopyUsed',
    };
    const mappedType = typeMap[type] || type;
    const validTypes = ['aiCopyUsed', 'aiImageUsed', 'aiVideoUsed'];
    if (!validTypes.includes(mappedType)) {
      return res.status(400).json({ success: false, error: `无效的额度类型: ${type}` });
    }

    let user = null;
    try { user = await getUserById(req.userId); } catch (_) {}
    if (!user && req.user) user = { plan: req.user.plan || 'free' };
    if (!user) user = { plan: 'free' };

    const plan = user.plan || 'free';
    const planInfo = PLANS[plan] || PLANS.free;

    // 从 planInfo 获取对应 limit
    const planKeyMap = {
      aiCopyUsed: 'aiCopyMonthly',
      aiImageUsed: 'aiImageMonthly',
      aiVideoUsed: 'aiVideoDaily',
    };
    const limitKey = planKeyMap[mappedType];
    const limit = limitKey ? planInfo[limitKey] : 0;

    // -1 = 无限
    if (limit === -1) {
      return res.json({ success: true, allowed: true, remaining: -1, unlimited: true });
    }

    let quotaData = { aiCopyUsed: 0, aiImageUsed: 0, aiVideoUsed: 0 };
    try {
      quotaData = await getQuotaByUser(req.userId);
    } catch (_) {}

    const currentVal = quotaData[mappedType] || 0;
    if (currentVal + amount > limit) {
      return res.json({
        success: true,
        allowed: false,
        error: '额度不足',
        remaining: Math.max(0, limit - currentVal),
        limit,
        used: currentVal
      });
    }

    const newVal = currentVal + amount;
    try {
      await updateUserQuota(req.userId, { [mappedType]: newVal });
    } catch (_) {}

    res.json({ success: true, allowed: true, remaining: limit - newVal, consumed: amount, used: newVal });
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
 * POST /api/membership/check-and-activate
 * AI客服调用：根据付款记录自动激活会员
 * 
 * 工作原理：
 * 1. 查询该用户所有 paid 订单
 * 2. 找到最新有效订单，计算到期时间 paidUntil
 * 3. 更新用户 paidUntil 字段（会员截止日期）
 * 4. 根据4个开关决定当前会员等级
 */
router.post('/check-and-activate', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: '缺少 userId' });
    }

    // 先确保 users 表有 paid_until 字段（兼容未迁移的数据库）
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS paid_until TIMESTAMP`);
    } catch (_) {}

    // 查询该用户所有已支付订单，按时间倒序
    const paidOrders = await pool.query(
      `SELECT order_no, plan_type, plan_name, amount, paid_at
       FROM payment_orders
       WHERE user_id = $1 AND status = 'paid'
       ORDER BY paid_at DESC`,
      [String(userId)]
    );

    if (paidOrders.rows.length === 0) {
      // 无付款记录，降级到 free
      await pool.query(
        `UPDATE users SET membership_type = 'free', updated_at = NOW() WHERE id::text = $1`,
        [String(userId)]
      );
      return res.json({
        success: true,
        activated: false,
        plan: 'free',
        reason: '无付款记录'
      });
    }

    // 取最新有效订单，计算到期时间
    const latestOrder = paidOrders.rows[0];
    // payment.db.js 使用 basic/premium/enterprise/flagship（无需映射）
    const planType = latestOrder.plan_type;
    const DURATION_DAYS = 30;
    const paidAt = new Date(latestOrder.paid_at);
    const paidUntil = new Date(paidAt.getTime() + DURATION_DAYS * 24 * 60 * 60 * 1000);

    // 4个会员开关：只有开关开启的套餐才能激活
    const MEMBERSHIP_ENABLED = {
      basic: true,
      premium: true,
      enterprise: true,
      flagship: true
    };

    const plan = MEMBERSHIP_ENABLED[planType] ? planType : 'free';

    // 更新用户会员信息
    await pool.query(
      `UPDATE users SET
        membership_type = $1,
        membership_expires_at = $2,
        paid_until = $2,
        updated_at = NOW()
       WHERE id::text = $3`,
      [plan, paidUntil, String(userId)]
    );

    console.log(`[AI客服] ✅ 用户 ${userId} 会员已激活: ${plan}，到期: ${paidUntil.toISOString()}`);

    res.json({
      success: true,
      activated: true,
      plan,
      paidUntil: paidUntil.toISOString(),
      lastOrder: {
        orderNo: latestOrder.order_no,
        planType: planType,
        planName: latestOrder.plan_name,
        amount: latestOrder.amount,
        paidAt: latestOrder.paid_at
      },
      switches: MEMBERSHIP_ENABLED
    });

  } catch (error) {
    console.error('[AI客服] 会员激活失败:', error);
    res.status(500).json({ success: false, error: '会员激活失败: ' + error.message });
  }
});

/**
 * GET /api/membership/admin/users
 * 管理员：获取所有用户及其会员状态
 */
router.get('/admin/users', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id::text, email, name, role,
             membership_type, membership_expires_at, paid_until,
             created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 200
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[管理员] 获取用户列表失败:', error);
    res.status(500).json({ success: false, error: '获取用户列表失败' });
  }
});

/**
 * POST /api/membership/admin/activate
 * 管理员：手动激活指定用户的会员
 */
router.post('/admin/activate', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { userId, plan } = req.body;

    if (!userId) return res.status(400).json({ success: false, error: '缺少 userId' });
    if (!PLANS[plan]) return res.status(400).json({ success: false, error: `无效套餐: ${plan}` });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await pool.query(`
      UPDATE users SET
        membership_type = $1,
        membership_expires_at = $2,
        paid_until = $2,
        updated_at = NOW()
      WHERE id::text = $3
    `, [plan, expiresAt, String(userId)]);

    console.log(`[管理员] ✅ 手动激活用户 ${userId} 为 ${plan}，到期: ${expiresAt.toISOString()}`);

    res.json({
      success: true,
      message: `${PLANS[plan].name} 激活成功`,
      data: { plan, planName: PLANS[plan].name, expiresAt: expiresAt.toISOString() }
    });
  } catch (error) {
    console.error('[管理员] 手动激活失败:', error);
    res.status(500).json({ success: false, error: '手动激活失败: ' + error.message });
  }
});

/**
 * POST /api/membership/admin/deactivate
 * 管理员：关闭指定用户的会员（降级为 free）
 */
router.post('/admin/deactivate', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ success: false, error: '缺少 userId' });

    await pool.query(`
      UPDATE users SET
        membership_type = 'free',
        membership_expires_at = NULL,
        paid_until = NULL,
        updated_at = NOW()
      WHERE id::text = $1
    `, [String(userId)]);

    console.log(`[管理员] ❌ 关闭用户 ${userId} 的会员`);

    res.json({ success: true, message: '会员已关闭，当前为免费会员' });
  } catch (error) {
    console.error('[管理员] 关闭会员失败:', error);
    res.status(500).json({ success: false, error: '关闭会员失败: ' + error.message });
  }
});

/**
 * POST /api/membership/create
 * 创建支付订单（兼容前端调用）
 * 内部转发到 /api/payment/create
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    // 转发到 payment.db.js 的 /create 端点
    const paymentReq = https.request({
      hostname: 'claw-backend-2026.onrender.com',
      port: 443,
      path: '/api/payment/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      }
    }, (paymentRes) => {
      let data = '';
      paymentRes.on('data', c => data += c);
      paymentRes.on('end', () => {
        try {
          const result = JSON.parse(data);
          res.status(paymentRes.statusCode).json(result);
        } catch (_) {
          res.status(paymentRes.statusCode).json({ success: false, error: data });
        }
      });
    });
    paymentReq.on('error', (err) => {
      res.status(500).json({ success: false, error: '支付服务暂时不可用: ' + err.message });
    });
    paymentReq.write(JSON.stringify(req.body));
    paymentReq.end();
  } catch (error) {
    console.error('[会员] /create 失败:', error);
    res.status(500).json({ success: false, error: '支付服务暂时不可用' });
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