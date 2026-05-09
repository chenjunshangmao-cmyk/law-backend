/**
 * WhatsApp Cloud API 客服路由
 * 用于海外市场客服对接（台湾/东南亚），AI自动回复
 * 
 * Meta官方文档: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { getInstance } from '../services/customer-service/AIChatEngine.js';

const router = express.Router();
const chatEngine = getInstance();

// 内存配置（生产环境持久化到DB）
const waConfigs = new Map();

/**
 * @route GET /api/whatsapp-cs/webhook
 * @desc WhatsApp webhook 验证（首次配置时Meta调用）
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  const verifyToken = process.env.WA_VERIFY_TOKEN || waConfigs.get('default')?.verifyToken;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp客服] Webhook验证成功');
    res.status(200).send(challenge);
  } else {
    console.warn('[WhatsApp客服] 验证失败');
    res.sendStatus(403);
  }
});

/**
 * @route POST /api/whatsapp-cs/webhook
 * @desc 接收WhatsApp消息（被Meta服务器调用）
 */
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const body = req.body;
    
    // Meta可能发多个entry
    if (!body.entry) {
      return res.sendStatus(200);
    }

    for (const entry of body.entry) {
      for (const change of entry.changes || []) {
        if (change.value?.messages) {
          for (const msg of change.value.messages) {
            // 只处理文本消息
            if (msg.type === 'text') {
              const fromPhone = msg.from;
              const phoneNumberId = change.value.metadata?.phone_number_id;
              const userMessage = msg.text.body;

              // 异步处理，立即回复200
              handleWaMessage(phoneNumberId, fromPhone, userMessage).catch(err => {
                console.error('[WhatsApp客服] 消息处理失败:', err.message);
              });
            }
            // 其他类型（图片/视频/语音）先回复占位
            else if (msg.type === 'image' || msg.type === 'video') {
              const fromPhone = msg.from;
              const phoneNumberId = change.value.metadata?.phone_number_id;
              
              sendWaMessage(phoneNumberId, fromPhone, 
                '📷 收到您的图片/视频！请简单描述您的需求，我会尽快回复～'
              ).catch(err => console.error('[WhatsApp客服] 回复失败:', err.message));
            }
          }
        }
      }
    }

    res.sendStatus(200);

  } catch (error) {
    console.error('[WhatsApp客服] Webhook错误:', error);
    res.sendStatus(200); // 即使出错也回200，避免Meta重试
  }
});

// 处理WhatsApp消息
async function handleWaMessage(phoneNumberId, fromPhone, userMessage) {
  const config = waConfigs.get('default');
  const accessToken = process.env.WA_ACCESS_TOKEN || config?.accessToken;

  if (!accessToken || !phoneNumberId) {
    console.error('[WhatsApp客服] 配置不完整');
    return;
  }

  // AI客服处理
  const result = await chatEngine.chat(userMessage, `wa_${fromPhone}`, {
    platform: 'whatsapp',
    userId: fromPhone
  });

  // 发送回复
  await sendWaMessage(phoneNumberId, fromPhone, result.response);
}

// 发送WhatsApp消息
async function sendWaMessage(phoneNumberId, to, text) {
  const config = waConfigs.get('default');
  const accessToken = process.env.WA_ACCESS_TOKEN || config?.accessToken;

  if (!accessToken) throw new Error('WhatsApp Token未配置');

  // 清理HTML标签，WhatsApp只支持纯文本
  const cleanText = text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .substring(0, 4096); // WhatsApp限制4096字符

  await axios.post(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: cleanText }
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );
}

/**
 * @route POST /api/whatsapp-cs/config
 * @desc 配置 WhatsApp Business 账号
 */
router.post('/config', (req, res) => {
  try {
    const { phoneNumberId, accessToken, verifyToken, businessName, phoneNumber } = req.body;

    if (!phoneNumberId || !accessToken) {
      return res.status(400).json({ success: false, error: 'phoneNumberId和accessToken必填' });
    }

    waConfigs.set('default', {
      phoneNumberId,
      accessToken,
      verifyToken: verifyToken || 'claw_verify_2026',
      businessName: businessName || '默认企业',
      phoneNumber: phoneNumber || '',
      configuredAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'WhatsApp Business 配置成功',
      webhookUrl: `${req.protocol}://${req.get('host')}/api/whatsapp-cs/webhook`,
      verifyToken: verifyToken || 'claw_verify_2026'
    });

  } catch (error) {
    console.error('[WhatsApp客服] 配置失败:', error);
    res.status(500).json({ success: false, error: '配置失败' });
  }
});

/**
 * @route GET /api/whatsapp-cs/config
 * @desc 获取 WhatsApp 配置状态
 */
router.get('/config', (req, res) => {
  const cfg = waConfigs.get('default');
  
  res.json({
    success: true,
    configured: !!cfg,
    config: cfg ? {
      phoneNumber: cfg.phoneNumber,
      businessName: cfg.businessName,
      configuredAt: cfg.configuredAt,
      webhookUrl: `${req.protocol}://${req.get('host')}/api/whatsapp-cs/webhook`
    } : null
  });
});

/**
 * @route POST /api/whatsapp-cs/send
 * @desc 主动发送消息给WhatsApp用户
 */
router.post('/send', async (req, res) => {
  try {
    const { phone, message, phoneNumberId } = req.body;
    const config = waConfigs.get('default');
    const pid = phoneNumberId || config?.phoneNumberId;

    if (!pid || !phone || !message) {
      return res.status(400).json({ success: false, error: '参数不完整' });
    }

    await sendWaMessage(pid, phone, message);
    res.json({ success: true, message: '发送成功' });

  } catch (error) {
    console.error('[WhatsApp客服] 发送失败:', error.message);
    res.status(500).json({ success: false, error: '发送失败' });
  }
});

/**
 * @route GET /api/whatsapp-cs/stats
 * @desc WhatsApp客服统计
 */
router.get('/stats', (req, res) => {
  let waSessions = 0;
  let waMessages = 0;

  for (const [id, session] of chatEngine.sessions) {
    if (id.startsWith('wa_')) {
      waSessions++;
      waMessages += session.messages.length;
    }
  }

  res.json({
    success: true,
    stats: {
      waSessions,
      waMessages,
      configured: waConfigs.has('default')
    }
  });
});

export default router;
