// 用正确的方式调用 /upay/v2/wap2
// 关键：签名放请求体里，不用Authorization header！
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
const terminalKey = '355cc26a464fe47bc7ce300e381c923e';

const clientSn = 'upay-' + Date.now();

// 1. 构建参数（不带sign/sign_type）
const requestParams = {
  terminal_sn: terminalSn,
  client_sn: clientSn,
  total_amount: '100',  // 1元
  subject: '测试支付',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return?clientSn=' + clientSn,
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba'
};

// 2. WAP签名：参数排序 + &key= + MD5大写
const sortedKeys = Object.keys(requestParams).sort();
const pairs = sortedKeys.map(k => `${k}=${requestParams[k]}`);
const signStr = pairs.join('&') + '&key=' + terminalKey;
const sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();

// 3. 请求体包含签名
const body = {
  ...requestParams,
  sign: sign,
  sign_type: 'MD5'
};

console.log('Request body:', JSON.stringify(body));
console.log('Sign str:', signStr);
console.log('Sign:', sign);

try {
  const resp = await axios.post('https://vsi-api.shouqianba.com/upay/v2/wap2', JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json'
      // 没有 Authorization header！
    },
    timeout: 30000
  });
  console.log('\n✅ Status:', resp.status);
  console.log('Full response:', JSON.stringify(resp.data, null, 2));
} catch (err) {
  console.log('\n❌ Error:', err.message);
  if (err.response) {
    console.log('Status:', err.response.status);
    const data = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
    console.log('Data:', data);
  }
}
