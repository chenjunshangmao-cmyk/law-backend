// 测试收钱吧 precreate API
import crypto from 'crypto';
import axios from 'axios';

const config = {
  apiBase: 'https://vsi-api.shouqianba.com',
  terminalSn: '100111220054389553',
  terminalKey: '96bfaf401367d934cb10a1cbe9773647'
};

const clientSn = 'pre-' + Date.now();

const requestBody = {
  terminal_sn: config.terminalSn,
  client_sn: clientSn,
  total_amount: 100,  // 1元(分)
  subject: '测试商品',
  body: '测试商品描述',
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

const bodyStr = JSON.stringify(requestBody);

// 收钱吧API签名：md5(body + key)
const sign = crypto.createHash('md5').update(bodyStr + config.terminalKey).digest('hex').toUpperCase();

console.log('=== Request ===');
console.log('URL:', config.apiBase + '/precreate');
console.log('Body:', bodyStr);
console.log('Auth:', config.terminalSn + ' ' + sign);

try {
  const resp = await axios.post(config.apiBase + '/precreate', bodyStr, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': config.terminalSn + ' ' + sign
    },
    timeout: 30000
  });
  console.log('\n=== Response ===');
  console.log('Status:', resp.status);
  console.log('Full:', JSON.stringify(resp.data, null, 2));
} catch (err) {
  console.log('\n=== Error ===');
  if (err.response) {
    console.log('Status:', err.response.status);
    const data = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
    console.log('Data:', data);
    console.log('Headers:', JSON.stringify(err.response.headers));
  } else {
    console.log('Message:', err.message);
    console.log('Code:', err.code);
  }
}
