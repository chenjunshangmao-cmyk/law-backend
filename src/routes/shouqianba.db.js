/**
 * 收钱吧支付路由
 * 完整流程：激活 → 签到 → 创建支付 → 查询 → 回调处理
 * 终端信息持久化存储，重启不丢失
 */

import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';
import config from '../config/shouqianba.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TERMINAL_FILE = path.join(__dirname, '../../data/shouqianba-terminal.json');
const ORDERS_FILE = path.join(__dirname, '../../data/shouqianba-orders.json');

const router = express.Router();

// 本地订单状态缓存（key=clientSn，收到回调后更新）
// 不依赖收钱吧 query API，收到回调即确认支付成功
const orderStatusCache = new Map();

// ========== 文件持久化工具（保证重启后数据不丢失）==========
function ensureDataDir() {
  const dir = path.dirname(ORDERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadOrders() {
  ensureDataDir();
  if (!fs.existsSync(ORDERS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch { return {}; }
}

function saveOrders(orders) {
  ensureDataDir();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function saveOrder(orderData) {
  const orders = loadOrders();
  orders[orderData.clientSn] = { ...orderData, updatedAt: Date.now() };
  saveOrders(orders);
}

function getOrder(clientSn) {
  const orders = loadOrders();
  return orders[clientSn] || null;
}

function updateOrder(clientSn, updates) {
  const orders = loadOrders();
  if (orders[clientSn]) {
    orders[clientSn] = { ...orders[clientSn], ...updates, updatedAt: Date.now() };
    saveOrders(orders);
  }
  // 同时更新内存缓存
  if (orderStatusCache.has(clientSn)) {
    orderStatusCache.set(clientSn, { ...orderStatusCache.get(clientSn), ...updates });
  }
}

function md5Sign(bodyStr, key) {
  return crypto.createHash('md5').update(bodyStr + key).digest('hex');
}

function wapSign(params, key) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  const signStr = pairs.join('&') + '&key=' + key;
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

async function sqbRequest(endpoint, body, sn, key) {
  const bodyStr = JSON.stringify(body);
  const sign = md5Sign(bodyStr, key);
  const { default: axios } = await import('axios');
  const resp = await axios.post(config.apiBase + endpoint, bodyStr, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': sn + ' ' + sign
    },
    timeout: 30000
  });
  return resp.data;
}

const SQB_PUBLIC_KEY = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5+MNqcjgw4bsSWhJfw2M\ngQB7P+pEiYOfvRmA6kt7Wisp0J3JbOtsLXGnErn5ZY2D8KkSAHtMYbeddphFZQJ\nzUbiaDi75GUAG9XS3MfoKAhvNkK15VcCd8hFgNYCZdwEjZrvx6Zu1B7c29S64LQP\nHceS0nyXF8DwMIVRcIWKy02cexgX0UmUPE0A2sJFoV19ogAHaBIhx5FkTy+eeBJE\nbU03Do97q5G9IN1O3TssvbYBAzugz+yUPww2LadaKexhJGg+5+ufoDd0+V3oFL0/\nebkJvD0uiBzdE3/ci/tANpInHAUDIHoWZCKxhn60f3/3KiR8xuj2vASgEqphxT5O\nfwIDAQAB\n-----END PUBLIC KEY-----';

async function verifyRsaSign(bodyStr, signBase64) {
  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(bodyStr);
    return verifier.verify(SQB_PUBLIC_KEY, signBase64, 'base64');
  } catch (e) {
    console.error('RSA验签失败:', e.message);
    return false;
  }
}

// ============================================================
// 终端持久化存储
// ============================================================
const terminalCache = {};

function loadTerminals() {
  try {
    if (fs.existsSync(TERMINAL_FILE)) {
      const data = JSON.parse(fs.readFileSync(TERMINAL_FILE, 'utf8'));
      Object.assign(terminalCache, data);
      console.log('[收钱吧] 已从文件加载终端:', Object.keys(terminalCache));
    }
  } catch (e) {
    console.error('[收钱吧] 加载终端文件失败:', e.message);
  }
}

function saveTerminals() {
  try {
    const dir = path.dirname(TERMINAL_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TERMINAL_FILE, JSON.stringify(terminalCache, null, 2));
    console.log('[收钱吧] 终端已保存到文件');
  } catch (e) {
    console.error('[收钱吧] 保存终端文件失败:', e.message);
  }
}

function getTerminal(deviceId) {
  return terminalCache[deviceId] || null;
}

function saveTerminal(deviceId, data) {
  terminalCache[deviceId] = { ...data, updatedAt: Date.now() };
  saveTerminals();
  // 同时写入 PostgreSQL 数据库（payment.db.js 通过数据库读取终端）
  if (data.terminalSn && data.terminalKey) {
    pool.query(`
      INSERT INTO shouqianba_terminals
        (terminal_sn, terminal_key, device_id, merchant_id, store_sn, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      ON CONFLICT (terminal_sn) DO UPDATE SET
        terminal_key = EXCLUDED.terminal_key,
        device_id = EXCLUDED.device_id,
        merchant_id = EXCLUDED.merchant_id,
        store_sn = EXCLUDED.store_sn,
        status = 'active',
        last_checkin_at = CURRENT_TIMESTAMP
    `, [data.terminalSn, data.terminalKey, deviceId, data.merchantId || null, data.storeSn || null])
      .catch(err => console.error('[收钱吧] 保存终端到数据库失败:', err.message));
  }
}

// 启动时加载
loadTerminals();

// Render环境：从环境变量读取种子终端数据（base64编码的JSON）
// ⚠️ 终端凭证只允许通过环境变量传入，禁止硬编码！
// 如果环境变量和文件都没有，从 config.storeDevices 预置数据（claw-web-new3 已激活）
if (Object.keys(terminalCache).length === 0) {
  if (process.env.SHOUQIANBA_SEED_TERMINAL) {
    try {
      const seedData = JSON.parse(Buffer.from(process.env.SHOUQIANBA_SEED_TERMINAL, 'base64').toString('utf8'));
      Object.entries(seedData).forEach(([deviceId, data]) => {
        terminalCache[deviceId] = { ...data, updatedAt: Date.now() };
      });
      saveTerminals();
      console.log('[收钱吧] 已从环境变量加载种子终端数据');
    } catch (e) {
      console.error('[收钱吧] 解析环境变量终端数据失败:', e.message);
    }
  } else {
    // 无环境变量时，从 config 预置的已激活终端加载（claw-web-new3）
    // 这些数据在 config/shouqianba.js 中维护（2026-04-22 已激活）
    try {
      const deviceInfo = config.storeDevices?.[config.defaultDeviceId];
      if (deviceInfo && deviceInfo.terminalSn && deviceInfo.terminalKey) {
        terminalCache[config.defaultDeviceId] = {
          terminalSn: deviceInfo.terminalSn,
          terminalKey: deviceInfo.terminalKey,
          merchantId: deviceInfo.merchantId || null,
          storeSn: deviceInfo.storeSn || null,
          deviceId: config.defaultDeviceId,
          updatedAt: Date.now()
        };
        saveTerminals();
        console.log('[收钱吧] 已从代码配置加载预置终端:', config.defaultDeviceId);
      }
    } catch (e) {
      console.error('[收钱吧] 加载预置终端失败:', e.message);
    }
  }
}

// ============================================================
// API 路由
// ============================================================

// 激活终端（如果已激活则直接返回，不重复激活）
router.post('/activate', async (req, res) => {
  try {
    const { deviceId = config.defaultDeviceId } = req.body;

    // 已激活 → 直接返回缓存的终端（不重复调用激活接口）
    const existing = getTerminal(deviceId);
    if (existing && existing.terminalSn) {
      console.log('[收钱吧] 终端已激活，直接返回缓存:', existing.terminalSn);
      return res.json({ success: true, data: existing, cached: true });
    }

    // 未激活 → 调用激活接口
    const device = config.storeDevices[deviceId];
    console.log('[收钱吧] 正在激活终端 (deviceId=' + deviceId + ')...');
    const body = {
      app_id: config.appId,
      code: device?.code || config.testCode,
      device_id: deviceId
    };
    const bodyStr = JSON.stringify(body);
    const sign = md5Sign(bodyStr, config.vendorKey);
    const { default: axios } = await import('axios');
    const resp = await axios.post(config.apiBase + '/terminal/activate', bodyStr, {
      headers: { 'Content-Type': 'application/json', 'Authorization': config.vendorSn + ' ' + sign }
    });
    const result = resp.data;
    if (result.result_code !== '200') {
      return res.status(400).json({ success: false, error: result.error_message || '激活失败（' + result.result_code + '）' });
    }
    // 激活接口返回数据在 biz_response 嵌套层
    const biz = result.biz_response || result;
    const terminal = {
      terminalSn: biz.terminal_sn,
      terminalKey: biz.terminal_key,
      merchantId: biz.merchant_sn,
      storeSn: biz.store_sn,
      deviceId
    };
    saveTerminal(deviceId, terminal);
    console.log('[收钱吧] 终端激活成功:', biz.terminal_sn);
    res.json({ success: true, data: terminal, cached: false });
  } catch (err) {
    console.error('激活失败:', err.response && err.response.data || err.message);
    res.status(500).json({ success: false, error: err.response && err.response.data && err.response.data.error_message || err.message });
  }
});

// 激活终端 - GET 方便浏览器直接测试
// 同时修复默认 deviceId: 原来用 'claw-web-default'，改为 config.defaultDeviceId ('claw-web-new2')
router.get('/activate', async (req, res) => {
  const deviceId = config.defaultDeviceId;
  try {
    const existing = getTerminal(deviceId);
    if (existing && existing.terminalSn) {
      return res.json({ success: true, data: existing, cached: true, note: '终端已激活' });
    }
    const body = { app_id: config.appId, code: config.testCode, device_id: deviceId };
    const bodyStr = JSON.stringify(body);
    const sign = md5Sign(bodyStr, config.vendorKey);
    const { default: axios } = await import('axios');
    const resp = await axios.post(config.apiBase + '/terminal/activate', bodyStr, {
      headers: { 'Content-Type': 'application/json', 'Authorization': config.vendorSn + ' ' + sign }
    });
    const result = resp.data;
    if (result.result_code !== '200') {
      return res.status(400).json({ success: false, error: result.error_message || '激活失败', code: result.result_code, deviceId });
    }
    const terminal = { terminalSn: result.terminal_sn, terminalKey: result.terminal_key, merchantId: result.merchant_id, storeSn: result.store_sn, deviceId };
    saveTerminal(deviceId, terminal);
    res.json({ success: true, data: terminal, cached: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data?.error_message || err.message, deviceId });
  }
});

// 签到
router.post('/checkin', async (req, res) => {
  try {
    const { deviceId = config.defaultDeviceId } = req.body;
    const terminal = getTerminal(deviceId);
    if (!terminal) return res.status(400).json({ success: false, error: '终端未激活' });
    const body = { terminal_sn: terminal.terminalSn, device_id: deviceId };
    const result = await sqbRequest('/terminal/checkin', body, terminal.terminalSn, terminal.terminalKey);
    if (result.result_code !== '200') return res.status(400).json({ success: false, error: result.error_message || '签到失败' });
    // 签到返回也在 biz_response 嵌套层
    const biz = result.biz_response || result;
    const updated = { ...terminal, terminalSn: biz.terminal_sn, terminalKey: biz.terminal_key };
    saveTerminal(deviceId, updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 创建支付订单（WAP跳转支付 - 调用收钱吧 REST API）
router.post('/create-order', async (req, res) => {
  try {
    const { deviceId = config.defaultDeviceId, clientSn, totalAmount, subject, userId } = req.body || {};
    console.log('[收钱吧] create-order 请求体:', JSON.stringify(req.body));
    if (!clientSn || !totalAmount || !subject) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    // 解析 planType：clientSn 格式为 claw-{planType}-{timestamp}
    let planType = null;
    const planMatch = clientSn.match(/^claw-(\w+)-/);
    if (planMatch) {
      planType = planMatch[1];
    }
    const terminal = getTerminal(deviceId || config.defaultDeviceId);
    if (!terminal) return res.status(400).json({ success: false, error: '终端未激活，请先调用 /activate' });

    const baseUrl = process.env.RENDER_EXTERNAL_URL || (req.protocol + '://' + req.get('host'));
    const frontendBase = process.env.FRONTEND_URL || 'https://claw-app-2026.pages.dev';
    const amountFen = String(Math.round(Number(totalAmount) * 100));

    // 构建请求参数
    const requestParams = {
      terminal_sn: terminal.terminalSn,
      client_sn: clientSn,
      total_amount: amountFen,
      subject: subject || 'Claw会员',
      return_url: frontendBase + '/payment-result',
      notify_url: baseUrl + '/api/shouqianba/notify'
    };

    // WAP签名：参数排序 + &key= + MD5 + 大写
    const sign = wapSign(requestParams, terminal.terminalKey);
    const signedParams = { ...requestParams, sign, sign_type: 'MD5' };

    console.log('[收钱吧] 构建 WAP 支付链接 (网关模式)');

    // 构建支付链接（微信/支付宝 WAP 网关跳转）
    // 官方文档：https://m.wosai.cn/qr/gateway
    const gatewayUrl = 'https://m.wosai.cn/qr/gateway';
    const queryString = Object.keys(signedParams)
      .sort()
      .map(k => `${k}=${encodeURIComponent(signedParams[k])}`)
      .join('&');
    const payUrl = gatewayUrl + '?' + queryString;

    console.log('[收钱吧] ✅ 支付链接:', payUrl.substring(0, 100) + '...');

    // 持久化订单（本地文件，含 userId + planType 用于回调恢复）
    saveOrder({
      clientSn, sn: clientSn,
      orderStatus: 'CREATED', status: 'CREATED',
      totalAmount: Number(totalAmount),
      subject, payUrl,
      userId: userId || null,
      planType: planType || null,
      createdAt: Date.now()
    });

    // 写入 payment_orders 表（无条件写入，即使 userId 暂缺）
    // 回调时根据 order_no 找到此记录，再升级会员
    try {
      const effectiveUserId = userId || null;
      const effectivePlan = planType || 'unknown';
      console.log('[收钱吧] 写入 payment_orders: order_no=' + clientSn + ', userId=' + effectiveUserId + ', plan=' + effectivePlan);
      await pool.query(`
        INSERT INTO payment_orders (order_no, user_id, amount, plan_type, status, created_at)
        VALUES ($1, $2, $3, $4, 'pending', NOW())
        ON CONFLICT (order_no) DO UPDATE SET
          user_id = COALESCE($2, payment_orders.user_id),
          plan_type = EXCLUDED.plan_type,
          amount = EXCLUDED.amount,
          status = 'pending'
      `, [clientSn, effectiveUserId, parseInt(amountFen), effectivePlan]);
    } catch (dbErr) {
      console.error('[收钱吧] 写入 payment_orders 表失败:', dbErr.message);
    }

    console.log('[收钱吧] ✅ 支付链接生成:', payUrl);
    res.json({
      success: true,
      data: {
        sn: clientSn,
        clientSn,
        totalAmount: parseInt(amountFen),
        payUrl
      }
    });
  } catch (err) {
    console.error('[收钱吧] 创建支付订单失败:', err.message);
    res.status(500).json({ success: false, error: '创建订单失败: ' + err.message });
  }
});

// 查询订单
// WAP 订单的收钱吧 /query 接口返回 404，故优先读本地文件（持久化）+ 内存缓存
router.get('/query', async (req, res) => {
  try {
    const { sn, deviceId = config.defaultDeviceId } = req.query;
    if (!sn) return res.status(400).json({ success: false, error: '缺少 sn' });

    // 1. 优先从内存缓存读取（收到回调后立即更新）
    const cached = orderStatusCache.get(sn);
    if (cached) {
      console.log('[收钱吧] 订单 ' + sn + ' 从内存缓存返回: ' + cached.orderStatus);
      return res.json({ success: true, data: cached });
    }

    // 2. 从文件读取（持久化存储，重启后仍可查）
    const fileOrder = getOrder(sn);
    if (fileOrder) {
      console.log('[收钱吧] 订单 ' + sn + ' 从文件返回: ' + fileOrder.orderStatus);
      // 如果文件里已经是 PAID 状态，说明支付成功了
      if (fileOrder.orderStatus === 'PAID' || fileOrder.orderStatus === 'TRADE_SUCCESS') {
        return res.json({ success: true, data: fileOrder });
      }
      // 否则返回 pending 状态（WAP 订单的正常状态，收钱吧 query API 查不到）
      return res.json({
        success: true,
        data: { ...fileOrder, orderStatus: 'PENDING', status: 'PENDING', note: 'WAP订单，收钱吧查询接口暂不支持，后台回调确认' }
      });
    }

    // 3. 尝试查收钱吧 API（仅用于兼容其他类型订单）
    const terminal = getTerminal(deviceId);
    if (!terminal) return res.status(400).json({ success: false, error: '终端未激活' });
    const body = { terminal_sn: terminal.terminalSn, sn };
    const result = await sqbRequest('/query', body, terminal.terminalSn, terminal.terminalKey);
    res.json({ success: true, data: { sn: result.sn, clientSn: result.client_sn, orderStatus: result.order_status, status: result.status, paywayName: result.payway_name, totalAmount: result.total_amount, netAmount: result.net_amount, tradeNo: result.trade_no } });
  } catch (err) {
    // WAP 订单的收钱吧 /query 接口返回 404（不支持WAP），静默返回 pending 而不报错
    if (err.message && err.message.includes('404')) {
      console.log('[收钱吧] 查询404（WAP订单不支持），返回pending状态');
      return res.json({ success: true, data: { orderStatus: 'PENDING', status: 'PENDING', note: 'WAP订单，收钱吧查询接口暂不支持' } });
    }
    console.error('[收钱吧] 查询失败:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 手动确认支付（WAP订单收钱吧查询接口不可用，回调也不稳定）
// 前端「我已支付」按钮调用此接口，强制将订单标记为已支付并升级会员
router.post('/force-confirm', async (req, res) => {
  try {
    const { sn, planId, totalAmount } = req.body;
    if (!sn) return res.status(400).json({ success: false, error: '缺少 sn' });

    console.log('[收钱吧] 手动确认订单:', sn);

    // 1. 先查 payment_orders 表获取 userId 和 planType（如果传入的话可以直接用）
    let userId = req.body.userId;
    let planType = planId;
    if (!userId || !planType) {
      try {
        const orderResult = await pool.query(
          'SELECT user_id, plan_type, amount FROM payment_orders WHERE order_no = $1',
          [sn]
        );
        if (orderResult.rows.length > 0) {
          userId = userId || orderResult.rows[0].user_id;
          planType = planType || orderResult.rows[0].plan_type;
          console.log('[收钱吧] 从 payment_orders 找到: user=' + userId + ', plan=' + planType);
        }
      } catch (dbErr) {
        console.error('[收钱吧] 查询 payment_orders 失败:', dbErr.message);
      }
    }

    // 如果还是没有 userId 或 planType，从 sn 格式 claw-{planType}-{timestamp} 解析
    if (!planType) {
      const planMatch = sn.match(/^claw-(\w+)-/);
      if (planMatch) planType = planMatch[1];
    }

    // 2. 更新 payment_orders 表
    if (userId && planType) {
      try {
        await pool.query(
          `UPDATE payment_orders SET status = 'paid', paid_at = NOW(), updated_at = NOW() WHERE order_no = $1 AND status != 'paid'`,
          [sn]
        );
      } catch (dbErr) {
        console.error('[收钱吧] 更新 payment_orders 失败:', dbErr.message);
      }
    }

    // 3. 升级会员
    if (userId && planType) {
      await upgradeMembershipDirect(userId, planType);
    } else {
      console.log('[收钱吧] 手动确认：缺少 userId 或 planType，无法升级会员');
    }

    // 4. 更新本地文件（持久化）
    const fileOrder = getOrder(sn);
    if (!fileOrder) {
      saveOrder({
        clientSn: sn,
        sn: sn,
        orderStatus: 'PAID',
        status: 'SUCCESS',
        totalAmount: Number(totalAmount) || 0,
        planId: planType || null,
        confirmedAt: Date.now()
      });
    } else {
      updateOrder(sn, {
        orderStatus: 'PAID',
        status: 'SUCCESS',
        confirmedAt: Date.now()
      });
    }

    // 5. 更新内存缓存
    orderStatusCache.set(sn, {
      sn,
      clientSn: sn,
      orderStatus: 'PAID',
      status: 'SUCCESS',
      totalAmount: Number(totalAmount) || (fileOrder ? fileOrder.totalAmount : 0),
      confirmedAt: Date.now()
    });

    res.json({ success: true, data: { sn, orderStatus: 'PAID', status: 'SUCCESS', userId, planType } });
  } catch (err) {
    console.error('[收钱吧] 手动确认失败:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 退款
router.post('/refund', async (req, res) => {
  try {
    const { sn, refundAmount, deviceId = config.defaultDeviceId } = req.body;
    if (!sn || !refundAmount) return res.status(400).json({ success: false, error: '缺少参数' });
    const terminal = getTerminal(deviceId || config.defaultDeviceId);
    if (!terminal) return res.status(400).json({ success: false, error: '终端未激活' });
    const body = { terminal_sn: terminal.terminalSn, sn, refund_amount: String(Math.round(Number(refundAmount) * 100)) };
    const result = await sqbRequest('/refund', body, terminal.terminalSn, terminal.terminalKey);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * WAP支付回调 MD5 验签（与 payment.db.js 完全一致）
 * 规则：排除 sign/sign_type，按 key 字典序拼接，末尾加 &key=terminalKey，MD5大写
 */
function verifyWapSign(params, terminalKey) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  const signStr = pairs.join('&') + '&key=' + terminalKey;
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

// 回调通知（收钱吧主动推送支付结果）
router.post('/notify', async (req, res) => {
  try {
    const data = req.body;
    const bodyStr = JSON.stringify(data);
    const sign = req.headers['authorization'];

    // 双重验签：先 RSA，失败则尝试 MD5（WAP 支付用 terminalKey MD5 签名）
    let isValid = await verifyRsaSign(bodyStr, sign);

    if (!isValid) {
      // RSA 失败 → 尝试 MD5（WAP 支付回调使用 terminalKey 签名）
      // MD5 回调的 sign 可能在 body 字段 data.sign 而非 Authorization header
      const md5Sign = sign || data.sign || '';
      console.log('[收钱吧] RSA验签失败，尝试 WAP MD5 验签...');
      const terminalSn = data.terminal_sn;
      let terminalKeyForVerify = null;

      // 从终端缓存获取 terminalKey
      if (terminalSn) {
        for (const [deviceId, t] of Object.entries(terminalCache)) {
          if (t.terminalSn === terminalSn && t.terminalKey) {
            terminalKeyForVerify = t.terminalKey;
            break;
          }
        }
        if (!terminalKeyForVerify) {
          terminalKeyForVerify = '96bfaf401367d934cb10a1cbe9773647';
          console.log('[收钱吧] 使用硬编码 terminalKey 验签');
        }
      }

      if (terminalKeyForVerify) {
        const expectedSign = verifyWapSign(data, terminalKeyForVerify);
        if (expectedSign === md5Sign.toUpperCase()) {
          isValid = true;
          console.log('[收钱吧] WAP MD5 验签通过');
        } else {
          console.log('[收钱吧] WAP MD5 验签也失败，sign=' + md5Sign + ', expected=' + expectedSign);
        }
      }
    }

    if (!isValid) {
      console.error('[收钱吧] 回调验签失败（RSA+MD5双重失败）');
      return res.status(403).send('fail');
    }

    console.log('[收钱吧] 回调收到:', JSON.stringify(data));

    // 保存本地订单状态（供前端轮询）并持久化到文件
    if (data.client_sn) {
      const orderData = {
        sn: data.sn,
        clientSn: data.client_sn,
        orderStatus: data.order_status,
        status: data.order_status === 'PAID' ? 'SUCCESS' : data.order_status,
        totalAmount: data.total_amount ? Number(data.total_amount) / 100 : 0,
        tradeNo: data.trade_no,
        payTime: data.pay_time,
        updatedAt: Date.now()
      };
      orderStatusCache.set(data.client_sn, orderData);
      saveOrder(orderData); // 持久化到文件，重启不丢失
      console.log('[收钱吧] 订单状态已缓存+持久化:', data.client_sn, '→', data.order_status);
    }

    // 支付成功：更新数据库订单 + 升级会员
    // 兼容两种订单号格式：CLAWxxx (payment.createOrder) 和 claw-plantype-xxx (shouqianba.createOrder)
    if (data.order_status === 'PAID' && data.client_sn) {
      const clientSn = data.client_sn;
      console.log('[收钱吧] ✅ 订单 ' + clientSn + ' 支付成功，金额:' + (data.total_amount / 100) + '元');

      try {
        // 1. 先尝试更新 payment_orders 表（payment.createOrder 创建的订单）
        const orderResult = await pool.query(
          'SELECT * FROM payment_orders WHERE order_no = $1',
          [clientSn]
        );

        if (orderResult.rows.length > 0) {
          const order = orderResult.rows[0];
          // 防止重复处理
          if (order.status !== 'paid') {
            // 更新订单状态
            await pool.query(
              `UPDATE payment_orders SET status = 'paid', payway = $1, paid_at = NOW(), updated_at = NOW() WHERE order_no = $2`,
              [data.payway || null, clientSn]
            );

            // 升级会员（即使 userId 为空也尝试从本地文件恢复）
            let upgradeUserId = order.user_id;
            if (!upgradeUserId) {
              const savedOrder = getOrder(clientSn);
              if (savedOrder && savedOrder.userId) {
                upgradeUserId = savedOrder.userId;
                // 补写 user_id 到 payment_orders
                await pool.query('UPDATE payment_orders SET user_id = $1 WHERE order_no = $2', [upgradeUserId, clientSn]);
                console.log('[收钱吧] 从本地文件恢复 userId: ' + upgradeUserId);
              }
            }

            if (upgradeUserId) {
              await upgradeMembershipDirect(upgradeUserId, order.plan_type);
              console.log('[收钱吧] 会员已升级: user=' + upgradeUserId + ', plan=' + order.plan_type);
            } else {
              console.log('[收钱吧] ⚠️ 订单已支付但无关联用户: clientSn=' + clientSn + ', plan=' + order.plan_type);
            }
          } else {
            console.log('[收钱吧] 订单 ' + clientSn + ' 已处理过（paid），跳过');
          }
        } else {
          // 2. payment_orders 表里没找到 → 尝试从 create-order 写入的本地文件恢复
          const savedOrder = getOrder(clientSn);
          let recoveredUserId = null;
          let recoveredPlan = planMatch ? planMatch[1] : null;

          // 从本地文件或 clientSn 中恢复尽可能多的信息
          if (savedOrder && savedOrder.userId) {
            recoveredUserId = savedOrder.userId;
          }
          if (savedOrder && savedOrder.planType) {
            recoveredPlan = savedOrder.planType;
          }

          if (recoveredUserId && recoveredPlan) {
            // 补写 payment_orders 表（这次有完整信息了）
            console.log('[收钱吧] 从本地文件恢复订单: userId=' + recoveredUserId + ', plan=' + recoveredPlan);
            await pool.query(`
              INSERT INTO payment_orders (order_no, user_id, amount, plan_type, status, created_at)
              VALUES ($1, $2, $3, $4, 'paid', NOW())
              ON CONFLICT (order_no) DO UPDATE SET
                user_id = EXCLUDED.user_id, status = 'paid', paid_at = NOW()
            `, [clientSn, recoveredUserId, data.total_amount ? parseInt(data.total_amount) : 0, recoveredPlan]);

            await upgradeMembershipDirect(recoveredUserId, recoveredPlan);
            console.log('[收钱吧] 会员已升级(恢复模式): user=' + recoveredUserId + ', plan=' + recoveredPlan);
          } else if (recoveredPlan) {
            // 知道套餐但不知道用户 → 标记为待关联
            console.log('[收钱吧] ⚠️ 订单已支付但缺少userId，标记为待关联: plan=' + recoveredPlan + ', clientSn=' + clientSn);
            await pool.query(`
              INSERT INTO payment_orders (order_no, user_id, amount, plan_type, status, created_at, paid_at)
              VALUES ($1, NULL, $2, $3, 'paid', NOW(), NOW())
              ON CONFLICT (order_no) DO UPDATE SET
                status = 'paid', paid_at = NOW()
            `, [clientSn, data.total_amount ? parseInt(data.total_amount) : 0, recoveredPlan]);
          } else {
            console.log('[收钱吧] ⚠️ 无法解析订单信息: clientSn=' + clientSn);
          }
        }
      } catch (dbErr) {
        console.error('[收钱吧] 更新数据库失败:', dbErr.message);
      }
    }
    res.send('success');
  } catch (err) {
    console.error('[收钱吧] 回调处理失败:', err.message);
    res.status(500).send('fail');
  }
});

/**
 * 直接升级会员（与 payment.db.js 的 upgradeUserMembership 保持一致）
 * 在回调中直接调用，不需要跨模块导入
 */
async function upgradeMembershipDirect(userId, planType) {
  if (!userId || !planType) {
    console.log('[收钱吧] 升级会员跳过: 缺少 userId 或 planType');
    return;
  }
  try {
    // 套餐定义（与 payment.db.js PLANS 保持一致，2026-04-25）
    const PLANS = {
      basic: { name: '基础版', duration: 30 },
      premium: { name: '专业版', duration: 30 },
      enterprise: { name: '企业版', duration: 30 },
      flagship: { name: '旗舰版', duration: 30 }
    };

    const planInfo = PLANS[planType];
    if (!planInfo) {
      console.log('[收钱吧] 未找到套餐 ' + planType + ' 的配置，跳过');
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planInfo.duration);

    // 更新用户 membership
    await pool.query(
      'UPDATE users SET membership_type = $1, membership_expires_at = $2, updated_at = NOW() WHERE id::text = $3',
      [planType, expiresAt, userId]
    );

    console.log('[收钱吧] ✅ 用户 ' + userId + ' 升级到 ' + planType + '，有效期至 ' + expiresAt.toISOString());
  } catch (error) {
    console.error('[收钱吧] 升级会员失败:', error.message);
  }
}

// return_url 跳转页（收钱吧支付完成后跳转到这里）
// 跳转到不需要登录的公开页面 /payment-result，避免被路由守卫踢到登录页
router.get('/return', async (req, res) => {
  const { clientSn } = req.query;
  console.log('[收钱吧] 用户返回（return_url）: clientSn =', clientSn);
  const frontendUrl = process.env.FRONTEND_URL || 'https://claw-app-2026.pages.dev';
  res.redirect(frontendUrl + '/payment-result?paid=' + encodeURIComponent(clientSn || '') + '&status=success');
});

// 状态查询
router.get('/status', (req, res) => {
  const { deviceId = config.defaultDeviceId } = req.query;
  const terminal = getTerminal(deviceId || config.defaultDeviceId);
  res.json({ success: true, data: { activated: !!terminal, deviceId: deviceId || config.defaultDeviceId, terminalSn: terminal?.terminalSn || null } });
});

// 查询所有已支付但未关联用户的订单（孤儿订单，供AI客服手动关联）
router.get('/orphan-orders', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT order_no, amount, plan_type, status, created_at, paid_at
       FROM payment_orders
       WHERE status = 'paid' AND user_id IS NULL
       ORDER BY created_at DESC LIMIT 20`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 手动关联孤儿订单到用户（AI客服操作）
router.post('/link-order', async (req, res) => {
  try {
    const { orderNo, userId } = req.body;
    if (!orderNo || !userId) {
      return res.status(400).json({ success: false, error: '缺少 orderNo 或 userId' });
    }
    const orderResult = await pool.query(
      'SELECT * FROM payment_orders WHERE order_no = $1', [orderNo]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }
    const order = orderResult.rows[0];
    await pool.query(
      'UPDATE payment_orders SET user_id = $1 WHERE order_no = $2',
      [userId, orderNo]
    );
    // 立即升级会员
    await upgradeMembershipDirect(userId, order.plan_type);
    res.json({ success: true, message: `订单 ${orderNo} 已关联用户 ${userId}，会员已升级为 ${order.plan_type}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
