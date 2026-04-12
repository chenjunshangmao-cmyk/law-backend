// 产品模型
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'SGD'
  },
  sourceUrl: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '1688或其他货源链接'
  },
  category: {
    type: DataTypes.STRING(100),
    defaultValue: 'general'
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '图片URL数组'
  },
  platformData: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: '各平台发布数据 {tiktok: {...}, youtube: {...}}'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  aiGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否AI生成文案'
  },
  generatedContent: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'AI生成的内容 {title, description, tags}'
  }
}, {
  tableName: 'products',
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['category'] },
    { fields: ['userId', 'status'] }
  ]
});

export default Product;
