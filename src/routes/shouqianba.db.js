/**
 * 收钱吧支付路由
 * 完整流程：激活 → 签到 → 创建支付 → 查询 → 回调处理
 */

import express from 'express';
import crypto from 'crypto';
import config from '../config/shouqianba.js';

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

const SQB_PUBLIC_KEY = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5+MNqcjgw4bsSWhJfw2M\n+gQB7P+pEiYOfvRmA6kt7Wisp0J3JbOtsLXGnErn5ZY2D8KkSAHtMYbeddphFZQJ\nzUbiaDi75GUAG9XS3MfoKAhvNkK15VcCd8hFgNYCZdwEjZrvx6Zu1B7c29S64LQP\nHceS0nyXF8DwMIVRcIWKy02cexgX0UmUPE0A2sJFoV19ogAHaBIhx5FkTy+eeBJE\nbU03Do97q5G9IN1O3TssvbYBAzugz+yUPww2LadaKexhJGg+5+ufoDd0+V3oFL0/\nebkJvD0uiBzdE3/ci/tANpInHAUDIHoWZCKxhn60f3/3KiR8xuj2vASgEqphxT5O\nfwIDAQAB\n-----END PUBLIC KEY-----';

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

const terminalCache = {};

function getTerminal(deviceId) {
  return terminalCache[deviceId] || null;
}

function saveTerminal(deviceId, data) {
  terminalCache[deviceId] = { ...data, updatedAt: Date.now() };
}

router.post('/activate', async (req, res) => {
  try {
    const { deviceId = 'claw-web-default' } = req.body;
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
      return res.status(400).json({ success: false, error: result.error_message || '激活失败' });
    }
    const terminal = {
      terminalSn: result.terminal_sn,
      terminalKey: result.terminal_key,
      merchantId: result.merchant_id,
      storeSn: result.store_sn,
      deviceId
    };
    saveTerminal(deviceId, terminal);
    res.json({ success: true, data: terminal });
  } catch (err) {
    console.error('激活失败:', err.response && err.response.data || err.message);
    res.status(500).json({ success: false, error: err.response && err.response.data && err.response.data.error_message || err.message });
  }
});

router.post('/checkin', async (req, res) => {
  try {
    const { deviceId = 'claw-web-default' } = req.body;
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

router.post('/create-order', async (req, res) => {
  try {
    const { deviceId = 'claw-web-default', clientSn, totalAmount, subject } = req.body;
    if (!clientSn || !totalAmount || !subject) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }
    const terminal = getTerminal(deviceId);
    if (!terminal) return res.status(400).json({ success: false, error: '终端未激活' });
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

router.get('/query', async (req, res) => {
  try {
    const { sn, deviceId = 'claw-web-default' } = req.query;
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

router.post('/refund', async (req, res) => {
  try {
    const { sn, refundAmount, deviceId = 'claw-web-default' } = req.body;
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

router.get('/status', (req, res) => {
  const { deviceId = 'claw-web-default' } = req.query;
  const terminal = getTerminal(deviceId);
  res.json({ success: true, data: { activated: !!terminal, deviceId } });
});

export default router;
