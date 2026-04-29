// 所有vsi-api上的非404端点（之前只试了几个）
import crypto from 'crypto';
import axios from 'axios';

const TS = '100111220054389553';
const TK = '355cc26a464fe47bc7ce300e381c923e';
const VS = '91803325';
const VK = '677da351628d3fe7664321669c3439b2';
const cs = 'scan' + Date.now().toString().slice(-5);

async function tryEndpoint(ep, body, auth, sign, desc) {
  try {
    const resp = await axios.post('https://vsi-api.shouqianba.com' + ep, body, {
      headers: { 'Content-Type': 'application/json', 'Authorization': auth + ' ' + sign },
      timeout: 15000,
      validateStatus: () => true
    });
    if (resp.status !== 404) {
      console.log(`${desc} (${ep}): ${resp.status} ${JSON.stringify(resp.data).substring(0, 200)}`);
    }
  } catch(e) {
    // ignore
  }
}

async function run() {
  const bodyStr = JSON.stringify({ terminal_sn: TS, client_sn: cs, total_amount: '19900', subject: 'test', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba' });
  const sign = crypto.createHash('md5').update(bodyStr + TK).digest('hex').toUpperCase();
  
  // 扫描更多端点
  const eps = [
    '/upay/v2/wap2',
    '/upay/v1/wap',
    '/upay/wap',
    '/wap2',
    '/wap',
    '/v2/pay/wap',
    '/v2/pay/precreate',
    '/v2/pay/qr',
    '/v2/pay',
    '/pay',
    '/pay/wap',
    '/pay/precreate',
    '/pay/qr',
    '/precreate',
    '/qrcode',
    '/v2/qrcode',
    '/upay/wap2',
    '/trade/pay',
    '/trade/wap',
    '/trade/create',
    '/api/pay',
    '/gateway/pay',
    '/v2/gateway',
    '/checkout',
  ];
  
  for (const ep of eps) {
    await tryEndpoint(ep, bodyStr, TS, sign, 'term-json');
    // 也试urlencoded
    const sorted = Object.keys({ terminal_sn: TS, client_sn: cs, total_amount: '19900', subject: 'test', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba' }).sort();
    const encoded = sorted.map(k => encodeURIComponent(k) + '=' + encodeURIComponent({ terminal_sn: TS, client_sn: cs, total_amount: '19900', subject: 'test', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba' }[k])).join('&');
    const sign2 = crypto.createHash('md5').update(encoded + TK).digest('hex').toUpperCase();
    try {
      const resp = await axios.post('https://vsi-api.shouqianba.com' + ep, encoded, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': TS + ' ' + sign2 },
        timeout: 10000,
        validateStatus: () => true
      });
      if (resp.status !== 404) {
        console.log(`term-form ${ep}: ${resp.status} ${JSON.stringify(resp.data).substring(0, 200)}`);
      }
    } catch(e) {}
    
    // vendor级别
    const vSign = crypto.createHash('md5').update(bodyStr + VK).digest('hex').toUpperCase();
    await tryEndpoint(ep, bodyStr, VS, vSign, 'vnd-json');
  }
  
  console.log('Done');
}

run();
