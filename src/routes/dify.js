// Dify 工作流 Webhook + 触发器 API
import express from 'express';
import { pool, useMemoryMode, memoryStore } from '../config/database.js';

const router = express.Router();

/**
 * POST /api/dify/webhook
 * Dify 工作流完成后的回调
 * Dify 配置此 URL 为工作流的 "End Node Webhook" 或 "Webhook" 节点
 *
 * 请求体示例（Dify 输出）：
 * {
 *   "workflow_id": "xxx",
 *   "task_id": "xxx",
 *   "event": "workflow.completed",
 *   "data": {
 *     "outputs": {
 *       "title": "Nike Air Max 2026",
 *       "description": "...",
 *       "price": 29.99,
 *       "images": ["url1", "url2"],
 *       "score": 85
 *     }
 *   },
 *   "metadata": {
 *     "user_id": "user_001"   // 可选，Dify 侧传来的用户标识
 *   }
 * }
 */
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;
    console.log('[Dify Webhook] 收到请求:', JSON.stringify(body).substring(0, 200));

    // 兼容两种 Dify 回调格式
    const outputs = body.outputs || body.data?.outputs || body;
    const taskId = body.task_id || body.id;
    const userId = body.metadata?.user_id || body.user_id || outputs.user_id;

    if (!outputs) {
      return res.status(400).json({ success: false, error: '无效的 Dify 回调数据' });
    }

    // 构建结构化的商品数据
    const productData = {
      workflow_id: body.workflow_id || body.workflowId,
      dify_task_id: taskId,
      title: outputs.title || outputs.product_title || '',
      description: outputs.description || outputs.product_desc || '',
      price: parseFloat(outputs.price || outputs.product_price || 0),
      currency: outputs.currency || 'USD',
      images: Array.isArray(outputs.images) ? outputs.images
        : outputs.image ? [outputs.image] : [],
      category: outputs.category || outputs.product_category || '',
      tags: Array.isArray(outputs.tags) ? outputs.tags
        : outputs.tag ? [outputs.tag] : [],
      score: parseFloat(outputs.score || outputs.quality_score || 0),
      language: outputs.language || outputs.lang || 'en',
      raw_outputs: outputs,  // 保留原始输出
    };

    // 自动触发规则：分数 >= threshold 时自动发布
    const AUTO_PUBLISH_THRESHOLD = parseInt(process.env.DIFY_AUTO_PUBLISH_THRESHOLD || '80');
    const autoPublish = productData.score >= AUTO_PUBLISH_THRESHOLD;

    // 写入 tasks 表（统一用 config JSONB，与现有 schema 完全兼容）
    const taskConfig = {
      product: productData,
      auto_publish: autoPublish,
      source: 'dify',
      dify_task_id: taskId,
      platform: outputs.platform || 'tiktok',
    };

    if (useMemoryMode) {
      const memTaskId = `dify_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      memoryStore.tasks.set(memTaskId, {
        id: memTaskId,
        user_id: userId,
        type: 'dify_auto',
        status: 'pending',
        config: taskConfig,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log('[Dify Webhook] ✅ 任务存入内存队列，ID:', memTaskId);
    } else {
      await pool.query(`
        INSERT INTO tasks (user_id, type, status, config)
        VALUES ($1, 'dify_auto', 'pending', $2)
      `, [userId || null, JSON.stringify(taskConfig)]);
      console.log('[Dify Webhook] ✅ 任务存入数据库，标题:', productData.title);
    }

    // 如果开启自动发布，触发 OpenClaw 任务（通过 HTTP 调用）
    if (autoPublish && process.env.OPENCLAW_WEBHOOK_URL) {
      try {
        await fetch(process.env.OPENCLAW_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'dify.auto_publish',
            product: productData,
            trigger: 'score_threshold'
          })
        });
        console.log('[Dify Webhook] 🚀 已触发 OpenClaw 自动发布');
      } catch (fetchErr) {
        console.warn('[Dify Webhook] ⚠️ OpenClaw 触发失败（不影响主流程）:', fetchErr.message);
      }
    }

    res.json({
      success: true,
      received: true,
      product_title: productData.title,
      quality_score: productData.score,
      auto_publish_triggered: autoPublish,
      message: autoPublish
        ? `评分 ${productData.score} ≥ ${AUTO_PUBLISH_THRESHOLD}，已触发自动发布`
        : `评分 ${productData.score} < ${AUTO_PUBLISH_THRESHOLD}，已存档待手动确认`
    });
  } catch (error) {
    console.error('[Dify Webhook] ❌ 错误:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/dify/trigger
 * Claw 主动触发 Dify 工作流
 *
 * 请求体：
 * {
 *   "workflow_key": "product_generator",   // Dify 工作流标识
 *   "input": {
 *     "product_url": "https://1688.com/item/xxx",
 *     "target_platform": "tiktok",
 *     "language": "en"
 *   },
 *   "user_id": "user_001"
 * }
 */
router.post('/trigger', async (req, res) => {
  try {
    const { workflow_key, input, user_id } = req.body;

    if (!workflow_key || !input) {
      return res.status(400).json({
        success: false,
        error: '缺少 workflow_key 或 input 参数'
      });
    }

    const DIFy_APP_URL = process.env.DIFY_APP_URL;
    const DIFY_API_KEY = process.env.DIFY_API_KEY;

    if (!DIFy_APP_URL || !DIFY_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Dify 未配置（设置 DIFY_APP_URL 和 DIFY_API_KEY 环境变量）'
      });
    }

    console.log(`[Dify Trigger] 触发工作流: ${workflow_key}`, input);

    const response = await fetch(`${DIFy_APP_URL}/v1/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow_key,
        input: {
          ...input,
          _user_id: user_id,
          _triggered_at: new Date().toISOString()
        }
      })
    });

    const result = await response.json();
    console.log('[Dify Trigger] 响应:', JSON.stringify(result).substring(0, 200));

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: result.error || 'Dify API 调用失败'
      });
    }

    // 记录触发任务到数据库
    const taskId = result.data?.task_id || result.task_id;
      if (taskId && user_id) {
      try {
        const config = {
          workflow_key,
          input,
          dify_task_id: taskId,
          source: 'dify',
          url: input.product_url || null,
        };
        if (useMemoryMode) {
          const id = `dify_trigger_${Date.now()}`;
          memoryStore.tasks.set(id, {
            id,
            user_id,
            type: 'dify_trigger',
            status: 'running',
            config,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          await pool.query(`
            INSERT INTO tasks (user_id, type, status, config)
            VALUES ($1, 'dify_trigger', 'running', $2)
          `, [user_id, JSON.stringify(config)]);
        }
      } catch (dbErr) {
        console.warn('[Dify Trigger] 任务记录失败:', dbErr.message);
      }
    }

    res.json({
      success: true,
      task_id: taskId,
      response: result
    });
  } catch (error) {
    console.error('[Dify Trigger] ❌ 错误:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/dify/tasks
 * 获取 Dify 相关任务列表
 */
router.get('/tasks', async (req, res) => {
  try {
    const { user_id, status, limit = 50 } = req.query;

    if (useMemoryMode) {
      const all = Array.from(memoryStore.tasks.values())
        .filter(t => t.source === 'dify')
        .filter(t => !user_id || t.user_id === user_id)
        .filter(t => !status || t.status === status)
        .slice(-parseInt(limit));
      return res.json({ success: true, data: all.reverse() });
    }

    let query = `SELECT * FROM tasks WHERE source = 'dify'`;
    const params = [];
    let idx = 1;
    if (user_id) { query += ` AND user_id = $${idx++}`; params.push(user_id); }
    if (status) { query += ` AND status = $${idx++}`; params.push(status); }
    query += ` ORDER BY created_at DESC LIMIT $${idx} `;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[Dify Tasks] ❌ 错误:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
