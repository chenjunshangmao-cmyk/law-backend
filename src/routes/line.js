/**
 * LINE Messaging API 路由
 * 用于台湾市场客服对接，AI自动回复
 * 
 * LINE官方文档: https://developers.line.biz/en/docs/messaging-api/
 */

import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { getInstance } from '../services/customer-service/AIChatEngine.js';

const router = express.Router();
const chatEngine = getInstance();

// 内存中存储各渠道配置（生产环境应持久化到DB）
const lineConfigs = new Map();

/**
 * @route POST /api/line/webhook
 * @desc LINE消息回调（被LINE服务器调用）
 * @access Public (LINE signature验证)
 */
router.post('/webhook', express.json({
  // LINE需要原始body做签名验证
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}), async (req, res) => {
  try {
    // 验证LINE签名
    const signature = req.headers['x-line-signature'];
    const channelSecret = process.env.LINE_CHANNEL_SECRET || lineConfigs.get('default')?.channelSecret;
    
    if (channelSecret) {
      const isValid = crypto
        .createHmac('SHA256', channelSecret)
        .update(req.rawBody)
        .digest('base64');
      
      if (signature !== isValid) {
        console.warn('[LINE] 签名验证失败');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const events = req.body.events || [];
    
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        // 异步处理，立即回复200给LINE
        handleLineMessage(event).catch(err => {
          console.error('[LINE] 消息处理失败:', err.message);
        });
      }
    }

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('[LINE] Webhook错误:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 处理LINE消息
async function handleLineMessage(event) {
  const userId = event.source.userId;
  const userMessage = event.message.text;
  const replyToken = event.replyToken;
  const channelAccessToken = process.env.LINE_CHANNEL_TOKEN || lineConfigs.get('default')?.channelAccessToken;

  if (!channelAccessToken) {
    console.error('[LINE] Channel Access Token未配置');
    return;
  }

  // 使用AI客服引擎处理
  const result = await chatEngine.chat(userMessage, `line_${userId}`, {
    platform: 'line',
    userId
  });

  // 回复消息（LINE限制5000字符）
  const replyText = result.response
    .replace(/<[^>]*>/g, '')  // 移除HTML标签
    .substring(0, 5000);

  await axios.post(
    'https://api.line.me/v2/bot/message/reply',
    {
      replyToken,
      messages: [{
        type: 'text',
        text: replyText
      }]
    },
    {
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  );
}

/**
 * @route POST /api/line/push
 * @desc 主动推送消息给LINE用户
 * @access Private
 */
router.post('/push', async (req, res) => {
  try {
    const { userId, message } = req.body;
    const channelAccessToken = process.env.LINE_CHANNEL_TOKEN || lineConfigs.get('default')?.channelAccessToken;

    if (!channelAccessToken) {
      return res.status(400).json({ success: false, error: 'LINE未配置' });
    }

    if (!userId || !message) {
      return res.status(400).json({ success: false, error: 'userId和message必填' });
    }

    await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: userId,
        messages: [{ type: 'text', text: message }]
      },
      {
        headers: {
          'Authorization': `Bearer ${channelAccessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    res.json({ success: true, message: '推送成功' });

  } catch (error) {
    console.error('[LINE] 推送失败:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: '推送失败' });
  }
});

/**
 * @route POST /api/line/config
 * @desc 配置LINE渠道
 * @access Private
 */
router.post('/config', (req, res) => {
  try {
    const { channelId, channelSecret, channelAccessToken, name, aiPrompt } = req.body;
    
    const key = name || 'default';
    lineConfigs.set(key, {
      channelId,
      channelSecret,
      channelAccessToken,
      name: name || '默认渠道',
      aiPrompt: aiPrompt || '',
      configuredAt: new Date().toISOString()
    });

    // 同步提示词到AI引擎
    chatEngine.setChannelPrompt('line', aiPrompt);

    res.json({
      success: true,
      message: `LINE渠道 "${name || '默认'}" 配置成功`,
      webhookUrl: `${req.protocol}://${req.get('host')}/api/line/webhook`
    });

  } catch (error) {
    console.error('[LINE] 配置失败:', error);
    res.status(500).json({ success: false, error: '配置失败' });
  }
});

/**
 * @route GET /api/line/config
 * @desc 获取LINE配置状态
 * @access Private
 */
router.get('/config', (req, res) => {
  const configs = Array.from(lineConfigs.entries()).map(([key, cfg]) => ({
    key,
    name: cfg.name,
    channelId: cfg.channelId ? `${cfg.channelId.slice(0, 6)}****` : null,
    configuredAt: cfg.configuredAt,
    webhookUrl: `${req.protocol}://${req.get('host')}/api/line/webhook`
  }));

  res.json({
    success: true,
    configured: configs.length > 0,
    channels: configs
  });
});

/**
 * @route GET /api/line/stats
 * @desc LINE客服统计
 * @access Private
 */
router.get('/stats', (req, res) => {
  const stats = chatEngine.getSessionStats();
  
  // 筛选LINE相关会话
  let lineSessions = 0;
  let lineMessages = 0;
  for (const [id, session] of chatEngine.sessions) {
    if (id.startsWith('line_')) {
      lineSessions++;
      lineMessages += session.messages.length;
    }
  }

  res.json({
    success: true,
    stats: {
      lineSessions,
      lineMessages,
      totalSessions: stats.totalSessions,
      activeSessions: stats.activeSessions
    }
  });
});

export default router;
