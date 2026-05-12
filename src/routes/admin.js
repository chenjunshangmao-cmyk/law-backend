import express from 'express';
const router = express.Router();
import { authMiddleware as auth } from '../middleware/auth.js';

// 数据库备份端点
router.post('/backup', auth, async (req, res) => {
  try {
    // 检查是否是管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '需要管理员权限'
      });
    }

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    };

    // 尝试备份用户数据
    try {
      const User = (await import('../models/User.js')).default;
      const users = await User.find({}).select('-password');
      backupData.data.users = users;
    } catch (e) {
      backupData.data.users = { error: '用户表不存在或无法访问', details: e.message };
    }

    // 尝试备份产品数据
    try {
      const Product = (await import('../models/Product.js')).default;
      const products = await Product.find({});
      backupData.data.products = products;
    } catch (e) {
      backupData.data.products = { error: '产品表不存在或无法访问', details: e.message };
    }

    // 尝试备份订单数据
    try {
      const Order = (await import('../models/Order.js')).default;
      const orders = await Order.find({});
      backupData.data.orders = orders;
    } catch (e) {
      backupData.data.orders = { error: '订单表不存在或无法访问', details: e.message };
    }

    // 尝试备份账号数据
    try {
      const Account = (await import('../models/Account.js')).default;
      const accounts = await Account.find({});
      backupData.data.accounts = accounts;
    } catch (e) {
      backupData.data.accounts = { error: '账号表不存在或无法访问', details: e.message };
    }

    // 尝试备份任务数据
    try {
      const Task = (await import('../models/Task.js')).default;
      const tasks = await Task.find({});
      backupData.data.tasks = tasks;
    } catch (e) {
      backupData.data.tasks = { error: '任务表不存在或无法访问', details: e.message };
    }

    // 添加备份元数据
    backupData.metadata = {
      backupTime: new Date().toISOString(),
      backupType: 'full',
      environment: process.env.NODE_ENV || 'development',
      recordCounts: {
        users: backupData.data.users?.length || 0,
        products: backupData.data.products?.length || 0,
        orders: backupData.data.orders?.length || 0,
        accounts: backupData.data.accounts?.length || 0,
        tasks: backupData.data.tasks?.length || 0
      }
    };

    res.json({
      success: true,
      message: '备份完成',
      data: backupData
    });

  } catch (error) {
    console.error('备份失败:', error);
    res.status(500).json({
      success: false,
      error: '备份失败: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 获取备份状态
router.get('/backup/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: '需要管理员权限'
      });
    }

    res.json({
      success: true,
      data: {
        lastBackup: null,
        backupEnabled: true,
        scheduledBackups: [
          { frequency: 'daily', time: '03:00', enabled: true }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
