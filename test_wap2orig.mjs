// 原始的 /wap2 端点 - 和terminal/activate一样的签名方式
import crypto from 'crypto';
import axios from 'axios';

const TS = '100111220054389553';
const TK = '355cc26a464fe47bc7ce300e381c923e';
const cs = 'wap2orig-' + Date.now();

// 跟terminal/activate一样的签名：md5(JSON.stringify(body) + key) 小写
const body = {
  terminal_sn: TS,
  client_sn: cs,
  total_amount: '19900',
  subject: 'Claw会员',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return',
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba'
};

const bodyStr = JSON.stringify(body);

// 跟 generateSign 完全一致：小写
const sign = crypto.createHash('md5').update(bodyStr + TK).digest('hex');

console.log('Body:', bodyStr);
console.log('Sign (lowercase):', sign);
console.log('Sign (uppercase):', sign.toUpperCase());

async function test() {
  // 小写签名
  try {
    const resp = await axios.post('https://vsi-api.shouqianba.com/wap2', bodyStr, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': TS + ' ' + sign  // 小写
      },
      timeout: 15000,
      validateStatus: () => true
    });
    console.log('\n/wap2 lowercase auth:', resp.status, JSON.stringify(resp.data).substring(0, 200));
    // 检查结果
    if (resp.data.biz_response?.pay_url || resp.data.pay_url) {
      console.log('🎉 HAS PAY_URL!');
      console.log('Full:', JSON.stringify(resp.data, null, 2));
      process.exit(0);
    }
  } catch(e) {
    console.log('/wap2 lowercase auth error:', e.message);
  }
  
  // 大写签名
  try {
    const resp = await axios.post('https://vsi-api.shouqianba.com/wap2', bodyStr, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': TS + ' ' + sign.toUpperCase()  // 大写
      },
      timeout: 15000,
      validateStatus: () => true
    });
    console.log('/wap2 uppercase auth:', resp.status, JSON.stringify(resp.data).substring(0, 200));
    if (resp.data.biz_response?.pay_url || resp.data.pay_url) {
      console.log('🎉 HAS PAY_URL!');
      console.log('Full:', JSON.stringify(resp.data, null, 2));
      process.exit(0);
    }
  } catch(e) {
    console.log('/wap2 uppercase auth error:', e.message);
  }
  
  // 也试试带operator的
  const body2 = { ...body, operator: 'claw_admin' };
  const bodyStr2 = JSON.stringify(body2);
  const sign2 = crypto.createHash('md5').update(bodyStr2 + TK).digest('hex');
  try {
    const resp = await axios.post('https://vsi-api.shouqianba.com/wap2', bodyStr2, {
      headers: { 'Content-Type': 'application/json', 'Authorization': TS + ' ' + sign2 },
      timeout: 15000,
      validateStatus: () => true
    });
    console.log('/wap2 with operator:', resp.status, JSON.stringify(resp.data).substring(0, 200));
    if (resp.data.biz_response?.pay_url || resp.data.pay_url) {
      console.log('🎉 HAS PAY_URL!');
    }
  } catch(e) {
    console.log('/wap2 with operator error:', e.message);
  }
}

test();
