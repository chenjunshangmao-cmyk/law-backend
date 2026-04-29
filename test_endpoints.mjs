// 测试收钱吧各种API端点
import crypto from 'crypto';
import axios from 'axios';

const device = {
  terminalSn: '100111220054389553',
  terminalKey: '96bfaf401367d934cb10a1cbe9773647',
  vendorSn: '91803325',
  vendorKey: '677da351628d3fe7664321669c3439b2'
};

const clientSn = 'dtest-' + Date.now();

// 测试不同的端点
const endpoints = [
  '/upay/v2/wap2',
  '/upay/v3/wap',
  '/upay/v2/wap',
  '/api/upay/v2/pay',
  '/api/upay/pay',
  '/upay/pay',
  '/pay/qr',
  '/api/pay',
  '/v2/pay/wap',
  '/trade/wappay',
];

async function testEndpoint(endpoint, vendorSign = false) {
  const requestBody = {
    terminal_sn: device.terminalSn,
    client_sn: clientSn,
    total_amount: 100,  // 1元测试
    subject: '测试',
    return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return?clientSn=' + clientSn,
    notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
    operator: 'claw_admin'
  };

  if (vendorSign) {
    requestBody.vendor_sn = device.vendorSn;
    requestBody.app_id = '2026041600011122';
  }

  const bodyStr = JSON.stringify(requestBody);
  const key = vendorSign ? device.vendorKey : device.terminalKey;
  const sn = vendorSign ? device.vendorSn : device.terminalSn;
  const sign = crypto.createHash('md5').update(bodyStr + key).digest('hex').toUpperCase();

  try {
    const resp = await axios.post('https://vsi-api.shouqianba.com' + endpoint, bodyStr, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': sn + ' ' + sign
      },
      timeout: 15000
    });
    console.log(`✅ ${endpoint}: ${resp.status}`, JSON.stringify(resp.data).substring(0, 200));
  } catch (err) {
    if (err.response) {
      const data = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
      console.log(`❌ ${endpoint}: ${err.response.status} ${data.substring(0, 100)}`);
    } else {
      console.log(`❌ ${endpoint}: ${err.message}`);
    }
  }
}

async function run() {
  for (const ep of endpoints) {
    await testEndpoint(ep);
  }
  console.log('\n--- 使用vendor级别签名 ---');
  for (const ep of ['/upay/v2/wap2', '/upay/v3/wap', '/api/upay/pay']) {
    await testEndpoint(ep, true);
  }
}

run();
