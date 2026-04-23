/**
 * 用新激活码 81119079 激活终端，并探测 WAP2 正确路径
 */
import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs';

const API_BASE = 'https://vsi-api.shouqianba.com';
const VENDOR_SN = '91803325';
const VENDOR_KEY = '677da351628d3fe7664321669c3439b2';
const APP_ID = '2026041600011122';
const NEW_CODE = '81119079';  // 新激活码
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

// Step 1: 激活终端
console.log('=== Step 1: 激活终端（新激活码 81119079）===');
const activateBody = { app_id: APP_ID, code: NEW_CODE, device_id: DEVICE_ID };
const activateBodyStr = JSON.stringify(activateBody);
const activateSign = md5Sign(activateBodyStr, VENDOR_KEY);

let terminal = null;
try {
  const resp = await axios.post(API_BASE + '/terminal/activate', activateBodyStr, {
    headers: { 'Content-Type': 'application/json', 'Authorization': VENDOR_SN + ' ' + activateSign },
    timeout: 15000
  });
  console.log('激活响应:', JSON.stringify(resp.data, null, 2));
  if (resp.data.result_code === '200') {
    terminal = {
      terminalSn: resp.data.terminal_sn,
      terminalKey: resp.data.terminal_key,
      merchantId: resp.data.merchant_id,
      storeSn: resp.data.store_sn,
      deviceId: DEVICE_ID
    };
    console.log('✅ 激活成功！终端SN:', terminal.terminalSn);
    // 保存到本地文件
    const data = { [DEVICE_ID]: { ...terminal, updatedAt: Date.now() } };
    fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync('data/shouqianba-terminal.json', JSON.stringify(data, null, 2));
    console.log('✅ 已保存到 data/shouqianba-terminal.json');
  } else {
    console.log('❌ 激活失败:', resp.data.error_message);
    process.exit(1);
  }
} catch (err) {
  console.log('❌ 激活请求失败:', err.response?.data || err.message);
  process.exit(1);
}

// Step 2: 探测 WAP2 正确路径
console.log('\n=== Step 2: 探测 WAP2 正确接口路径 ===');
const testPaths = [
  '/upay/wap2',
  '/upay/v2/wap2', 
  '/wap2',
  '/v2/wap2',
  '/upay/v3/wap2',
  '/api/wap2',
  '/pay/wap2'
];

for (const p of testPaths) {
  const params = {
    terminal_sn: terminal.terminalSn,
    client_sn: 'TEST' + Date.now(),
    total_amount: '1',
    subject: '测试',
    return_url: 'https://claw-app-2026.pages.dev/membership',
    notify_url: 'https://claw-backend-2026.onrender.com/api/shouqianba/notify',
    sign_type: 'MD5'
  };
  params.sign = wapSign(params, terminal.terminalKey);
  
  try {
    const r = await axios.post(API_BASE + p, JSON.stringify(params), {
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000,
      validateStatus: () => true  // 不抛404
    });
    if (r.status === 404) {
      console.log(`路径 ${p}: ❌ 404`);
    } else {
      console.log(`路径 ${p}: ✅ HTTP ${r.status}`);
      console.log('  响应:', JSON.stringify(r.data));
    }
  } catch (err) {
    console.log(`路径 ${p}: ❌ 网络错误 ${err.message}`);
  }
  await new Promise(r => setTimeout(r, 500));
}
