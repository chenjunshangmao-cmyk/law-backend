// 平台账号模型 (TikTok, YouTube等)
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Account = sequelize.define('Account', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  platform: {
    type: DataTypes.ENUM('tiktok', 'youtube', 'ozon', 'taobao', 'pdd'),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '账号名称/店铺名'
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '登录用户名'
  },
  credentials: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '加密的凭证信息'
  },
  cookies: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '浏览器cookies'
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '平台特定设置'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'expired', 'error'),
    defaultValue: 'active'
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Cookie过期时间'
  }
}, {
  tableName: 'accounts',
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['platform'] },
    { fields: ['status'] },
    { fields: ['user_id', 'platform'] }
  ]
});

export default Account;
