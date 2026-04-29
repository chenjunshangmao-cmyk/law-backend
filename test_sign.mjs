// 精确按文档PHP示例计算签名
import crypto from 'crypto';

const TS = '100111220054389553';
const TK = '96bfaf401367d934cb10a1cbe9773647';
const cs = 'sign-' + Date.now().toString().slice(-5);

// 参数排序
const params = {
  client_sn: cs,
  notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
  operator: 'claw_admin',
  return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return?clientSn=' + cs,
  subject: 'Claw会员',
  terminal_sn: TS,
  total_amount: '19900'
};

// PHP示例: $paramsStr = "client_sn=test&operator=TEST&return_url=test&subject=TEST&terminal_sn=test&total_amount=3";
// $sign = strtoupper(md5($paramsStr.'&key=test'));

// 1. 剔除sign/sign_type
// 2. 排序 -> Object.keys.sort()
const sortedKeys = Object.keys(params).sort();
// 3. 拼接 key=value 用 &
const pairs = sortedKeys.map(k => `${k}=${params[k]}`);
const signStr = pairs.join('&') + '&key=' + TK;
const sign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();

console.log('Sorted keys:', sortedKeys.join(','));
console.log('Sign str:', signStr);
console.log('Sign:', sign);

// 4. 拼URL
pairs.push('sign=' + sign, 'sign_type=MD5');
const url = 'https://m.wosai.cn/qr/gateway?' + pairs.join('&');
console.log('\nURL:', url);
console.log('\nURL length:', url.length);
