// open-api.shouqianba.com - 真正的交易API
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
const terminalKey = '355cc26a464fe47bc7ce300e381c923e';
const vendorSn = '91803325';
const vendorKey = '677da351628d3fe7664321669c3439b2';
const clientSn = 'open-' + Date.now();

// 不同的请求体
const bodies = [
  // 1. 终端级别 - 基础
  { terminal_sn: terminalSn, client_sn: clientSn, total_amount: 100, subject: '测试', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', operator: 'claw_admin' },
  // 2. vendor级别 - 带app_id和vendor_sn
  { app_id: '2026041600011122', vendor_sn: vendorSn, terminal_sn: terminalSn, client_sn: clientSn, total_amount: 100, subject: '测试', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', operator: 'claw_admin' },
  // 3. 只有total_amount转字符串
  { terminal_sn: terminalSn, client_sn: 'st-' + Date.now(), total_amount: '100', subject: '测试', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', operator: 'claw_admin' },
  // 4. 加store_sn
  { terminal_sn: terminalSn, store_sn: '00010101001200200046406', client_sn: 'st2-' + Date.now(), total_amount: 100, subject: '测试', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', operator: 'claw_admin' }
];

async function test() {
  const endpoints = ['/v2/pay/wap', '/v2/pay/precreate'];
  
  for (const ep of endpoints) {
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const bodyStr = JSON.stringify(body);
      
      // 尝试用terminalKey签名
      const sign1 = crypto.createHash('md5').update(bodyStr + terminalKey).digest('hex').toUpperCase();
      // 尝试用vendorKey签名
      const sign2 = crypto.createHash('md5').update(bodyStr + vendorKey).digest('hex').toUpperCase();
      
      for (const {sign, auth} of [{sign: sign1, auth: terminalSn}, {sign: sign2, auth: vendorSn}]) {
        try {
          const resp = await axios.post('https://open-api.shouqianba.com' + ep, body, {
            headers: { 'Content-Type': 'application/json', 'Authorization': auth + ' ' + sign },
            timeout: 15000,
            validateStatus: () => true
          });
          
          const data = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
          const hasPayUrl = data.includes('pay_url');
          // 跳过纯404
          if (data.includes('Route Not Found') || data.includes('Not Found')) continue;
          
          console.log(`${ep} body#${i} auth=${auth.substring(0,8)}: ${data.substring(0, 200)}`);
          if (hasPayUrl) console.log('🎉 Found pay_url!');
        } catch(e) {
          // skip network errors
        }
      }
    }
  }
}

test();
