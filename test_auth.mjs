// Authorization header方式 - 去掉body中的sign
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
const terminalKey = '355cc26a464fe47bc7ce300e381c923e';

const clientSn = 'auth-' + Date.now();

const body = {
  terminal_sn: terminalSn,
  client_sn: clientSn,
  total_amount: 100,
  subject: '测试',
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

const bodyStr = JSON.stringify(body);

// 方式1: md5(body+key) 大写
const sign1 = crypto.createHash('md5').update(bodyStr + terminalKey).digest('hex').toUpperCase();

// 方式2: md5(body+key) 小写
const sign2 = crypto.createHash('md5').update(bodyStr + terminalKey).digest('hex').toLowerCase();

async function test() {
  for (const [name, sign] of [['大写', sign1], ['小写', sign2]]) {
    try {
      const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', bodyStr, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `${terminalSn} ${sign}` },
        timeout: 15000,
        validateStatus: () => true
      });
      const d = resp.data;
      if (d.result_code === '200' || d.biz_response?.pay_url) {
        console.log(`✅ ${name}:`, JSON.stringify(d).substring(0, 400));
      } else if (d.error_code === 'ILLEGAL_REQUEST') {
        console.log(`🆕 ${name}:`, JSON.stringify(d));
      } else if (d.error_code !== 'ILLEGAL_SIGN') {
        console.log(`🟡 ${name}:`, JSON.stringify(d).substring(0, 200));
      }
    } catch(e) {
      if (e.response?.status !== 400) console.log(`💥 ${name}: ${e.message}`);
    }
  }
  
  // 方式3: 测试不同的content-type
  console.log('\n--- 测试application/x-www-form-urlencoded ---');
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    params.append(k, v);
  }
  const urlStr = params.toString();
  const urlSign = crypto.createHash('md5').update(urlStr + terminalKey).digest('hex').toUpperCase();
  try {
    const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', urlStr, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `${terminalSn} ${urlSign}` },
      timeout: 15000,
      validateStatus: () => true
    });
    console.log('urlencoded:', JSON.stringify(resp.data).substring(0, 200));
  } catch(e) {
    if (e.response) console.log('urlencoded:', e.response.status, typeof e.response.data === 'string' ? e.response.data.substring(0, 200) : JSON.stringify(e.response.data));
  }
}

test();
