/**
 * 修复版激活脚本 - 正确读取 biz_response 嵌套层
 */
import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs';

const API_BASE = 'https://vsi-api.shouqianba.com';
const VENDOR_SN = '91803325';
const VENDOR_KEY = '677da351628d3fe7664321669c3439b2';
const APP_ID = '2026041600011122';
const NEW_CODE = '81119079';
const DEVICE_ID = 'claw-web-default';

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

async function main() {
  // Step 1: 激活
  console.log('=== Step 1: 激活终端（修复版）===');
  const activateBody = { app_id: APP_ID, code: NEW_CODE, device_id: DEVICE_ID };
  const activateBodyStr = JSON.stringify(activateBody);
  const activateSign = md5Sign(activateBodyStr, VENDOR_KEY);

  let terminalSn, terminalKey;
  try {
    const resp = await axios.post(API_BASE + '/terminal/activate', activateBodyStr, {
      headers: { 'Content-Type': 'application/json', 'Authorization': VENDOR_SN + ' ' + activateSign },
      timeout: 15000
    });
    console.log('激活响应:', JSON.stringify(resp.data, null, 2));

    if (resp.data.result_code !== '200') {
      console.log('❌ 激活失败:', resp.data.error_message);
      process.exit(1);
    }

    // ✅ 正确：从 biz_response 嵌套层读取
    const biz = resp.data.biz_response;
    terminalSn = biz.terminal_sn;
    terminalKey = biz.terminal_key;
    console.log('✅ 正确提取 - terminalSn:', terminalSn);
    console.log('✅ 正确提取 - terminalKey:', terminalKey);

    // 保存到本地
    const data = { [DEVICE_ID]: { terminalSn, terminalKey, merchantId: biz.merchant_sn, storeSn: biz.store_sn, deviceId: DEVICE_ID, updatedAt: Date.now() } };
    fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync('data/shouqianba-terminal.json', JSON.stringify(data, null, 2));
    console.log('✅ 已保存到 data/shouqianba-terminal.json');
  } catch (err) {
    console.log('❌ 激活失败:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 2: 签到验证 key 是否正确
  console.log('\n=== Step 2: 签到验证 key ===');
  const checkinBody = { terminal_sn: terminalSn, device_id: DEVICE_ID };
  const checkinBodyStr = JSON.stringify(checkinBody);
  const checkinSign = md5Sign(checkinBodyStr, terminalKey);

  try {
    const r = await axios.post(API_BASE + '/terminal/checkin', checkinBodyStr, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${terminalSn} ${checkinSign}`
      },
      timeout: 10000
    });
    console.log('签到响应:', JSON.stringify(r.data, null, 2));
    if (r.data.result_code === '200') {
      const newKey = r.data.biz_response?.terminal_key || r.data.terminal_key;
      console.log('✅ 签到成功！新 terminalKey:', newKey);
      // 更新文件
      const data = JSON.parse(fs.readFileSync('data/shouqianba-terminal.json', 'utf8'));
      data[DEVICE_ID].terminalKey = newKey;
      fs.writeFileSync('data/shouqianba-terminal.json', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ 签到失败:', r.data.error_message);
    }
  } catch (e) {
    console.log('❌ 签到请求失败:', e.response?.data || e.message);
  }

  // Step 3: 测试 WAP2 支付
  console.log('\n=== Step 3: 测试 WAP2 支付 ===');
  const params = {
    terminal_sn: terminalSn,
    client_sn: 'T' + Date.now(),
    total_amount: '1',
    subject: 'Claw会员充值',
    return_url: 'https://claw-app-2026.pages.dev/membership',
    notify_url: 'https://claw-backend-2026.onrender.com/api/shouqianba/notify',
    sign_type: 'MD5'
  };
  params.sign = wapSign(params, terminalKey);

  console.log('请求参数:', JSON.stringify(params, null, 2));
  const signDebug = (() => {
    const filtered = { ...params };
    delete filtered.sign;
    delete filtered.sign_type;
    const sortedKeys = Object.keys(filtered).sort();
    const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
    return pairs.join('&') + '&key=' + terminalKey;
  })();
  console.log('签名字符串:', signDebug);

  try {
    const r = await axios.post(API_BASE + '/v2/wap2', JSON.stringify(params), {
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': '123.123.123.123' },
      timeout: 10000
    });
    console.log('WAP2响应:', JSON.stringify(r.data, null, 2));
  } catch (e) {
    console.log('WAP2响应:', JSON.stringify(e.response?.data || e.message));
  }
}

main();
