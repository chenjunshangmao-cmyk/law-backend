/**
 * 精确对比测试：wapSign 各种变体
 * 目标：找出 ILLEGAL_SIGN 的真正原因
 */
import crypto from 'crypto';
import axios from 'axios';
import fs from 'fs';

// 真实激活的终端数据
const terminalSn = '100111220054361143';
const terminalKey = 'a0c6c3d9e2b7f8a4e1d3c5b7f9a2e4d6';
const subject = 'Claw会员充值';
const clientSn = 'T' + Date.now();
const totalAmount = '1'; // 1分钱
const returnUrl = 'https://claw-app-2026.pages.dev/membership';
const notifyUrl = 'https://claw-backend-2026.onrender.com/api/shouqianba/notify';

const baseParams = {
  terminal_sn: terminalSn,
  client_sn: clientSn,
  total_amount: totalAmount,
  subject: subject,
  return_url: returnUrl,
  notify_url: notifyUrl
};

// ====== 变体1：标准 wapSign ======
function wapSign1(params, key) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  let signStr = pairs.join('&') + `&key=${key}`;
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

// ====== 变体2：无 &key= 前缀 ======
function wapSign2(params, key) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  let signStr = pairs.join('&') + key; // 直接拼接key，无&key=
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

// ====== 变体3：无 & 前缀，但有 key= ======
function wapSign3(params, key) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  let signStr = pairs.join('&') + '&key=' + key; // 标准
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

// ====== 变体4：带空格的 key ======
function wapSign4(params, key) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  let signStr = pairs.join('&') + ' key=' + key; // 空格在key前
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

// ====== 变体5：key放最前面 ======
function wapSign5(params, key) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  let signStr = 'key=' + key + '&' + pairs.join('&');
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

// ====== 变体6：直接MD5(body + key)，无排序 ======
function md5Sign(params, key) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const bodyStr = JSON.stringify(filtered);
  return crypto.createHash('md5').update(bodyStr + key).digest('hex').toUpperCase();
}

// ====== 变体7：wapSign + HEX大写 vs 小写 ======
function wapSign7(params, key) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  let signStr = pairs.join('&') + `&key=${key}`;
  return crypto.createHash('md5').update(signStr).digest('hex'); // 小写
}

// 打印当前参数和所有变体签名
console.log('=== 参数 ===');
const sortedKeys = Object.keys(baseParams).sort();
for (const k of sortedKeys) {
  console.log(`  ${k} = ${baseParams[k]}`);
}
console.log('');
console.log('变体1 (标准wapSign &key=):', wapSign1(baseParams, terminalKey));
console.log('变体2 (直接拼接key无&):', wapSign2(baseParams, terminalKey));
console.log('变体3 (标准):', wapSign3(baseParams, terminalKey));
console.log('变体4 (空格key=):', wapSign4(baseParams, terminalKey));
console.log('变体5 (key放前面):', wapSign5(baseParams, terminalKey));
console.log('变体6 (MD5 body+key):', md5Sign(baseParams, terminalKey));
console.log('变体7 (HEX小写):', wapSign7(baseParams, terminalKey));

// 逐个测试
const variants = [
  { name: '变体3-标准wapSign', fn: wapSign3 },
];

async function testVariant(name, signFn) {
  const sign = signFn(baseParams, terminalKey);
  const body = {
    ...baseParams,
    sign: sign,
    sign_type: 'MD5'
  };
  console.log(`\n>>> 测试 ${name}:`);
  console.log('签名:', sign);

  // 打印签名字符串（不含key）
  const filtered = { ...baseParams };
  const sorted = Object.keys(filtered).sort();
  const pairs = sorted.map(k => `${k}=${filtered[k]}`);
  console.log('签名字符串: ' + pairs.join('&') + '&key=' + terminalKey);

  try {
    const resp = await axios.post(
      'https://vsi-api.shouqianba.com/v2/wap2',
      JSON.stringify(body),
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    console.log('响应:', JSON.stringify(resp.data));
  } catch (e) {
    if (e.response) {
      console.log('HTTP:', e.response.status, JSON.stringify(e.response.data));
    } else {
      console.log('错误:', e.message);
    }
  }
}

console.log('\n=== 开始测试 ===');
testVariant('变体3-标准wapSign', wapSign3);
