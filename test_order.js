// 测试收钱吧API创建订单
const crypto = require('crypto');
const axios = require('axios');

const config = {
  apiBase: 'https://vsi-api.shouqianba.com',
  storeDevices: {
    'claw-web-new3': {
      terminalSn: '100111220054389553',
      terminalKey: '96bfaf401367d934cb10a1cbe9773647'
    }
  }
};

const device = config.storeDevices['claw-web-new3'];
const clientSn = 'dtest-' + Date.now();
const totalAmount = 199 * 100; // 199元 → 分

const requestBody = {
  terminal_sn: device.terminalSn,
  client_sn: clientSn,
  total_amount: totalAmount,
  subject: 'Claw会员测试',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return?clientSn=' + clientSn,
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

const bodyStr = JSON.stringify(requestBody);
const sign = crypto.createHash('md5').update(bodyStr + device.terminalKey).digest('hex').toUpperCase();

console.log('=== Request ===');
console.log('URL:', config.apiBase + '/upay/v2/wap2');
console.log('Body:', bodyStr);
console.log('Auth:', device.terminalSn + ' ' + sign);

axios.post(config.apiBase + '/upay/v2/wap2', bodyStr, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': device.terminalSn + ' ' + sign
  },
  timeout: 30000
}).then(resp => {
  console.log('\n=== Response ===');
  console.log('Status:', resp.status);
  console.log('Data:', JSON.stringify(resp.data, null, 2));
}).catch(err => {
  console.log('\n=== Error ===');
  if (err.response) {
    console.log('Status:', err.response.status);
    console.log('Headers:', JSON.stringify(err.response.headers));
    console.log('Data:', err.response.data);
  } else {
    console.log('Message:', err.message);
    console.log('Code:', err.code);
  }
});
