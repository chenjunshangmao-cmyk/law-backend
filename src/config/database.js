// 数据库配置 - PostgreSQL (Render)
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// 从环境变量或 .env 获取数据库 URL
const databaseUrl = process.env.DATABASE_URL || 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db';

// 创建 Sequelize 实例
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,  // 使用下划线命名 (createdAt -> created_at)
    freezeTableName: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// 测试数据库连接
export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
};

// 同步数据库模型
export const syncDatabase = async (force = false) => {
  try {
    // 使用 alter: false 避免 PostgreSQL 兼容问题
    // 只创建不存在的表，不修改现有表结构
    await sequelize.sync({ force, alter: false });
    console.log('✅ 数据库同步成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库同步失败:', error.message);
    // 同步失败不阻止服务启动
    console.log('⚠️  继续启动服务（可能使用内存模式）...');
    return true;
  }
};

// 命名导出 sequelize
export { sequelize };
export default sequelize;
