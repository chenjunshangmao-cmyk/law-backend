/**
 * 完整支付流程测试：用真实terminal_key + 正确路径 /v2/wap2
 */
import crypto from 'crypto';
import axios from 'axios';

const API_BASE = 'https://vsi-api.shouqianba.com';
const TERMINAL_SN = '100111220054361143';
const TERMINAL_KEY = '6403fa70271edbbcbad339e7f8daa6cc';

function wapSign(params, key) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  const signStr = pairs.join('&') + '&key=' + key;
  console.log('[签名串]', signStr);
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

console.log('=== 测试 /v2/wap2 创建支付订单 ===');
const params = {
  terminal_sn: TERMINAL_SN,
  client_sn: 'CLAWTEST' + Date.now(),
  total_amount: '1',   // 1分钱
  subject: 'Claw会员-测试',
  return_url: 'https://claw-app-2026.pages.dev/membership',
  notify_url: 'https://claw-backend-2026.onrender.com/api/shouqianba/notify',
  sign_type: 'MD5'
};
params.sign = wapSign(params, TERMINAL_KEY);

console.log('\n请求参数:', JSON.stringify(params, null, 2));

try {
  const resp = await axios.post(API_BASE + '/v2/wap2', JSON.stringify(params), {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
    validateStatus: () => true
  });
  console.log('\nHTTP状态:', resp.status);
  console.log('响应:', JSON.stringify(resp.data, null, 2));
  
  if (resp.data.result_code === '200' || resp.data.biz_response?.result_code === '200') {
    const biz = resp.data.biz_response || resp.data;
    console.log('\n🎉 成功！支付URL:', biz.pay_url);
  }
} catch (err) {
  console.log('❌ 请求失败:', err.message);
}
