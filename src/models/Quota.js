// 用户额度模型（2026-04-23 更新：AI文案/图片/视频+代理服务）
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Quota = sequelize.define('Quota', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  plan: {
    type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise', 'flagship'),
    defaultValue: 'free'
  },
  // AI 文案（每月重置）
  ai_copy_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '本月已使用AI文案次数'
  },
  // AI 图片（每月重置）
  ai_image_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '本月已使用AI图片次数'
  },
  // AI 视频（每日重置）
  ai_video_used: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '今日已使用AI视频次数'
  },
  // 月度重置日期
  monthly_reset_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '下次月度重置日期'
  },
  // 每日重置日期
  daily_reset_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '下次每日重置日期'
  },
  // 兼容旧字段（映射到 ai_copy_used）
  text_generations: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  image_generations: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  products_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tasks_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'quotas',
  underscored: true,
  indexes: [
    { unique: true, fields: ['user_id'] },
    { fields: ['plan'] }
  ]
});

export default Quota;
