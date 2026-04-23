/**
 * 调试WAP2签名 - 检查中文编码和各种签名变体
 */
import crypto from 'crypto';
import axios from 'axios';

const API_BASE = 'https://vsi-api.shouqianba.com';
const TERMINAL_SN = '100111220054361143';
const TERMINAL_KEY = '6403fa70271edbbcbad339e7f8daa6cc';

// 测试1: 去掉中文subject
async function testSign(label, params) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  const signStr = pairs.join('&') + '&key=' + TERMINAL_KEY;
  const sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
  const body = { ...params, sign, sign_type: 'MD5' };
  
  console.log(`\n[${label}]`);
  console.log('签名串:', signStr);
  console.log('Sign:', sign);
  
  try {
    const r = await axios.post(API_BASE + '/v2/wap2', JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      timeout: 10000,
      validateStatus: () => true
    });
    console.log('响应:', JSON.stringify(r.data));
  } catch (e) {
    console.log('错误:', e.message);
  }
}

// 方案1：ASCII subject
await testSign('ASCII subject', {
  terminal_sn: TERMINAL_SN,
  client_sn: 'CLAWTEST' + Date.now(),
  total_amount: '1',
  subject: 'Claw membership test',
  return_url: 'https://claw-app-2026.pages.dev/membership',
  notify_url: 'https://claw-backend-2026.onrender.com/api/shouqianba/notify',
  sign_type: 'MD5'
});

await new Promise(r => setTimeout(r, 1000));

// 方案2：加上 app_id 参数（文档里说了app_id参与签名？）
await testSign('加app_id', {
  app_id: '2026041600011122',
  terminal_sn: TERMINAL_SN,
  client_sn: 'CLAWTEST' + Date.now(),
  total_amount: '1',
  subject: 'membership test',
  return_url: 'https://claw-app-2026.pages.dev/membership',
  notify_url: 'https://claw-backend-2026.onrender.com/api/shouqianba/notify',
  sign_type: 'MD5'
});
