/**
 * 测试收钱吧WAP2两个接口路径哪个正确
 * 同时验证Render上终端是否还活着
 */
import crypto from 'crypto';
import axios from 'axios';

const API_BASE = 'https://vsi-api.shouqianba.com';

// 已激活的终端信息（从昨天激活记录）
const TERMINAL_SN = '100111220054328800';
// 需要从文件读取terminal_key，这里先试试看Render状态
// terminal_key 在data/shouqianba-terminal.json里

function wapSign(params, key) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  const signStr = pairs.join('&') + '&key=' + key;
  console.log('[签名串]', signStr);
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

async function testPath(path, terminalKey) {
  const params = {
    terminal_sn: TERMINAL_SN,
    client_sn: 'TEST' + Date.now(),
    total_amount: '1',
    subject: '会员测试',
    return_url: 'https://claw-app-2026.pages.dev/membership',
    notify_url: 'https://claw-backend-2026.onrender.com/api/shouqianba/notify',
    sign_type: 'MD5'
  };
  params.sign = wapSign(params, terminalKey);
  
  console.log(`\n测试路径: ${path}`);
  try {
    const resp = await axios.post(API_BASE + path, JSON.stringify(params), {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    console.log('✅ HTTP状态:', resp.status);
    console.log('响应:', JSON.stringify(resp.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.log('❌ HTTP状态:', err.response.status);
      console.log('响应:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('❌ 网络错误:', err.message);
    }
  }
}

// 先从本地文件读取终端key
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TERMINAL_FILE = path.join(__dirname, 'data/shouqianba-terminal.json');

let terminalKey = null;
if (fs.existsSync(TERMINAL_FILE)) {
  const data = JSON.parse(fs.readFileSync(TERMINAL_FILE, 'utf8'));
  const def = data['claw-web-default'];
  if (def && def.terminalKey) {
    terminalKey = def.terminalKey;
    console.log('✅ 从本地文件读取到terminal_key');
    console.log('终端SN:', def.terminalSn);
  }
} else {
  console.log('❌ 本地没有终端文件，Render重启后可能丢失了');
}

if (!terminalKey) {
  console.log('\n⚠️ 没有terminal_key，无法测试签名，但可以看路径是否存在...');
  terminalKey = 'placeholder_key';
}

console.log('=== 测试两个路径 ===');
await testPath('/upay/wap2', terminalKey);
await testPath('/upay/v2/wap2', terminalKey);
