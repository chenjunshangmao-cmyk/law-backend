// 自动化任务 API - 数据库版本
import express from 'express';
import { 
  getTasksByUser, 
  getTaskById, 
  createTask, 
  updateTask, 
  deleteTask,
  incrementUsage
} from '../services/dbService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 任务类型
const TASK_TYPES = ['select', 'generate', 'publish', 'full'];
// 任务状态
const TASK_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'];

/**
 * GET /api/tasks
 * 获取任务列表
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type, limit = 50, offset = 0 } = req.query;
    
    const tasks = await getTasksByUser(req.userId, {
      status,
      type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({ 
      success: true, 
      data: tasks,
      pagination: {
        total: tasks.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({ success: false, error: '获取任务列表失败' });
  }
});

/**
 * POST /api/tasks
 * 创建任务
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, params, productId } = req.body;
    
    // 验证任务类型
    if (!type || !TASK_TYPES.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: `无效的任务类型: ${type}，支持的类型: ${TASK_TYPES.join(', ')}` 
      });
    }
    
    const newTask = await createTask({
      userId: req.userId,
      type,
      status: 'pending',
      params: params || {},
      productId: productId || null,
      result: null,
      logs: [{
        time: Date.now(),
        level: 'info',
        message: '任务已创建，等待执行'
      }],
      progress: 0,
      startedAt: null,
      completedAt: null
    });
    
    // 记录任务使用
    await incrementUsage(req.userId, 'task');
    
    // 如果是自动执行类型，立即启动
    if (params && params.autoStart !== false) {
      setImmediate(() => executeTask(newTask.id));
    }
    
    res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({ success: false, error: '创建任务失败' });
  }
});

/**
 * GET /api/tasks/:id
 * 获取任务详情
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await getTaskById(req.params.id);
    
    if (!task || task.userId !== req.userId) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('获取任务详情失败:', error);
    res.status(500).json({ success: false, error: '获取任务详情失败' });
  }
});

/**
 * PUT /api/tasks/:id
 * 更新任务状态
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, params, progress, result, logs } = req.body;
    const task = await getTaskById(req.params.id);
    
    if (!task || task.userId !== req.userId) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    
    const updates = {};
    
    // 验证状态转换
    if (status && TASK_STATUSES.includes(status)) {
      if (!isValidStatusTransition(task.status, status)) {
        return res.status(400).json({ 
          success: false, 
          error: `无效的状态转换: ${task.status} -> ${status}` 
        });
      }
      
      updates.status = status;
      
      if (status === 'running' && !task.startedAt) {
        updates.startedAt = new Date();
      } else if (status === 'completed' || status === 'failed') {
        updates.completedAt = new Date();
      }
    }
    
    if (params) updates.params = { ...task.params, ...params };
    if (progress !== undefined) updates.progress = progress;
    if (result) updates.result = result;
    if (logs) updates.logs = logs;
    
    const updatedTask = await updateTask(req.params.id, updates);
    res.json({ success: true, data: updatedTask });
  } catch (error) {
    console.error('更新任务失败:', error);
    res.status(500).json({ success: false, error: '更新任务失败' });
  }
});

/**
 * DELETE /api/tasks/:id
 * 删除任务
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await getTaskById(req.params.id);
    
    if (!task || task.userId !== req.userId) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    
    // 不允许删除正在运行的任务
    if (task.status === 'running') {
      return res.status(400).json({ 
        success: false, 
        error: '无法删除正在运行的任务，请先停止任务' 
      });
    }
    
    await deleteTask(req.params.id);
    res.json({ success: true, message: '任务已删除' });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({ success: false, error: '删除任务失败' });
  }
});

/**
 * GET /api/tasks/:id/logs
 * 获取任务执行日志
 */
router.get('/:id/logs', authenticateToken, async (req, res) => {
  try {
    const task = await getTaskById(req.params.id);
    
    if (!task || task.userId !== req.userId) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    
    res.json({ 
      success: true, 
      data: {
        taskId: task.id,
        logs: task.logs || []
      }
    });
  } catch (error) {
    console.error('获取任务日志失败:', error);
    res.status(500).json({ success: false, error: '获取任务日志失败' });
  }
});

/**
 * POST /api/tasks/:id/stop
 * 停止正在运行的任务
 */
router.post('/:id/stop', authenticateToken, async (req, res) => {
  try {
    const task = await getTaskById(req.params.id);
    
    if (!task || task.userId !== req.userId) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    
    if (task.status !== 'running') {
      return res.status(400).json({ 
        success: false, 
        error: '任务不在运行中' 
      });
    }
    
    const logs = [...(task.logs || [])];
    logs.push({
      time: Date.now(),
      level: 'warn',
      message: '任务被用户手动停止'
    });
    
    const updatedTask = await updateTask(req.params.id, {
      status: 'cancelled',
      completedAt: new Date(),
      logs
    });
    
    res.json({ success: true, message: '任务已停止', data: updatedTask });
  } catch (error) {
    console.error('停止任务失败:', error);
    res.status(500).json({ success: false, error: '停止任务失败' });
  }
});

/**
 * 验证状态转换是否有效
 */
function isValidStatusTransition(from, to) {
  const validTransitions = {
    'pending': ['running', 'failed', 'cancelled'],
    'running': ['completed', 'failed', 'cancelled'],
    'completed': [],
    'failed': ['pending'],
    'cancelled': ['pending']
  };
  return validTransitions[from]?.includes(to) || false;
}

/**
 * 模拟任务执行
 * 实际应该调用 OpenClaw 或其他服务
 */
async function executeTask(taskId) {
  const task = await getTaskById(taskId);
  if (!task) return;
  
  try {
    // 更新状态为运行中
    await updateTask(taskId, {
      status: 'running',
      startedAt: new Date()
    });
    
    const logs = [...(task.logs || [])];
    logs.push({ time: Date.now(), level: 'info', message: '开始执行任务...' });
    await updateTask(taskId, { logs });
    
    // 根据任务类型执行不同的操作
    switch (task.type) {
      case 'select':
        await executeSelectTask(taskId);
        break;
      case 'generate':
        await executeGenerateTask(taskId);
        break;
      case 'publish':
        await executePublishTask(taskId);
        break;
      case 'full':
        await executeFullTask(taskId);
        break;
    }
    
    // 任务完成
    await updateTask(taskId, {
      status: 'completed',
      completedAt: new Date(),
      progress: 100
    });
    
  } catch (error) {
    console.error('任务执行失败:', error);
    const logs = [...(task.logs || [])];
    logs.push({ time: Date.now(), level: 'error', message: `执行失败: ${error.message}` });
    
    await updateTask(taskId, {
      status: 'failed',
      completedAt: new Date(),
      errorMessage: error.message,
      logs
    });
  }
}

async function executeSelectTask(taskId) {
  const task = await getTaskById(taskId);
  if (!task) return;
  
  const logs = [...(task.logs || [])];
  logs.push({ time: Date.now(), level: 'info', message: '开始选品...' });
  await updateTask(taskId, { logs, progress: 30 });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  logs.push({ time: Date.now(), level: 'info', message: '分析产品数据...' });
  await updateTask(taskId, { logs, progress: 60 });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await updateTask(taskId, {
    result: {
      products: [
        { name: '夏季儿童连衣裙', price: 25, source: '1688' },
        { name: '儿童T恤套装', price: 18, source: '1688' }
      ],
      summary: '找到2个潜在商品'
    },
    logs
  });
}

async function executeGenerateTask(taskId) {
  const task = await getTaskById(taskId);
  if (!task) return;
  
  const logs = [...(task.logs || [])];
  logs.push({ time: Date.now(), level: 'info', message: '调用AI生成文案...' });
  await updateTask(taskId, { logs, progress: 30 });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  logs.push({ time: Date.now(), level: 'info', message: '生成标题和描述...' });
  await updateTask(taskId, { logs, progress: 60 });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await updateTask(taskId, {
    result: {
      title: 'Summer Kids Dress - Lightweight Cotton',
      description: 'Perfect for summer days. Made from 100% cotton, soft and comfortable...',
      tags: ['kids', 'summer', 'dress', 'cotton'],
      platform: task.params?.platform || 'tiktok'
    },
    logs
  });
}

async function executePublishTask(taskId) {
  const task = await getTaskById(taskId);
  if (!task) return;
  
  const logs = [...(task.logs || [])];
  logs.push({ time: Date.now(), level: 'info', message: '准备发布数据...' });
  await updateTask(taskId, { logs, progress: 30 });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  logs.push({ time: Date.now(), level: 'info', message: '连接平台API...' });
  await updateTask(taskId, { logs, progress: 50 });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  logs.push({ time: Date.now(), level: 'info', message: '上传商品信息...' });
  await updateTask(taskId, { logs, progress: 80 });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await updateTask(taskId, {
    result: {
      published: true,
      platform: task.params?.platform || 'tiktok',
      productId: 'PRD' + Date.now(),
      url: 'https://tiktok.com/product/' + Date.now()
    },
    logs
  });
}

async function executeFullTask(taskId) {
  await executeSelectTask(taskId);
  await executeGenerateTask(taskId);
  await executePublishTask(taskId);
  
  const task = await getTaskById(taskId);
  if (task && task.result) {
    await updateTask(taskId, {
      result: {
        ...task.result,
        fullFlow: true,
        summary: '完整流程执行完成'
      }
    });
  }
}

export default router;
