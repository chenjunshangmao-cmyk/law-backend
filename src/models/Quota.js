// 用户额度模型
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Quota = sequelize.define('Quota', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  plan: {
    type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise'),
    defaultValue: 'free'
  },
  // 文案生成额度
  textGenerations: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已使用次数'
  },
  textLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    comment: '月度上限'
  },
  // 图片生成额度
  imageGenerations: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  imageLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  // 产品数量限制
  productsLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  productsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '当前产品数量'
  },
  // 任务执行额度
  tasksLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  tasksCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // 额度重置日期
  resetDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '下次重置日期'
  }
}, {
  tableName: 'quotas',
  indexes: [
    { unique: true, fields: ['userId'] },
    { fields: ['plan'] }
  ]
});

export default Quota;
