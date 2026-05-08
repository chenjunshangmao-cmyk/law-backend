/**
 * token-stats.js — AI Token用量统计API
 * 
 * GET /api/ai/usage-stats?days=7&source=xxx   — 用量统计
 * GET /api/ai/cost-summary?days=7              — 花费汇总
 * GET /api/ai/track-test                       — 手动触发一次测试写入
 */

import express from 'express';
import { getUsageStats, getCostSummary, trackUsage } from '../services/ai/TokenTracker.js';

const router = express.Router();

/**
 * GET /api/ai/usage-stats
 * 获取用量统计（按日期、模型、模块）
 */
router.get('/usage-stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const source = req.query.source || null;
    
    const stats = await getUsageStats({ days, source });
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/ai/cost-summary
 * 获取花费汇总
 */
router.get('/cost-summary', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const summary = await getCostSummary(days);
    
    res.json({
      success: true,
      data: summary,
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/ai/track-test
 * 写入一条测试数据
 */
router.get('/track-test', async (req, res) => {
  try {
    await trackUsage('customerService', 'qwen3.5-plus', 850, 320);
    await trackUsage('ozonPublish', 'qwen-plus', 1800, 650);
    await trackUsage('generate', 'qwen-plus', 2300, 1100);
    await trackUsage('xiaohongshu', 'qwen-plus', 2000, 800);
    await trackUsage('agent-ai', 'qwen-turbo', 400, 200);
    await trackUsage('live-stream', 'qwen-plus', 1500, 600);
    await trackUsage('customerService', 'deepseek-chat', 500, 300);
    
    const summary = await getCostSummary(1);
    res.json({
      success: true,
      message: '✅ 测试数据已写入（内存模式），以下为模拟统计',
      data: summary,
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

export default router;
