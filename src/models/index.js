// 模型统一导出和关联定义
import User from './User.js';
import Product from './Product.js';
import Task from './Task.js';
import Account from './Account.js';
import Quota from './Quota.js';
import Video from './Video.js';
import Script from './Script.js';

// 定义关联关系 (使用 user_id)

export const setupAssociations = () => {
  // User -> Product (一对多)
  User.hasMany(Product, { foreignKey: 'user_id', as: 'products' });
  Product.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // User -> Task (一对多)
  User.hasMany(Task, { foreignKey: 'user_id', as: 'tasks' });
  Task.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // User -> Account (一对多)
  User.hasMany(Account, { foreignKey: 'user_id', as: 'accounts' });
  Account.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // User -> Quota (一对一)
  User.hasOne(Quota, { foreignKey: 'user_id', as: 'quota' });
  Quota.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // User -> Video (一对多)
  User.hasMany(Video, { foreignKey: 'user_id', as: 'videos' });
  Video.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // User -> Script (一对多)
  User.hasMany(Script, { foreignKey: 'user_id', as: 'scripts' });
  Script.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Product -> Task (一对多)
  Product.hasMany(Task, { foreignKey: 'product_id', as: 'tasks' });
  Task.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // Product -> Video (一对多)
  Product.hasMany(Video, { foreignKey: 'product_id', as: 'videos' });
  Video.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // Product -> Script (一对多)
  Product.hasMany(Script, { foreignKey: 'product_id', as: 'scripts' });
  Script.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

  // Script -> Video (一对多)
  Script.hasMany(Video, { foreignKey: 'script_id', as: 'videos' });
  Video.belongsTo(Script, { foreignKey: 'script_id', as: 'script' });
};

// 初始化关联
setupAssociations();

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
