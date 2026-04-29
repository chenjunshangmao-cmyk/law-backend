// ILLEGAL_REQUEST - 金额单位问题
// total_amount 可能要求是元（带小数点）
import crypto from 'crypto';
import axios from 'axios';

const TS = '100111220054389553';
const TK = '355cc26a464fe47bc7ce300e381c923e';

const bcs = 'amt-' + Date.now().toString().slice(-6);

// 尝试不同的金额格式
const tests = [
  { desc: '分 19900', total: '19900' },
  { desc: '元 199', total: '199' },
  { desc: '元 199.00', total: '199.00' },
  { desc: '元 1', total: '1' },
  { desc: '分 100', total: '100' },
  { desc: '元 0.01', total: '0.01' },
];

async function run() {
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    const cs = bcs + i;
    const b = {
      terminal_sn: TS,
      client_sn: cs,
      total_amount: t.total,
      subject: 'Claw会员',
      return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return',
      notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
      operator: 'claw_admin'
    };
    
    const sorted = Object.keys(b).sort();
    const raw = sorted.map(k => k + '=' + b[k]).join('&');
    const sign = crypto.createHash('md5').update(raw + '&key=' + TK).digest('hex').toUpperCase();
    
    const encoded = sorted.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(b[k])).join('&');
    
    try {
      const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', encoded, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': TS + ' ' + sign },
        timeout: 15000,
        validateStatus: () => true
      });
      const d = resp.data;
      if (d.result_code === '200' || d.error_code !== 'ILLEGAL_REQUEST') {
        console.log(`${t.desc}: rc=${d.result_code}`, JSON.stringify(d).substring(0, 300));
      } else {
        console.log(`${t.desc}: ILLEGAL_REQUEST`);
      }
    } catch(e) {
      console.log(`${t.desc}: ${e.message}`);
    }
  }
}

run();
