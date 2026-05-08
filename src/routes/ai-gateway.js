/**
 * ai-gateway-routes.js — AI网关管理API
 * 
 * GET  /api/gateway/status  — 查看各平台状态和用量
 * POST /api/gateway/test    — 测试指定平台的连接
 * POST /api/gateway/config  — 更新API Key配置
 * POST /api/gateway/chat    — 通过网关调用AI
 */

import express from 'express';
import { getGateway } from '../services/ai/AIGateway.js';

const router = express.Router();
const gateway = getGateway();

// 获取网关状态
router.get('/status', (req, res) => {
  res.json({ success: true, data: gateway.getStatus() });
});

// 测试指定平台
router.post('/test', async (req, res) => {
  try {
    const { provider } = req.body;
    const result = await gateway.chat(
      [{ role: 'user', content: '回复"ok"表示连接正常' }],
      'test',
      { model: provider }
    );
    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 通过网关调用AI
router.post('/chat', async (req, res) => {
  try {
    const { messages, scene, model, temperature, maxTokens } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.json({ success: false, error: '请提供 messages 数组' });
    }
    const result = await gateway.chat(messages, scene || 'default', { model, temperature, maxTokens });
    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

export default router;
