// 金额大字测试 - ILLEGAL_REQUEST可能因为金额太小或者参数格式问题
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
const terminalKey = '355cc26a464fe47bc7ce300e381c923e';
const clientSn = 'big-' + Date.now();

// 用199元测试（19900分）
const params = {
  terminal_sn: terminalSn,
  client_sn: clientSn,
  total_amount: '19900',  // 199元
  subject: 'vip会员套餐',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return',
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

const urlEncoded = Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');

// 签名: md5(urlencoded + key)
const sign = crypto.createHash('md5').update(urlEncoded + terminalKey).digest('hex').toUpperCase();

console.log('URL encoded:', urlEncoded.substring(0, 300));
console.log('Sign:', sign);

async function test() {
  try {
    const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', urlEncoded, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `${terminalSn} ${sign}`
      },
      timeout: 15000,
      validateStatus: () => true
    });
    const d = resp.data;
    console.log('Response:', JSON.stringify(d, null, 2));
    
    if (d.biz_response?.pay_url || d.pay_url) {
      console.log('\n🎉 Found pay_url!');
    }
  } catch(e) {
    console.log('Error:', e.message);
  }
}

test();
