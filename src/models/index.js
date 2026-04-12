// 模型统一导出和关联定义
import User from './User.js';
import Product from './Product.js';
import Task from './Task.js';
import Account from './Account.js';
import Quota from './Quota.js';
import Video from './Video.js';
import Script from './Script.js';

// 定义关联关系

// User -> Product (一对多)
User.hasMany(Product, { foreignKey: 'userId', as: 'products' });
Product.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Task (一对多)
User.hasMany(Task, { foreignKey: 'userId', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Account (一对多)
User.hasMany(Account, { foreignKey: 'userId', as: 'accounts' });
Account.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Quota (一对一)
User.hasOne(Quota, { foreignKey: 'userId', as: 'quota' });
Quota.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Video (一对多)
User.hasMany(Video, { foreignKey: 'userId', as: 'videos' });
Video.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Script (一对多)
User.hasMany(Script, { foreignKey: 'userId', as: 'scripts' });
Script.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Product -> Task (一对多)
Product.hasMany(Task, { foreignKey: 'productId', as: 'tasks' });
Task.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

export {
  User,
  Product,
  Task,
  Account,
  Quota,
  Video,
  Script
};

export default {
  User,
  Product,
  Task,
  Account,
  Quota,
  Video,
  Script
};
