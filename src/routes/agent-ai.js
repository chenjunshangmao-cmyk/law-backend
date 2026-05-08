/**
 * agent-ai.js — 4子AI API路由
 * 
 * 端点：
 * GET    /api/agent-ai/list           - 获取所有Agent信息
 * GET    /api/agent-ai/:id/status     - 获取指定Agent状态
 * POST   /api/agent-ai/:id/chat       - 与Agent对话
 * POST   /api/agent-ai/:id/script     - Agent生成直播话术
 * POST   /api/agent-ai/:id/optimize   - Agent分析优化建议
 * GET    /api/agent-ai/:id/qa-history - 获取Agent问答历史
 * POST   /api/agent-ai/:id/save-tip   - Agent保存经验笔记
 * POST   /api/agent-ai/:id/save-qa    - 保存问答记录
 * GET    /api/agent-ai/:id/dashboard  - Agent仪表盘数据
 */

import express from 'express';
import { getAgentManager, getAgent, AGENT_PERSONALITIES } from '../services/ai/AgentAIManager.js';

const router = express.Router();

// ─── 获取所有Agent列表 ───
router.get('/list', (req, res) => {
  try {
    const manager = getAgentManager();
    res.json({
      success: true,
      data: {
        agents: manager.getAgentList(),
        total: manager.getAllAgents().length,
      },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ─── 获取指定Agent状态 ───
router.get('/:id/status', (req, res) => {
  try {
    const agent = getAgent(req.params.id);
    const config = AGENT_PERSONALITIES?.[agent.id] || {};

    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        persona: {
          style: config.style || agent.personality?.style,
          gender: config.gender || agent.personality?.gender,
        },
        memory: {
          conversations: agent.conversations.size,
          qaRecords: agent.knowledgeBase.viewerQuestions.length,
          tips: agent.knowledgeBase.tips.length,
          scripts: agent.knowledgeBase.scripts.length,
        },
        description: config.description || '',
      },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ─── 与Agent对话 ───
router.post('/:id/chat', async (req, res) => {
  try {
    const { message, sessionId, roomId } = req.body;
    if (!message) {
      return res.json({ success: false, error: '消息不能为空' });
    }

    const agent = getAgent(req.params.id);
    const reply = await agent.getReply({ message, sessionId, roomId });
    
    res.json({
      success: true,
      data: {
        reply,
        agentId: agent.id,
        agentName: agent.name,
      },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ─── Agent生成直播话术 ───
router.post('/:id/script', async (req, res) => {
  try {
    const { productName, productDesc, topic, roomId } = req.body;
    if (!productName && !topic) {
      return res.json({ success: false, error: '请提供产品名称或话题' });
    }

    const agent = getAgent(req.params.id);
    const script = await agent.generateScript({ productName, productDesc, topic, roomId });
    
    // 自动分段
    const segments = script.split(/[。\n]+/).filter(s => s.trim().length > 3).map(text => ({
      text: text.trim(),
      duration: Math.max(8, Math.min(45, Math.round(text.length * 0.3))),
      agentId: agent.id,
    }));

    res.json({
      success: true,
      data: {
        script,
        segments,
        agentId: agent.id,
        agentName: agent.name,
      },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ─── Agent分析优化 ───
router.post('/:id/optimize', async (req, res) => {
  try {
    const { roomId } = req.body;
    const agent = getAgent(req.params.id);
    const result = await agent.analyzeAndOptimize(roomId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ─── 获取Agent问答历史 ───
router.get('/:id/qa-history', async (req, res) => {
  try {
    const { roomId, limit = 50 } = req.query;
    const agent = getAgent(req.params.id);
    const qaList = await agent.getHistoryQA(roomId || '', parseInt(limit));
    
    res.json({
      success: true,
      data: {
        qaList,
        total: qaList.length,
      },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ─── 保存经验笔记 ───
router.post('/:id/save-tip', async (req, res) => {
  try {
    const { content, tags } = req.body;
    if (!content) {
      return res.json({ success: false, error: '内容不能为空' });
    }

    const agent = getAgent(req.params.id);
    await agent.saveTip(content, tags || []);
    
    res.json({
      success: true,
      data: { message: '笔记已保存' },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ─── 保存问答记录 ───
router.post('/:id/save-qa', async (req, res) => {
  try {
    const { question, answer, roomId } = req.body;
    if (!question || !answer) {
      return res.json({ success: false, error: '问答内容不能为空' });
    }

    const agent = getAgent(req.params.id);
    await agent.saveQA(roomId, question, answer);
    
    res.json({
      success: true,
      data: { message: '问答已保存' },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ─── Agent仪表盘数据 ───
router.get('/:id/dashboard', async (req, res) => {
  try {
    const agent = getAgent(req.params.id);
    const allQA = await agent.getAllQAForOptimization(agent.id, 100);
    
    // 统计
    const totalQA = allQA.length;
    const uniqueRooms = new Set(allQA.map(qa => qa.room_id)).size;
    const totalTips = agent.knowledgeBase.tips.length;

    // 高频问题TOP 5
    const questionMap = new Map();
    allQA.forEach(qa => {
      const key = qa.question.substring(0, 30);
      questionMap.set(key, (questionMap.get(key) || 0) + 1);
    });
    const topQuestions = [...questionMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([q, count]) => ({ question: q, count }));

    res.json({
      success: true,
      data: {
        agentId: agent.id,
        agentName: agent.name,
        stats: {
          totalQA,
          uniqueRooms,
          totalTips,
          conversationsActive: agent.conversations.size,
        },
        topQuestions,
        recentQA: allQA.slice(-10).reverse(),
      },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

export default router;
