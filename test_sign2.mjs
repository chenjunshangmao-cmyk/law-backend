// 测试 /v2/pay/wap 的签名 - 参考收钱吧文档常见的签名方式
import crypto from 'crypto';
import axios from 'axios';

const cfg = {
  terminalSn: '100111220054389553',
  terminalKey: '96bfaf401367d934cb10a1cbe9773647',
  vendorSn: '91803325',
  vendorKey: '677da351628d3fe7664321669c3439b2',
  appId: '2026041600011122',
  storeSn: '00010101001200200046406',
  merchantId: '18956397746'
};

const clientSn = 'sign-' + Date.now();

// 构建请求体，删除operator试试
const bodies = [
  {
    terminal_sn: cfg.terminalSn,
    client_sn: clientSn,
    total_amount: 100,
    subject: '测试',
    notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
    operator: 'claw_admin'
  },
  // 没有operator
  {
    terminal_sn: cfg.terminalSn,
    client_sn: clientSn,
    total_amount: 100,
    subject: '测试',
    notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba'
  },
  // 加description
  {
    terminal_sn: cfg.terminalSn,
    client_sn: clientSn,
    total_amount: 100,
    subject: '测试',
    body: '测试商品描述',
    notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
    operator: 'claw_admin'
  },
  // 加store_sn
  {
    app_id: cfg.appId,
    vendor_sn: cfg.vendorSn,
    store_sn: cfg.storeSn,
    terminal_sn: cfg.terminalSn,
    client_sn: clientSn,
    total_amount: 100,
    subject: '测试',
    notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba',
    operator: 'claw_admin'
  }
];

async function test() {
  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    const bodyStr = JSON.stringify(body);
    
    // 尝试多种签名方式
    const signMethods = [
      { 
        name: `body#${i} md5(body+terminalKey) terminalAuth`,
        sign: crypto.createHash('md5').update(bodyStr + cfg.terminalKey).digest('hex').toUpperCase(),
        auth: cfg.terminalSn
      },
      {
        name: `body#${i} md5(body+vendorKey) vendorAuth`,  
        sign: crypto.createHash('md5').update(bodyStr + cfg.vendorKey).digest('hex').toUpperCase(),
        auth: cfg.vendorSn
      },
      {
        name: `body#${i} md5(body+terminalKey) vendorAuth`,
        sign: crypto.createHash('md5').update(bodyStr + cfg.terminalKey).digest('hex').toUpperCase(),
        auth: cfg.vendorSn
      }
    ];

    for (const method of signMethods) {
      try {
        const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', bodyStr, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': method.auth + ' ' + method.sign
          },
          timeout: 10000,
          validateStatus: () => true
        });
        const rc = resp.data.result_code;
        const msg = resp.data.error_message || resp.data.error_code || '';
        const hasPayUrl = JSON.stringify(resp.data).includes('pay_url');
        const emoji = rc === '200' || rc === 'SUCCESS' ? '✅' : '❌';
        if (rc !== '400' || msg !== 'ILLEGAL_SIGN') {
          console.log(`${emoji} ${method.name}: rc=${rc} msg=${msg.substring(0,80)} payUrl=${hasPayUrl}`);
          if (hasPayUrl) console.log('  Full:', JSON.stringify(resp.data));
        } else {
          // 只打印第一个签名错误，其他的IL结EGAL_SIGN跳过
          if (i === 0 && signMethods.indexOf(method) === 0) {
            console.log(`${emoji} ${method.name}: ILLEGAL_SIGN`);
          }
        }
      } catch(e) {
        console.log(`💥 ${method.name}: ${e.message}`);
      }
    }
  }
}

test();
