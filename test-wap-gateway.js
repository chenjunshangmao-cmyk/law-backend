/**
 * 正确的 WAP 支付测试
 * 文档说明：WAP 用 GET 请求到 https://m.wosai.cn/qr/gateway
 * 参数用查询字符串，sign 直接拼接在最后
 */
import crypto from 'crypto';
import https from 'https';
import fs from 'fs';

const GATEWAY = 'https://m.wosai.cn/qr/gateway';
const terminalSn = '100111220054361978';
const terminalKey = 'bb02eea086bd071fc5c31ea980e008d2'; // 签到后的key

// WAP签名：直接拼接 key 在最后
function wapSign(params, key) {
  const p = {};
  for (const k of Object.keys(params)) p[k] = params[k];
  delete p.sign;
  delete p.sign_type;
  const sortedKeys = Object.keys(p).sort();
  const pairs = sortedKeys.map(k => `${k}=${encodeURIComponent(p[k])}`);
  const signStr = pairs.join('&') + key; // 直接拼接key，无 &
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

function wapSign_raw(params, key) {
  const p = {};
  for (const k of Object.keys(params)) p[k] = params[k];
  delete p.sign;
  delete p.sign_type;
  const sortedKeys = Object.keys(p).sort();
  const pairs = sortedKeys.map(k => `${k}=${p[k]}`);
  const signStr = pairs.join('&') + key; // 直接拼接key，无 &
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

async function testGateway(description, params, key) {
  const sign = wapSign_raw(params, key);
  const signedParams = { ...params, sign, sign_type: 'MD5' };

  // 构建查询字符串
  const queryParts = Object.keys(signedParams).sort().map(k => `${k}=${encodeURIComponent(signedParams[k])}`);
  const queryString = queryParts.join('&');
  const url = GATEWAY + '?' + queryString;

  // 打印签名字符串
  const p2 = {}; for (const k of Object.keys(params)) p2[k] = params[k];
  delete p2.sign; delete p2.sign_type;
  const sk = Object.keys(p2).sort();
  const debugPairs = sk.map(k => `${k}=${p2[k]}`).join('&');
  const signDebugStr = debugPairs + key;

  console.log(`\n>>> ${description}:`);
  console.log('  签名字符串:', signDebugStr);
  console.log('  签名:', sign);
  console.log('  查询字符串:', queryString.substring(0, 200) + '...');
  console.log('  URL:', url.substring(0, 150) + '...');

  // 实际发GET请求看看返回什么
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          'Accept': 'text/html,application/xhtml+xml',
          'Referer': 'https://claw-app-2026.pages.dev/'
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          console.log('  HTTP:', res.statusCode);
          console.log('  响应前200字符:', data.substring(0, 200));
          resolve({ status: res.statusCode, data: data.substring(0, 300) });
        });
      });
      req.on('error', (e) => {
        console.log('  网络错误:', e.message);
        resolve({ error: e.message });
      });
      req.setTimeout(10000, () => { req.destroy(); resolve({ error: 'timeout' }); });
      req.end();
    } catch (e) {
      console.log('  错误:', e.message);
      resolve({ error: e.message });
    }
  });
}

async function main() {
  // 参数（参考文档，必填：terminal_sn, client_sn, total_amount, subject, return_url, operator）
  const baseParams = {
    terminal_sn: terminalSn,
    client_sn: 'T' + Date.now(),
    total_amount: '1',
    subject: 'Claw会员充值',
    return_url: 'https://claw-app-2026.pages.dev/membership',
    operator: 'admin'
  };

  console.log('=== 测试1: 直接拼接key（无&）===');
  await testGateway('直接拼接', baseParams, terminalKey);

  console.log('\n=== 测试2: &key=拼接（标准wapSign）===');
  const p2 = {}; for (const k of Object.keys(baseParams)) p2[k] = baseParams[k];
  const sk = Object.keys(p2).sort();
  const pairs2 = sk.map(k => `${k}=${p2[k]}`).join('&') + '&key=' + terminalKey;
  console.log('标准签名字符串:', pairs2);
  const sign2 = crypto.createHash('md5').update(pairs2).digest('hex').toUpperCase();
  const signed2 = { ...baseParams, sign: sign2, sign_type: 'MD5' };
  const q2 = Object.keys(signed2).sort().map(k => `${k}=${encodeURIComponent(signed2[k])}`).join('&');
  console.log('标准签名:', sign2);
  console.log('标准URL:', GATEWAY + '?' + q2.substring(0, 150) + '...');
  await testGateway('标准&key=', baseParams, '&key=' + terminalKey);

  // 保存最终正确的terminal数据
  console.log('\n=== 保存正确的terminal数据 ===');
  fs.writeFileSync('data/shouqianba-terminal.json', JSON.stringify({
    'claw-web-new1': {
      terminalSn,
      terminalKey,
      merchantId: '18956397746',
      storeSn: '00010101001200200046406',
      deviceId: 'claw-web-new1',
      updatedAt: Date.now()
    }
  }, null, 2));
  console.log('已保存!');
}

main();
