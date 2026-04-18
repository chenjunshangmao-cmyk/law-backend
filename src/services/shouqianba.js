/**
 * 收钱吧支付 SDK
 * 文档: https://doc.shouqianba.com
 */

import crypto from 'crypto';
import axios from 'axios';

// 收钱吧 API 配置
const SHOUQIANBA_API = 'https://vsi-api.shouqianba.com';

// 从环境变量读取配置
const VENDOR_SN = process.env.SHOUQIANBA_VENDOR_SN || '';  // 必填：收钱吧机构编号（终端编号）
const VENDOR_KEY = process.env.SHOUQIANBA_VENDOR_KEY || ''; // 必填：收钱吧机构密钥
const APP_ID = process.env.SHOUQIANBA_APP_ID || '';        // 必填：收钱吧应用 ID

/**
 * 生成 MD5 签名（非支付接口）
 * sign = MD5(CONCAT(body + key))
 * 注意：body必须是JSON字符串，不能有空格
 */
function generateSign(body, key) {
  // 确保body是紧凑的JSON字符串（无空格）
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  const signStr = bodyStr + key;
  console.log('签名原文:', signStr);
  const sign = crypto.createHash('md5').update(signStr).digest('hex');
  console.log('签名结果:', sign);
  return sign;
}

/**
 * 生成跳转支付接口签名
 * 参数排序后拼接 + &key= + MD5 + 转大写
 */
function generateWapSign(params, key) {
  // 剔除 sign 和 sign_type
  const filtered = { ...params };
  delete filtered.sign;
  delete filtered.sign_type;

  // 按ASCII码排序
  const sortedKeys = Object.keys(filtered).sort();
  
  // 拼接参数
  const pairs = sortedKeys.map(k => `${k}=${filtered[k]}`);
  let signStr = pairs.join('&');
  signStr += `&key=${key}`;

  // MD5 + 大写
  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

/**
 * 验证回调签名
 */
function verifyNotifySign(params, key) {
  const sign = params.sign;
  const calculatedSign = generateWapSign(params, key);
  return sign === calculatedSign;
}

/**
 * 收钱吧 API 请求封装
 */
async function shouqianbaRequest(endpoint, body, sn, key) {
  const bodyStr = JSON.stringify(body);
  const sign = generateSign(bodyStr, key);

  try {
    const response = await axios.post(`${SHOUQIANBA_API}${endpoint}`, bodyStr, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${sn} ${sign}`
      },
      timeout: 30000
    });

    return response.data;
  } catch (error) {
    console.error('收钱吧 API 请求失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
      throw new Error(error.response.data.error_message || 'API请求失败');
    }
    throw error;
  }
}

/**
 * 激活终端
 * 使用 vendor_sn + vendor_key 签名
 */
export async function activateTerminal(deviceId, code) {
  const body = {
    app_id: APP_ID,
    code: code,
    device_id: deviceId
  };

  const result = await shouqianbaRequest('/terminal/activate', body, VENDOR_SN, VENDOR_KEY);
  
  if (result.result_code !== '200') {
    throw new Error(result.error_message || '激活失败');
  }

  return {
    terminalSn: result.terminal_sn,
    terminalKey: result.terminal_key,
    merchantId: result.merchant_id,
    storeSn: result.store_sn
  };
}

/**
 * 终端签到
 * 使用 terminal_sn + terminal_key 签名，返回新的密钥
 */
export async function checkinTerminal(terminalSn, terminalKey, deviceId) {
  const body = {
    terminal_sn: terminalSn,
    device_id: deviceId
  };

  const result = await shouqianbaRequest('/terminal/checkin', body, terminalSn, terminalKey);

  if (result.result_code !== '200') {
    throw new Error(result.error_message || '签到失败');
  }

  return {
    terminalSn: result.terminal_sn,
    terminalKey: result.terminal_key
  };
}

/**
 * 创建跳转支付订单
 * 返回支付URL，用户扫码支付
 * 使用跳转支付专用签名方式
 */
export async function createWapPayment(params) {
  const {
    terminalSn,
    terminalKey,
    clientSn,        // 商户订单号
    totalAmount,     // 金额（分）
    subject,         // 订单标题
    returnUrl,       // 支付完成返回地址
    notifyUrl,       // 回调地址
    clientIp         // 用户IP
  } = params;

  // 构建请求参数（按收钱吧 wap2 接口要求）
  const requestParams = {
    terminal_sn: terminalSn,
    client_sn: clientSn,
    total_amount: totalAmount.toString(),
    subject: subject,
    return_url: returnUrl,
    notify_url: notifyUrl
  };

  // 使用跳转支付专用签名
  const sign = generateWapSign(requestParams, terminalKey);

  const body = {
    ...requestParams,
    sign: sign,
    sign_type: 'MD5'
  };

  console.log('收钱吧 wap2 请求:', JSON.stringify(body));

  try {
    const response = await axios.post(`${SHOUQIANBA_API}/upay/v2/wap2`, JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const result = response.data;
    console.log('收钱吧 wap2 响应:', JSON.stringify(result));

    if (result.result_code !== '200') {
      throw new Error(result.error_message || '创建支付订单失败');
    }

    return {
      sn: result.sn,                    // 收钱吧订单号
      clientSn: result.client_sn,       // 商户订单号
      tradeNo: result.trade_no,         // 支付渠道订单号
      payUrl: result.pay_url,           // 支付URL（用于生成二维码）
      totalAmount: result.total_amount,
      status: result.order_status
    };
  } catch (error) {
    console.error('创建支付订单请求失败:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
      throw new Error(error.response.data?.error_message || '创建支付订单失败');
    }
    throw error;
  }
}

/**
 * 查询订单状态
 */
export async function queryOrder(terminalSn, terminalKey, sn) {
  const body = {
    terminal_sn: terminalSn,
    sn: sn
  };

  const result = await shouqianbaRequest('/query', body, terminalSn, terminalKey);

  return {
    sn: result.sn,
    clientSn: result.client_sn,
    tradeNo: result.trade_no,
    status: result.order_status,      // PAID/PAY_CANCELED/CREATED等
    payway: result.payway,            // WECHAT/ALIPAY
    paywayName: result.payway_name,
    totalAmount: result.total_amount,
    netAmount: result.net_amount,
    payerUid: result.payer_uid,
    payerLogin: result.payer_login,
    channelFinishTime: result.channel_finish_time
  };
}

/**
 * 退款
 */
export async function refundOrder(terminalSn, terminalKey, sn, refundAmount) {
  const body = {
    terminal_sn: terminalSn,
    sn: sn,
    refund_amount: refundAmount.toString()
  };

  const result = await shouqianbaRequest('/refund', body, terminalSn, terminalKey);

  return {
    sn: result.sn,
    clientSn: result.client_sn,
    status: result.order_status,
    refundAmount: result.refund_amount,
    refundOrderNo: result.refund_order_no
  };
}

/**
 * 处理收钱吧回调
 * 验签并解析回调数据
 */
export function handleNotify(params) {
  // 验签
  const isValid = verifyNotifySign(params, VENDOR_KEY);
  
  if (!isValid) {
    throw new Error('回调签名验证失败');
  }

  return {
    sn: params.sn,
    clientSn: params.client_sn,
    tradeNo: params.trade_no,
    status: params.order_status,
    payway: params.payway,
    paywayName: params.payway_name,
    totalAmount: params.total_amount,
    netAmount: params.net_amount,
    channelFinishTime: params.channel_finish_time,
    subject: params.subject
  };
}

/**
 * 生成支付二维码URL
 */
export function generateQrCodeUrl(payUrl) {
  // 使用免费二维码API
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payUrl)}`;
}

export default {
  activateTerminal,
  checkinTerminal,
  createWapPayment,
  queryOrder,
  refundOrder,
  handleNotify,
  generateQrCodeUrl
};
