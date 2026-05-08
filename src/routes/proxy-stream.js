/**
 * 海外推流代理 API 路由 v1.0
 * 
 * 端点：
 * GET    /api/stream-proxy/plans        - 获取套餐列表
 * GET    /api/stream-proxy/regions      - 获取区域列表
 * GET    /api/stream-proxy/nodes        - 获取节点状态（管理）
 * POST   /api/stream-proxy/order        - 创建代理订单
 * GET    /api/stream-proxy/orders       - 获取用户订单列表
 * GET    /api/stream-proxy/subscription - 获取当前活跃订阅
 * POST   /api/stream-proxy/activate     - 激活订单（支付回调）
 * GET    /api/stream-proxy/config       - 获取代理配置（推流用）
 * POST   /api/stream-proxy/nodes        - 添加节点（管理）
 * DELETE /api/stream-proxy/nodes/:id    - 移除节点（管理）
 * GET    /api/stream-proxy/stats        - 统计信息
 * POST   /api/stream-proxy/usage-log    - 记录使用时长
 */

import express from 'express';
import { getProxyPool } from '../services/ProxyPool.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 初始化代理池
let proxyPool = null;
async function ensurePool() {
  if (!proxyPool) {
    proxyPool = getProxyPool();
    await proxyPool.init();
  }
  return proxyPool;
}

// ═══ 公开接口 ═══

/**
 * GET /api/stream-proxy/plans
 * 获取所有代理套餐（无需登录）
 */
router.get('/plans', async (req, res) => {
  try {
    const pool = await ensurePool();
    res.json({ success: true, data: pool.getPlans() });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/stream-proxy/regions
 * 获取可用区域列表
 */
router.get('/regions', async (req, res) => {
  try {
    const pool = await ensurePool();
    const regions = pool.getAvailableRegions();
    res.json({ success: true, data: regions });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/stream-proxy/nodes
 * 获取节点状态（需登录）
 */
router.get('/nodes', authenticateToken, async (req, res) => {
  try {
    const pool = await ensurePool();
    const nodes = await pool.getNodes();
    res.json({ success: true, data: nodes });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ═══ 用户操作 ═══

/**
 * POST /api/stream-proxy/order
 * 创建代理订单
 * Body: { planId, selectedRegions, paymentMethod, durationMonths, discount }
 */
router.post('/order', authenticateToken, async (req, res) => {
  try {
    const pool = await ensurePool();
    const userId = req.user.id;
    const { planId, selectedRegions, paymentMethod, durationMonths, discount } = req.body;

    if (!planId) {
      return res.json({ success: false, error: '请选择套餐' });
    }

    // 检查是否已有活跃订阅
    const existing = await pool.getActiveSubscription(userId);
    if (existing) {
      return res.json({ 
        success: false, 
        error: '您已有活跃的代理订阅，请等待到期后再购买',
        existingOrder: {
          id: existing.id,
          planName: existing.plan_name,
          expiresAt: existing.expires_at,
          daysRemaining: existing.daysRemaining,
        }
      });
    }

    const order = await pool.createOrder(userId, planId, {
      selectedRegions: selectedRegions || ['hongkong'],
      paymentMethod: paymentMethod || 'shouqianba',
      durationMonths: durationMonths || 1,
      discount: discount || 0,
    });

    res.json({ success: true, data: order });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/stream-proxy/orders
 * 获取用户所有代理订单
 */
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const pool = await ensurePool();
    const userId = req.user.id;
    const orders = await pool.getUserOrders(userId);
    res.json({ success: true, data: orders });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/stream-proxy/subscription
 * 获取当前活跃订阅
 */
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const pool = await ensurePool();
    const userId = req.user.id;
    const sub = await pool.getActiveSubscription(userId);
    if (!sub) {
      return res.json({ success: true, data: null, message: '无活跃订阅' });
    }
    res.json({ success: true, data: sub });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * POST /api/stream-proxy/activate
 * 激活订单（支付成功后调用）
 * Body: { orderId, paymentTxId }
 */
router.post('/activate', authenticateToken, async (req, res) => {
  try {
    const pool = await ensurePool();
    const { orderId, paymentTxId } = req.body;
    
    if (!orderId) {
      return res.json({ success: false, error: '缺少订单ID' });
    }

    const order = await pool.activateOrder(orderId, paymentTxId);
    res.json({ success: true, data: order });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/stream-proxy/config
 * 获取推流代理配置（LiveStreamEngine调用）
 * Query: ?region=hongkong&platform=youtube
 */
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const pool = await ensurePool();
    const userId = req.user.id;
    const { region = 'hongkong', platform = 'custom' } = req.query;

    const proxyConfig = await pool.getProxyConfig(userId, region, platform);
    res.json({ success: true, data: proxyConfig });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * POST /api/stream-proxy/usage-log
 * 记录使用时长
 * Body: { orderId, nodeId, region, platform, durationSecs, bytesSent }
 */
router.post('/usage-log', authenticateToken, async (req, res) => {
  try {
    const pool = await ensurePool();
    const userId = req.user.id;
    const { orderId, nodeId, region, platform, durationSecs, bytesSent } = req.body;

    await pool.logUsage(userId, orderId, nodeId, region, platform, durationSecs, bytesSent);
    res.json({ success: true, message: '已记录' });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ═══ 管理接口（管理员） ═══

/**
 * POST /api/stream-proxy/nodes
 * 添加代理节点（管理）
 */
router.post('/nodes', authenticateToken, async (req, res) => {
  try {
    const pool = await ensurePool();
    const node = await pool.addNode(req.body);
    res.json({ success: true, data: node });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * DELETE /api/stream-proxy/nodes/:id
 * 移除代理节点（管理）
 */
router.delete('/nodes/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await ensurePool();
    await pool.removeNode(parseInt(req.params.id));
    res.json({ success: true, message: '节点已移除' });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/stream-proxy/stats
 * 获取代理池统计
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const pool = await ensurePool();
    const stats = await pool.getStats();
    res.json({ success: true, data: stats });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/stream-proxy/validate
 * 验证代理订阅是否有效（前端快速检查）
 */
router.get('/validate', authenticateToken, async (req, res) => {
  try {
    const pool = await ensurePool();
    const userId = req.user.id;
    const result = await pool.validateSubscription(userId);
    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

export default router;
