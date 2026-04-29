// ILLEGAL_REQUEST - 参数问题，不是签名问题
// 用199元、确认所有参数正确
import crypto from 'crypto';
import axios from 'axios';

const TS = '100111220054389553';
const TK = '355cc26a464fe47bc7ce300e381c923e';

const clientSn = 'fix-' + Date.now().toString().slice(-8);

// 1. URL encoded 方式 - 已确认签名能过（ILLEGAL_REQUEST而不是ILLEGAL_SIGN）
const urlParams = {
  terminal_sn: TS,
  client_sn: clientSn,
  total_amount: '19900',  // 199元
  subject: 'Claw会员',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return',
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

// 手动排序构建
const sorted = Object.keys(urlParams).sort();
const formPairs = sorted.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(urlParams[k]));
const formBody = formPairs.join('&');

// 不带encode的排序字符串用于签名
const rawPairs = sorted.map(k => k + '=' + urlParams[k]);
const rawStr = rawPairs.join('&');

// 尝试不同的签名组合
const signs = [
  { name: 'md5(urlEncodedBody+key)', sign: crypto.createHash('md5').update(formBody + TK).digest('hex').toUpperCase() },
  { name: 'md5(noEncode+&key=)', sign: crypto.createHash('md5').update(rawStr + '&key=' + TK).digest('hex').toUpperCase() },
  { name: 'md5(noEncode+key)', sign: crypto.createHash('md5').update(rawStr + TK).digest('hex').toUpperCase() },
];

async function test() {
  for (const s of signs) {
    try {
      const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', formBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': TS + ' ' + s.sign
        },
        timeout: 15000,
        validateStatus: () => true
      });
      const d = resp.data;
      if (d.result_code === '200' || d.pay_url || (d.biz_response && d.biz_response.pay_url)) {
        console.log(`✅ ${s.name}: rc=${d.result_code}`, JSON.stringify(d).substring(0, 400));
      } else if (d.error_code === 'ILLEGAL_SIGN') {
        console.log(`❌ ${s.name}: ILLEGAL_SIGN`);
      } else {
        console.log(`🟡 ${s.name}: rc=${d.result_code} err=${d.error_code} msg=${(d.error_message||'').substring(0,60)}`);
      }
    } catch(e) {
      console.log(`💥 ${s.name}: ${e.message}`);
    }
  }
  
  // 试试用JSON body + 不带encode的排序签名
  console.log('\n--- JSON方式 + 排序签名 ---');
  const jsonBody = JSON.stringify(urlParams);
  for (const s of signs) {
    if (!s.name.includes('urlEncoded')) continue;
    try {
      const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', jsonBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': TS + ' ' + s.sign
        },
        timeout: 15000,
        validateStatus: () => true
      });
      const d = resp.data;
      console.log(`JSON ${s.name}:`, JSON.stringify(d).substring(0, 200));
    } catch(e) {}
  }
  
  // 输出调试信息
  console.log('\n--- Debug ---');
  console.log('formBody:', formBody.substring(0, 300));
  console.log('rawStr:', rawStr.substring(0, 300));
  console.log('rawStr+&key=:', rawStr + '&key=' + TK);
  console.log('md5(raw+&key=):', crypto.createHash('md5').update(rawStr + '&key=' + TK).digest('hex').toUpperCase());
}

test();
