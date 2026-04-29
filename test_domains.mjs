// 测试不同API域名
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
const terminalKey = '355cc26a464fe47bc7ce300e381c923e';
const vendorSn = '91803325';
const vendorKey = '677da351628d3fe7664321669c3439b2';
const clientSn = 'domain-' + Date.now();

const body = {
  terminal_sn: terminalSn,
  client_sn: clientSn,
  total_amount: 100,
  subject: '测试',
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

const bodyStr = JSON.stringify(body);
const sign = crypto.createHash('md5').update(bodyStr + terminalKey).digest('hex').toUpperCase();

// 尝试不同域名
const domains = [
  'https://vsi-api.shouqianba.com',
  'https://api.shouqianba.com',
  'https://open-api.shouqianba.com',
  'https://pay.shouqianba.com',
  'https://gateway.shouqianba.com',
];

async function test(domain) {
  const endpoints = [
    '/v2/pay/wap',
    '/v2/pay/precreate',
    '/api/v2/pay/wap',
    '/api/pay/wap',
    '/pay/v2/wap',
  ];
  
  for (const ep of endpoints) {
    try {
      const resp = await axios.post(domain + ep, bodyStr, {
        headers: { 'Content-Type': 'application/json', 'Authorization': terminalSn + ' ' + sign },
        timeout: 8000,
        validateStatus: () => true
      });
      const rc = resp.data.result_code || resp.status;
      const hasPayUrl = JSON.stringify(resp.data).includes('pay_url');
      if (rc === '200' || rc === 'SUCCESS' || hasPayUrl) {
        console.log(`✅ ${domain}${ep}: rc=${rc}`, JSON.stringify(resp.data).substring(0, 300));
      } else if (rc !== '400' || !JSON.stringify(resp.data).includes('ILLEGAL_SIGN')) {
        const dataStr = JSON.stringify(resp.data).substring(0, 100);
        console.log(`🟡 ${domain}${ep}: ${resp.status} ${dataStr}`);
      }
    } catch (e) {
      if (e.code === 'ERR_BAD_REQUEST' || e.response?.status === 400) {
        // ILLEGAL_SIGN - skip
      } else {
        console.log(`💥 ${domain}${ep}: ${e.code || e.message}`);
      }
    }
  }
}

async function run() {
  for (const d of domains) {
    await test(d);
  }
  console.log('Done');
}

run();
