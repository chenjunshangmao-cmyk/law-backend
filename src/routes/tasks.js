/**
 * 自动化任务 API
 * 管理选品、文案生成、发布等自动化任务
 */

import express from 'express';
import { 
  readData, writeData, generateId,
  getTasks, saveTasks, getTasksByUser, getTaskById, createTask, updateTask, deleteTask 
} from '../services/dataStore.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 任务类型
const TASK_TYPES = ['select', 'generate', 'publish', 'full'];
// 任务状态
const TASK_STATUSES = ['pending', 'running', 'completed', 'failed'];

/**
 * GET /api/tasks
 * 获取任务列表
 * 支持过滤：?status=running&type=select
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, type, limit = 50, offset = 0 } = req.query;
    
    let tasks = getTasksByUser(req.userId);
    
    // 应用筛选条件
    if (status && TASK_STATUSES.includes(status)) {
      tasks = tasks.filter(t => t.status === status);
    }
    if (type && TASK_TYPES.includes(type)) {
      tasks = tasks.filter(t => t.type === type);
    }
    
    // 排序：最新的在前
    tasks.sort((a, b) => b.createdAt - a.createdAt);
    
    // 分页
    const total = tasks.length;
    const paginatedTasks = tasks.slice(Number(offset), Number(offset) + Number(limit));
    
    res.json({ 
      success: true, 
      data: paginatedTasks,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
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
    const { type, params } = req.body;
    
    // 验证任务类型
    if (!type || !TASK_TYPES.includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: `无效的任务类型: ${type}，支持的类型: ${TASK_TYPES.join(', ')}` 
      });
    }
    
    const newTask = {
      id: generateId(),
      userId: req.userId,
      type,
      status: 'pending',
      params: params || {},
      result: null,
      logs: [{
        time: Date.now(),
        level: 'info',
        message: '任务已创建，等待执行'
      }],
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      startedAt: null,
      completedAt: null
    };
    
    createTask(newTask);
    
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
    const task = getTaskById(req.params.id);
    
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
    const { status, params } = req.body;
    const task = getTaskById(req.params.id);
    
    if (!task || task.userId !== req.userId) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    
    const updates = { updatedAt: Date.now() };
    
    // 验证状态转换
    if (status && TASK_STATUSES.includes(status)) {
      if (!isValidStatusTransition(task.status, status)) {
        return res.status(400).json({ 
          success: false, 
          error: `无效的状态转换: ${task.status} -> ${status}` 
        });
      }
      
      updates.status = status;
      
      if (status === 'running') {
        updates.startedAt = Date.now();
        addLog(task, 'info', '任务开始执行');
      } else if (status === 'completed' || status === 'failed') {
        updates.completedAt = Date.now();
        addLog(task, status === 'completed' ? 'info' : 'error', 
          status === 'completed' ? '任务已完成' : '任务执行失败');
      }
    }
    
    if (params) {
      updates.params = { ...task.params, ...params };
    }
    
    const updatedTask = updateTask(req.params.id, updates);
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
    const task = getTaskById(req.params.id);
    
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
    
    deleteTask(req.params.id);
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
    const task = getTaskById(req.params.id);
    
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
    const task = getTaskById(req.params.id);
    
    if (!task || task.userId !== req.userId) {
      return res.status(404).json({ success: false, error: '任务不存在' });
    }
    
    if (task.status !== 'running') {
      return res.status(400).json({ 
        success: false, 
        error: '任务不在运行中' 
      });
    }
    
    const updates = {
      status: 'failed',
      completedAt: Date.now(),
      updatedAt: Date.now()
    };
    addLog(task, 'warn', '任务被用户手动停止');
    
    const updatedTask = updateTask(req.params.id, updates);
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
    'pending': ['running', 'failed'],
    'running': ['completed', 'failed'],
    'completed': [],
    'failed': ['pending']
  };
  return validTransitions[from]?.includes(to) || false;
}

/**
 * 添加任务日志
 */
function addLog(task, level, message) {
  if (!task.logs) task.logs = [];
  task.logs.push({
    time: Date.now(),
    level,
    message
  });
}

/**
 * 模拟任务执行
 * 实际应该调用 OpenClaw 或其他服务
 */
async function executeTask(taskId) {
  const task = getTaskById(taskId);
  if (!task) return;
  
  try {
    // 更新状态为运行中
    updateTask(taskId, {
      status: 'running',
      startedAt: Date.now(),
      updatedAt: Date.now()
    });
    addLog(task, 'info', '开始执行任务...');
    
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
    updateTask(taskId, {
      status: 'completed',
      completedAt: Date.now(),
      progress: 100,
      updatedAt: Date.now()
    });
    addLog(task, 'info', '任务执行完成');
    
  } catch (error) {
    console.error('任务执行失败:', error);
    updateTask(taskId, {
      status: 'failed',
      completedAt: Date.now(),
      updatedAt: Date.now()
    });
    addLog(task, 'error', `执行失败: ${error.message}`);
  }
}

async function executeSelectTask(taskId) {
  const task = getTaskById(taskId);
  if (!task) return;
  
  addLog(task, 'info', '开始选品...');
  updateTask(taskId, { progress: 30, updatedAt: Date.now() });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  addLog(task, 'info', '分析产品数据...');
  updateTask(taskId, { progress: 60, updatedAt: Date.now() });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 模拟选品结果
  updateTask(taskId, {
    result: {
      products: [
        { name: '夏季儿童连衣裙', price: 25, source: '1688' },
        { name: '儿童T恤套装', price: 18, source: '1688' }
      ],
      summary: '找到2个潜在商品'
    },
    updatedAt: Date.now()
  });
}

async function executeGenerateTask(taskId) {
  const task = getTaskById(taskId);
  if (!task) return;
  
  addLog(task, 'info', '调用AI生成文案...');
  updateTask(taskId, { progress: 30, updatedAt: Date.now() });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  addLog(task, 'info', '生成标题和描述...');
  updateTask(taskId, { progress: 60, updatedAt: Date.now() });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  updateTask(taskId, {
    result: {
      title: 'Summer Kids Dress - Lightweight Cotton',
      description: 'Perfect for summer days. Made from 100% cotton, soft and comfortable...',
      tags: ['kids', 'summer', 'dress', 'cotton'],
      platform: task.params?.platform || 'tiktok'
    },
    updatedAt: Date.now()
  });
}

async function executePublishTask(taskId) {
  const task = getTaskById(taskId);
  if (!task) return;
  
  addLog(task, 'info', '准备发布数据...');
  updateTask(taskId, { progress: 30, updatedAt: Date.now() });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  addLog(task, 'info', '连接平台API...');
  updateTask(taskId, { progress: 50, updatedAt: Date.now() });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  addLog(task, 'info', '上传商品信息...');
  updateTask(taskId, { progress: 80, updatedAt: Date.now() });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  updateTask(taskId, {
    result: {
      published: true,
      platform: task.params?.platform || 'tiktok',
      productId: 'PRD' + Date.now(),
      url: 'https://tiktok.com/product/' + Date.now()
    },
    updatedAt: Date.now()
  });
}

async function executeFullTask(taskId) {
  // 执行完整流程：选品 -> 生成 -> 发布
  await executeSelectTask(taskId);
  await executeGenerateTask(taskId);
  await executePublishTask(taskId);
  
  const task = getTaskById(taskId);
  if (task && task.result) {
    updateTask(taskId, {
      result: {
        ...task.result,
        fullFlow: true,
        summary: '完整流程执行完成'
      },
      updatedAt: Date.now()
    });
  }
}

export default router;
