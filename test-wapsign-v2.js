/**
 * WAP2 签名终极变体测试
 * 用新激活+签到后的真实key测试
 */
import crypto from 'crypto';
import https from 'https';

const terminalSn = '100111220054361978';
const terminalKey = 'bb02eea086bd071fc5c31ea980e008d2'; // 签到后的key
const clientIp = '123.123.123.123';

function httpPost(path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    const options = {
      hostname: 'vsi-api.shouqianba.com',
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr), ...extraHeaders }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(bodyStr);
    req.end();
  });
}

// ===== 变体1: 标准wapSign =====
function wapSign_std(params, key) {
  const p = {}; for (const k of Object.keys(params)) p[k] = params[k];
  delete p.sign; delete p.sign_type;
  const sortedKeys = Object.keys(p).sort();
  const pairs = sortedKeys.map(k => `${k}=${p[k]}`);
  return crypto.createHash('md5').update(pairs.join('&') + '&key=' + key).digest('hex').toUpperCase();
}

// ===== 变体2: 无 &key= 前缀 =====
function wapSign_nokey(params, key) {
  const p = {}; for (const k of Object.keys(params)) p[k] = params[k];
  delete p.sign; delete p.sign_type;
  const sortedKeys = Object.keys(p).sort();
  const pairs = sortedKeys.map(k => `${k}=${p[k]}`);
  return crypto.createHash('md5').update(pairs.join('&') + key).digest('hex').toUpperCase();
}

// ===== 变体3: key放前面 =====
function wapSign_keyfirst(params, key) {
  const p = {}; for (const k of Object.keys(params)) p[k] = params[k];
  delete p.sign; delete p.sign_type;
  const sortedKeys = Object.keys(p).sort();
  const pairs = sortedKeys.map(k => `${k}=${p[k]}`);
  return crypto.createHash('md5').update('key=' + key + '&' + pairs.join('&')).digest('hex').toUpperCase();
}

// ===== 变体4: 只有key=value =====
function wapSign_keyval(params, key) {
  const p = {}; for (const k of Object.keys(params)) p[k] = params[k];
  delete p.sign; delete p.sign_type;
  const sortedKeys = Object.keys(p).sort();
  const pairs = sortedKeys.map(k => `${k}=${p[k]}`);
  return crypto.createHash('md5').update(pairs.join('&') + '&key=' + key).digest('hex').toUpperCase();
}

// ===== 变体5: 用签到前的原始key =====
function wapSign_origkey(params, key) {
  const p = {}; for (const k of Object.keys(params)) p[k] = params[k];
  delete p.sign; delete p.sign_type;
  const sortedKeys = Object.keys(p).sort();
  const pairs = sortedKeys.map(k => `${k}=${p[k]}`);
  return crypto.createHash('md5').update(pairs.join('&') + '&key=' + key).digest('hex').toUpperCase();
}

// ===== 变体6: Authorization header 格式 =====
function md5Sign(bodyStr, key) {
  return crypto.createHash('md5').update(bodyStr + key).digest('hex');
}

async function testWap2(name, params, key, extraHeaders = {}) {
  const sign = wapSign_std(params, key);
  const reqParams = { ...params, sign, sign_type: 'MD5' };
  console.log(`\n>>> ${name}:`);
  console.log('  sign:', sign);

  // 打印签名字符串
  const p2 = {}; for (const k of Object.keys(params)) p2[k] = params[k];
  delete p2.sign; delete p2.sign_type;
  const sk = Object.keys(p2).sort();
  const debugStr = sk.map(k => `${k}=${p2[k]}`).join('&') + '&key=' + key;
  console.log('  签名字符串:', debugStr);

  const resp = await httpPost('/v2/wap2', reqParams, extraHeaders);
  console.log('  响应:', JSON.stringify(resp));
  return resp;
}

async function main() {
  const baseParams = {
    terminal_sn: terminalSn,
    client_sn: 'T' + Date.now(),
    total_amount: '1',
    subject: 'Claw会员充值',
    return_url: 'https://claw-app-2026.pages.dev/membership'
    // notify_url 不填（减少参数）
  };

  // 测试1: 标准wapSign + 签到key
  await testWap2('标准wapSign + 签到key', baseParams, terminalKey, { 'X-Forwarded-For': clientIp });

  // 测试2: 签到前的原始key
  await testWap2('标准wapSign + 原始key', baseParams, 'd1e1de91f83e27cbb5be596ff962af5a', { 'X-Forwarded-For': clientIp });

  // 测试3: 标准wapSign + Authorization header
  const bodyStr = JSON.stringify(baseParams);
  const authSign = md5Sign(bodyStr, terminalKey);
  await testWap2('标准wapSign + Auth header', baseParams, terminalKey, {
    'X-Forwarded-For': clientIp,
    'Authorization': `${terminalSn} ${authSign}`
  });

  // 测试4: 用 Authorization 方式的 sign（body+key），wapSign里用terminalKey
  const wap2ParamsWithAuth = { ...baseParams, sign_type: 'MD5' };
  wap2ParamsWithAuth.sign = wapSign_std(wap2ParamsWithAuth, terminalKey);
  const resp4 = await httpPost('/v2/wap2', wap2ParamsWithAuth, {
    'X-Forwarded-For': clientIp,
    'Authorization': `${terminalSn} ${authSign}`
  });
  console.log('\n>>> Auth+wapSign组合:', JSON.stringify(resp4));
}

main().catch(e => console.error('Error:', e.message));
