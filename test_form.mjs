// 回到URL encoded格式 - 签名应该是md5(urlencoded_str + key)
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
const terminalKey = '355cc26a464fe47bc7ce300e381c923e';
const ck = terminalKey;

const clientSn = 'form-' + Date.now();

// 构建参数
const params = {
  terminal_sn: terminalSn,
  client_sn: clientSn,
  total_amount: '100',
  subject: 'test',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return',
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

// URL encoded字符串
const urlEncoded = Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');

// 签名方式1: md5(urlencoded + key)
const sign1 = crypto.createHash('md5').update(urlEncoded + ck).digest('hex').toUpperCase();

// 签名方式2: md5(urlencoded + &key=key)
const sign2 = crypto.createHash('md5').update(urlEncoded + '&key=' + ck).digest('hex').toUpperCase();

// 签名方式3: json body + key
const jsonBody = JSON.stringify(params);
const sign3 = crypto.createHash('md5').update(jsonBody + ck).digest('hex').toUpperCase();

// 签名方式4: 不带encode的排序参数 + &key=
const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
const sign4 = crypto.createHash('md5').update(sorted + '&key=' + ck).digest('hex').toUpperCase();

async function test() {
  const tests = [
    { desc: 'urlencoded + md5(body+key)', body: urlEncoded, contentType: 'application/x-www-form-urlencoded', sign: sign1 },
    { desc: 'urlencoded + md5(body+&key=)', body: urlEncoded, contentType: 'application/x-www-form-urlencoded', sign: sign2 },
    { desc: 'json + md5(body+key)', body: jsonBody, contentType: 'application/json', sign: sign3 },
    { desc: '排序+&key=', body: sorted, contentType: 'application/x-www-form-urlencoded', sign: sign4 },
  ];
  
  for (const t of tests) {
    try {
      const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', t.body, {
        headers: { 'Content-Type': t.contentType, 'Authorization': `${terminalSn} ${t.sign}` },
        timeout: 15000,
        validateStatus: () => true
      });
      const d = resp.data;
      const hasPayUrl = JSON.stringify(resp.data).includes('pay_url');
      if (d.result_code === '200' || hasPayUrl) {
        console.log(`✅ ${t.desc}:`, JSON.stringify(d).substring(0, 400));
      } else {
        console.log(`${t.desc}: rc=${d.result_code} err=${d.error_code||''} msg=${(d.error_message||'').substring(0,60)}`);
      }
    } catch(e) {
      console.log(`${t.desc}: ${e.message}`);
    }
  }
  
  // 再试试直接用排序参数拼body（不带sign和sign_type）
  console.log('\n--- 排序参数 body 不带sign ---');
  const bodyOnly = sorted;
  const signOnly = crypto.createHash('md5').update(bodyOnly + ck).digest('hex').toUpperCase();
  try {
    const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', bodyOnly, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `${terminalSn} ${signOnly}` },
      timeout: 15000,
      validateStatus: () => true
    });
    console.log('sorted urlencoded:', JSON.stringify(resp.data).substring(0, 200));
  } catch(e) {
    console.log('error:', e.message);
  }
}

test();
