// 用户额度模型
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
    type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise'),
    defaultValue: 'free'
  },
  text_generations: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已使用次数'
  },
  text_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    comment: '月度上限'
  },
  image_generations: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  image_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  },
  products_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  products_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '当前产品数量'
  },
  tasks_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  tasks_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  reset_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '下次重置日期'
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
