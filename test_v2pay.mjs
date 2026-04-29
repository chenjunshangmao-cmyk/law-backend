// 测试 /v2/pay/wap - 收钱吧WAP支付
import crypto from 'crypto';
import axios from 'axios';

const device = {
  terminalSn: '100111220054389553',
  terminalKey: '96bfaf401367d934cb10a1cbe9773647'
};

const clientSn = 'dtest-' + Date.now();

const requestBody = {
  terminal_sn: device.terminalSn,
  client_sn: clientSn,
  total_amount: 100,  // 1元
  subject: '测试',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return?clientSn=' + clientSn,
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

// 方法1：md5(body + terminalKey)
const bodyStr = JSON.stringify(requestBody);
const sign1 = crypto.createHash('md5').update(bodyStr + device.terminalKey).digest('hex').toUpperCase();

// 方法2：md5(body + terminalKey) 但是小写
const sign2 = crypto.createHash('md5').update(bodyStr + device.terminalKey).digest('hex').toLowerCase();

// 方法3：参数排序方式签名
const sortedKeys = Object.keys(requestBody).sort();
const paramStr = sortedKeys.map(k => `${k}=${requestBody[k]}`).join('&');
const sign3 = crypto.createHash('md5').update(paramStr + '&key=' + device.terminalKey).digest('hex').toUpperCase();

// 方法4：参数排序 + 不encode
const sign4 = crypto.createHash('md5').update(paramStr + '&key=' + device.terminalKey).digest('hex').toLowerCase();

console.log('Body:', bodyStr);
console.log('ParamStr:', paramStr);
console.log('');

const tests = [
  { name: 'md5(body+key) 大写', sign: sign1 },
  { name: 'md5(body+key) 小写', sign: sign2 },
  { name: '参数排序+&key= 大写', sign: sign3 },
  { name: '参数排序+&key= 小写', sign: sign4 },
];

async function run() {
  for (const t of tests) {
    try {
      const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', bodyStr, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': device.terminalSn + ' ' + t.sign
        },
        timeout: 15000
      });
      console.log(`✅ ${t.name}: sign=${t.sign.substring(0,16)}...`);
      console.log('  Response:', JSON.stringify(resp.data).substring(0, 300));
    } catch (err) {
      if (err.response) {
        const data = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
        console.log(`❌ ${t.name}: ${err.response.status} ${data.substring(0, 150)}`);
      } else {
        console.log(`❌ ${t.name}: ${err.message}`);
      }
    }
  }
}

run();
