/**
 * AI客服路由
 * 处理客服对话、会话管理、统计等
 */

import express from 'express';
import { getInstance } from '../services/customer-service/AIChatEngine.js';

const router = express.Router();

const chatEngine = getInstance();

/**
 * @route POST /api/customer-service/chat
 * @desc AI客服对话
 * @access Public
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId, context = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: '消息内容不能为空'
      });
    }

    // 限制消息长度
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: '消息内容过长，请控制在1000字以内'
      });
    }

    const result = await chatEngine.chat(message, sessionId, context);

    res.json({
      success: true,
      sessionId: result.sessionId,
      response: result.response,
      source: result.source,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('客服对话错误:', error);
    res.status(500).json({
      success: false,
      error: '服务暂时不可用，请稍后再试'
    });
  }
});

/**
 * @route POST /api/customer-service/chat/stream
 * @desc AI客服对话（流式响应）
 * @access Public
 */
router.post('/chat/stream', async (req, res) => {
  try {
    const { message, sessionId, context = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: '消息内容不能为空'
      });
    }

    // 设置SSE头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 获取对话结果
    const result = await chatEngine.chat(message, sessionId, context);

    // 模拟流式输出（逐字发送）
    const response = result.response;
    const chars = response.split('');
    
    for (let i = 0; i < chars.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20)); // 20ms/字
      res.write(`data: ${JSON.stringify({ 
        type: 'chunk', 
        content: chars[i],
        index: i 
      })}\n\n`);
    }

    // 发送完成标记
    res.write(`data: ${JSON.stringify({ 
      type: 'done',
      sessionId: result.sessionId,
      source: result.source
    })}\n\n`);

    res.end();

  } catch (error) {
    console.error('流式对话错误:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error',
      error: '服务暂时不可用'
    })}\n\n`);
    res.end();
  }
});

/**
 * @route GET /api/customer-service/session/:sessionId
 * @desc 获取会话历史
 * @access Public
 */
router.get('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { session } = chatEngine.getOrCreateSession(sessionId);

    res.json({
      success: true,
      sessionId,
      messages: session.messages,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    });

  } catch (error) {
    console.error('获取会话错误:', error);
    res.status(500).json({
      success: false,
      error: '获取会话失败'
    });
  }
});

/**
 * @route DELETE /api/customer-service/session/:sessionId
 * @desc 清除会话历史
 * @access Public
 */
router.delete('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // 从Map中删除会话
    chatEngine.sessions.delete(sessionId);

    res.json({
      success: true,
      message: '会话已清除'
    });

  } catch (error) {
    console.error('清除会话错误:', error);
    res.status(500).json({
      success: false,
      error: '清除会话失败'
    });
  }
});

/**
 * @route GET /api/customer-service/stats
 * @desc 获取客服统计
 * @access Private (Admin)
 */
router.get('/stats', (req, res) => {
  try {
    const stats = chatEngine.getSessionStats();

    res.json({
      success: true,
      stats: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('获取统计错误:', error);
    res.status(500).json({
      success: false,
      error: '获取统计失败'
    });
  }
});

/**
 * @route POST /api/customer-service/cleanup
 * @desc 清理过期会话
 * @access Private (Admin)
 */
router.post('/cleanup', (req, res) => {
  try {
    const cleanedCount = chatEngine.cleanupSessions();

    res.json({
      success: true,
      message: `已清理 ${cleanedCount} 个过期会话`
    });

  } catch (error) {
    console.error('清理会话错误:', error);
    res.status(500).json({
      success: false,
      error: '清理会话失败'
    });
  }
});

/**
 * @route GET /api/customer-service/health
 * @desc 健康检查
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
