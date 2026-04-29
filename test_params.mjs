// ILLEGAL_REQUEST - 可能是参数格式问题
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
const terminalKey = '355cc26a464fe47bc7ce300e381c923e';
const clientSn = 'fix-' + Date.now();

// total_amount必须是字符串！
const bodies = [
  // 原版（缺 return_url）
  { terminal_sn: terminalSn, client_sn: clientSn, total_amount: '100', subject: 'test', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', operator: 'claw_admin' },
  // 加 return_url
  { terminal_sn: terminalSn, client_sn: clientSn, total_amount: '100', subject: 'test', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return', operator: 'claw_admin' },
  // 不加operator
  { terminal_sn: terminalSn, client_sn: clientSn, total_amount: '100', subject: 'test', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return' },
  // 加description
  { terminal_sn: terminalSn, client_sn: clientSn, total_amount: '100', subject: 'test', body: '商品描述', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return', operator: 'claw_admin' },
  // 含store_sn
  { terminal_sn: terminalSn, store_sn: '00010101001200200046406', client_sn: clientSn, total_amount: '100', subject: 'test', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return', operator: 'claw_admin' },
  // 含app_id + vendor_sn
  { app_id: '2026041600011122', vendor_sn: '91803325', terminal_sn: terminalSn, store_sn: '00010101001200200046406', client_sn: clientSn, total_amount: '100', subject: 'test', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return', operator: 'claw_admin' },
];

async function test() {
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    const bodyStr = JSON.stringify(b);
    const sign = crypto.createHash('md5').update(bodyStr + terminalKey).digest('hex').toUpperCase();
    
    try {
      const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', bodyStr, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `${terminalSn} ${sign}` },
        timeout: 15000,
        validateStatus: () => true
      });
      const d = resp.data;
      if (d.result_code === '200' || d.biz_response?.pay_url || d.pay_url) {
        console.log(`✅ body#${i}:`, JSON.stringify(d).substring(0, 400));
      } else {
        console.log(`body#${i}: rc=${d.result_code} err=${d.error_code} msg=${(d.error_message||'').substring(0,60)}`);
      }
    } catch(e) {
      console.log(`body#${i}: ${e.message}`);
    }
  }
}

test();
