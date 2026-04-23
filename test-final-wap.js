/**
 * 最终验证：用本地新终端测试 WAP 支付生成
 */
import crypto from 'crypto';
import https from 'https';

const terminalSn = '100111220054361978';
const terminalKey = 'bb02eea086bd071fc5c31ea980e008d2';
const GATEWAY = 'https://m.wosai.cn/qr/gateway';

function wapSign(params, key) {
  const p = {};
  for (const k of Object.keys(params)) p[k] = params[k];
  delete p.sign;
  delete p.sign_type;
  const sortedKeys = Object.keys(p).sort();
  const pairs = sortedKeys.map(k => `${k}=${p[k]}`);
  const signStr = pairs.join('&') + '&key=' + key;
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

// 模拟后端 create-order 路由
function createWapOrder(planId, price) {
  const baseUrl = 'https://claw-app-2026.pages.dev';
  const clientSn = planId + '_' + Date.now();
  const requestParams = {
    terminal_sn: terminalSn,
    client_sn: clientSn,
    total_amount: String(Math.round(Number(price) * 100)),
    subject: 'Claw会员 - ' + planId,
    return_url: baseUrl + '/membership',
    notify_url: baseUrl + '/api/shouqianba/notify',
    operator: 'claw_admin'
  };
  const sign = wapSign(requestParams, terminalKey);
  const signedParams = { ...requestParams, sign, sign_type: 'MD5' };
  const queryString = Object.keys(signedParams)
    .sort()
    .map(k => `${k}=${encodeURIComponent(signedParams[k])}`)
    .join('&');
  return GATEWAY + '?' + queryString;
}

// 测试生成
const payUrl = createWapOrder('monthly', 29.9);
console.log('✅ 生成的支付URL:');
console.log(payUrl);
console.log('\n将此URL生成二维码即可扫码支付！');

// 验证URL可以访问（302跳转为正常）
new Promise((resolve) => {
  const urlObj = new URL(payUrl);
  const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15' }
  };
  const req = https.request(options, (res) => {
    console.log('\n✅ 网关响应: HTTP', res.statusCode);
    if (res.statusCode === 302) {
      console.log('✅ 跳转到:', res.headers.location?.substring(0, 100));
    } else if (res.statusCode === 200) {
      console.log('✅ 支付页面HTML返回成功!');
    }
    resolve();
  });
  req.on('error', e => { console.log('错误:', e.message); resolve(); });
  req.setTimeout(10000, () => { req.destroy(); resolve(); });
  req.end();
});
