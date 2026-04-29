// 尝试所有组合
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
const terminalKey = '355cc26a464fe47bc7ce300e381c923e';

const clientSn = 'final-' + Date.now();

const requestParams = {
  terminal_sn: terminalSn,
  client_sn: clientSn,
  total_amount: '100',
  subject: '测试',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return?clientSn=' + clientSn,
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba'
};

const sortedKeys = Object.keys(requestParams).sort();
const pairs = sortedKeys.map(k => `${k}=${requestParams[k]}`);
const signStr = pairs.join('&') + '&key=' + terminalKey;
const sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();

const bodyWithSign = { ...requestParams, sign, sign_type: 'MD5' };
const bodyStr = JSON.stringify(bodyWithSign);

// 尝试所有域名+认证方式的组合
async function test(domain, endpoint, contentType, auth = null) {
  const headers = { 'Content-Type': contentType };
  if (auth) headers['Authorization'] = auth;
  
  try {
    const resp = await axios.post(domain + endpoint, bodyStr, {
      headers,
      timeout: 10000,
      validateStatus: () => true
    });
    const data = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
    if (data.includes('pay_url') || resp.data?.result_code === '200') {
      console.log(`✅ ${domain}${endpoint} (${contentType}${auth ? ' +auth' : ''}): ${data.substring(0, 300)}`);
      return true;
    } else if (!data.includes('Not Found') && !data.includes('ILLEGAL_SIGN')) {
      console.log(`🟡 ${domain}${endpoint}: ${resp.status} ${data.substring(0, 150)}`);
    }
  } catch(e) {
    if (e.response?.status !== 400 && e.response?.status !== 404) {
      console.log(`💥 ${domain}${endpoint}: ${e.message}`);
    }
  }
  return false;
}

async function run() {
  const configs = [
    ['https://vsi-api.shouqianba.com', '/upay/v2/wap2', 'application/json'],
    ['https://vsi-api.shouqianba.com', '/upay/v2/wap2', 'application/x-www-form-urlencoded'],
    ['https://vsi-api.shouqianba.com', '/v2/pay/wap', 'application/json'],
    ['https://vsi-api.shouqianba.com', '/v2/pay/wap', 'application/x-www-form-urlencoded'],
    ['https://gateway.shouqianba.com', '/v2/pay/wap', 'application/json'],
    ['https://gateway.shouqianba.com', '/v2/pay/wap', 'application/x-www-form-urlencoded'],
    // 带Authorization的方式
    ['https://vsi-api.shouqianba.com', '/v2/pay/wap', 'application/json', `${terminalSn} ${sign}`],
    ['https://gateway.shouqianba.com', '/v2/pay/wap', 'application/json', `${terminalSn} ${sign}`],
    // body排序签名 + auth
    ['https://vsi-api.shouqianba.com', '/v2/pay/wap', 'application/json', `${terminalSn} ${crypto.createHash('md5').update(bodyStr + terminalKey).digest('hex').toUpperCase()}`],
  ];
  
  for (const cfg of configs) {
    const [domain, ep, ct, auth] = cfg;
    if (await test(domain, ep, ct, auth)) break;
  }
  
  console.log('\n--- 直接测试原生body auth ---');
  // 直接用md5(body+key) + terminalSn auth
  const authSign = crypto.createHash('md5').update(bodyStr + terminalKey).digest('hex').toUpperCase();
  try {
    const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', bodyStr, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `${terminalSn} ${authSign}` },
      timeout: 10000,
      validateStatus: () => true
    });
    console.log(`v2/pay/wap w/sign+auth:`, JSON.stringify(resp.data).substring(0, 200));
  } catch(e) {}
  
  // 试试不带sign/sign_type，用Authorization
  try {
    const bodyNoSign = JSON.stringify(requestParams);
    const noSignAuth = crypto.createHash('md5').update(bodyNoSign + terminalKey).digest('hex').toUpperCase();
    const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', bodyNoSign, {
      headers: { 'Content-Type': 'application/json', 'Authorization': `${terminalSn} ${noSignAuth}` },
      timeout: 10000,
      validateStatus: () => true
    });
    console.log(`v2/pay/wap no-sign + auth:`, JSON.stringify(resp.data).substring(0, 200));
  } catch(e) {}
}

run();
