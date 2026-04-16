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
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: '所属用户ID'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '视频标题'
  },
  script_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '关联的脚本ID'
  },
  video_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '视频URL'
  },
  thumbnail_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '缩略图URL'
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
  product_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: '关联产品ID'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    comment: '视频状态'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '额外元数据'
  }
}, {
  tableName: 'videos',
  underscored: true,
  timestamps: true
});

export default Video;
