/**
 * WAP2 签名终极调试
 * 测试点：
 * 1. sign_type 是否参与签名（排除 vs 不排除）
 * 2. sign 本身是否参与签名（排除 vs 不排除）
 * 3. 是否需要 X-Forwarded-For 头
 * 4. 尝试签到后用新 key
 */
import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs';

// 真实终端数据
const terminalSn = '100111220054361143';
const terminalKey = 'a0c6c3d9e2b7f8a4e1d3c5b7f9a2e4d6';
const subject = 'Claw会员充值';
const clientSn = 'T' + Date.now();
const totalAmount = '1';
const returnUrl = 'https://claw-app-2026.pages.dev/membership';
const notifyUrl = 'https://claw-backend-2026.onrender.com/api/shouqianba/notify';
const clientIp = '123.123.123.123'; // 模拟公网IP

// 基础参数
const baseParams = {
  terminal_sn: terminalSn,
  client_sn: clientSn,
  total_amount: totalAmount,
  subject: subject,
  return_url: returnUrl,
  notify_url: notifyUrl
};

// 生成签名（变体：是否剔除sign_type）
function makeSign(params, key, excludeSignType) {
  // 深拷贝
  const p = {};
  for (const k of Object.keys(params)) p[k] = params[k];

  // 剔除
  delete p.sign;
  if (excludeSignType) delete p.sign_type;

  // 排序
  const sortedKeys = Object.keys(p).sort();
  const pairs = sortedKeys.map(k => `${k}=${p[k]}`);
  const signStr = pairs.join('&') + '&key=' + key;
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

async function test(desc, params, key, excludeSignType, useXFF) {
  const sign = makeSign(params, key, excludeSignType);
  const body = { ...params, sign };

  console.log(`\n>>> ${desc}`);
  console.log('  签名:', sign);

  const headers = { 'Content-Type': 'application/json' };
  if (useXFF) headers['X-Forwarded-For'] = clientIp;

  try {
    const resp = await axios.post(
      'https://vsi-api.shouqianba.com/v2/wap2',
      JSON.stringify(body),
      { headers, timeout: 10000 }
    );
    console.log('  结果:', JSON.stringify(resp.data));
  } catch (e) {
    if (e.response) {
      console.log('  HTTP:', e.response.status, JSON.stringify(e.response.data));
    } else {
      console.log('  错误:', e.message);
    }
  }
}

async function checkin() {
  // 签到获取新 key
  const body = { terminal_sn: terminalSn, device_id: 'claw-web-test' };
  const signStr = JSON.stringify(body) + terminalKey;
  const sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();

  console.log('\n=== 签到 ===');
  try {
    const resp = await axios.post(
      'https://vsi-api.shouqianba.com/terminal/checkin',
      JSON.stringify(body),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${terminalSn} ${sign}`
        },
        timeout: 10000
      }
    );
    console.log('签到结果:', JSON.stringify(resp.data));
    if (resp.data.result_code === '200') {
      const newKey = resp.data.biz_response?.terminal_key || resp.data.terminal_key;
      console.log('新key:', newKey);
      return newKey;
    }
  } catch (e) {
    console.log('签到错误:', e.response?.data || e.message);
  }
  return null;
}

async function main() {
  // 1. 先签到刷新 key
  const newKey = await checkin();
  const activeKey = newKey || terminalKey;

  console.log('\n使用key:', activeKey);
  console.log('\n=== 基础参数 ===');
  for (const k of Object.keys(baseParams).sort()) {
    console.log(`  ${k}=${baseParams[k]}`);
  }

  // 2. 测试各种变体
  await test('标准wapSign (剔除sign+sign_type)', baseParams, activeKey, true, false);
  await test('包含sign_type在签名中 (剔除sign,保留sign_type)', baseParams, activeKey, false, false);
  await test('标准 + X-Forwarded-For头', baseParams, activeKey, true, true);
}

main();
