// 用vendor级别签名 + urlencoded body
import crypto from 'crypto';
import axios from 'axios';

const TS = '100111220054389553';
const TK = '355cc26a464fe47bc7ce300e381c923e';
const VS = '91803325';
const VK = '677da351628d3fe7664321669c3439b2';
const cs = 'vl-' + Date.now().toString().slice(-6);

const body = {
  terminal_sn: TS,
  client_sn: cs,
  total_amount: '19900',
  subject: 'Claw会员',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return',
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

// 排序参数
const sorted = Object.keys(body).sort();
const rawPairs = sorted.map(k => k + '=' + body[k]);
const rawStr = rawPairs.join('&');

// 尝试vendor级别的签名
const vendorSign = crypto.createHash('md5').update(rawStr + '&key=' + VK).digest('hex').toUpperCase();
const terminalSign = crypto.createHash('md5').update(rawStr + '&key=' + TK).digest('hex').toUpperCase();

const encoded = sorted.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(body[k])).join('&');

const tests = [
  { desc: 'vendor sign + vendor auth', auth: VS, sign: vendorSign },
  { desc: 'vendor sign + terminal auth', auth: TS, sign: vendorSign },
  { desc: 'terminal sign + vendor auth', auth: VS, sign: terminalSign },
  { desc: 'terminal sign + terminal auth', auth: TS, sign: terminalSign },
];

async function run() {
  for (const t of tests) {
    try {
      const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', encoded, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': t.auth + ' ' + t.sign
        },
        timeout: 15000,
        validateStatus: () => true
      });
      const d = resp.data;
      if (d.result_code === '200' || d.error_code !== 'ILLEGAL_REQUEST') {
        console.log(`✅ ${t.desc}:`, JSON.stringify(d).substring(0, 300));
      } else {
        console.log(`🟡 ${t.desc}: ${d.error_code}`);
      }
    } catch(e) {
      console.log(`💥 ${t.desc}: ${e.message}`);
    }
  }
}

run();
