// 用最开始的key试
import crypto from 'crypto';
import axios from 'axios';

const TS = '100111220054389553';
const TK = '96bfaf401367d934cb10a1cbe9773647'; // 初始key
const cs = 'oldkey-' + Date.now().toString().slice(-5);

const body = {
  terminal_sn: TS,
  client_sn: cs,
  total_amount: '19900',
  subject: 'Claw会员',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return',
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin'
};

const sorted = Object.keys(body).sort();
const raw = sorted.map(k => k + '=' + body[k]).join('&');
const sign = crypto.createHash('md5').update(raw + '&key=' + TK).digest('hex').toUpperCase();
const encoded = sorted.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(body[k])).join('&');

console.log('Using original key');
console.log('Sign:', sign);

try {
  const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', encoded, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': TS + ' ' + sign },
    timeout: 15000,
    validateStatus: () => true
  });
  console.log('Result:', JSON.stringify(resp.data));
} catch(e) {
  console.log('Error:', e.message);
}

// 也试试旧key + JSON body + md5(body+key)（原始的shouqianbaRequest方式）
console.log('\n--- JSON方式 with original key ---');
const jsonBody = JSON.stringify({ terminal_sn: TS, client_sn: cs+'j', total_amount: '19900', subject: 'Claw会员', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return' });
const jsonSign = crypto.createHash('md5').update(jsonBody + TK).digest('hex').toUpperCase();
try {
  const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', jsonBody, {
    headers: { 'Content-Type': 'application/json', 'Authorization': TS + ' ' + jsonSign },
    timeout: 15000,
    validateStatus: () => true
  });
  console.log('Result:', JSON.stringify(resp.data));
} catch(e) {
  console.log('Error:', e.message);
}
