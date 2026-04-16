/**
 * 收钱吧终端签到脚本
 * 终端已激活，执行签到并保存到数据库
 */

import pool from './src/config/database.js';
import axios from 'axios';
import crypto from 'crypto';

// 已激活的终端信息
const DEVICE_ID = 'CLAW_WEB_001';
const TERMINAL_SN = '100111220054192664';
const TERMINAL_KEY = '9a69da1f5e3a08bcbb7f5d736bc33e66';
const MERCHANT_ID = '18956397746';
const STORE_SN = '100111220054192664';

// 生成 MD5 签名
function generateSign(body, key) {
  const signStr = body + key;
  return crypto.createHash('md5').update(signStr).digest('hex');
}

// 收钱吧 API 请求
async function shouqianbaRequest(endpoint, body, sn, key) {
  const bodyStr = JSON.stringify(body);
  const sign = generateSign(bodyStr, key);

  try {
    const response = await axios.post(`https://vsi-api.shouqianba.com${endpoint}`, bodyStr, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${sn} ${sign}`
      },
      timeout: 30000
    });

    return response.data;
  } catch (error) {
    console.error('API请求失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
      throw new Error(error.response.data.error_message || 'API请求失败');
    }
    throw error;
  }
}

async function checkin() {
  try {
    console.log('=== 收钱吧终端签到 ===\n');

    console.log(`设备号: ${DEVICE_ID}`);
    console.log(`终端号: ${TERMINAL_SN}\n`);

    // 1. 签到
    console.log('1. 正在签到...');
    const checkinBody = {
      terminal_sn: TERMINAL_SN,
      device_id: DEVICE_ID
    };
    
    const checkinResult = await shouqianbaRequest('/terminal/checkin', checkinBody, TERMINAL_SN, TERMINAL_KEY);
    
    console.log('响应:', JSON.stringify(checkinResult, null, 2));
    
    if (checkinResult.result_code !== '200') {
      throw new Error(checkinResult.error_message || '签到失败');
    }
    
    const newTerminalKey = checkinResult.terminal_key || TERMINAL_KEY;
    
    console.log('   ✅ 签到成功！');
    console.log(`   终端密钥已更新\n`);

    // 2. 保存到数据库
    console.log('2. 保存终端信息到数据库...');
    await pool.query(
      `INSERT INTO shouqianba_terminals 
       (terminal_sn, terminal_key, device_id, store_sn, merchant_id, status, last_checkin_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (terminal_sn) 
       DO UPDATE SET 
         terminal_key = $2,
         last_checkin_at = $7`,
      [
        TERMINAL_SN,
        newTerminalKey,
        DEVICE_ID,
        STORE_SN,
        MERCHANT_ID,
        'active',
        new Date()
      ]
    );
    console.log('   ✅ 终端信息已保存\n');

    console.log('🎉 终端签到完成！');
    console.log('\n终端信息摘要:');
    console.log(`- 终端号: ${TERMINAL_SN}`);
    console.log(`- 商户号: ${MERCHANT_ID}`);
    console.log(`- 设备号: ${DEVICE_ID}`);
    console.log(`- 状态: 已激活并已签到`);

  } catch (error) {
    console.error('\n❌ 签到失败:', error.message);
    process.exit(1);
  }
}

checkin();
