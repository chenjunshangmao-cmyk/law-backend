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
import config from '../config/shouqianba.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TERMINAL_FILE = path.join(__dirname, '../../data/shouqianba-terminal.json');

const router = express.Router();

// 本地订单状态缓存（key=clientSn，收到回调后更新）
// 不依赖收钱吧 query API，收到回调即确认支付成功
const orderStatusCache = new Map();

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

// 创建支付订单（WAP跳转支付）
router.post('/create-order', async (req, res) => {
  try {
    const { deviceId = config.defaultDeviceId, clientSn, totalAmount, subject } = req.body;
    if (!clientSn || !totalAmount || !subject) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }
    const terminal = getTerminal(deviceId || config.defaultDeviceId);
    if (!terminal) return res.status(400).json({ success: false, error: '终端未激活，请先调用 /activate' });
    const baseUrl = process.env.RENDER_EXTERNAL_URL || (req.protocol + '://' + req.get('host'));

    // WAP支付参数（参考官方文档，必填：terminal_sn, client_sn, total_amount, subject, return_url, operator）
    const requestParams = {
      terminal_sn: terminal.terminalSn,
      client_sn: clientSn,
      total_amount: String(Math.round(Number(totalAmount))), // 金额（分，已在前端×100）
      subject,
      return_url: baseUrl + '/api/shouqianba/return?clientSn=' + clientSn, // 支付完成后跳转（带sn）
      notify_url: baseUrl + '/api/shouqianba/notify', // 服务器异步回调（收钱吧主动通知）
      operator: 'claw_admin' // 门店操作员（必填，文档明确要求）
    };

    // WAP签名：参数排序 + &key= + MD5 + 大写
    const sign = wapSign(requestParams, terminal.terminalKey);
    const signedParams = { ...requestParams, sign, sign_type: 'MD5' };

    // 构建网关URL（GET请求，参数拼在URL后面）
    const gatewayUrl = 'https://m.wosai.cn/qr/gateway';
    const queryString = Object.keys(signedParams)
      .sort()
      .map(k => `${k}=${encodeURIComponent(signedParams[k])}`)
      .join('&');
    const payUrl = gatewayUrl + '?' + queryString;

    console.log('[收钱吧] WAP支付URL已生成:', payUrl.substring(0, 100) + '...');
    res.json({
      success: true,
      data: {
        sn: clientSn,         // 修复：统一用 sn 供前端轮询
        clientSn,             // 保留兼容
        totalAmount: Number(totalAmount),
        payUrl,               // 前端直接跳转到此URL即可完成支付
        gateway: gatewayUrl,
      }
    });
  } catch (err) {
    console.error('创建支付订单失败:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 查询订单（优先读本地缓存，WAP场景下收钱吧query接口可能不支持）
router.get('/query', async (req, res) => {
  try {
    const { sn, deviceId = config.defaultDeviceId } = req.query;
    if (!sn) return res.status(400).json({ success: false, error: '缺少 sn' });

    // 1. 优先从本地缓存读取（收到回调后立即更新，保证准确）
    const cached = orderStatusCache.get(sn);
    if (cached) {
      console.log('[收钱吧] 订单 ' + sn + ' 从本地缓存返回: ' + cached.orderStatus);
      return res.json({ success: true, data: cached });
    }

    // 2. 缓存没有，尝试查收钱吧 API
    const terminal = getTerminal(deviceId);
    if (!terminal) return res.status(400).json({ success: false, error: '终端未激活' });
    const body = { terminal_sn: terminal.terminalSn, sn };
    const result = await sqbRequest('/query', body, terminal.terminalSn, terminal.terminalKey);
    res.json({ success: true, data: { sn: result.sn, clientSn: result.client_sn, orderStatus: result.order_status, status: result.status, paywayName: result.payway_name, totalAmount: result.total_amount, netAmount: result.net_amount, tradeNo: result.trade_no } });
  } catch (err) {
    console.error('[收钱吧] 查询失败:', err.message);
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

// 回调通知（收钱吧主动推送支付结果）
router.post('/notify', async (req, res) => {
  try {
    const bodyStr = JSON.stringify(req.body);
    const sign = req.headers['authorization'];
    const isValid = await verifyRsaSign(bodyStr, sign);
    if (!isValid) {
      console.error('[收钱吧] 回调验签失败');
      return res.status(403).send('fail');
    }
    const data = req.body;
    console.log('[收钱吧] 回调收到:', data);

    // 保存本地订单状态（供前端轮询）
    if (data.client_sn) {
      orderStatusCache.set(data.client_sn, {
        sn: data.sn,
        clientSn: data.client_sn,
        orderStatus: data.order_status,
        status: data.order_status === 'PAID' ? 'SUCCESS' : data.order_status,
        totalAmount: data.total_amount ? Number(data.total_amount) / 100 : 0,
        tradeNo: data.trade_no,
        payTime: data.pay_time,
        updatedAt: Date.now()
      });
      console.log('[收钱吧] 订单状态已缓存:', data.client_sn, '→', data.order_status);
    }

    if (data.order_status === 'PAID') {
      console.log('[收钱吧] ✅ 订单 ' + data.client_sn + ' 支付成功，金额:' + (data.total_amount / 100) + '元');
    }
    res.send('success');
  } catch (err) {
    console.error('[收钱吧] 回调处理失败:', err.message);
    res.status(500).send('fail');
  }
});

// return_url 跳转页（收钱吧支付完成后跳转到这里）
router.get('/return', async (req, res) => {
  const { clientSn } = req.query;
  console.log('[收钱吧] 用户返回（return_url）: clientSn =', clientSn);
  // 重定向到前端会员页
  const frontendUrl = process.env.FRONTEND_URL || 'https://4d12215a.claw-app-2026.pages.dev';
  res.redirect(frontendUrl + '/membership?paid=' + encodeURIComponent(clientSn || ''));
});

// 状态查询
router.get('/status', (req, res) => {
  const { deviceId = config.defaultDeviceId } = req.query;
  const terminal = getTerminal(deviceId || config.defaultDeviceId);
  res.json({ success: true, data: { activated: !!terminal, deviceId: deviceId || config.defaultDeviceId, terminalSn: terminal?.terminalSn || null } });
});

export default router;
