// 自动化任务模型
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('select', 'generate', 'publish', 'full'),
    allowNull: false,
    comment: 'select: 选品, generate: 生成文案, publish: 发布, full: 完整流程'
  },
  status: {
    type: DataTypes.ENUM('pending', 'running', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending'
  },
  params: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '任务参数'
  },
  result: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '执行结果'
  },
  logs: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '执行日志数组'
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '关联的产品ID'
  }
}, {
  tableName: 'tasks',
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['type'] },
    { fields: ['userId', 'status'] },
    { fields: ['productId'] }
  ]
});

export default Task;
