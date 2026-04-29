// 最小化参数，逐个排除
import crypto from 'crypto';
import axios from 'axios';

const TS = '100111220054389553';
const TK = '355cc26a464fe47bc7ce300e381c923e';
const base = 'min' + Date.now().toString().slice(-5);

// 逐个字段测试
async function testOne(params, desc) {
  const sorted = Object.keys(params).sort();
  const raw = sorted.map(k => k + '=' + params[k]).join('&');
  const sign = crypto.createHash('md5').update(raw + '&key=' + TK).digest('hex').toUpperCase();
  const encoded = sorted.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  
  try {
    const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', encoded, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': TS + ' ' + sign },
      timeout: 15000,
      validateStatus: () => true
    });
    const d = resp.data;
    if (d.result_code === '200' || d.error_code === 'ILLEGAL_SIGN') {
      console.log(`${d.error_code === 'ILLEGAL_SIGN' ? '❌ SIGN' : '✅'} ${desc}: ${d.result_code} ${(d.error_message||'').substring(0,30)}`);
      if (d.result_code === '200') console.log('Full:', JSON.stringify(d));
    } else {
      console.log(`🟡 ${desc}: ${d.error_code}`);
    }
  } catch(e) {
    console.log(`💥 ${desc}: ${e.message}`);
  }
}

async function run() {
  // 0: 基础成功的情况 - terminal_sn + total_amount + subject（最少参数）
  await testOne({ terminal_sn: TS, client_sn: base+'0', total_amount: '19900', subject: 'test' }, '基参');
  
  // 1: 加 notify_url
  await testOne({ terminal_sn: TS, client_sn: base+'1', total_amount: '19900', subject: 'test', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba' }, '+notify');
  
  // 2: 加 return_url
  await testOne({ terminal_sn: TS, client_sn: base+'2', total_amount: '19900', subject: 'test', return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return' }, '+return');
  
  // 3: 加 operator
  await testOne({ terminal_sn: TS, client_sn: base+'3', total_amount: '19900', subject: 'test', operator: 'claw_admin' }, '+operator');
  
  // 4: 所有字段
  await testOne({ terminal_sn: TS, client_sn: base+'4', total_amount: '19900', subject: 'test', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return', operator: 'claw_admin' }, '全部');
  
  // 5: total_amount 用数字
  await testOne({ terminal_sn: TS, client_sn: base+'5', total_amount: 19900, subject: 'test' }, '数字金额');
  
  // 6: 用timeout参数
  await testOne({ terminal_sn: TS, client_sn: base+'6', total_amount: '19900', subject: 'test', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return', operator: 'claw_admin', timeout: '240' }, '+timeout');
  
  // 7: 带description
  await testOne({ terminal_sn: TS, client_sn: base+'7', total_amount: '19900', subject: 'test', description: '会员套餐', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba' }, '+desc');
  
  // 8: 试试clear_pay_mode
  await testOne({ terminal_sn: TS, client_sn: base+'8', total_amount: '19900', subject: 'test', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', clear_pay_mode: '1' }, '+clear');
  
  // 9: 试试total_amount用分+"00" 
  await testOne({ terminal_sn: TS, client_sn: base+'9', total_amount: '1990000', subject: 'test' }, '大金额');
}

run();
