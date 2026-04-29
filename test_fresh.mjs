// 签到后用新key测试
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
const terminalKey = '355cc26a464fe47bc7ce300e381c923e'; // 签到后的新key
const clientSn = 'fresh-' + Date.now();

const body = {
  terminal_sn: terminalSn,
  client_sn: clientSn,
  total_amount: 100,
  subject: '测试',
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

const bodyStr = JSON.stringify(body);

// 尝试所有可能的签名组合
const attempts = [
  // 1. md5(body+key) 大写
  { name: 'md5(body+key) UPPER', sign: crypto.createHash('md5').update(bodyStr + terminalKey).digest('hex').toUpperCase() },
  // 2. md5(body+key) 小写  
  { name: 'md5(body+key) LOWER', sign: crypto.createHash('md5').update(bodyStr + terminalKey).digest('hex') },
  // 3. 排序参数 + &key= 大写
  { 
    name: 'sorted+&key= UPPER',
    sign: (() => {
      const keys = Object.keys(body).sort();
      const str = keys.map(k => `${k}=${body[k]}`).join('&');
      return crypto.createHash('md5').update(str + '&key=' + terminalKey).digest('hex').toUpperCase();
    })()
  },
  // 4. 排序参数 + key= (无&) 大写
  {
    name: 'sorted+key= UPPER',
    sign: (() => {
      const keys = Object.keys(body).sort();
      const str = keys.map(k => `${k}=${body[k]}`).join('&');
      return crypto.createHash('md5').update(str + 'key=' + terminalKey).digest('hex').toUpperCase();
    })()
  },
  // 5. 排序参数(无encode) + &key= + 小写
  {
    name: 'sorted+&key= LOWER',
    sign: (() => {
      const keys = Object.keys(body).sort();
      const str = keys.map(k => `${k}=${body[k]}`).join('&');
      return crypto.createHash('md5').update(str + '&key=' + terminalKey).digest('hex').toLowerCase();
    })()
  },
  // 6. 不带operator
  { 
    name: 'no-op md5(body+key)',
    sign: (() => {
      const b2 = { terminal_sn: terminalSn, client_sn: clientSn, total_amount: 100, subject: '测试', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba' };
      return crypto.createHash('md5').update(JSON.stringify(b2) + terminalKey).digest('hex').toUpperCase();
    })()
  },
  // 7. 加description
  { 
    name: 'with body md5(body+key)',
    sign: (() => {
      const b3 = { terminal_sn: terminalSn, client_sn: clientSn, total_amount: 100, subject: '测试', body: '测试商品', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', operator: 'claw_admin' };
      return crypto.createHash('md5').update(JSON.stringify(b3) + terminalKey).digest('hex').toUpperCase();
    })()
  },
  // 8. total_amount作为字符串
  { 
    name: 'amount str md5(body+key)',
    sign: (() => {
      const b4 = { terminal_sn: terminalSn, client_sn: clientSn, total_amount: '100', subject: '测试', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', operator: 'claw_admin' };
      return crypto.createHash('md5').update(JSON.stringify(b4) + terminalKey).digest('hex').toUpperCase();
    })()
  },
];

async function run() {
  for (const a of attempts) {
    try {
      const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', bodyStr, {
        headers: { 'Content-Type': 'application/json', 'Authorization': terminalSn + ' ' + a.sign },
        timeout: 10000,
        validateStatus: () => true
      });
      const rc = resp.data.result_code;
      if (rc !== '400') {
        console.log(`✅ ${a.name}: rc=${rc}`, JSON.stringify(resp.data).substring(0, 300));
      } else {
        const msg = resp.data.error_code || '';
        if (!msg.includes('ILLEGAL_SIGN')) {
          console.log(`🟡 ${a.name}: rc=${rc} ${resp.data.error_message||''}`);
        }
      }
    } catch(e) {
      console.log(`💥 ${a.name}: ${e.message}`);
    }
  }
  console.log('Done - all ILLEGAL_SIGN results suppressed');
}

run();
