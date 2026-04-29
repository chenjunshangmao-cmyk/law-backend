// 测试 /upay/v2/wap2 的不同变体
import crypto from 'crypto';
import axios from 'axios';

const terminalSn = '100111220054389553';
const terminalKey = '355cc26a464fe47bc7ce300e381c923e';
const vendorSn = '91803325';
const vendorKey = '677da351628d3fe7664321669c3439b2';

const clientSn = 'wap2-' + Date.now();

// 尝试所有端点组合  
const configs = [
  // 本地刚才试过的 upay/v2/wap2
  { domain: 'https://vsi-api.shouqianba.com', ep: '/upay/v2/wap2', auth: terminalSn, key: terminalKey },
  { domain: 'https://vsi-api.shouqianba.com', ep: '/upay/v2/wap2', auth: vendorSn, key: vendorKey },
  // v1版本
  { domain: 'https://vsi-api.shouqianba.com', ep: '/upay/v1/wap', auth: terminalSn, key: terminalKey },
  { domain: 'https://vsi-api.shouqianba.com', ep: '/upay/v1/wap', auth: vendorSn, key: vendorKey },
  // 排序签名（不是md5(body+key)）
  { domain: 'https://vsi-api.shouqianba.com', ep: '/upay/v2/wap2', auth: terminalSn, key: null, sorted: true },
  { domain: 'https://vsi-api.shouqianba.com', ep: '/v2/pay/wap', auth: terminalSn, key: null, sorted: true },
];

async function run() {
  for (const c of configs) {
    const body = {
      terminal_sn: c.auth === vendorSn ? undefined : terminalSn,
      vendor_sn: c.auth === vendorSn ? vendorSn : undefined,
      app_id: c.auth === vendorSn ? '2026041600011122' : undefined,
      client_sn: clientSn,
      total_amount: 100,
      subject: '测试',
      notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
      operator: 'claw_admin'
    };
    // 清理undefined
    const cleanBody = {};
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined) cleanBody[k] = v;
    }
    
    const bodyStr = JSON.stringify(cleanBody);
    let sign, auth;
    
    if (c.sorted) {
      const keys = Object.keys(cleanBody).sort();
      const str = keys.map(k => `${k}=${cleanBody[k]}`).join('&');
      sign = crypto.createHash('md5').update(str + '&key=' + terminalKey).digest('hex').toUpperCase();
      auth = terminalSn;
    } else {
      sign = crypto.createHash('md5').update(bodyStr + c.key).digest('hex').toUpperCase();
      auth = c.auth;
    }
    
    try {
      const resp = await axios.post(c.domain + c.ep, bodyStr, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth + ' ' + sign
        },
        timeout: 15000,
        validateStatus: () => true
      });
      const data = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
      const rc = resp.data.result_code;
      
      if (rc === '200' || rc === 'SUCCESS' || data.includes('pay_url')) {
        console.log(`✅ ${c.ep} (${c.auth.substring(0,8)}): ${data.substring(0,300)}`);
      } else if (rc === '400' && data.includes('ILLEGAL_SIGN')) {
        // skip ILLEGAL_SIGN
      } else {
        console.log(`🟡 ${c.ep} (${c.auth.substring(0,8)}): ${resp.status} ${data.substring(0,200)}`);
      }
    } catch(e) {
      if (e.response?.status !== 400) {
        console.log(`💥 ${c.ep}: ${e.message}`);
      }
    }
  }
  console.log('Done');
}

run();
