// Claw外贸网站后端API - 主入口
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// 中间件
import { requestLogger, securityHeaders, errorHandler, notFoundHandler, healthCheck } from './middleware/errorHandler.js';
import { rateLimitMiddleware } from './middleware/auth.js';

// 路由
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import generateRoutes from './routes/generate.js';
import calculateRoutes from './routes/calculate.js';
import accountsRoutes, { initAccountsRoutes } from './routes/accounts.js';
import tasksRoutes from './routes/tasks.js';
import membershipRoutes from './routes/membership.js';
import membershipDbRoutes from './routes/membership.db.js';
import browserRoutes from './routes/browser.js';
import xiaohongshuRoutes from './routes/xiaohongshu.js';
import tiktokPublishRoutes from './routes/tiktokPublish.js';
import ozonPublishRoutes from './routes/ozonPublish.js';
import publishRoutes from './routes/publish.js';
import customerServiceRoutes from './routes/customerService.js';
import shouqianbaRoutes from './routes/shouqianba.db.js';
import paymentRoutes from './routes/payment.db.js';

const app = express();
const PORT = process.env.PORT || 8089;

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

// CORS配置 - 安全增强
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: function(origin, callback) {
    // 允许无origin的请求（如移动端、Postman）
    if (!origin) return callback(null, true);
    
    // 开发环境允许所有来源
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // 允许 claw-app-2026.pages.dev 的所有子域名（Preview/Production）
    if (origin.includes('claw-app-2026.pages.dev') || origin.includes('chenjuntrading.cn')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 拒绝CORS请求: ${origin}`);
      callback(new Error('不允许的源'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24小时
}));

// 请求解析
app.use(express.json({
  limit: '10mb', // 限制请求体大小
  strict: true
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// 安全头
app.use(securityHeaders);

// 请求日志
app.use(requestLogger);

// 根路径健康检查
app.get('/', healthCheck);

// 详细健康检查
app.get('/api/health', healthCheck);

// 全局速率限制（每分钟100个请求）
app.use(rateLimitMiddleware());

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/calculate', calculateRoutes);
// accounts 路由：自动初始化数据库表
initAccountsRoutes(app);
app.use('/api/tasks', tasksRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/membership', membershipDbRoutes);
app.use('/api/quota', membershipRoutes); // 额度接口
app.use('/api/browser', browserRoutes); // 浏览器自动化
app.use('/api/publish', publishRoutes); // 产品发布（链接/素材）
app.use('/api/xiaohongshu', xiaohongshuRoutes); // 小红书
app.use('/api/tiktok-publish', tiktokPublishRoutes); // TikTok Shop AI发布
app.use('/api/ozon-publish', ozonPublishRoutes); // OZON AI发布
app.use('/api/customer-service', customerServiceRoutes); // AI客服
app.use('/api/shouqianba', shouqianbaRoutes); // 收钱吧支付
app.use('/api/webhook', paymentRoutes); // 收钱吧支付回调（webhook）

// 404处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                  Claw外贸网站后端API 已启动                       ║
╠══════════════════════════════════════════════════════════════════╣
║  端口: ${PORT}                                                     ║
║  状态: http://localhost:${PORT}/api/health                         ║
║  环境: ${process.env.NODE_ENV || 'development'}                    ║
╠══════════════════════════════════════════════════════════════════╣
║  [📊 监控]                                                        ║
║  ├─ GET    /api/health          - 系统健康检查                    ║
║  [🔐 认证]                                                        ║
║  ├─ POST   /api/auth/register   - 用户注册                        ║
║  ├─ POST   /api/auth/login      - 用户登录                        ║
║  ├─ POST   /api/auth/logout     - 用户登出                        ║
║  ├─ GET    /api/auth/profile    - 获取用户信息                    ║
║  └─ GET    /api/auth/quota      - 获取用户额度                    ║
║  [🛍️ 产品]                                                       ║
║  ├─ GET    /api/products        - 获取产品列表                    ║
║  ├─ POST   /api/products        - 创建产品                        ║
║  ├─ GET    /api/products/:id    - 获取单个产品                    ║
║  ├─ PUT    /api/products/:id    - 更新产品                        ║
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
║  ├─ GET    /api/accounts/:id    - 获取单个账号                    ║
║  ├─ PUT    /api/accounts/:id    - 更新账号                        ║
║  ├─ DELETE /api/accounts/:id    - 删除账号                        ║
║  └─ POST   /api/accounts/:id/test - 测试连接                      ║
║  [📝 任务管理]                                                     ║
║  ├─ GET    /api/tasks           - 获取任务列表                    ║
║  ├─ POST   /api/tasks           - 创建任务                        ║
║  ├─ GET    /api/tasks/:id       - 获取单个任务                    ║
║  ├─ PUT    /api/tasks/:id       - 更新任务状态                    ║
║  ├─ DELETE /api/tasks/:id       - 删除任务                        ║
║  └─ GET    /api/tasks/:id/logs  - 获取执行日志                    ║
║  [👑 会员管理]                                                     ║
║  ├─ GET    /api/membership      - 获取会员信息                    ║
║  ├─ GET    /api/membership/plans - 获取套餐列表                   ║
║  ├─ GET    /api/quota           - 获取额度详情                    ║
║  ├─ POST   /api/quota/consume   - 消费额度                        ║
║  ├─ POST   /api/quota/release   - 释放额度                        ║
║  └─ POST   /api/membership/upgrade - 升级套餐                     ║
║  [🌐 浏览器自动化]                                                 ║
║  ├─ POST   /api/browser/tiktok/login - TikTok登录                ║
║  ├─ GET    /api/browser/tiktok/status - TikTok状态检查           ║
║  ├─ POST   /api/browser/tiktok/publish - TikTok发布产品          ║
║  ├─ POST   /api/browser/youtube/login - YouTube登录              ║
║  ├─ GET    /api/browser/youtube/status - YouTube状态检查         ║
║  ├─ POST   /api/browser/youtube/upload - YouTube上传视频         ║
║  ├─ POST   /api/browser/close   - 关闭所有浏览器                  ║
║  └─ GET    /api/browser/list-sessions - 列出保存的session        ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
