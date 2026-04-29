// gateway.shouqianba.com - 正确的交易API域名
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
const terminalKey = '355cc26a464fe47bc7ce300e381c923e';
const clientSn = 'gw-' + Date.now();

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

try {
  const resp = await axios.post('https://gateway.shouqianba.com/v2/pay/wap', bodyStr, {
    headers: { 'Content-Type': 'application/json', 'Authorization': terminalSn + ' ' + sign },
    timeout: 15000
  });
  console.log('Status:', resp.status);
  console.log('Full response:', JSON.stringify(resp.data, null, 2));
} catch (err) {
  console.log('Error:', err.message);
  if (err.response) {
    console.log('Status:', err.response.status);
    const data = typeof err.response.data === 'string' ? err.response.data.substring(0, 500) : JSON.stringify(err.response.data);
    console.log('Data:', data);
  }
}
