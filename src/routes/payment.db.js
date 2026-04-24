/**
 * 支付订单 API - 收钱吧对接（修复版）
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  generateQrCodeUrl
} from '../services/shouqianba.js';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';

// 终端缓存文件路径：与 shouqianba.db.js 保持完全一致
// shouqianba.db.js 写入: path.join(__dirname, '../../data/shouqianba-terminal.json')
// __dirname = /app/src/routes，故 '../../data/' = /app/data/shouqianba-terminal.json
const _paymentDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * 验签函数：WAP支付回调 MD5 验签
 * 与 shouqianba.db.js 中 wapSign() 完全一致
 * 规则：排除 sign/sign_type，按 key 字典序拼接，末尾加 &key=terminalKey，MD5大写
 */
function verifyWapSign(params, terminalKey) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  const signStr = pairs.join('&') + '&key=' + terminalKey;
  const expected = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  return expected === (params.sign || '').toUpperCase();
}

const TERMINAL_FILE = path.join(_paymentDir, '../../data', 'shouqianba-terminal.json');
function loadTerminalCache() {
  try {
    if (fs.existsSync(TERMINAL_FILE)) {
      return JSON.parse(fs.readFileSync(TERMINAL_FILE, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return {};
}

const router = express.Router();

// ============================================================
// 自动初始化：确保 payment_orders 和 shouqianba_terminals 表存在
// ============================================================
let _paymentTablesReady = false;

async function ensurePaymentTables() {
  if (_paymentTablesReady) return;
  _paymentTablesReady = true;
  try {
    // payment_orders 表（完整字段）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_orders (
        id SERIAL PRIMARY KEY,
        order_no VARCHAR(50) UNIQUE NOT NULL,
        shouqianba_sn VARCHAR(50),
        user_id VARCHAR(100) NOT NULL,
        plan_type VARCHAR(30),
        plan_name VARCHAR(50),
        amount INTEGER NOT NULL DEFAULT 0,
        subject VARCHAR(255),
        notify_url VARCHAR(500),
        return_url VARCHAR(500),
        expired_at TIMESTAMP,
        client_ip VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        payway VARCHAR(20),
        trade_no VARCHAR(100),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // quotas 表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotas (
        user_id VARCHAR(100) PRIMARY KEY,
        text_limit INTEGER DEFAULT 50,
        text_generations INTEGER DEFAULT 0,
        image_limit INTEGER DEFAULT 20,
        image_generations INTEGER DEFAULT 0,
        products_limit INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // shouqianba_terminals 表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shouqianba_terminals (
        id SERIAL PRIMARY KEY,
        terminal_sn VARCHAR(50) UNIQUE,
        terminal_key VARCHAR(100),
        merchant_id VARCHAR(100),
        store_sn VARCHAR(100),
        device_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        last_checkin_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 终端数据由 shouqianba.db.js 激活时写入此处
    // 不再插入测试终端，让真实激活的终端优先

    console.log('[支付] 表初始化完成');
  } catch (err) {
    console.error('[支付] 表初始化失败:', err.message);
  }
}

// ============================================================
// 套餐配置（与 membership.db.js 保持一致）
// 价格单位：分（fen），1元 = 100分
// ⚠️ basic ¥1.9 = 190fen（测试价格，正式收款时改为 19900）
const PLANS = {
  basic: { name: '基础版', price: 190, duration: 30 },       // ¥1.9（测试）/ ¥199（正式）
  premium: { name: '高级版', price: 49900, duration: 30 },   // ¥499
  enterprise: { name: '企业版', price: 159900, duration: 30 }, // ¥1599
  flagship: { name: '旗舰版', price: 588800, duration: 30 }  // ¥5888
};

// 积分换算比例（1元 = 100分 = 100fen，5000积分 = ¥50 = 5000fen）
const POINTS_RATIO = 100; // 1元 = 100积分
const POINTS_PRICE_FEN = 1; // 1积分 = 1fen（直接1:1）

// 业务服务配置（前端传 points，后端按 POINTS_PRICE_FEN 转 fen）
// 5000 points × 1 = 5000fen = ¥50 ✅
const SERVICES = {
  'domestic-op': { name: '国内代运营', points: 5000 },      // 5000积分=¥50
  'overseas-op': { name: '海外代运营', points: 5000 },      // 5000积分=¥50
  'website-build': { name: '独立站搭建', points: 3800 },    // 3800积分=¥38
  'youtube-live': { name: 'YouTube 直播号', points: 1000 }, // 1000积分=¥10
  'facebook-live': { name: 'Facebook 直播推广号', points: 2800 }, // 2800积分=¥28
  'ads-account': { name: '广告户开户', points: 500 }        // 500积分=¥5
};

// 硬编码终端配置（claw-web-new3，已激活）
// terminalSn: 100111220054389553
// terminalKey: 96bfaf401367d934cb10a1cbe9773647
const HARDCODE = {
  terminalSn: '100111220054389553',
  terminalKey: '96bfaf401367d934cb10a1cbe9773647',
  merchantId: '18956397746',
  storeSn: '00010101001200200046406',
  deviceId: 'claw-web-new3'
};

/**
 * 获取激活终端（支持多种配置来源）
 * 优先级：1. 硬编码 > 2. shouqianba.js > 3. 环境变量 > 4. 缓存 > 5. 数据库
 */
async function getActiveTerminal() {
  // 1. 直接返回硬编码配置（最可靠，不依赖 import）
  if (HARDCODE.terminalSn && HARDCODE.terminalKey) {
    return HARDCODE;
  }

  // 2. 尝试 shouqianba.js
  try {
    const { default: shouqianbaConfig } = await import('../config/shouqianba.js');
    const storeDevices = shouqianbaConfig && shouqianbaConfig.storeDevices;
    const deviceConfig = storeDevices && storeDevices['claw-web-new3'];
    if (deviceConfig && deviceConfig.terminalSn && deviceConfig.terminalKey) {
      console.log('[支付] 从 shouqianba.js 读取终端:', deviceConfig.terminalSn);
      return deviceConfig;
    }
  } catch (e) {
    console.warn('[支付] shouqianba.js 读取失败:', e.message);
  }

  // 3. 环境变量
  const envSn = process.env.SHOUQIANBA_TERMINAL_SN;
  const envKey = process.env.SHOUQIANBA_TERMINAL_KEY;
  if (envSn && envKey) {
    return { terminalSn: envSn, terminalKey: envKey };
  }

  // 4. 缓存文件
  const cache = loadTerminalCache();
  const deviceIds = Object.keys(cache);
  if (deviceIds.length > 0) {
    const t = cache[deviceIds[0]];
    if (t.terminalSn && t.terminalKey) return t;
  }

  // 5. 数据库
  try {
    const result = await pool.query(
      'SELECT terminal_sn, terminal_key FROM shouqianba_terminals WHERE status = $1 LIMIT 1',
      ['active']
    );
    return result.rows[0] || null;
  } catch (e) {
    return null;
  }
}

/**
 * POST /api/payment/create
 * 创建支付订单（支持套餐和业务服务）
 */
router.post('/create', authenticateToken, async (req, res) => {
  try {
    // 确保表已初始化
    await ensurePaymentTables();

    // 获取终端（getActiveTerminal 已内置硬编码兜底）
    let terminal = await getActiveTerminal();
    console.log('[支付] 终端配置:', terminal ? `${terminal.terminalSn}(hasKey=${!!terminal.terminalKey})` : 'null');

    const { plan, serviceId, serviceName, amount, returnUrl } = req.body;
    const userId = req.userId;

    let orderType, orderName, orderAmount, subject;

    // 判断是套餐还是业务服务
    if (plan && PLANS[plan]) {
      const planInfo = PLANS[plan];
      orderType = plan;
      orderName = planInfo.name;
      orderAmount = planInfo.price; // 已是分
      subject = `Claw ${planInfo.name} - ${planInfo.duration}天`;
    } else if (serviceId && SERVICES[serviceId]) {
      const serviceInfo = SERVICES[serviceId];
      orderType = serviceId;
      orderName = serviceName || serviceInfo.name;
      // 业务服务：points × POINTS_PRICE_FEN（1积分=1fen）
      orderAmount = serviceInfo.points * POINTS_PRICE_FEN; // 5000×1=5000fen=¥50 ✅
      subject = `Claw 业务服务 - ${orderName}`;
    } else if (serviceId && amount) {
      orderType = serviceId;
      orderName = serviceName || '业务服务';
      orderAmount = amount; // 直接是分
      subject = `Claw 业务服务 - ${orderName}`;
    } else {
      return res.status(400).json({ success: false, error: '无效的订单类型' });
    }

    // 生成订单号
    const orderNo = `CLAW${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const expiredAt = new Date(Date.now() + 4 * 60 * 1000);
    const clientIp = (req.headers['x-forwarded-for'] || req.ip || '127.0.0.1').split(',')[0].trim();
    const notifyUrl = `${process.env.API_BASE_URL || 'https://claw-backend-2026.onrender.com'}/api/webhook/shouqianba`;
    const returnUrlFull = returnUrl || `${process.env.FRONTEND_URL || 'https://claw-frontend.pages.dev'}/payment/result`;

    // 检查是否有有效的收钱吧配置（兼容驼峰和蛇形命名）
    const sn = terminal.terminalSn || terminal.terminal_sn;
    const key = terminal.terminalKey || terminal.terminal_key;
    const hasShouqianbaConfig =
      terminal && sn && key && sn !== '100111220054328800'; // 排除硬编码测试终端

    let paymentResult;

    if (hasShouqianbaConfig) {
      // ★ 使用收钱吧原生扫码支付 API（/upay/v2/create）生成真实支付链接
      // 与 shouqianba.js 中 sqbRequest() 使用相同的签名方式
      try {
        const { default: axios } = await import('axios');
        const wapParams = {
          terminal_sn: sn,
          client_sn: orderNo,
          total_amount: String(orderAmount),
          subject: subject,
          return_url: returnUrlFull,
          notify_url: notifyUrl
        };
        // 签名：参数排序 → key1=val1&key2=val2&... → MD5(内容 + key) → 大写
        const sortedKeys = Object.keys(wapParams).sort();
        const pairs = sortedKeys.map(k => `${k}=${wapParams[k]}`);
        const signStr = pairs.join('&') + '&key=' + key;
        const sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
        const reqBody = { ...wapParams, sign, sign_type: 'MD5' };

        console.log('[支付] 收钱吧扫码API请求:', JSON.stringify(reqBody).substring(0, 200));

        const apiResp = await axios.post('https://vsi-api.shouqianba.com/upay/v2/create',
          JSON.stringify(reqBody),
          { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
        );
        const result = apiResp.data;
        console.log('[支付] 收钱吧扫码API响应:', JSON.stringify(result).substring(0, 300));

        // 收钱吧原生扫码接口返回格式
        const payUrl = result.pay_url || result.payUrl || null;
        if (result.result_code === '200' && payUrl) {
          console.log('[支付] ✅ 扫码支付链接获取成功:', payUrl.substring(0, 80) + '...');
          paymentResult = {
            sn: result.sn || orderNo,
            payUrl,
            testMode: false,
            message: '请使用微信/支付宝扫码支付'
          };
        } else {
          console.error('[支付] ❌ 收钱吧返回失败:', result.result_code, result.error_message);
          paymentResult = {
            sn: `TEST-${orderNo}`,
            payUrl: null,
            qrCode: null,
            testMode: true,
            message: '收钱吧:' + (result.error_message || result.result_code)
          };
        }
      } catch (wapErr) {
        console.error('[支付] ❌ 扫码API异常:', wapErr.message, wapErr.response?.data);
        paymentResult = {
          sn: `TEST-${orderNo}`,
          payUrl: null,
          qrCode: null,
          testMode: true,
          message: '收钱吧API异常：' + wapErr.message
        };
      }
    } else {
      // 无有效终端配置，降级为测试模式（立即返回，不挂起）
      console.log('[支付] 无收钱吧配置，进入测试模式，订单号:', orderNo);
      paymentResult = {
        sn: `TEST-${orderNo}`,
        payUrl: null,
        qrCode: null,
        testMode: true,
        message: '支付功能测试模式'
      };
    }

    // 保存订单到数据库
    await pool.query(
      `INSERT INTO payment_orders 
       (order_no, shouqianba_sn, user_id, plan_type, plan_name, amount, 
        subject, notify_url, return_url, expired_at, client_ip, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')`,
      [
        orderNo,
        paymentResult.sn || null,
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

    // 生成二维码URL（如果不是测试模式才调用）
    let qrCodeUrl;
    if (paymentResult.qrCode) {
      qrCodeUrl = paymentResult.qrCode;
    } else if (paymentResult.payUrl) {
      qrCodeUrl = generateQrCodeUrl(paymentResult.payUrl);
    } else {
      qrCodeUrl = null;
    }

    const isTestMode = String(paymentResult.sn || '').startsWith('TEST-');

    res.json({
      success: true,
      data: {
        orderNo: orderNo,
        amount: orderAmount,
        planName: orderName,
        payUrl: paymentResult.payUrl,
        qrCode: qrCodeUrl,
        expiredAt: expiredAt.toISOString(),
        testMode: isTestMode,
        message: isTestMode ? '测试模式：收钱吧未配置，返回模拟支付链接' : '请在支付页面完成付款'
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

            // ★ 简化：只记录付款，会员激活由 AI客服 处理
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
 *
 * 验收标准要求三层状态判断：
 *   第一层（通讯层）：result_code
 *   第二层（业务结果层）：biz_response.result_code
 *   第三层（订单状态层）：order_status
 */
router.post('/shouqianba', async (req, res) => {
  try {
    const params = req.body;
    console.log('【收钱吧回调】收到:', JSON.stringify(params));

    // 验签：WAP支付回调用 terminalKey（不是 vendorKey）
    // 1. 从回调参数中获取 terminal_sn
    // 2. 从数据库 shouqianba_terminals 表查询对应的 terminal_key
    // 3. 用 terminal_key 进行 MD5 验签
    const terminalSn = params.terminal_sn;
    let terminalKeyForVerify = null;

    if (terminalSn) {
      try {
        const termResult = await pool.query(
          'SELECT terminal_key FROM shouqianba_terminals WHERE terminal_sn = $1 AND status = $2',
          [terminalSn, 'active']
        );
        if (termResult.rows.length > 0) {
          terminalKeyForVerify = termResult.rows[0].terminal_key;
        }
      } catch (e) {
        console.warn('【收钱吧回调】查询终端密钥失败:', e.message);
      }
    }

    // 如果数据库查不到，回退用环境变量的 vendorKey（旧版兼容）
    if (!terminalKeyForVerify) {
      terminalKeyForVerify = process.env.SHOUQIANBA_VENDOR_KEY || '677da351628d3fe7664321669c3439b2';
      console.warn('【收钱吧回调】使用 vendorKey 验签（终端密钥未找到）:', terminalSn);
    }

    // 使用与创建支付时相同的验签方式：参数排序 + &key= + MD5
    const isValid = verifyWapSign(params, terminalKeyForVerify);

    if (!isValid) {
      console.error('【收钱吧回调】验签失败，terminal_sn:', terminalSn, 'params:', JSON.stringify(params));
      return res.send('fail');
    }

    // ========== 三层状态判断（验收标准要求）==========

    // 第一层：通讯层
    if (params.result_code !== 'SUCCESS') {
      console.error(`【收钱吧回调】第一层（通讯层）失败 result_code=${params.result_code}`);
      return res.send('success');
    }

    // 第二层：业务结果层
    const bizResultCode = params.biz_response?.result_code;
    if (bizResultCode !== 'SUCCESS') {
      console.error(`【收钱吧回调】第二层（业务结果层）失败 biz_response.result_code=${bizResultCode}`);
      return res.send('success');
    }

    // 第三层：订单状态层
    const orderStatus = params.order_status;
    console.log(`【收钱吧回调】三层通过 → sn=${params.client_sn} order_status=${orderStatus}`);

    // ========== 订单处理 ==========

    // 查询本地订单
    const orderResult = await pool.query(
      'SELECT * FROM payment_orders WHERE order_no = $1',
      [params.client_sn]
    );

    if (orderResult.rows.length === 0) {
      console.error('【收钱吧回调】订单不存在:', params.client_sn);
      return res.send('success');
    }

    const order = orderResult.rows[0];

    // 防止重复处理
    if (order.status === 'paid') {
      console.log(`【收钱吧回调】订单 ${params.client_sn} 已是 paid，跳过`);
      return res.send('success');
    }

    if (orderStatus === 'PAID') {
      await pool.query(
        `UPDATE payment_orders
         SET status = $1, payway = $2, paid_at = $3, updated_at = NOW()
         WHERE order_no = $4`,
        ['paid', params.payway || null, new Date(), params.client_sn]
      );

      // ★ 简化：只记录付款，不自动激活会员
      // 会员激活由 AI客服 通过 /api/membership/check-and-activate 检查并处理
      console.log(`【收钱吧回调】✅ 订单 ${params.client_sn} 付款记录已保存，金额:¥${(params.total_amount / 100).toFixed(2)}，待AI客服激活会员`);
    } else if (orderStatus === 'CLOSED' || orderStatus === 'REFUND') {
      await pool.query(
        `UPDATE payment_orders SET status = $1, updated_at = NOW() WHERE order_no = $2`,
        [orderStatus === 'REFUND' ? 'refunded' : 'closed', params.client_sn]
      );
      console.log(`【收钱吧回调】订单 ${params.client_sn} 状态: ${orderStatus}`);
    }

    // 必须返回 success，否则收钱吧会重试
    res.send('success');

  } catch (error) {
    console.error('【收钱吧回调】处理异常:', error);
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
 * POST /api/payment/confirm-test
 * 测试模式：直接标记订单为已支付（仅允许 testMode 订单）
 */
router.post('/confirm-test', authenticateToken, async (req, res) => {
  try {
    const { orderNo } = req.body;
    const userId = req.userId;

    if (!orderNo) {
      return res.status(400).json({ success: false, error: '缺少订单号' });
    }

    // 验证订单存在且属于当前用户
    const orderResult = await pool.query(
      'SELECT * FROM payment_orders WHERE order_no = $1 AND user_id = $2',
      [orderNo, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    const order = orderResult.rows[0];

    // 安全检查：只允许以 TEST- 开头的订单使用此接口
    if (!order.shouqianba_sn || !order.shouqianba_sn.startsWith('TEST-')) {
      return res.status(403).json({
        success: false,
        error: '此接口仅用于测试模式，不可用于真实订单'
      });
    }

    // 更新为已支付
    await pool.query(
      `UPDATE payment_orders SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE order_no = $1`,
      [orderNo]
    );

    // ★ 简化：只记录付款，会员激活由 AI客服 处理
    console.log(`[支付] 测试模式订单已标记为已支付: ${orderNo}，待AI客服激活会员`);

    res.json({ success: true, message: '测试支付确认成功' });

  } catch (error) {
    console.error('确认测试支付失败:', error);
    res.status(500).json({ success: false, error: '确认测试支付失败' });
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
      'UPDATE users SET membership_type = $1, membership_expires_at = $2, updated_at = NOW() WHERE id::text = $3',
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

/**
 * GET /api/debug/terminal
 * 诊断终端配置读取
 */
router.get('/debug/terminal', async (req, res) => {
  try {
    // 模拟 getActiveTerminal 的所有路径
    const result = {
      step1_shouqianba_js: null,
      step1b_hardcoded: null,
      step2_cache: null,
      step3_env: null,
      step4_db: null,
      final_hasConfig: false
    };

    // Step 1: 读 shouqianba.js
    try {
      const { default: shouqianbaConfig } = await import('../config/shouqianba.js');
      const storeDevices = shouqianbaConfig && shouqianbaConfig.storeDevices;
      const deviceConfig = storeDevices && storeDevices['claw-web-new3'];
      result.step1_shouqianba_js = {
        hasConfig: !!shouqianbaConfig,
        hasStoreDevices: !!storeDevices,
        keys: storeDevices ? Object.keys(storeDevices) : null,
        deviceConfig: deviceConfig ? {
          terminalSn: deviceConfig.terminalSn,
          hasKey: !!deviceConfig.terminalKey
        } : null
      };
      if (deviceConfig && deviceConfig.terminalSn && deviceConfig.terminalKey) {
        return res.json({ source: 'shouqianba.js', data: deviceConfig, ...result });
      }
    } catch (e) {
      result.step1_shouqianba_js = { error: e.message };
    }

    // Step 1b: 硬编码兜底
    const HARDCODED = {
      terminalSn: '100111220054389553',
      terminalKey: '96bfaf401367d934cb10a1cbe9773647'
    };
    result.step1b_hardcoded = HARDCODED;

    // Step 2: 缓存文件
    const cache = loadTerminalCache();
    result.step2_cache = { hasKeys: Object.keys(cache).length > 0, cache };

    // Step 3: 环境变量
    result.step3_env = {
      sn: process.env.SHOUQIANBA_TERMINAL_SN || null,
      hasKey: !!process.env.SHOUQIANBA_TERMINAL_KEY
    };

    // Step 4: 数据库
    try {
      const dbResult = await pool.query(
        'SELECT terminal_sn, terminal_key FROM shouqianba_terminals WHERE status = $1 LIMIT 1',
        ['active']
      );
      result.step4_db = { rows: dbResult.rows.length, data: dbResult.rows[0] || null };
    } catch (e) {
      result.step4_db = { error: e.message };
    }

    // 最终判定
    const terminal = await getActiveTerminal();
    const sn = terminal?.terminalSn || terminal?.terminal_sn;
    const key = terminal?.terminalKey || terminal?.terminal_key;
    result.final_hasConfig = !!(terminal && sn && key && sn !== '100111220054328800');
    result.final_terminal = terminal ? {
      terminalSn: terminal.terminalSn,
      terminalSn_undefined: terminal.terminalSn === undefined,
      terminal_sn: terminal.terminal_sn,
      hasKey: !!terminal.terminalKey,
      sn_type: typeof sn,
      sn_value: sn
    } : 'null_or_undefined';

    res.json({ terminal, ...result });
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

export default router;
