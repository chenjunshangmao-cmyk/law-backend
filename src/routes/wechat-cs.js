/**
 * 微信客服路由（微信公众号客服消息）
 * 用于中国大陆市场客服对接，AI自动回复
 * 
 * 微信公众平台文档: https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Service_Center_messages.html
 */

import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { getInstance } from '../services/customer-service/AIChatEngine.js';

const router = express.Router();
const chatEngine = getInstance();

// 内存中存储各公众号配置
const wechatConfigs = new Map();

// 辅助：简单XML解析（不依赖第三方库）
function parseXML(xml) {
  const data = {};
  const fields = ['ToUserName', 'FromUserName', 'CreateTime', 'MsgType', 'Content', 'Event', 'EventKey', 'Recognition', 'MediaId'];
  for (const field of fields) {
    const regex = new RegExp(`<${field}><!\\[CDATA\\[([^\\]]*)\\]\\]></${field}>`, 'i');
    const match = xml.match(regex);
    if (match) {
      data[field] = match[1];
    } else {
      const plainRegex = new RegExp(`<${field}>([^<]*)</${field}>`, 'i');
      const plainMatch = xml.match(plainRegex);
      if (plainMatch) {
        data[field] = plainMatch[1];
      }
    }
  }
  return data;
}

/**
 * @route GET /api/wechat-cs/webhook
 * @desc 微信服务器验证（首次配置时）
 */
router.get('/webhook', (req, res) => {
  const { signature, timestamp, nonce, echostr } = req.query;
  const token = process.env.WECHAT_TOKEN || wechatConfigs.get('default')?.token;

  if (!token) {
    return res.status(400).send('Token not configured');
  }

  // 验证签名
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');
  const sha1 = crypto.createHash('sha1').update(str).digest('hex');

  if (sha1 === signature) {
    console.log('[微信客服] 服务器验证成功');
    res.send(echostr);
  } else {
    console.warn('[微信客服] 签名验证失败');
    res.status(401).send('Invalid signature');
  }
});

/**
 * @route POST /api/wechat-cs/webhook
 * @desc 接收微信用户消息
 */
router.post('/webhook', express.text({ type: '*/*' }), async (req, res) => {
  try {
    const data = parseXML(req.body);
    
    // 提取消息信息
    const msgType = data.MsgType;
    const fromUser = data.FromUserName;
    const toUser = data.ToUserName;
    
    let userMessage = '';
    if (msgType === 'text') {
      userMessage = data.Content;
    } else if (msgType === 'image') {
      userMessage = '[图片消息]';
    } else if (msgType === 'voice') {
      userMessage = data.Recognition || '[语音消息]';
    } else if (msgType === 'event') {
      if (data.Event === 'subscribe') {
        userMessage = '关注公众号';
      } else if (data.Event === 'CLICK') {
        userMessage = data.EventKey;
      } else {
        userMessage = `[事件: ${data.Event}]`;
      }
    } else {
      userMessage = `[${msgType}消息]`;
    }

    // AI客服处理
    const result = await chatEngine.chat(userMessage, `wechat_${fromUser}`, {
      platform: 'wechat',
      userId: fromUser
    });

    // 构建回复XML
    const replyText = result.response.replace(/<[^>]*>/g, '').substring(0, 600);
    const replyXml = `<xml>
<ToUserName><![CDATA[${fromUser}]]></ToUserName>
<FromUserName><![CDATA[${toUser}]]></FromUserName>
<CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
<MsgType><![CDATA[text]]></MsgType>
<Content><![CDATA[${replyText}]]></Content>
</xml>`;

    res.set('Content-Type', 'application/xml');
    res.send(replyXml);

  } catch (error) {
    console.error('[微信客服] 消息处理失败:', error);
    // 即使失败也回复success避免微信重试
    res.status(200).send('success');
  }
});

/**
 * @route POST /api/wechat-cs/config
 * @desc 配置微信公众号
 * @access Private
 */
router.post('/config', (req, res) => {
  try {
    const { appId, appSecret, token, name, merchantId } = req.body;
    
    const key = name || 'default';
    wechatConfigs.set(key, {
      appId,
      appSecret,
      token,
      name: name || '默认公众号',
      merchantId: merchantId || null,
      configuredAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `微信公众号 "${name || '默认'}" 配置成功`,
      webhookUrl: `${req.protocol}://${req.get('host')}/api/wechat-cs/webhook`
    });

  } catch (error) {
    console.error('[微信客服] 配置失败:', error);
    res.status(500).json({ success: false, error: '配置失败' });
  }
});

/**
 * @route GET /api/wechat-cs/config
 * @desc 获取微信配置状态
 * @access Private
 */
router.get('/config', (req, res) => {
  const configs = Array.from(wechatConfigs.entries()).map(([key, cfg]) => ({
    key,
    name: cfg.name,
    appId: cfg.appId ? `${cfg.appId.slice(0, 6)}****` : null,
    configuredAt: cfg.configuredAt,
    merchantId: cfg.merchantId,
    webhookUrl: `${req.protocol}://${req.get('host')}/api/wechat-cs/webhook`
  }));

  res.json({
    success: true,
    configured: configs.length > 0,
    channels: configs
  });
});

/**
 * @route POST /api/wechat-cs/custom-message
 * @desc 主动发送客服消息
 * @access Private
 */
router.post('/custom-message', async (req, res) => {
  try {
    const { openId, message, configKey = 'default' } = req.body;
    const config = wechatConfigs.get(configKey);

    if (!config) {
      return res.status(400).json({ success: false, error: '微信公众号未配置' });
    }

    if (!openId || !message) {
      return res.status(400).json({ success: false, error: 'openId和message必填' });
    }

    // 获取access_token
    const tokenRes = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.appId}&secret=${config.appSecret}`,
      { timeout: 10000 }
    );

    if (tokenRes.data.errcode) {
      throw new Error(`获取token失败: ${tokenRes.data.errmsg}`);
    }

    const accessToken = tokenRes.data.access_token;

    // 发送客服消息
    await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${accessToken}`,
      {
        touser: openId,
        msgtype: 'text',
        text: { content: message }
      },
      { timeout: 10000 }
    );

    res.json({ success: true, message: '发送成功' });

  } catch (error) {
    console.error('[微信客服] 发送失败:', error.message);
    res.status(500).json({ success: false, error: '发送失败' });
  }
});

/**
 * @route GET /api/wechat-cs/stats
 * @desc 微信客服统计
 * @access Private
 */
router.get('/stats', (req, res) => {
  let wechatSessions = 0;
  let wechatMessages = 0;
  
  for (const [id, session] of chatEngine.sessions) {
    if (id.startsWith('wechat_')) {
      wechatSessions++;
      wechatMessages += session.messages.length;
    }
  }

  res.json({
    success: true,
    stats: {
      wechatSessions,
      wechatMessages,
      configured: wechatConfigs.size > 0
    }
  });
});

export default router;
