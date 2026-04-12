/**
 * 视频脚本模型
 * 存储AI生成的视频脚本
 */

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Script = sequelize.define('Script', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '所属用户ID'
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '产品名称'
  },
  productDesc: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '产品描述'
  },
  scene: {
    type: DataTypes.ENUM('product', 'lifestyle', 'educational', 'promotional'),
    defaultValue: 'product',
    comment: '脚本场景类型'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '脚本内容'
  },
  keywords: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '关键词数组'
  },
  hashtags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '标签数组'
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
    comment: '预计时长(秒)'
  },
  usedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '使用次数'
  }
}, {
  tableName: 'scripts',
  timestamps: true
});

export default Script;
