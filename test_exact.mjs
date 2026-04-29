// 精确复制shouqianba.js的签名方式
import crypto from 'crypto';

const TS = '100111220054389553';
const TK = '5b5ecd12a79ba77589b834393f1d1778'; // 最新签到后的key

function generateSign(body, key) {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  const signStr = bodyStr + key;
  const sign = crypto.createHash('md5').update(signStr).digest('hex');
  return sign;
}

const body = {
  terminal_sn: TS,
  client_sn: 'exact-' + Date.now().toString().slice(-5),
  total_amount: '19900',
  subject: 'Claw会员',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return',
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

const bodyStr = JSON.stringify(body);
const sign = generateSign(bodyStr, TK);
console.log('body:', bodyStr);
console.log('sign:', sign);

import axios from 'axios';

async function run() {
  for (const ep of ['/v2/pay/wap', '/v2/pay']) {
    try {
      const resp = await axios.post('https://vsi-api.shouqianba.com' + ep, bodyStr, {
        headers: { 'Content-Type': 'application/json', 'Authorization': TS + ' ' + sign },
        timeout: 15000,
        validateStatus: () => true
      });
      console.log(`\n${ep}:`, JSON.stringify(resp.data).substring(0, 300));
    } catch(e) {
      console.log(`${ep}: ${e.message}`);
    }
  }
}

run();
