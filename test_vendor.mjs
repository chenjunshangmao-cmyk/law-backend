// 测试 /v2/pay/wap - 用vendor级别签名
import crypto from 'crypto';
import axios from 'axios';

const config = {
  vendorSn: '91803325',
  vendorKey: '677da351628d3fe7664321669c3439b2',
  appId: '2026041600011122',
  terminalSn: '100111220054389553',
  terminalKey: '96bfaf401367d934cb10a1cbe9773647'
};

const clientSn = 'vtest-' + Date.now();

// 参数含vendor_sn和app_id (v3格式带门店ID)
const requestBody = {
  app_id: config.appId,
  vendor_sn: config.vendorSn,
  store_sn: '00010101001200200046406',
  terminal_sn: config.terminalSn,
  client_sn: clientSn,
  total_amount: 100,  // 1元
  subject: '测试',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return?clientSn=' + clientSn,
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

const bodyStr = JSON.stringify(requestBody);

// 尝试不同的签名组合
const combos = [
  { name: 'md5(body+vendorKey) 大写', key: config.vendorKey },
  { name: 'md5(body+terminalKey) 大写', key: config.terminalKey },
  { name: 'md5(body+vendorKey) 小写', key: config.vendorKey },
];

async function run() {
  // 先试试 vendor级别
  for (const c of combos) {
    const sign = crypto.createHash('md5').update(bodyStr + c.key).digest('hex');
    const finalSign = c.name.includes('大写') ? sign.toUpperCase() : sign.toLowerCase();
    
    // 尝试不同auth格式
    const authFormats = [
      config.vendorSn + ' ' + finalSign,
      config.terminalSn + ' ' + finalSign,
      config.vendorSn + ' ' + finalSign,
      config.vendorSn + ' ' + crypto.createHash('md5').update(bodyStr + config.vendorKey).digest('hex').toUpperCase(),
    ];
    
    for (const auth of [...new Set(authFormats)]) {
      try {
        const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', bodyStr, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
          },
          timeout: 15000
        });
        console.log(`✅ ${c.name} auth=${auth.split(' ')[0]}...:`, JSON.stringify(resp.data).substring(0, 300));
        if (resp.data.result_code === '200' || resp.data.result_code === 'SUCCESS') {
          console.log('🎉 SUCCESS! ', JSON.stringify(resp.data));
        }
        break;
      } catch (err) {
        if (err.response) {
          const data = typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
          // 如果是200但内容是错误，也打印
          if (err.response.status === 200) {
            console.log(`🟡 ${c.name} auth=${auth.split(' ')[0]}...:`, data.substring(0, 200));
          }
        }
      }
    }
  }
  
  // 也试试不带store_sn的
  console.log('\n--- 不带store_sn ---');
  const body2 = JSON.stringify({
    app_id: config.appId,
    vendor_sn: config.vendorSn,
    terminal_sn: config.terminalSn,
    client_sn: 'b2-' + Date.now(),
    total_amount: 100,
    subject: '测试',
    return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return',
    notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
    operator: 'claw_admin'
  });
  
  const sign2 = crypto.createHash('md5').update(body2 + config.vendorKey).digest('hex').toUpperCase();
  try {
    const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', body2, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.vendorSn + ' ' + sign2
      },
      timeout: 15000
    });
    console.log('Status:', resp.status);
    console.log('Data:', JSON.stringify(resp.data));
  } catch(err) {
    console.log('Error:', err.message);
    if (err.response) console.log('Data:', typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data));
  }
}

run();
