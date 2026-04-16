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
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '所属用户ID'
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '关联产品ID'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '脚本标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '脚本内容'
  },
  type: {
    type: DataTypes.STRING(50),
    defaultValue: 'product',
    comment: '脚本类型'
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
  used_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '使用次数'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '额外元数据'
  }
}, {
  tableName: 'scripts',
  underscored: true,
  timestamps: true
});

export default Script;
