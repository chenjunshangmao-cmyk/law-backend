// Claw外贸网站后端API - 主入口 (数据库版本)
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// 数据库配置
import { testConnection, syncDatabase } from './config/database.js';

// 路由 (数据库版本)
import authRoutes from './routes/auth.db.js';
import productRoutes from './routes/products.db.js';
import generateRoutes from './routes/generate.js';
import calculateRoutes from './routes/calculate.js';
import accountsRoutes from './routes/accounts.db.js';
import tasksRoutes from './routes/tasks.db.js';
import membershipRoutes from './routes/membership.db.js';
import browserRoutes from './routes/browser.js';
import avatarRoutes from './routes/avatar.db.js';

const app = express();
const PORT = process.env.PORT || 8089;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 初始化数据库
const initDatabase = async () => {
  console.log('🔄 正在初始化数据库...');
  
  // 测试连接
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ 数据库连接失败，服务无法启动');
    process.exit(1);
  }
  
  // 同步模型
  const synced = await syncDatabase();
  if (!synced) {
    console.error('❌ 数据库同步失败，服务无法启动');
    process.exit(1);
  }
  
  console.log('✅ 数据库初始化完成');
};

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'claw-backend',
    version: '1.0.0',
    database: 'sqlite',
    timestamp: new Date().toISOString()
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/calculate', calculateRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/quota', membershipRoutes);
app.use('/api/browser', browserRoutes);
app.use('/api/avatar', avatarRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API端点不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// 启动服务器
const startServer = async () => {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║           Claw外贸网站后端API 已启动                   ║
║              (数据库版本 - SQLite)                     ║
╠═══════════════════════════════════════════════════════╣
║  端口: ${PORT}                                          ║
║  状态: http://localhost:${PORT}/health                   ║
╠═══════════════════════════════════════════════════════╣
║  API端点:                                            ║
║  [认证]                                              ║
║  ├─ POST   /api/auth/register    - 用户注册          ║
║  ├─ POST   /api/auth/login       - 用户登录           ║
║  ├─ GET    /api/auth/profile     - 获取用户信息       ║
║  └─ GET    /api/auth/quota       - 获取用户额度       ║
║  [产品]                                              ║
║  ├─ GET    /api/products         - 获取产品列表       ║
║  ├─ POST   /api/products         - 创建产品           ║
║  ├─ PUT    /api/products/:id     - 更新产品           ║
║  └─ DELETE /api/products/:id    - 删除产品           ║
║  [AI生成]                                            ║
║  ├─ POST   /api/generate/text   - 生成文案           ║
║  └─ POST   /api/generate/image  - 生成图片描述       ║
║  [利润计算]                                          ║
║  ├─ POST   /api/calculate/profit - 计算利润          ║
║  └─ POST   /api/calculate/quick  - 快速定价          ║
║  [账号管理]                                          ║
║  ├─ GET    /api/accounts        - 获取账号列表       ║
║  ├─ POST   /api/accounts         - 添加账号           ║
║  ├─ PUT    /api/accounts/:id     - 更新账号           ║
║  ├─ DELETE /api/accounts/:id    - 删除账号           ║
║  └─ POST   /api/accounts/:id/test - 测试连接         ║
║  [任务管理]                                          ║
║  ├─ GET    /api/tasks           - 获取任务列表       ║
║  ├─ POST   /api/tasks            - 创建任务           ║
║  ├─ PUT    /api/tasks/:id        - 更新任务状态       ║
║  ├─ DELETE /api/tasks/:id       - 删除任务           ║
║  └─ GET    /api/tasks/:id/logs  - 获取执行日志       ║
    ║  [会员管理]                                          ║
    ║  ├─ GET    /api/membership      - 获取会员信息       ║
    ║  ├─ GET    /api/membership/plans - 获取套餐列表       ║
    ║  ├─ GET    /api/quota            - 获取额度详情       ║
    ║  ├─ POST   /api/quota/consume   - 消费额度           ║
    ║  └─ POST   /api/quota/release   - 释放额度           ║
    ║  [数字人视频]                                        ║
    ║  ├─ POST   /api/avatar/generate      - 生成视频       ║
    ║  ├─ POST   /api/avatar/generate-script - 生成脚本     ║
    ║  ├─ GET    /api/avatar/list          - 视频列表       ║
    ║  ├─ GET    /api/avatar/:id          - 视频详情       ║
    ║  ├─ DELETE /api/avatar/:id         - 删除视频       ║
    ║  ├─ GET    /api/avatar/scripts/list - 脚本列表       ║
    ║  └─ POST   /api/avatar/upload      - 上传视频       ║
    ╚═══════════════════════════════════════════════════════╝
    `);
  });
};

startServer();

export default app;
