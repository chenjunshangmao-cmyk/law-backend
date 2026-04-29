// 独立测试 /upay/v2/wap2 - 用sign放body方式
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
// 签到后的key
const terminalKey = '355cc26a464fe47bc7ce300e381c923e';

const clientSn = 'standalone-' + Date.now();

const requestParams = {
  terminal_sn: terminalSn,
  client_sn: clientSn,
  total_amount: '19900',
  subject: 'Claw会员-基础版',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return?clientSn=' + clientSn,
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba'
};

// WAP签名：排序 + &key= + MD5大写
const sortedKeys = Object.keys(requestParams).sort();
const pairs = sortedKeys.map(k => k + '=' + requestParams[k]);
const signStr = pairs.join('&') + '&key=' + terminalKey;
const sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();

const body = { ...requestParams, sign, sign_type: 'MD5' };

console.log('Sign str:', signStr);
console.log('Sign:', sign);
console.log('Body:', JSON.stringify(body));

// 用正确的Content-Type
async function test() {
  try {
    const resp = await axios.post('https://vsi-api.shouqianba.com/upay/v2/wap2', JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
      validateStatus: () => true
    });
    console.log('\nStatus:', resp.status);
    console.log('Response:', JSON.stringify(resp.data, null, 2));
  } catch(err) {
    console.log('Error:', err.message);
    if (err.response) {
      console.log('Resp status:', err.response.status);
      console.log('Resp data:', typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data));
    }
  }
}

test();
