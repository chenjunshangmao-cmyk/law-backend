// Claw外贸网站后端API - 完整版（PostgreSQL + 全部功能）
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// 数据库配置
import { testConnection, syncDatabase, sequelize } from './config/database.js';

// 中间件
import { requestLogger, securityHeaders, errorHandler, notFoundHandler, healthCheck } from './middleware/errorHandler.js';
import { rateLimitMiddleware } from './middleware/auth.js';

// 路由
import authRoutes from './routes/auth.min.js';
import productRoutes from './routes/products.db.js';
import generateRoutes from './routes/generate.js';
import calculateRoutes from './routes/calculate.js';
import accountsRoutes from './routes/accounts.db.js';
import tasksRoutes from './routes/tasks.db.js';
import membershipRoutes from './routes/membership.db.js';
import browserRoutes from './routes/browser.js';
import avatarRoutes from './routes/avatar.db.js';
import publishRoutes from './routes/publish.js';
import customerServiceRoutes from './routes/customerService.js';
import paymentRoutes from './routes/payment.db.js';

const app = express();
const PORT = process.env.PORT || 9000;

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS配置
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS拒绝: ${origin}`);
      callback(new Error('不允许的源'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
}));

// 请求解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 安全头
app.use(securityHeaders);

// 请求日志
app.use(requestLogger);

// 根路径健康检查
app.get('/', healthCheck);

// 详细健康检查
app.get('/api/health', healthCheck);

// 全局速率限制
app.use(rateLimitMiddleware());

// 初始化数据库
const initDatabase = async () => {
  console.log('正在初始化数据库...');
  
  const connected = await testConnection();
  if (!connected) {
    console.error('数据库连接失败，使用内存模式运行');
    // 不退出，让服务继续运行
    return false;
  }
  
  // 同步数据库模型（不强制修改表结构，避免PostgreSQL兼容问题）
  try {
    await syncDatabase(false);
    console.log('✅ 数据库同步成功');
  } catch (error) {
    console.error('⚠️ 数据库同步失败:', error.message);
    console.log('继续启动服务...');
  }
  
  // 自动激活收钱吧终端
  try {
    const { ShouqianbaService } = await import('./services/shouqianba.js');
    const sqbService = new ShouqianbaService();
    const result = await sqbService.activateTerminal('Claw-001', 'Claw主终端');
    if (result.success) {
      console.log('✅ 收钱吧终端激活成功:', result.terminal.terminal_sn);
    } else {
      console.log('⚠️ 收钱吧终端激活失败:', result.error);
    }
  } catch (error) {
    console.error('⚠️ 收钱吧终端自动激活出错:', error.message);
  }
  
  return true;
};

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
app.use('/api/publish', publishRoutes);
app.use('/api/customer-service', customerServiceRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/webhook', paymentRoutes);

// ==========================================
// 商品抓取API (简化版)
// ==========================================
app.post('/api/scraper/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: '请提供商品链接'
      });
    }

    console.log(`[INFO] 抓取商品 - ${url}`);
    
    // 简化版商品抓取 - 返回模拟数据
    // TODO: 实际实现需要 Playwright 抓取
    const mockProduct = {
      title: '商品标题（模拟数据）',
      description: '商品描述（模拟数据）',
      price: 0,
      images: [],
      source: '1688',
      url: url,
      specs: {},
      note: '这是模拟数据，实际抓取功能需要配置 Playwright'
    };

    res.json({
      success: true,
      data: mockProduct
    });

  } catch (error) {
    console.error('[ERROR] 抓取商品失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==========================================
// 竞品搜索API (简化版)
// ==========================================
app.post('/api/competitor/search', async (req, res) => {
  try {
    const { keyword, category, limit = 5 } = req.body;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: '请提供搜索关键词'
      });
    }

    console.log(`[INFO] 搜索竞品 - ${keyword}`);
    
    // 返回模拟数据
    const mockResults = {
      keyword,
      products: [],
      note: '这是模拟数据，实际搜索功能需要配置 TikTok API'
    };

    res.json({
      success: true,
      data: mockResults
    });

  } catch (error) {
    console.error('[ERROR] 搜索竞品失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                  Claw外贸网站后端API 已启动                       ║
╠══════════════════════════════════════════════════════════════════╣
║  端口: ${PORT}                                                     ║
║  状态: http://localhost:${PORT}/api/health                         ║
║  环境: ${process.env.NODE_ENV || 'development'}                    ║
╠══════════════════════════════════════════════════════════════════╣
║  [🔐 认证]                                                        ║
║  ├─ POST   /api/auth/register   - 用户注册                        ║
║  ├─ POST   /api/auth/login      - 用户登录                        ║
║  ├─ POST   /api/auth/logout     - 用户登出                        ║
║  ├─ GET    /api/auth/profile    - 获取用户信息                    ║
║  └─ GET    /api/auth/quota      - 获取用户额度                    ║
║  [🛍️ 产品]                                                       ║
║  ├─ GET    /api/products        - 获取产品列表                    ║
║  ├─ POST   /api/products        - 创建产品                        ║
║  └─ DELETE /api/products/:id    - 删除产品                        ║
║  [🤖 AI生成]                                                      ║
║  ├─ POST   /api/generate/text   - 生成文案                        ║
║  └─ POST   /api/generate/image  - 生成图片描述                    ║
║  [💰 利润计算]                                                     ║
║  ├─ POST   /api/calculate/profit - 计算利润                       ║
║  └─ POST   /api/calculate/quick  - 快速定价                       ║
║  [👥 账号管理]                                                     ║
║  ├─ GET    /api/accounts        - 获取账号列表                    ║
║  ├─ POST   /api/accounts        - 添加账号                        ║
║  └─ POST   /api/accounts/:id/test - 测试连接                      ║
║  [📝 任务管理]                                                     ║
║  ├─ GET    /api/tasks           - 获取任务列表                    ║
║  └─ POST   /api/tasks           - 创建任务                        ║
║  [👑 会员管理]                                                     ║
║  ├─ GET    /api/membership      - 获取会员信息                    ║
║  └─ GET    /api/quota           - 获取额度详情                    ║
║  [🌐 浏览器自动化]                                                 ║
║  ├─ POST   /api/browser/tiktok/login - TikTok登录                ║
║  ├─ GET    /api/browser/tiktok/status - TikTok状态               ║
║  └─ POST   /api/browser/close   - 关闭浏览器                      ║
║  [📹 数字人视频]                                                   ║
║  ├─ POST   /api/avatar/generate - 生成视频                        ║
║  └─ GET    /api/avatar/list     - 视频列表                        ║
║  [🚀 发布管理]                                                     ║
║  ├─ POST   /api/publish/tiktok  - TikTok发布                     ║
║  └─ POST   /api/publish/youtube - YouTube发布                    ║
╚══════════════════════════════════════════════════════════════════╝
    `);
  });
};

startServer();

export default app;
