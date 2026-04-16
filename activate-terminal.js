/**
 * 收钱吧终端激活脚本
 * 运行一次即可，保存终端信息到数据库
 */

import pool from './src/config/database.js';
import { activateTerminal, checkinTerminal } from './src/services/shouqianba.js';
import axios from 'axios';
import crypto from 'crypto';

// 配置（从收钱吧获取）
const ACTIVATION_CODE = process.env.SHOUQIANBA_ACTIVATION_CODE || '66172491';
const DEVICE_ID = process.env.SHOUQIANBA_DEVICE_ID || 'CLAW_WEB_001';

// 收钱吧配置
const VENDOR_SN = '91803325';
const VENDOR_KEY = '677da351628d3fe7664321669c3439b2';
const APP_ID = '2026041600011122';

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

async function activate() {
  try {
    console.log('=== 收钱吧终端激活 ===\n');

    if (!ACTIVATION_CODE) {
      console.error('❌ 错误: 请设置 SHOUQIANBA_ACTIVATION_CODE 环境变量');
      process.exit(1);
    }

    console.log(`设备号: ${DEVICE_ID}`);
    console.log(`激活码: ${ACTIVATION_CODE.substring(0, 4)}****\n`);
    console.log(`vendor_sn: ${VENDOR_SN}`);
    console.log(`app_id: ${APP_ID}\n`);

    // 1. 激活终端
    console.log('1. 正在激活终端...');
    // 按照字母顺序排序字段（a-z）
    const body = {
      app_id: APP_ID,
      code: ACTIVATION_CODE,
      device_id: DEVICE_ID
    };
    
    console.log('请求体:', JSON.stringify(body, null, 2));
    
    // 激活接口使用 vendor_sn + vendor_key
    const result = await shouqianbaRequest('/terminal/activate', body, VENDOR_SN, VENDOR_KEY);
    
    console.log('响应:', JSON.stringify(result, null, 2));
    
    if (result.result_code !== '200') {
      throw new Error(result.error_message || '激活失败');
    }

    const terminal = {
      terminalSn: result.terminal_sn,
      terminalKey: result.terminal_key,
      merchantId: result.merchant_id,
      storeSn: result.store_sn
    };
    
    console.log('   ✅ 激活成功！');
    console.log(`   终端号: ${terminal.terminalSn}`);
    console.log(`   商户号: ${terminal.merchantId}`);
    console.log(`   门店号: ${terminal.storeSn}\n`);

    // 2. 立即签到
    console.log('2. 正在签到...');
    const checkinBody = {
      terminal_sn: terminal.terminalSn,
      device_id: DEVICE_ID
    };
    
    const checkinResult = await shouqianbaRequest('/terminal/checkin', checkinBody, terminal.terminalSn, terminal.terminalKey);
    
    if (checkinResult.result_code !== '200') {
      throw new Error(checkinResult.error_message || '签到失败');
    }
    
    const checkin = {
      terminalSn: checkinResult.terminal_sn,
      terminalKey: checkinResult.terminal_key
    };
    
    console.log('   ✅ 签到成功！');
    console.log(`   新终端密钥已更新\n`);

    // 3. 保存到数据库
    console.log('3. 保存终端信息到数据库...');
    await pool.query(
      `INSERT INTO shouqianba_terminals 
       (terminal_sn, terminal_key, device_id, store_sn, merchant_id, status, last_checkin_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (terminal_sn) 
       DO UPDATE SET 
         terminal_key = $2,
         last_checkin_at = $7,
         updated_at = CURRENT_TIMESTAMP`,
      [
        checkin.terminalSn,
        checkin.terminalKey,
        DEVICE_ID,
        terminal.storeSn,
        terminal.merchantId,
        'active',
        new Date()
      ]
    );
    console.log('   ✅ 终端信息已保存\n');

    console.log('🎉 终端激活完成！');
    console.log('\n提示:');
    console.log('- 终端只需激活一次');
    console.log('- 建议每天定时签到更新密钥');
    console.log('- 同一设备号不能重复激活');

  } catch (error) {
    console.error('\n❌ 激活失败:', error.message);
    console.log('\n常见错误:');
    console.log('- EJ26: 签名错误，检查 vendor_sn/vendor_key');
    console.log('- 激活码无效或已过期');
    console.log('- 激活码使用次数已达上限');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

activate();
