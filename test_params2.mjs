// ILLEGAL_REQUEST - 不带operator、改参数顺序
import crypto from 'crypto';
import axios from 'axios';

const TS = '100111220054389553';
const TK = '355cc26a464fe47bc7ce300e381c923e';
const cs = 'p-' + Date.now().toString().slice(-8);

// 不带operator
const b1 = { terminal_sn: TS, client_sn: cs, total_amount: '19900', subject: 'Claw会员', return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba' };
// 带body描述  
const b2 = { terminal_sn: TS, client_sn: cs + 'b', total_amount: '19900', subject: 'Claw会员', body: 'Claw会员基础版30天', return_url: 'https://api.chenjuntrading.cn/api/shouqianba/return', notify_url: 'https://api.chenjuntrading.cn/api/webhook/shouqianba', operator: 'claw_admin' };
// 只有最低参数
const b3 = { terminal_sn: TS, client_sn: cs + 'c', total_amount: '19900', subject: 'Claw' };
// 试着把字段全写小写
const b4 = {};
for (const [k, v] of Object.entries(b1)) b4[k.toLowerCase()] = v;
const b5 = { ...b1, client_sn: cs + 'e', total_amount: '19900', operator: 'claw_admin' };

const bods = [b1, b2, b3, b4, b5];
const descs = ['no-operator', 'with-body', 'minimal', 'lowercase', 'with-operator'];

async function test() {
  for (let i = 0; i < bods.length; i++) {
    const b = bods[i];
    // 排序参数（不encode）
    const sorted = Object.keys(b).sort();
    const raw = sorted.map(k => k + '=' + b[k]).join('&');
    
    // 尝试多种签名方式 - 用url-encoded body
    const encodePairs = sorted.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(b[k]));
    const encoded = encodePairs.join('&');
    
    // 签名方式：md5(不encode的排序参数 + &key=)
    const sign1 = crypto.createHash('md5').update(raw + '&key=' + TK).digest('hex').toUpperCase();
    // 签名方式：md5(encode的 + key)
    const sign2 = crypto.createHash('md5').update(encoded + TK).digest('hex').toUpperCase();
    
    for (const [sn, sign] of [['raw+&key=', sign1], ['encoded+key', sign2]]) {
      try {
        const resp = await axios.post('https://vsi-api.shouqianba.com/v2/pay/wap', encoded, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': TS + ' ' + sign
          },
          timeout: 15000,
          validateStatus: () => true
        });
        const d = resp.data;
        if (d.result_code === '200' || d.error_code !== 'ILLEGAL_REQUEST' && d.error_code !== 'ILLEGAL_SIGN') {
          console.log(`✅ ${descs[i]} ${sn}: rc=${d.result_code}`, JSON.stringify(d).substring(0, 300));
        } else if (d.error_code === 'ILLEGAL_SIGN') {
          // skip ILLEGAL_SIGN
        } else {
          console.log(`${descs[i]} ${sn}: ${d.error_code} ${(d.error_message||'').substring(0,60)}`);
        }
      } catch(e) {
        if (e.response?.status !== 400) console.log(`${descs[i]} ${sn}: ${e.message}`);
      }
    }
  }
}

test();
