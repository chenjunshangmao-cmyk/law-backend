// Claw外贸网站后端API - 主入�?
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// 中间�?
import { requestLogger, securityHeaders, errorHandler, notFoundHandler, healthCheck } from './middleware/errorHandler.js';
import { rateLimitMiddleware } from './middleware/auth.js';

// 路由
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import generateRoutes from './routes/generate.js';
import calculateRoutes from './routes/calculate.js';
import accountsRoutes, { initAccountsRoutes } from './routes/accounts.js';
import tasksRoutes from './routes/tasks.js';
import membershipDbRoutes from './routes/membership.db.js';
import browserRoutes from './routes/browser.js';
import xiaohongshuRoutes from './routes/xiaohongshu.js';
import tiktokPublishRoutes from './routes/tiktokPublish.js';
import ozonPublishRoutes from './routes/ozonPublish.js';
import publishRoutes from './routes/publish.js';
import customerServiceRoutes from './routes/customerService.js';
import shouqianbaRoutes from './routes/shouqianba.db.js';
import paymentRoutes from './routes/payment.db.js';
import whatsappRoutes from './routes/whatsapp.js';
import adminRoutes from './routes/admin.js';
import adminTogglesRoutes from './routes/adminToggles.js';
import pickingRoutes from './routes/picking.js';
import saasRoutes from './routes/saas/index.js';
import publishQueueRoutes from './routes/publishQueue.js';

const app = express();
const PORT = process.env.PORT || 8089;

// 安全中间�?
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
    // 允许无origin的请求（如移动端、Postman�?
    if (!origin) return callback(null, true);
    
    // 开发环境允许所有来�?
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // 允许 claw-app-2026.pages.dev 的所有子域名（Preview/Production�?
    if (origin.includes('claw-app-2026.pages.dev') || origin.includes('chenjuntrading.cn')) {
      return callback(null, true);
    }
    
    // 允许 Chrome 扩展发起的请�?
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 拒绝CORS请求: ${origin}`);
      callback(new Error('不允许的来源'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24小时
}));

// 请求解析
app.use(express.json({
  limit: '10mb', // 限制请求体大�?
  strict: true
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// 安全�?
app.use(securityHeaders);

// 请求日志
app.use(requestLogger);

// 根路径健康检�?
app.get('/', healthCheck);

// 详细健康检�?
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
app.use('/api/membership', membershipDbRoutes);
app.use('/api/quota', membershipDbRoutes); // 额度接口
app.use('/api/browser', browserRoutes); // 浏览器自动化
app.use('/api/publish', publishRoutes); // 产品发布（链�?素材�?
app.use('/api/xiaohongshu', xiaohongshuRoutes); // 小红�?
app.use('/api/tiktok-publish', tiktokPublishRoutes); // TikTok Shop AI发布
app.use('/api/ozon-publish', ozonPublishRoutes); // OZON AI发布
app.use('/api/customer-service', customerServiceRoutes); // AI客服
app.use('/api/shouqianba', shouqianbaRoutes); // 收钱吧支�?
app.use('/api/webhook', paymentRoutes); // 收钱吧支付回调（webhook�?

// WhatsApp 中继引流模块
app.use('/api/whatsapp', whatsappRoutes);
app.use('/go', whatsappRoutes); // 公共跳转�?

// 广告采集
import scraperRoutes from './routes/scraper.js';
app.use('/api/scraper', scraperRoutes);
app.use('/api/competitor', scraperRoutes);

// OZON 自动发布
import ozonAutoPublishRoutes from './routes/ozonAutoPublish.js';
app.use('/api/ozon-publish', ozonAutoPublishRoutes);

// AI智能选品
app.use('/api/picking', pickingRoutes);
// 发布任务队列（PublishPage + social-auto-upload 引擎）
app.use('/api/publish-queue', publishQueueRoutes);
// SaaSBuilder 极速建站
app.use('/api/saas', saasRoutes);

// AI 工具箱（图片去水�?增强/文案生成�?
import aiToolsRoutes from './routes/aiTools.js';
app.use('/api/ai-tools', aiToolsRoutes);

// 外贸干货文章
import articlesRoutes from './routes/articles.js';
app.use('/api/articles', articlesRoutes);

// AI 网关（管理页面接口）
import aiGatewayRoutes from './routes/ai-gateway.js';
app.use('/api/ai-gateway', aiGatewayRoutes);

// 广告数据分析（仅管理员）
import adAnalyticsRoutes from './routes/adAnalytics.js';
app.use('/api/ad-analytics', adAnalyticsRoutes);

// 小说引擎
import novelEngineRoutes from './routes/novelEngine.js';
app.use('/api/novel-engine', novelEngineRoutes);

// 邀�?积分系统
import referralRoutes from './routes/referral.js';
app.use('/api/referral', referralRoutes);

// 管理员路�?
app.use('/api/admin', adminRoutes);
app.use('/api/admin/toggles', adminTogglesRoutes);

// 钉钉天枢AI通讯


// ��������AIͨѶ
import dingtalkRoutes from './routes/dingtalk.js';
app.use('/dingtalk', dingtalkRoutes);

// 静态文件 - SaaSBuilder模板
app.use('/templates', express.static('public/templates'));

// 404处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务�?
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
�?                 Claw外贸网站后端API 已启�?                      �?
╠══════════════════════════════════════════════════════════════════╣
�? 端口: ${PORT}                                                     �?
�? 状�? http://localhost:${PORT}/api/health                         �?
�? 环境: ${process.env.NODE_ENV || 'development'}                    �?
╠══════════════════════════════════════════════════════════════════╣
�? [📊 监控]                                                        �?
�? ├─ GET    /api/health          - 系统健康检�?                   �?
�? [🔐 认证]                                                        �?
�? ├─ POST   /api/auth/register   - 用户注册                        �?
�? ├─ POST   /api/auth/login      - 用户登录                        �?
�? ├─ POST   /api/auth/logout     - 用户登出                        �?
�? ├─ GET    /api/auth/profile    - 获取用户信息                    �?
�? └─ GET    /api/auth/quota      - 获取用户额度                    �?
�? [🛍�?产品]                                                       �?
�? ├─ GET    /api/products        - 获取产品列表                    �?
�? ├─ POST   /api/products        - 创建产品                        �?
�? ├─ GET    /api/products/:id    - 获取单个产品                    �?
�? ├─ PUT    /api/products/:id    - 更新产品                        �?
�? └─ DELETE /api/products/:id    - 删除产品                        �?
�? [🤖 AI生成]                                                      �?
�? ├─ POST   /api/generate/text   - 生成文案                        �?
�? └─ POST   /api/generate/image  - 生成图片描述                    �?
�? [💰 利润计算]                                                     �?
�? ├─ POST   /api/calculate/profit - 计算利润                       �?
�? └─ POST   /api/calculate/quick  - 快速定�?                      �?
�? [👥 账号管理]                                                     �?
�? ├─ GET    /api/accounts        - 获取账号列表                    �?
�? ├─ POST   /api/accounts        - 添加账号                        �?
�? ├─ GET    /api/accounts/:id    - 获取单个账号                    �?
�? ├─ PUT    /api/accounts/:id    - 更新账号                        �?
�? ├─ DELETE /api/accounts/:id    - 删除账号                        �?
�? └─ POST   /api/accounts/:id/test - 测试连接                      �?
�? [📝 任务管理]                                                     �?
�? ├─ GET    /api/tasks           - 获取任务列表                    �?
�? ├─ POST   /api/tasks           - 创建任务                        �?
�? ├─ GET    /api/tasks/:id       - 获取单个任务                    �?
�? ├─ PUT    /api/tasks/:id       - 更新任务状�?                   �?
�? ├─ DELETE /api/tasks/:id       - 删除任务                        �?
�? └─ GET    /api/tasks/:id/logs  - 获取执行日志                    �?
�? [👑 会员管理]                                                     �?
�? ├─ GET    /api/membership      - 获取会员信息                    �?
�? ├─ GET    /api/membership/plans - 获取套餐列表                   �?
�? ├─ GET    /api/quota           - 获取额度详情                    �?
�? ├─ POST   /api/quota/consume   - 消费额度                        �?
�? ├─ POST   /api/quota/release   - 释放额度                        �?
�? └─ POST   /api/membership/upgrade - 升级套餐                     �?
�? [🌐 浏览器自动化]                                                 �?
�? ├─ POST   /api/browser/tiktok/login - TikTok登录                �?
�? ├─ GET    /api/browser/tiktok/status - TikTok状态检�?          �?
�? ├─ POST   /api/browser/tiktok/publish - TikTok发布产品          �?
�? ├─ POST   /api/browser/youtube/login - YouTube登录              �?
�? ├─ GET    /api/browser/youtube/status - YouTube状态检�?        �?
�? ├─ POST   /api/browser/youtube/upload - YouTube上传视频         �?
�? ├─ POST   /api/browser/close   - 关闭所有浏览器                  �?
�? └─ GET    /api/browser/list-sessions - 列出保存的session        �?
�? [🔧 管理员]                                                     �?
�? ├─ POST   /api/admin/backup   - 数据库备�?                     �?
�? └─ GET    /api/admin/backup/status - 备份状�?                 �?
╚══════════════════════════════════════════════════════════════════╝
  `);
});

// 钉钉天枢AI通讯

export default app;
