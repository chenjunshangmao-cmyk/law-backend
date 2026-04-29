/**
 * 发布任务队列 API
 * 
 * 流程：前端创建发布任务 → 任务进队列 → OpenClaw 客服轮询领取 → Playwright 自动执行 → 回调更新状态
 * 
 * 状态流转：
 *   pending → processing → completed / failed
 */
import express from 'express';
import jwt from 'jsonwebtoken';
import { pool, useMemoryMode, memoryStore } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'claw-default-secret-key-for-development-only-32chars';

// 内存模式存储
if (!memoryStore.publishTasks) {
  memoryStore.publishTasks = new Map();
  memoryStore.idCounters = memoryStore.idCounters || {};
  memoryStore.idCounters.publishTasks = 1;
}

// ========== 初始化数据库表 ==========
async function initPublishTasksTable() {
  if (useMemoryMode) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS publish_tasks (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        platform VARCHAR(50) NOT NULL DEFAULT 'xiaohongshu',
        account_id VARCHAR(128),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        
        -- 发布内容（JSON）
        title VARCHAR(255),
        content TEXT,
        tags JSONB DEFAULT '[]',
        images JSONB DEFAULT '[]',
        
        -- 执行结果
        result JSONB,
        error TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        
        -- 客服执行信息
        agent_id VARCHAR(128),
        agent_log TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ publish_tasks 表已就绪');
  } catch (err) {
    console.error('创建 publish_tasks 表失败:', err.message);
  }
}

initPublishTasksTable();

// ========== API: 创建发布任务 ==========
// POST /api/publish-queue/tasks
router.post('/tasks', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { platform, accountId, title, content, tags, images } = req.body;

    if (!title && !content) {
      return res.status(400).json({ success: false, error: '请提供标题或正文' });
    }
    if (!images || images.length === 0) {
      return res.status(400).json({ success: false, error: '请至少提供一张图片' });
    }

    // 图片处理：base64 太大不存数据库，保存为文件存路径
    const imageRefs = [];
    for (let i = 0; i < Math.min(images.length, 9); i++) {
      const img = images[i];
      if (img && img.startsWith('data:')) {
        // base64 → 保存文件 → 存路径引用
        const ref = await saveImageToFile(userId, img, i);
        imageRefs.push(ref);
      } else if (img && (img.startsWith('http') || img.startsWith('/'))) {
        // URL 引用直接存
        imageRefs.push({ type: 'url', value: img });
      }
    }

    if (imageRefs.length === 0) {
      return res.status(400).json({ success: false, error: '没有可用的图片' });
    }

    const taskData = {
      user_id: String(userId),
      platform: platform || 'xiaohongshu',
      account_id: accountId || null,
      status: 'pending',
      title: title || '',
      content: content || '',
      tags: JSON.stringify(tags || []),
      images: JSON.stringify(imageRefs),
    };

    let task;
    if (useMemoryMode) {
      const id = memoryStore.idCounters.publishTasks++;
      task = { id, ...taskData, created_at: new Date(), updated_at: new Date() };
      memoryStore.publishTasks.set(id, task);
    } else {
      const result = await pool.query(
        `INSERT INTO publish_tasks (user_id, platform, account_id, status, title, content, tags, images)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [taskData.user_id, taskData.platform, taskData.account_id, taskData.status,
         taskData.title, taskData.content, taskData.tags, taskData.images]
      );
      task = result.rows[0];
    }

    console.log(`[发布队列] 新任务 #${task.id}: ${platform} "${title?.substring(0, 20)}..." by user:${userId}`);

    res.json({
      success: true,
      data: {
        taskId: task.id,
        status: task.status,
        message: '发布任务已创建，客服将自动执行发布',
      },
    });
  } catch (error) {
    console.error('[发布队列] 创建任务失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== API: 查询任务状态 ==========
// GET /api/publish-queue/tasks/:id
router.get('/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?.userId);
    const taskId = req.params.id;

    let task;
    if (useMemoryMode) {
      task = memoryStore.publishTasks.get(Number(taskId));
    } else {
      const result = await pool.query('SELECT * FROM publish_tasks WHERE id = $1', [taskId]);
      task = result.rows[0];
    }

    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    if (task.user_id !== userId) {
      return res.status(403).json({ success: false, error: '无权查看此任务' });
    }

    // 不返回图片原始数据（太大），只返回引用信息
    const safeTask = { ...task };
    if (typeof safeTask.images === 'string') {
      try { safeTask.images = JSON.parse(safeTask.images); } catch {}
    }
    if (typeof safeTask.tags === 'string') {
      try { safeTask.tags = JSON.parse(safeTask.tags); } catch {}
    }

    res.json({ success: true, data: safeTask });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== API: 查询用户所有任务 ==========
// GET /api/publish-queue/tasks
router.get('/tasks', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?.userId);
    const platform = req.query.platform;
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    let tasks;
    if (useMemoryMode) {
      tasks = Array.from(memoryStore.publishTasks.values())
        .filter(t => t.user_id === userId && (!platform || t.platform === platform))
        .sort((a, b) => b.id - a.id)
        .slice(0, limit);
    } else {
      const query = platform
        ? 'SELECT * FROM publish_tasks WHERE user_id = $1 AND platform = $2 ORDER BY id DESC LIMIT $3'
        : 'SELECT * FROM publish_tasks WHERE user_id = $1 ORDER BY id DESC LIMIT $2';
      const params = platform ? [userId, platform, limit] : [userId, limit];
      const result = await pool.query(query, params);
      tasks = result.rows;
    }

    // 精简返回（不含图片原始数据）
    const safeTasks = tasks.map(t => {
      const safe = { ...t };
      if (typeof safe.images === 'string') {
        try { safe.images = JSON.parse(safe.images); } catch {}
      }
      if (typeof safe.tags === 'string') {
        try { safe.tags = JSON.parse(safe.tags); } catch {}
      }
      return safe;
    });

    res.json({ success: true, data: safeTasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== API: 客服领取待执行任务（OpenClaw 调用） ==========
// POST /api/publish-queue/claim
// 需要 agent token 验证
router.post('/claim', async (req, res) => {
  try {
    const { agentId, agentToken } = req.body;

    // 简单验证 agent 身份
    const validToken = process.env.AGENT_TOKEN || 'claw-agent-2026';
    if (agentToken !== validToken) {
      return res.status(401).json({ success: false, error: 'Agent 认证失败' });
    }

    // 查找最早的 pending 任务
    let task;
    if (useMemoryMode) {
      task = Array.from(memoryStore.publishTasks.values())
        .filter(t => t.status === 'pending')
        .sort((a, b) => a.id - b.id)[0];
    } else {
      const result = await pool.query(
        `UPDATE publish_tasks 
         SET status = 'processing', agent_id = $1, started_at = NOW(), updated_at = NOW()
         WHERE id = (
           SELECT id FROM publish_tasks 
           WHERE status = 'pending' 
           ORDER BY id ASC LIMIT 1
         )
         RETURNING *`,
        [agentId || 'openclaw']
      );
      task = result.rows[0];
    }

    // 内存模式需手动更新状态
    if (useMemoryMode && task) {
      task.status = 'processing';
      task.agent_id = agentId || 'openclaw';
      task.started_at = new Date();
      task.updated_at = new Date();
    }

    if (!task) {
      return res.json({ success: true, data: null, message: '当前无待执行任务' });
    }

    // 读取图片文件内容，返回完整 base64
    let imagesWithData = [];
    if (typeof task.images === 'string') {
      try { imagesWithData = JSON.parse(task.images); } catch { imagesWithData = []; }
    } else {
      imagesWithData = task.images || [];
    }

    // 对于文件引用的图片，读取回 base64
    for (let i = 0; i < imagesWithData.length; i++) {
      const img = imagesWithData[i];
      if (img.type === 'file' && img.filePath) {
        try {
          const fs = await import('fs');
          const fileBuffer = fs.readFileSync(img.filePath);
          const base64 = fileBuffer.toString('base64');
          imagesWithData[i] = {
            ...img,
            base64: `data:${img.mimeType || 'image/jpeg'};base64,${base64}`,
          };
        } catch (e) {
          console.error(`[发布队列] 读取图片文件失败: ${img.filePath}`, e.message);
          imagesWithData[i] = { ...img, error: '文件读取失败' };
        }
      }
    }

    let tags = task.tags;
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch { tags = []; }
    }

    console.log(`[发布队列] 客服 ${agentId} 领取任务 #${task.id}: ${task.platform} "${task.title?.substring(0, 20)}..."`);

    res.json({
      success: true,
      data: {
        taskId: task.id,
        platform: task.platform,
        accountId: task.account_id,
        title: task.title,
        content: task.content,
        tags,
        images: imagesWithData,
      },
    });
  } catch (error) {
    console.error('[发布队列] 领取任务失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== API: 客服回报任务结果 ==========
// POST /api/publish-queue/report
router.post('/report', async (req, res) => {
  try {
    const { agentId, agentToken, taskId, status, result, error, agentLog } = req.body;

    const validToken = process.env.AGENT_TOKEN || 'claw-agent-2026';
    if (agentToken !== validToken) {
      return res.status(401).json({ success: false, error: 'Agent 认证失败' });
    }

    if (!taskId) {
      return res.status(400).json({ success: false, error: '缺少 taskId' });
    }

    const finalStatus = status === 'completed' ? 'completed' : 'failed';

    if (useMemoryMode) {
      const task = memoryStore.publishTasks.get(Number(taskId));
      if (task) {
        task.status = finalStatus;
        task.result = result || null;
        task.error = error || null;
        task.agent_log = agentLog || null;
        task.completed_at = new Date();
        task.updated_at = new Date();
      }
    } else {
      await pool.query(
        `UPDATE publish_tasks 
         SET status = $1, result = $2, error = $3, agent_log = $4, completed_at = NOW(), updated_at = NOW()
         WHERE id = $5`,
        [finalStatus, JSON.stringify(result || {}), error || null, agentLog || null, taskId]
      );
    }

    console.log(`[发布队列] 任务 #${taskId} 结果: ${finalStatus}${error ? ' - ' + error.substring(0, 50) : ''}`);

    res.json({ success: true, message: `任务 #${taskId} 已更新为 ${finalStatus}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========== 实时监控：SSE + 进度推送 ==========

// 内存中的进度事件缓存（key: taskId, value: 事件数组）
if (!memoryStore.publishProgress) {
  memoryStore.publishProgress = new Map();
}

// SSE 客户端连接池（key: taskId, value: Set<res>）
if (!memoryStore.sseClients) {
  memoryStore.sseClients = new Map();
}

// 向所有监听某个任务的 SSE 客户端广播事件
function broadcastProgress(taskId, event) {
  const clients = memoryStore.sseClients.get(String(taskId));
  if (clients) {
    const data = JSON.stringify(event);
    for (const res of clients) {
      try {
        res.write(`data: ${data}\n\n`);
      } catch (e) {
        clients.delete(res);
      }
    }
  }
}

// ========== API: 前端 SSE 监听任务进度 ==========
// GET /api/publish-queue/tasks/:id/stream?token=xxx
// 注意：SSE 不支持自定义 header，使用 query param 传递 token
router.get('/tasks/:id/stream', async (req, res) => {
  try {
    // 手动验证 token（支持 query param，因为 EventSource 不支持自定义 header）
    const token = req.query.token || (req.headers.authorization?.split(' ')[1]);
    if (!token) {
      return res.status(401).json({ success: false, error: '未提供认证令牌' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, error: '令牌无效或已过期' });
    }

    const userId = String(decoded.userId || decoded.id);
    const taskId = req.params.id;

    // 验证任务归属
    let task;
    if (useMemoryMode) {
      task = memoryStore.publishTasks.get(Number(taskId));
    } else {
      const result = await pool.query('SELECT id, user_id, status FROM publish_tasks WHERE id = $1', [taskId]);
      task = result.rows[0];
    }

    if (!task || (task.user_id !== userId && String(task.user_id) !== userId)) {
      return res.status(403).json({ success: false, error: '无权查看此任务' });
    }

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Nginx 不缓冲
    });

    // 发送初始连接确认
    res.write(`data: ${JSON.stringify({ type: 'connected', taskId })}\n\n`);

    // 注册客户端
    const taskKey = String(taskId);
    if (!memoryStore.sseClients.has(taskKey)) {
      memoryStore.sseClients.set(taskKey, new Set());
    }
    memoryStore.sseClients.get(taskKey).add(res);

    // 发送历史进度事件（如果有的话）
    const history = memoryStore.publishProgress.get(taskKey) || [];
    for (const evt of history) {
      res.write(`data: ${JSON.stringify(evt)}\n\n`);
    }

    // 心跳保活（每 15 秒）
    const heartbeat = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch (e) {
        clearInterval(heartbeat);
      }
    }, 15000);

    // 客户端断开时清理
    req.on('close', () => {
      clearInterval(heartbeat);
      const clients = memoryStore.sseClients.get(taskKey);
      if (clients) {
        clients.delete(res);
        if (clients.size === 0) {
          memoryStore.sseClients.delete(taskKey);
        }
      }
    });

  } catch (error) {
    console.error('[发布队列] SSE 连接失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== API: 客服推送进度（截图+日志） ==========
// POST /api/publish-queue/progress
router.post('/progress', async (req, res) => {
  try {
    const { agentId, agentToken, taskId, step, stepName, screenshot, log } = req.body;

    const validToken = process.env.AGENT_TOKEN || 'claw-agent-2026';
    if (agentToken !== validToken) {
      return res.status(401).json({ success: false, error: 'Agent 认证失败' });
    }

    if (!taskId) {
      return res.status(400).json({ success: false, error: '缺少 taskId' });
    }

    const event = {
      type: 'progress',
      taskId,
      step: step || 0,
      stepName: stepName || '',
      screenshot: screenshot || null,  // base64 截图
      log: log || '',
      timestamp: new Date().toISOString(),
    };

    // 缓存进度事件（最多保留 100 条）
    const taskKey = String(taskId);
    if (!memoryStore.publishProgress.has(taskKey)) {
      memoryStore.publishProgress.set(taskKey, []);
    }
    const history = memoryStore.publishProgress.get(taskKey);
    history.push(event);
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    // 广播给所有 SSE 客户端
    broadcastProgress(taskId, event);

    console.log(`[发布队列] 任务 #${taskId} 进度: Step ${step} - ${stepName}`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== 辅助函数：保存 base64 图片到文件 ==========
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLISH_IMAGES_DIR = path.join(__dirname, '../../data/publish-images');

// 确保目录存在
if (!fs.existsSync(PUBLISH_IMAGES_DIR)) {
  fs.mkdirSync(PUBLISH_IMAGES_DIR, { recursive: true });
}

async function saveImageToFile(userId, base64Data, index) {
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error('无效的 base64 数据');

  const mimeType = matches[1];
  const ext = mimeType.split('/')[1] || 'jpg';
  const fileName = `${userId}_${Date.now()}_${index}.${ext}`;
  const filePath = path.join(PUBLISH_IMAGES_DIR, fileName);

  const buffer = Buffer.from(matches[2], 'base64');
  fs.writeFileSync(filePath, buffer);

  return {
    type: 'file',
    filePath,
    fileName,
    mimeType,
    size: buffer.length,
  };
}

export default router;
