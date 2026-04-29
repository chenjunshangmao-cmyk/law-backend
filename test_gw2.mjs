// 测试 gateway.shouqianba.com/v2/pay/wap - 用正确的Content-Type
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
const terminalKey = '355cc26a464fe47bc7ce300e381c923e';
const clientSn = 'gw2-' + Date.now();

// 构建form-encoded数据
const params = new URLSearchParams();
params.append('terminal_sn', terminalSn);
params.append('client_sn', clientSn);
params.append('total_amount', '19900');
params.append('subject', 'Claw会员');
params.append('return_url', 'https://api.chenjuntrading.cn/api/shouqianba/return');
params.append('notify_url', 'https://api.chenjuntrading.cn/api/webhook/shouqianba');
params.append('operator', 'claw_admin');

const bodyStr = params.toString();
const sign = crypto.createHash('md5').update(bodyStr + terminalKey).digest('hex').toUpperCase();

console.log('Body:', bodyStr);
console.log('Sign:', sign);

async function test() {
  // 尝试form-urlencoded方式
  try {
    const resp = await axios.post('https://gateway.shouqianba.com/v2/pay/wap', bodyStr, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': terminalSn + ' ' + sign
      },
      timeout: 15000,
      // 不验证状态码
      validateStatus: () => true
    });
    
    console.log('Status:', resp.status);
    console.log('Headers:', JSON.stringify(resp.headers));
    console.log('Raw body:', resp.data);
    
    // 检查响应类型
    const ct = resp.headers['content-type'] || '';
    console.log('Content-Type:', ct);
    
  } catch(err) {
    console.log('Error:', err.message);
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Data:', typeof err.response.data === 'string' ? err.response.data.substring(0, 200) : JSON.stringify(err.response.data));
    }
  }
  
  // 也试试json方式
  console.log('\n--- JSON方式 ---');
  const jsonBody = JSON.stringify({
    terminal_sn: terminalSn,
    client_sn: clientSn,
    total_amount: '19900',
    subject: 'Claw会员',
    return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return',
    notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
    operator: 'claw_admin'
  });
  const jsonSign = crypto.createHash('md5').update(jsonBody + terminalKey).digest('hex').toUpperCase();
  try {
    const resp = await axios.post('https://gateway.shouqianba.com/v2/pay/wap', jsonBody, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': terminalSn + ' ' + jsonSign
      },
      timeout: 15000,
      validateStatus: () => true
    });
    console.log('Status:', resp.status);
    console.log('Body:', resp.data);
  } catch(err) {
    console.log('Error:', err.message);
  }
}

test();
