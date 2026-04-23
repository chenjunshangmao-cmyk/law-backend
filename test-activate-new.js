/**
 * 新设备ID + 新激活码 重新激活
 */
import crypto from 'crypto';
import https from 'https';
import fs from 'fs';

const API_BASE = 'https://vsi-api.shouqianba.com';
const VENDOR_SN = '91803325';
const VENDOR_KEY = '677da351628d3fe7664321669c3439b2';
const APP_ID = '2026041600011122';
const NEW_CODE = '81119079';
const DEVICE_ID = 'claw-web-new1';  // 换新的设备ID，绕过 EJ13

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

function httpPost(path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const options = {
      hostname: 'vsi-api.shouqianba.com',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        ...extraHeaders
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log('=== 激活新设备 ===');

  const activateBody = { app_id: APP_ID, code: NEW_CODE, device_id: DEVICE_ID };
  const activateBodyStr = JSON.stringify(activateBody);
  const activateSign = md5Sign(activateBodyStr, VENDOR_KEY);

  const resp = await httpPost('/terminal/activate', activateBodyStr, {
    'Authorization': VENDOR_SN + ' ' + activateSign
  });
  console.log('激活响应:', JSON.stringify(resp, null, 2));

  if (resp.result_code !== '200') {
    console.log('❌ 激活失败!');
    return;
  }

  // ✅ 正确读取 biz_response
  const biz = resp.biz_response;
  const terminalSn = biz.terminal_sn;
  const terminalKey = biz.terminal_key;
  console.log('\n✅ NEW terminalSn:', terminalSn);
  console.log('✅ NEW terminalKey:', terminalKey);

  // 保存
  const saveData = {
    [DEVICE_ID]: {
      terminalSn, terminalKey,
      merchantId: biz.merchant_sn,
      storeSn: biz.store_sn,
      deviceId: DEVICE_ID,
      updatedAt: Date.now()
    }
  };
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/shouqianba-terminal.json', JSON.stringify(saveData, null, 2));

  // 签到
  console.log('\n=== 签到验证 ===');
  const checkinBody = { terminal_sn: terminalSn, device_id: DEVICE_ID };
  const checkinBodyStr = JSON.stringify(checkinBody);
  const checkinSign = md5Sign(checkinBodyStr, terminalKey);
  const checkinResp = await httpPost('/terminal/checkin', checkinBodyStr, {
    'Authorization': `${terminalSn} ${checkinSign}`
  });
  console.log('签到响应:', JSON.stringify(checkinResp, null, 2));

  if (checkinResp.result_code === '200') {
    const newKey = checkinResp.biz_response?.terminal_key || checkinResp.terminal_key;
    console.log('✅ 签到成功! 新 key:', newKey);
    saveData[DEVICE_ID].terminalKey = newKey;
    fs.writeFileSync('data/shouqianba-terminal.json', JSON.stringify(saveData, null, 2));
  } else {
    console.log('签到失败(可能是旧key无checkin权限，忽略)');
  }

  // WAP2 测试
  console.log('\n=== WAP2 支付测试 ===');
  const wap2Params = {
    terminal_sn: terminalSn,
    client_sn: 'T' + Date.now(),
    total_amount: '1',
    subject: 'Claw会员充值',
    return_url: 'https://claw-app-2026.pages.dev/membership',
    notify_url: 'https://claw-backend-2026.onrender.com/api/shouqianba/notify',
    sign_type: 'MD5'
  };
  wap2Params.sign = wapSign(wap2Params, terminalKey);
  console.log('请求:', JSON.stringify(wap2Params));
  const wap2Resp = await httpPost('/v2/wap2', wap2Params, {
    'X-Forwarded-For': '123.123.123.123'
  });
  console.log('WAP2响应:', JSON.stringify(wap2Resp, null, 2));
}

main().catch(e => console.error('Error:', e.message));
