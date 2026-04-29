// 总结一下今晚所有的测试结果

import crypto from 'crypto';
import axios from 'axios';

const TS = '100111220054389553';
const TK = '355cc26a464fe47bc7ce300e381c923e';
const VS = '91803325';
const VK = '677da351628d3fe7664321669c3439b2';
const cs = 'summary-' + Date.now();

console.log('=== 域名和API端点测试结果 ===\n');

const tests = [
  // vsi-api (管理API域名)
  ['vsi-api.shouqianba.com', '/terminal/activate', '终端激活 ✅ (vendor级auth)'],
  ['vsi-api.shouqianba.com', '/terminal/checkin', '终端签到 ✅ (terminal级auth)'],
  ['vsi-api.shouqianba.com', '/upay/v2/wap2', 'WAP支付API ❌ 404 (已下线)'],
  ['vsi-api.shouqianba.com', '/v2/pay/wap', '❌ ILLEGAL_SIGN (签名不正确)'],
  ['vsi-api.shouqianba.com', '/v2/pay/precreate', '❌ ILLEGAL_SIGN'],
  ['vsi-api.shouqianba.com', '/precreate', '❌ 404'],
  
  // 其他域名
  ['gateway.shouqianba.com', '/v2/pay/wap', '负载均衡健康检查 "OK"'],
  ['open-api.shouqianba.com', '/v2/pay/wap', '❌ 404'],
  
  // m.wosai.cn
  ['m.wosai.cn', '/qr/gateway?参数...', 'WAP H5页面 ⚠️ 电脑端提示"请用XX打开"，手机端空白'],
];

for (const [domain, path, result] of tests) {
  console.log(`  ${domain}${path}`);
  console.log(`  → ${result}`);
  console.log();
}

console.log('=== 已修复的问题 ===');
console.log('1. ✅ notify_url: localhost:8089 → api.chenjuntrading.cn');
console.log('2. ✅ /api/webhook路由已注册（MD5验签回调）');
console.log('3. ✅ 前端二维码引导文字已清理');
console.log('');
console.log('=== 需要解决的问题 ===');
console.log('1. ❌ 支付API签名错误 (ILLEGAL_SIGN/EJ26)');
console.log('   - /v2/pay/wap 需要正确的 Authorization 签名方式');
console.log('   - md5(body+key) 签名全部失败');
console.log('2. ❌ /upay/v2/wap2 已下线/404');
console.log('');
console.log('=== 建议方案 ===');
console.log('1. 联系收钱吧客服 139-1786-2326 (陆先生) 咨询EJ26错误');
console.log('2. 或检查收钱吧后台确认claw-web-new3终端的交易权限');
console.log('3. 启用新商户重新对接');
