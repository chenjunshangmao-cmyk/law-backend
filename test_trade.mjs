// 看看收钱吧 v2/pay/wap 能不能响
// 同时测试v2/pay/precreate
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
const terminalKey = '96bfaf401367d934cb10a1cbe9773647';
const clientSn = 'addr-' + Date.now();

const endpoints = [
  '/v2/pay/wap',
  '/v2/pay/precreate',
  '/v1/trade/precreate',
  '/pay/precreate',
  '/trade/precreate'
];

async function test(endpoint) {
  const body = {
    terminal_sn: terminalSn,
    client_sn: clientSn,
    total_amount: 100,
    subject: '测试',
    notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
    operator: 'claw_admin'
  };

  const bodyStr = JSON.stringify(body);
  const sign = crypto.createHash('md5').update(bodyStr + terminalKey).digest('hex').toUpperCase();

  try {
    const resp = await axios.post('https://vsi-api.shouqianba.com' + endpoint, bodyStr, {
      headers: { 'Content-Type': 'application/json', 'Authorization': terminalSn + ' ' + sign },
      timeout: 10000,
      validateStatus: () => true
    });
    console.log(`${endpoint}: ${resp.status} ${JSON.stringify(resp.data).substring(0,200)}`);
  } catch(e) {
    console.log(`${endpoint}: error ${e.message}`);
  }
}

for (const ep of endpoints) {
  await test(ep);
}
