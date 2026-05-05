/**
 * 加密货币支付 API — USDT 收款
 * 
 * 端点：
 *   POST /api/crypto/create      — 创建 USDT 支付订单
 *   GET  /api/crypto/status/:no  — 轮询支付状态（含自动链上检测）
 *   GET  /api/crypto/wallet      — 获取收款地址 & 链信息
 *   GET  /api/crypto/health      — 钱包健康状态
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';
import {
  getWalletAddress,
  SUPPORTED_CHAINS,
  checkPaymentAllChains,
  healthCheck,
} from '../services/cryptoPayment.js';

const router = express.Router();

// ======== 套餐价格映射（与 payment.db.js 对齐，单位：元） ========
const PLAN_PRICES = {
  basic:      199,
  premium:    499,
  enterprise: 1599,
  flagship:   5888,
};

// ======== 业务服务价格映射（与 payment.db.js 对齐，单位：元） ========
const SERVICE_PRICES = {
  'domestic-op':    { name: '国内代运营',       price: 5000 },
  'overseas-op':    { name: '海外代运营',       price: 5000 },
  'website-build':  { name: '独立站搭建',       price: 3800 },
  'youtube-live':   { name: 'YouTube 直播号',   price: 1000 },
  'facebook-live':  { name: 'Facebook 直播推广号', price: 2800 },
  'ads-account':    { name: '广告户开户',       price: 500 },
};

function getPrice(key) {
  if (PLAN_PRICES[key]) return PLAN_PRICES[key];
  if (SERVICE_PRICES[key]) return SERVICE_PRICES[key].price;
  return null;
}

function getName(key) {
  const planNames = { basic: '基础版', premium: '专业版', enterprise: '企业版', flagship: '旗舰版' };
  if (planNames[key]) return planNames[key] + '套餐';
  if (SERVICE_PRICES[key]) return SERVICE_PRICES[key].name;
  return key;
}

// ======== 确保 payment_orders 表有 crypto 相关字段 ========
let _tableReady = false;
async function ensureCryptoFields() {
  if (_tableReady) return;
  _tableReady = true;
  try {
    // 添加 payment_method 字段（如果不存在）
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'shouqianba';
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);
    // 添加 crypto 相关字段
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS crypto_chain VARCHAR(20);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS crypto_address VARCHAR(100);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS crypto_tx_hash VARCHAR(100);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);
    console.log('[CryptoPay] 数据库字段就绪');
  } catch (e) {
    console.error('[CryptoPay] 数据库字段初始化失败:', e.message);
  }
}

// ======== POST /api/crypto/create ========
router.post('/create', authenticateToken, async (req, res) => {
  try {
    await ensureCryptoFields();

    const { plan, serviceId } = req.body;
    const orderKey = plan || serviceId;
    const userId = req.userId;

    if (!orderKey || !getPrice(orderKey)) {
      return res.status(400).json({ success: false, error: '无效的套餐或服务类型' });
    }

    const amountCNY = getPrice(orderKey);
    const orderName = getName(orderKey);
    const amountUSDT = amountCNY; // 1 USDT ≈ 1 USD ≈ 7 CNY 暂时 1:1

    const orderNo = `CRYPTO${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const walletAddress = getWalletAddress();

    // 写入数据库
    await pool.query(
      `INSERT INTO payment_orders 
       (order_no, user_id, plan_type, plan_name, amount, subject, 
        payment_method, crypto_address, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())`,
      [
        orderNo,
        userId,
        orderKey,
        orderName,
        amountCNY * 100,
        `USDT支付 - ${orderName}`,
        'crypto',
        walletAddress,
      ]
    );

    res.json({
      success: true,
      data: {
        orderNo,
        amountCNY,
        amountUSDT,
        walletAddress,
        orderName,
        orderKey,
        chains: SUPPORTED_CHAINS,
        createdAt: new Date().toISOString(),
        tip: `请向该地址转入恰好 ${amountUSDT} USDT（任意链），系统自动确认`,
      },
    });
  } catch (err) {
    console.error('[CryptoPay] 创建订单失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======== GET /api/crypto/status/:orderNo ========
router.get('/status/:orderNo', authenticateToken, async (req, res) => {
  try {
    const { orderNo } = req.params;
    const userId = req.userId;

    const result = await pool.query(
      'SELECT * FROM payment_orders WHERE order_no = $1 AND user_id = $2',
      [orderNo, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const order = result.rows[0];

    // 如果还在 pending 且是 crypto 支付 → 查链上
    if (order.status === 'pending' && order.payment_method === 'crypto') {
      const planType = order.plan_type;
      const amountCNY = order.amount / 100; // 分→元
      const amountUSDT = getPrice(planType) || amountCNY;

      const txResult = await checkPaymentAllChains(
        amountUSDT,
        new Date(order.created_at)
      );

      if (txResult.matched) {
        // 自动确认
        await pool.query(
          `UPDATE payment_orders 
           SET status = 'paid', crypto_tx_hash = $1, crypto_chain = $2,
               paid_at = NOW(), updated_at = NOW()
           WHERE order_no = $3`,
          [txResult.txHash, txResult.chain, orderNo]
        );

        order.status = 'paid';
        order.crypto_tx_hash = txResult.txHash;
        order.crypto_chain = txResult.chain;

        console.log(`[CryptoPay] ✅ 订单 ${orderNo} 已自动确认 — ${txResult.txHash} (${txResult.chain})`);
      }
    }

    res.json({
      success: true,
      data: {
        orderNo: order.order_no,
        status: order.status,
        amount: order.amount,
        planType: order.plan_type,
        planName: order.plan_name,
        paymentMethod: order.payment_method,
        cryptoChain: order.crypto_chain,
        cryptoTxHash: order.crypto_tx_hash,
        paidAt: order.paid_at,
        createdAt: order.created_at,
      },
    });
  } catch (err) {
    console.error('[CryptoPay] 查询状态失败:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======== GET /api/crypto/wallet ========
router.get('/wallet', async (req, res) => {
  try {
    const address = getWalletAddress();
    res.json({
      success: true,
      data: {
        address,
        chains: SUPPORTED_CHAINS,
        qrValue: `ethereum:${address}`, // 通用 EVM 地址二维码
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======== GET /api/crypto/health ========
router.get('/health', async (req, res) => {
  try {
    const status = await healthCheck();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
