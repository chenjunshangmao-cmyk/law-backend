// 新签到后的key再试
import crypto from 'crypto';
import axios from 'axios';

const TS = '100111220054389553';
const TK = '5b5ecd12a79ba77589b834393f1d1778';
const cs = 'final2-' + Date.now().toString().slice(-6);

// form-urlencoded 方式（之前签名能过）
const body = {
  terminal_sn: TS,
  client_sn: cs,
  total_amount: '19900',
  subject: 'Claw会员',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return',
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

const sorted = Object.keys(body).sort();
const raw = sorted.map(k => k + '=' + body[k]).join('&');
const sign = crypto.createHash('md5').update(raw + '&key=' + TK).digest('hex').toUpperCase();
const encoded = sorted.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(body[k])).join('&');

console.log('New key:', TK);
console.log('Body:', encoded.substring(0, 200));
console.log('Sign:', sign);

async function run() {
  // /v2/pay/wap
  for (const ep of ['/v2/pay/wap', '/v2/pay/precreate', '/v2/pay/qr']) {
    try {
      const resp = await axios.post('https://vsi-api.shouqianba.com' + ep, encoded, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': TS + ' ' + sign },
        timeout: 15000,
        validateStatus: () => true
      });
      const d = resp.data;
      if (d.result_code === '200') {
        console.log(`✅ ${ep}:`, JSON.stringify(d).substring(0, 400));
      } else {
        console.log(`${ep}: ${d.error_code} ${(d.error_message||'').substring(0,40)}`);
      }
    } catch(e) {
      console.log(`${ep}: ${e.message}`);
    }
  }
}

run();
