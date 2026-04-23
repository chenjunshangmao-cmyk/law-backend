/**
 * 收钱吧 终端激活 + WAP2支付 测试脚本
 */
import crypto from 'crypto';
import axios from 'axios';

const SHOUQIANBA_API = 'https://vsi-api.shouqianba.com';

// 收钱吧配置
const VENDOR_SN = '91803325';
const VENDOR_KEY = '677da351628d3fe7664321669c3439b2';
const APP_ID = '2026041600011122';
const ACTIVATION_CODE = '66172491';

// 生成MD5签名
function generateSign(body, key) {
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  const signStr = bodyStr + key;
  return crypto.createHash('md5').update(signStr).digest('hex');
}

// 生成WAP签名
function generateWapSign(params, key) {
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;
  const sortedKeys = Object.keys(filtered).sort();
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  let signStr = pairs.join('&');
  signStr += `&key=${key}`;
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

// 测试1：激活终端
async function testActivate() {
  const deviceId = `claw-${Date.now()}`;
  const body = {
    app_id: APP_ID,
    code: ACTIVATION_CODE,
    device_id: deviceId
  };
  const bodyStr = JSON.stringify(body);
  const sign = generateSign(bodyStr, VENDOR_KEY);

  console.log('=== 测试1: 终端激活 ===');
  console.log('请求体:', bodyStr);
  console.log('签名:', sign);
  console.log('');

  try {
    const response = await axios.post(`${SHOUQIANBA_API}/terminal/activate`, bodyStr, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${VENDOR_SN} ${sign}`
      },
      timeout: 15000
    });
    console.log('✅ 激活成功!');
    console.log('响应:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log('❌ 激活失败!');
    if (error.response) {
      console.log('HTTP状态:', error.response.status);
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('错误:', error.message);
    }
    return null;
  }
}

// 测试2: WAP2支付
async function testWap2Payment(terminalSn, terminalKey) {
  const orderNo = `CLAW${Date.now()}`;
  const requestParams = {
    terminal_sn: terminalSn,
    client_sn: orderNo,
    total_amount: '1',  // 1分钱
    subject: 'Claw测试订单-1分',
    return_url: 'https://claw-app-2026.pages.dev/payment/result',
    notify_url: 'https://claw-backend-2026.onrender.com/api/webhook/shouqianba'
  };

  const sign = generateWapSign(requestParams, terminalKey);
  const body = { ...requestParams, sign, sign_type: 'MD5' };

  console.log('\n=== 测试2: WAP2支付 ===');
  console.log('terminal_sn:', terminalSn);
  console.log('terminal_key:', terminalKey);
  console.log('请求体:', JSON.stringify(body, null, 2));
  console.log('');

  try {
    const response = await axios.post(`${SHOUQIANBA_API}/upay/v2/wap2`, JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    console.log('✅ 支付创建成功!');
    console.log('响应:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log('❌ WAP2支付失败!');
    if (error.response) {
      console.log('HTTP状态:', error.response.status);
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('错误:', error.message);
    }
    return null;
  }
}

// 主测试流程
async function runTests() {
  console.log('收钱吧 API 测试开始...\n');

  // 测试激活
  const activationResult = await testActivate();

  if (activationResult && activationResult.result_code === '200') {
    console.log('\n终端激活成功，获得:');
    console.log('  terminal_sn:', activationResult.terminal_sn);
    console.log('  terminal_key:', activationResult.terminal_key);
    console.log('  merchant_id:', activationResult.merchant_id);

    // 用激活后的终端测试WAP2
    await testWap2Payment(activationResult.terminal_sn, activationResult.terminal_key);
  } else {
    // 如果激活失败，尝试用VENDOR_SN/VENDOR_KEY直接测试WAP2
    console.log('\n激活失败，直接用机构编号测试WAP2...');
    await testWap2Payment(VENDOR_SN, VENDOR_KEY);
  }
}

runTests();
