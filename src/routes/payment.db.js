/**
 * 支付订单 API - 收钱吧对接
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createWapPayment,
  queryOrder,
  handleNotify,
  generateQrCodeUrl
} from '../services/shouqianba.js';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';

const router = express.Router();

// 套餐配置（与 membership.db.js 保持一致）
const PLANS = {
  basic: { name: '基础版', price: 19900, duration: 30 },      // 价格单位：分
  premium: { name: '高级版', price: 49900, duration: 30 },
  enterprise: { name: '企业版', price: 199900, duration: 30 }
};

// 业务服务配置
const SERVICES = {
  'domestic-op': { name: '国内代运营', price: 500000 },      // ¥5000/月
  'overseas-op': { name: '海外代运营', price: 500000 },      // ¥5000/月
  'website-build': { name: '独立站搭建', price: 380000 },    // ¥3800/站
  'youtube-live': { name: 'YouTube 直播号', price: 100000 }, // ¥1000/个
  'facebook-live': { name: 'Facebook 直播推广号', price: 280000 }, // ¥2800/个
  'ads-account': { name: '广告户开户', price: 50000 }        // ¥500/户
};

// 收钱吧终端配置（从数据库读取）
async function getActiveTerminal() {
  const result = await pool.query(
    'SELECT * FROM shouqianba_terminals WHERE status = $1 ORDER BY last_checkin_at DESC LIMIT 1',
    ['active']
  );
  return result.rows[0];
}

/**
 * POST /api/payment/create
 * 创建支付订单（支持套餐和业务服务）
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { plan, serviceId, serviceName, amount, returnUrl } = req.body;
    const userId = req.userId;

    let orderType, orderName, orderAmount, subject;

    // 判断是套餐还是业务服务
    if (plan && PLANS[plan]) {
      // 套餐订单
      const planInfo = PLANS[plan];
      orderType = plan;
      orderName = planInfo.name;
      orderAmount = planInfo.price;
      subject = `Claw ${planInfo.name} - ${planInfo.duration}天`;
    } else if (serviceId && SERVICES[serviceId]) {
      // 业务服务订单
      const serviceInfo = SERVICES[serviceId];
      orderType = serviceId;
      orderName = serviceName || serviceInfo.name;
      orderAmount = serviceInfo.price;
      subject = `Claw 业务服务 - ${orderName}`;
    } else if (serviceId && amount) {
      // 自定义业务服务（前端传入价格）
      orderType = serviceId;
      orderName = serviceName || '业务服务';
      orderAmount = amount * 100; // 转为分
      subject = `Claw 业务服务 - ${orderName}`;
    } else {
      return res.status(400).json({
        success: false,
        error: '无效的订单类型'
      });
    }

    // 获取收钱吧终端
    const terminal = await getActiveTerminal();
    if (!terminal) {
      return res.status(500).json({
        success: false,
        error: '支付服务暂不可用，请联系客服'
      });
    }

    // 生成订单号
    const orderNo = `CLAW${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    // 获取用户IP
    const clientIp = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';

    // 构建回调地址
    const notifyUrl = `${process.env.API_BASE_URL || 'https://claw-backend-2026.onrender.com'}/api/webhook/shouqianba`;
    const returnUrlFull = returnUrl || `${process.env.FRONTEND_URL || 'https://claw-frontend.pages.dev'}/payment/result`;

    // 创建收钱吧订单
    const paymentResult = await createWapPayment({
      terminalSn: terminal.terminal_sn,
      terminalKey: terminal.terminal_key,
      clientSn: orderNo,
      totalAmount: orderAmount,
      subject: subject,
      returnUrl: returnUrlFull,
      notifyUrl: notifyUrl,
      clientIp: clientIp.split(',')[0].trim()
    });

    // 保存订单到数据库
    const expiredAt = new Date(Date.now() + 4 * 60 * 1000); // 4分钟过期
    await pool.query(
      `INSERT INTO payment_orders 
       (order_no, shouqianba_sn, user_id, plan_type, plan_name, amount, 
        subject, notify_url, return_url, expired_at, client_ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        orderNo,
        paymentResult.sn,
        userId,
        orderType,
        orderName,
        orderAmount,
        subject,
        notifyUrl,
        returnUrlFull,
        expiredAt,
        clientIp
      ]
    );

    // 生成二维码URL
    const qrCodeUrl = generateQrCodeUrl(paymentResult.payUrl);

    res.json({
      success: true,
      data: {
        orderNo: orderNo,
        amount: orderAmount,
        planName: orderName,
        payUrl: paymentResult.payUrl,
        qrCode: qrCodeUrl,
        expiredAt: expiredAt.toISOString()
      }
    });

  } catch (error) {
    console.error('创建支付订单失败:', error);
    res.status(500).json({
      success: false,
      error: error.message || '创建支付订单失败'
    });
  }
});

/**
 * GET /api/payment/status/:orderNo
 * 查询订单状态
 */
router.get('/status/:orderNo', authenticateToken, async (req, res) => {
  try {
    const { orderNo } = req.params;
    const userId = req.userId;

    // 查询本地订单
    const orderResult = await pool.query(
      'SELECT * FROM payment_orders WHERE order_no = $1 AND user_id = $2',
      [orderNo, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }

    const order = orderResult.rows[0];

    // 如果订单还在pending状态，查询收钱吧最新状态
    if (order.status === 'pending' && order.shouqianba_sn) {
      try {
        const terminal = await getActiveTerminal();
        if (terminal) {
          const shouqianbaStatus = await queryOrder(
            terminal.terminal_sn,
            terminal.terminal_key,
            order.shouqianba_sn
          );

          // 更新本地状态
          if (shouqianbaStatus.status === 'PAID' && order.status !== 'paid') {
            await pool.query(
              'UPDATE payment_orders SET status = $1, payway = $2, paid_at = $3, updated_at = NOW() WHERE order_no = $4',
              ['paid', shouqianbaStatus.payway, new Date(), orderNo]
            );

            // 更新用户会员
            await upgradeUserMembership(order.user_id, order.plan_type);

            order.status = 'paid';
            order.payway = shouqianbaStatus.payway;
            order.paid_at = new Date();
          }
        }
      } catch (queryError) {
        console.error('查询收钱吧订单状态失败:', queryError);
        // 继续返回本地状态
      }
    }

    res.json({
      success: true,
      data: {
        orderNo: order.order_no,
        status: order.status,
        amount: order.amount,
        planName: order.plan_name,
        payway: order.payway,
        paidAt: order.paid_at,
        createdAt: order.created_at,
        expiredAt: order.expired_at
      }
    });

  } catch (error) {
    console.error('查询订单状态失败:', error);
    res.status(500).json({
      success: false,
      error: '查询订单状态失败'
    });
  }
});

/**
 * POST /api/webhook/shouqianba
 * 收钱吧支付回调（路由已挂载到 /api/webhook，故此处直接写 /shouqianba）
 */
router.post('/shouqianba', async (req, res) => {
  try {
    console.log('收到收钱吧回调:', req.body);

    // 验签并解析回调
    const notifyData = handleNotify(req.body);

    // 查询订单
    const orderResult = await pool.query(
      'SELECT * FROM payment_orders WHERE order_no = $1',
      [notifyData.clientSn]
    );

    if (orderResult.rows.length === 0) {
      console.error('回调订单不存在:', notifyData.clientSn);
      return res.send('success'); // 返回success避免重试
    }

    const order = orderResult.rows[0];

    // 更新订单状态
    if (notifyData.status === 'PAID') {
      await pool.query(
        `UPDATE payment_orders 
         SET status = $1, payway = $2, paid_at = $3, updated_at = NOW() 
         WHERE order_no = $4`,
        ['paid', notifyData.payway, new Date(), notifyData.clientSn]
      );

      // 更新用户会员
      await upgradeUserMembership(order.user_id, order.plan_type);

      console.log('订单支付成功:', notifyData.clientSn);
    }

    // 必须返回 success，否则收钱吧会重试
    res.send('success');

  } catch (error) {
    console.error('处理收钱吧回调失败:', error);
    // 即使失败也返回success，避免无限重试
    res.send('success');
  }
});

/**
 * GET /api/payment/orders
 * 获取用户订单列表
 */
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT order_no, plan_name, amount, status, payway, paid_at, created_at
       FROM payment_orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM payment_orders WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      data: {
        orders: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取订单列表失败'
    });
  }
});

/**
 * 升级用户会员
 */
async function upgradeUserMembership(userId, planType) {
  try {
    const planInfo = PLANS[planType];
    if (!planInfo) {
      console.log(`升级会员：未找到套餐 ${planType} 的配置，跳过`);
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planInfo.duration);

    // 更新用户套餐（字段名匹配 users 表：membership_type / membership_expires_at）
    await pool.query(
      'UPDATE users SET membership_type = $1, membership_expires_at = $2, updated_at = NOW() WHERE id = $3',
      [planType, expiresAt, userId]
    );

    // 重置额度（使用 quotas 表，已在 init-db.js 创建）
    // quotas 表字段：text_generations, image_generations, products_limit
    try {
      await pool.query(
        `INSERT INTO quotas (user_id, text_generations, image_generations)
         VALUES ($1, 0, 0)
         ON CONFLICT (user_id) 
         DO UPDATE SET text_generations = 0, image_generations = 0`,
        [userId]
      );
      console.log(`用户 ${userId} 额度已重置`);
    } catch (quotaErr) {
      console.warn(`重置额度失败（quota表可能不存在）: ${quotaErr.message}`);
    }

    console.log(`✅ 用户 ${userId} 升级到 ${planType}，有效期至 ${expiresAt}`);

  } catch (error) {
    console.error('升级会员失败:', error);
  }
}

export default router;
