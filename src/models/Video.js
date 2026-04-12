/**
 * 数字人视频模型
 * 存储生成的数字人视频元数据
 */

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Video = sequelize.define('Video', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '视频文件名'
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '视频文件路径'
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
    comment: '视频时长(秒)'
  },
  size: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '文件大小(字节)'
  },
  script: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '视频脚本内容'
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '关联产品名称'
  },
  productDesc: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '产品描述'
  },
  templateId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '视频模板ID'
  },
  avatarStyle: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '数字人形象风格'
  },
  voiceId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '声音ID'
  },
  background: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '背景设置'
  },
  music: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '背景音乐'
  },
  status: {
    type: DataTypes.ENUM('generating', 'completed', 'failed', 'uploaded'),
    defaultValue: 'completed',
    comment: '视频状态'
  },
  uploadStatus: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '上传状态 {youtube: {...}, tiktok: {...}}'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '额外元数据'
  }
}, {
  tableName: 'videos',
  timestamps: true
});

export default Video;
