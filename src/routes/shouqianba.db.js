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
    console.log('[收钱吧] 正在激活终端...');
    const body = {
      app_id: config.appId,
      code: config.testCode,
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
    const terminal = {
      terminalSn: result.terminal_sn,
      terminalKey: result.terminal_key,
      merchantId: result.merchant_id,
      storeSn: result.store_sn,
      deviceId
    };
    saveTerminal(deviceId, terminal);
    console.log('[收钱吧] 终端激活成功:', result.terminal_sn);
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
    const updated = { ...terminal, terminalSn: result.terminal_sn, terminalKey: result.terminal_key };
    saveTerminal(deviceId, updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 创建支付订单
router.post('/create-order', async (req, res) => {
  try {
    const { deviceId = config.defaultDeviceId, clientSn, totalAmount, subject } = req.body;
    if (!clientSn || !totalAmount || !subject) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }
    const terminal = getTerminal(deviceId);
    if (!terminal) return res.status(400).json({ success: false, error: '终端未激活，请先调用 /activate' });
    const baseUrl = process.env.RENDER_EXTERNAL_URL || (req.protocol + '://' + req.get('host'));
    const requestParams = {
      terminal_sn: terminal.terminalSn,
      client_sn: clientSn,
      total_amount: String(Math.round(Number(totalAmount) * 100)),
      subject,
      return_url: baseUrl + '/membership',
      notify_url: baseUrl + '/api/shouqianba/notify'
    };
    const sign = wapSign(requestParams, terminal.terminalKey);
    const body = { ...requestParams, sign, sign_type: 'MD5' };
    const { default: axios } = await import('axios');
    const resp = await axios.post(config.apiBase + '/upay/v2/wap2', JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' }
    });
    const result = resp.data;
    if (result.result_code !== '200') {
      return res.status(400).json({ success: false, error: result.error_message || '创建支付订单失败' });
    }
    res.json({ success: true, data: { sn: result.sn, clientSn: result.client_sn, payUrl: result.pay_url, totalAmount: result.total_amount } });
  } catch (err) {
    console.error('创建支付订单失败:', err.response && err.response.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 查询订单
router.get('/query', async (req, res) => {
  try {
    const { sn, deviceId = config.defaultDeviceId } = req.query;
    if (!sn) return res.status(400).json({ success: false, error: '缺少 sn' });
    const terminal = getTerminal(deviceId);
    if (!terminal) return res.status(400).json({ success: false, error: '终端未激活' });
    const body = { terminal_sn: terminal.terminalSn, sn };
    const result = await sqbRequest('/query', body, terminal.terminalSn, terminal.terminalKey);
    res.json({ success: true, data: { sn: result.sn, clientSn: result.client_sn, orderStatus: result.order_status, status: result.status, paywayName: result.payway_name, totalAmount: result.total_amount, netAmount: result.net_amount, tradeNo: result.trade_no } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 退款
router.post('/refund', async (req, res) => {
  try {
    const { sn, refundAmount, deviceId = config.defaultDeviceId } = req.body;
    if (!sn || !refundAmount) return res.status(400).json({ success: false, error: '缺少参数' });
    const terminal = getTerminal(deviceId);
    if (!terminal) return res.status(400).json({ success: false, error: '终端未激活' });
    const body = { terminal_sn: terminal.terminalSn, sn, refund_amount: String(Math.round(Number(refundAmount) * 100)) };
    const result = await sqbRequest('/refund', body, terminal.terminalSn, terminal.terminalKey);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 回调通知
router.post('/notify', async (req, res) => {
  try {
    const bodyStr = JSON.stringify(req.body);
    const sign = req.headers['authorization'];
    const isValid = await verifyRsaSign(bodyStr, sign);
    if (!isValid) {
      console.error('收钱吧回调验签失败');
      return res.status(403).send('fail');
    }
    const data = req.body;
    console.log('收钱吧回调:', data);
    if (data.order_status === 'PAID') {
      console.log('订单 ' + data.client_sn + ' 支付成功，金额:' + (data.total_amount / 100) + '元');
    }
    res.send('success');
  } catch (err) {
    console.error('回调处理失败:', err.message);
    res.status(500).send('fail');
  }
});

// 状态查询
router.get('/status', (req, res) => {
  const { deviceId = 'claw-web-default' } = req.query;
  const terminal = getTerminal(deviceId);
  res.json({ success: true, data: { activated: !!terminal, deviceId, terminalSn: terminal?.terminalSn || null } });
});

export default router;
