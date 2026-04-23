/**
 * 收钱吧 API 测试脚本
 * 直接测试收钱吧的 WAP2 支付接口
 */
import crypto from 'crypto';
import axios from 'axios';

const SHOUQIANBA_API = 'https://vsi-api.shouqianba.com';

// 收钱吧配置（从开发者平台获取）
const terminalSn = '91803325';
const terminalKey = '677da351628d3fe7664321669c3439b2';

// 生成WAP支付签名
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

// 测试1：创建WAP支付订单
async function testCreatePayment() {
  const orderNo = `TEST${Date.now()}`;
  const requestParams = {
    terminal_sn: terminalSn,
    client_sn: orderNo,
    total_amount: '1',  // 1分钱测试
    subject: 'Claw测试订单',
    return_url: 'https://claw-app-2026.pages.dev/payment/result',
    notify_url: 'https://claw-backend-2026.onrender.com/api/webhook/shouqianba'
  };

  const sign = generateWapSign(requestParams, terminalKey);

  const body = {
    ...requestParams,
    sign: sign,
    sign_type: 'MD5'
  };

  console.log('=== 测试收钱吧 WAP2 支付接口 ===');
  console.log('请求参数:', JSON.stringify(body, null, 2));
  console.log('签名原文:', requestParams, terminalKey);
  console.log('');

  try {
    const response = await axios.post(`${SHOUQIANBA_API}/upay/v2/wap2`, JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    console.log('✅ 响应成功!');
    console.log('状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log('❌ 请求失败!');
    if (error.response) {
      console.log('HTTP状态:', error.response.status);
      console.log('错误响应:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('无响应（网络问题或超时）:', error.message);
    } else {
      console.log('请求配置错误:', error.message);
    }
    return null;
  }
}

testCreatePayment();
