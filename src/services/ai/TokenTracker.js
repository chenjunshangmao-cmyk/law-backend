/**
 * TokenTracker.js — AI Token用量统计
 * 
 * 监控全站所有百炼/DeepSeek调用的token消耗
 * 按日期、模型、模块分类统计
 * 
 * 用法：
 *   在任何调百炼的地方：
 *   const { trackUsage } = await import('../services/ai/TokenTracker.js');
 *   await trackUsage('generate', 'qwen-plus', promptTokens, completionTokens);
 *   
 * 查看：
 *   GET /api/ai/usage-stats?days=7
 */

import fs from 'fs';
import path from 'path';
import { pool, useMemoryMode } from '../../config/database.js';

// ─── 模型 token 单价（元/百万token） ───
const MODEL_PRICES = {
  // 百炼千问
  'qwen-turbo': { input: 0.2, output: 0.2 },       // ¥0.2/百万tokens
  'qwen-plus': { input: 2.0, output: 2.0 },         // ¥2/百万tokens  
  'qwen-max': { input: 20.0, output: 20.0 },        // ¥20/百万tokens
  'qwen3-plus': { input: 2.0, output: 2.0 },        // ¥2/百万tokens
  'qwen3.5-plus': { input: 2.0, output: 2.0 },      // ¥2/百万tokens
  'qwen3-vl-plus': { input: 6.0, output: 6.0 },     // ¥6/百万tokens（视觉模型贵）
  // DeepSeek
  'deepseek-chat': { input: 0.5, output: 2.0 },     // ¥0.5入/¥2出
  // 其他
  'default': { input: 2.0, output: 2.0 },           // 默认按qwen-plus算
};

// 文件名及对应模块名
const MODULE_NAMES = {
  'generate': '文案生成',
  'index': 'AI图片生成',
  'ozonPublish': 'OZON发布翻译',
  'tiktokPublish': 'TikTok发布翻译',
  'xiaohongshu': '小红书图文',
  'agent-ai': '4子AI系统',
  'customerService': 'AI客服引擎',
  'live-stream': 'AI直播脚本',
  'dify': 'Dify工作流',
};

// ─── 内存缓存（每次请求写入+定期落盘） ───
const DAILY_STATS = new Map(); // key: YYYY-MM-DD_model_module

/**
 * 记录一次AI调用
 */
export async function trackUsage(source, model, promptTokens, completionTokens, extra = {}) {
  const date = new Date().toISOString().slice(0, 10);
  const key = `${date}_${model}_${source}`;
  
  const totalTokens = (promptTokens || 0) + (completionTokens || 0);
  const prices = MODEL_PRICES[model] || MODEL_PRICES.default;
  const cost = ((promptTokens || 0) * prices.input + (completionTokens || 0) * prices.output) / 1000000;

  // 内存累计
  if (!DAILY_STATS.has(key)) {
    DAILY_STATS.set(key, {
      date,
      model,
      source,
      moduleName: MODULE_NAMES[source] || source,
      calls: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cost: 0,
      errorCount: 0,
    });
  }
  
  const stat = DAILY_STATS.get(key);
  stat.calls++;
  stat.promptTokens += promptTokens || 0;
  stat.completionTokens += completionTokens || 0;
  stat.totalTokens += totalTokens;
  stat.cost += cost;

  // 异步写入数据库
  if (!useMemoryMode) {
    try {
      await pool.query(`
        INSERT INTO ai_token_usage (date, source, model, prompt_tokens, completion_tokens, total_tokens, cost, calls)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
        ON CONFLICT (date, source, model)
        DO UPDATE SET 
          prompt_tokens = ai_token_usage.prompt_tokens + $4,
          completion_tokens = ai_token_usage.completion_tokens + $5,
          total_tokens = ai_token_usage.total_tokens + $6,
          cost = ai_token_usage.cost + $7,
          calls = ai_token_usage.calls + 1
      `, [date, source, model, promptTokens || 0, completionTokens || 0, totalTokens, cost]);
    } catch (e) {
      // 表不存在时静默
    }
  }

  return { totalTokens, cost };
}

/**
 * 获取用量统计
 */
export async function getUsageStats(options = {}) {
  const days = options.days || 7;
  const source = options.source || null;

  // 先从数据库获取
  let dbStats = [];
  if (!useMemoryMode) {
    try {
      const startDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      let query = `
        SELECT date, source, model, 
               SUM(calls) as calls,
               SUM(prompt_tokens) as prompt_tokens,
               SUM(completion_tokens) as completion_tokens,
               SUM(total_tokens) as total_tokens,
               SUM(cost) as cost
        FROM ai_token_usage 
        WHERE date >= $1
      `;
      const params = [startDate];
      
      if (source) {
        query += ' AND source = $2';
        params.push(source);
      }
      
      query += ' GROUP BY date, source, model ORDER BY date DESC';
      
      const result = await pool.query(query, params);
      dbStats = result.rows;
    } catch (e) {
      // 表不存在
    }
  }

  // 内存中的统计数据
  const memoryStats = [...DAILY_STATS.values()]
    .filter(s => {
      const daysAgo = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
      return s.date >= daysAgo && (!source || s.source === source);
    });

  return { dbStats, memoryStats };
}

/**
 * 获取总花费汇总
 */
export async function getCostSummary(days = 7) {
  const { dbStats, memoryStats } = await getUsageStats({ days });
  
  // 合并统计
  const merged = new Map();
  
  [...dbStats, ...memoryStats].forEach(stat => {
    const key = `${stat.date}_${stat.model}_${stat.source}`;
    if (!merged.has(key)) {
      merged.set(key, { ...stat });
    } else {
      const existing = merged.get(key);
      existing.calls = (parseInt(existing.calls) || 0) + (parseInt(stat.calls) || 0);
      existing.total_tokens = (parseInt(existing.total_tokens) || 0) + (parseInt(stat.total_tokens) || 0);
      existing.cost = (parseFloat(existing.cost) || 0) + (parseFloat(stat.cost) || 0);
    }
  });

  const stats = [...merged.values()];
  
  const totalCost = stats.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);
  const totalTokens = stats.reduce((sum, s) => sum + parseInt(s.total_tokens || 0), 0);
  
  // 按日期汇总
  const byDate = new Map();
  stats.forEach(s => {
    const d = s.date;
    if (!byDate.has(d)) byDate.set(d, { date: d, cost: 0, tokens: 0, calls: 0 });
    const day = byDate.get(d);
    day.cost += parseFloat(s.cost || 0);
    day.tokens += parseInt(s.total_tokens || 0);
    day.calls += parseInt(s.calls || 0);
  });

  // 按模块汇总
  const bySource = new Map();
  stats.forEach(s => {
    const key = MODULE_NAMES[s.source] || s.source;
    if (!bySource.has(key)) bySource.set(key, { source: key, cost: 0, tokens: 0, calls: 0 });
    const src = bySource.get(key);
    src.cost += parseFloat(s.cost || 0);
    src.tokens += parseInt(s.total_tokens || 0);
    src.calls += parseInt(s.calls || 0);
  });

  return {
    totalCost: Math.round(totalCost * 10000) / 10000,
    totalTokens,
    totalCalls: stats.reduce((sum, s) => sum + parseInt(s.calls || 0), 0),
    byDate: [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date)),
    bySource: [...bySource.values()].sort((a, b) => b.cost - a.cost),
    details: stats,
  };
}

/**
 * 初始化数据库表
 */
export async function initTokenTracker() {
  if (useMemoryMode) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_token_usage (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        source VARCHAR(64) NOT NULL,
        model VARCHAR(64) NOT NULL,
        calls INTEGER DEFAULT 0,
        prompt_tokens BIGINT DEFAULT 0,
        completion_tokens BIGINT DEFAULT 0,
        total_tokens BIGINT DEFAULT 0,
        cost DECIMAL(12, 6) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, source, model)
      )
    `);
    console.log('[TokenTracker] ✅ 用量统计表初始化完成');
  } catch (e) {
    console.warn('[TokenTracker] ⚠️ 表创建失败:', e.message);
  }
}
