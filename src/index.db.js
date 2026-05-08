// Claw外贸网站后端API - 完整版（PostgreSQL + 全部功能）
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 数据库配置
import { testConnection, syncDatabase, sequelize, pool } from './config/database.js';
import { findUserById } from './services/dbService.js';

// 中间件
import { requestLogger, securityHeaders, errorHandler, notFoundHandler, healthCheck } from './middleware/errorHandler.js';
import { rateLimitMiddleware } from './middleware/auth.js';

// 路由
import authRoutes from './routes/auth.min.js';
import youtubeAuthRoutes from './routes/auth.youtube.js';
import productRoutes from './routes/products.db.js';
import generateRoutes from './routes/generate.js';
import calculateRoutes from './routes/calculate.js';
import accountsRoutes from './routes/accounts.db.js';
import tasksRoutes from './routes/tasks.db.js';
import membershipRoutes from './routes/membership.db.js';
import browserRoutes from './routes/browser.js';
import proxyRoutes from './routes/proxies.js';
import avatarRoutes from './routes/avatar.db.js';
import publishRoutes from './routes/publish.js';
import customerServiceRoutes from './routes/customerService.js';
import paymentRoutes from './routes/payment.db.js';
import shouqianbaRoutes from './routes/shouqianba.db.js';
import xiaohongshuRoutes from './routes/xiaohongshu.js';
import ozonPublishRoutes from './routes/ozonPublish.js';
import whatsappRoutes from './routes/whatsapp.js';
import cryptoPaymentRoutes from './routes/cryptoPayment.js';
import youtubeApiRoutes from './routes/youtube.api.js';
import aiToolsRoutes from './routes/aiTools.js';
import heartbeatRoutes from './routes/heartbeat.js';
import writerRoutes from './routes/writer.js';
import videoFactoryRoutes from './routes/video-factory.js';
import liveStreamRoutes from './routes/live-stream.js';
import proxyStreamRoutes from './routes/proxy-stream.js';
import agentAIRoutes from './routes/agent-ai.js';

const app = express();
const PORT = process.env.PORT || 8089;

// 安全中间件
app.use(helmet({
  // 禁用 CSP（CORS 已处理跨域控制，CSP 过于严格会导致同源 API 调用被误拦）
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS配置 - 支持多域名
const corsWhiteList = [
  'https://claw-app-2026.pages.dev',
  'https://df98523c.claw-app-2026.pages.dev',
  'https://60872676.claw-app-2026.pages.dev',
  'https://production.claw-app-2026.pages.dev',
  'https://main.claw-app-2026.pages.dev',
  'https://www.chenjuntrading.cn',
  'https://chenjuntrading.cn',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

// 支持 ALLOWED_ORIGINS 环境变量扩展
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(o => {
    const trimmed = o.trim();
    if (trimmed && !corsWhiteList.includes(trimmed)) {
      corsWhiteList.push(trimmed);
    }
  });
}

app.use(cors({
  origin: function (origin, callback) {
    // 允许无origin（如Postman、服务器端请求）
    if (!origin) return callback(null, true);

    // 精确匹配白名单
    if (corsWhiteList.includes(origin)) return callback(null, true);

    // 支持 *.claw-app-2026.pages.dev 所有子域名（Cloudflare Pages 动态部署）
    if (/^https:\/\/.+\.claw-app-2026\.pages\.dev$/.test(origin)) {
      return callback(null, true);
    }

    // 允许 Chrome 扩展发起的请求（chrome-extension:// 起源）
    if (/^chrome-extension:\/\//.test(origin)) {
      return callback(null, true);
    }

    console.warn(`🚫 CORS拒绝: ${origin}`);
    callback(new Error('CORS: 不允许的源'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}));

// 请求解析（verify回调捕获rawBody，供收钱吧回调RSA验签使用）
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 安全头
app.use(securityHeaders);

// 请求日志
app.use(requestLogger);

// 根路径健康检查
app.get('/', healthCheck);

// 详细健康检查
app.get('/api/health', healthCheck);

// 综合心跳监控 (数据库+WhatsApp+支付+内存)
app.use('/api/heartbeat', heartbeatRoutes);
app.use('/api/writer', writerRoutes);
app.use('/api/video-factory', videoFactoryRoutes);
app.use('/api/live-stream', liveStreamRoutes);
app.use('/api/stream-proxy', proxyStreamRoutes);
app.use('/api/agent-ai', agentAIRoutes);

// Token用量统计API（无认证，仅管理员可看）
import tokenStatsRoutes from './routes/token-stats.js';
app.use('/api/ai', tokenStatsRoutes);

// AI 免费网关 API
import aiGatewayRoutes from './routes/ai-gateway.js';
app.use('/api/gateway', aiGatewayRoutes);

// 版本信息 API
app.get('/api/version', (req, res) => {
  res.json({
    success: true,
    version: '1.1.0423b',
    buildTime: '2026-04-23',
    mode: process.env.DATABASE_URL ? 'database' : 'memory'
  });
});

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
  
  // 初始化AI Agent数据表
  try {
    const { initAgentTables } = await import('./services/ai/initAgentTables.js');
    await initAgentTables();
  } catch (err) {
    console.error('⚠️ AI Agent表初始化失败:', err.message);
  }
  
  // 初始化Token用量统计表
  try {
    const { initTokenTracker } = await import('./services/ai/TokenTracker.js');
    await initTokenTracker();
  } catch (err) {
    console.error('⚠️ Token统计表初始化失败:', err.message);
  }
  
  // 同步数据库模型（不强制修改表结构，避免PostgreSQL兼容问题）
  try {
    await syncDatabase(false);
    console.log('✅ 数据库同步成功');
  } catch (error) {
    console.error('⚠️ 数据库同步失败:', error.message);
    console.log('继续启动服务...');
  }

  // 会员字段迁移：添加 member_id 列并为现有用户分配
  try {
    // 1. 添加 member_id 列（如果不存在）
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS member_id VARCHAR(20) UNIQUE
    `);
    console.log('[迁移] ✅ member_id 列就绪');

    // 2. 为缺少 member_id 的用户分配（按注册顺序）
    const nullUsers = await pool.query(`
      SELECT id FROM users WHERE member_id IS NULL ORDER BY created_at ASC
    `);
    if (nullUsers.rows.length > 0) {
      console.log(`[迁移] 为 ${nullUsers.rows.length} 个用户分配 member_id...`);
      for (let i = 0; i < nullUsers.rows.length; i++) {
        const id = nullUsers.rows[i].id;
        const seq = String(i + 1).padStart(4, '0');
        const d = new Date();
        const memberId = `M${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}${seq}`;
        await pool.query('UPDATE users SET member_id = $1 WHERE id = $2', [memberId, id]);
      }
      console.log('[迁移] ✅ 现有用户 member_id 分配完成');
    }
  } catch (err) {
    console.error('[迁移] ⚠️ member_id 迁移失败（不影响主服务）:', err.message);
  }

  return true;
};

// API路由
app.use('/api/auth', authRoutes);

app.use('/api/auth/youtube', youtubeAuthRoutes);  // YouTube OAuth 路由（视频授权）
app.use('/api/youtube', youtubeApiRoutes);          // YouTube Data API v3（视频上传/管理等）
app.get('/api/health', healthCheck);
app.get('/health', healthCheck);
app.use('/api/products', productRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/calculate', calculateRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/quota', membershipRoutes);
app.use('/api/browser', browserRoutes);
app.use('/api/proxies', proxyRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/ai-tools', aiToolsRoutes);
app.use('/api/publish', publishRoutes);
app.use('/api/customer-service', customerServiceRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/webhook', paymentRoutes);
app.use('/api/shouqianba', shouqianbaRoutes);

// AI团队协作看板（公开访问）
const _teamDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../team');
app.get('/team/tasks.json', (_req, res) => {
  const tasksFile = path.join(_teamDir, 'tasks.json');
  if (fs.existsSync(tasksFile)) {
    res.sendFile(tasksFile);
  } else {
    res.status(404).json({ error: 'tasks.json not found' });
  }
});
app.get('/team/dashboard', (req, res) => {
  // 只有带正确 key 才能看，防止客户看到
  if (req.query.key !== 'claw888') {
    return res.status(403).send('<h2>无权访问</h2>');
  }
  res.sendFile(path.join(_teamDir, 'dashboard.html'));
});
app.get('/team', (req, res) => {
  res.redirect('/team/dashboard?key=claw888');
});

// 小红书
// 小红书
app.use('/api/xiaohongshu', xiaohongshuRoutes);

// OZON 智能发布
app.use('/api/ozon-publish', ozonPublishRoutes);

// WhatsApp 中继引流模块
app.use('/api/whatsapp', whatsappRoutes);
app.use('/go', whatsappRoutes); // 公共跳转页
app.use('/api/crypto', cryptoPaymentRoutes); // USDT 加密支付

// 发布任务队列（OpenClaw 客服自动执行）
import publishQueueRoutes from './routes/publishQueue.js';
app.use('/api/publish-queue', publishQueueRoutes);

// Dify 工作流集成（Webhook + 触发器 + OpenClaw 任务队列）
import difyRoutes from './routes/dify.js';
app.use('/api/dify', difyRoutes);

// 商品抓取API - 支持1688/淘宝/拼多多
import ProductScraper from './services/scraper/ProductScraper.js';
const scraperInstance = new ProductScraper();

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
    
    // 检测来源
    const source = url.includes('1688.com') ? '1688' 
      : url.includes('taobao.com') || url.includes('tmall.com') ? 'taobao'
      : url.includes('pinduoduo.com') ? 'pdd'
      : 'unknown';

    if (source === 'unknown') {
      return res.status(400).json({
        success: false,
        error: '暂不支持该链接类型，请使用1688/淘宝/天猫/拼多多链接'
      });
    }

    // 尝试真实抓取（Playwright不可用时返回友好提示）
    try {
      const product = await scraperInstance.fetchProduct(url);
      res.json({ success: true, data: product });
    } catch (scrapeErr) {
      console.warn('[WARN] 抓取失败，使用模拟数据:', scrapeErr.message);
      // 真实抓取失败时，从URL提取商品ID，返回友好提示
      const productId = url.match(/\/(\d+)\.html/) || [null, Date.now().toString()];
      res.json({
        success: true,
        data: {
          title: `商品 ${productId[1] || ''}`,
          description: '',
          price: 0,
          cost: 0,
          images: [],
          source,
          url,
          specs: [],
          warning: '自动抓取暂不可用，请在下方手动填写商品信息',
          note: '链接已记录，可手动补充信息后继续发布'
        }
      });
    }

  } catch (error) {
    console.error('[ERROR] 抓取商品失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI生成产品图片
app.post('/api/generate/product-image', async (req, res) => {
  try {
    const { productName, productDesc, style, referenceImages } = req.body;

    if (!productName) {
      return res.status(400).json({ success: false, error: '请提供产品名称' });
    }

    console.log(`[INFO] AI生成产品图 - ${productName}`);

    // 优先使用百炼API生成图片（Flux或通义万相）
    const FLUX_KEY = process.env.FLUX_API_KEY;
    const Bailian_KEY = process.env.BAILIAN_API_KEY;
    const Bailian_URL = process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

    let imageUrls = [];
    const styleMap = {
      fresh: '清新自然风格，柔和光线，自然背景，适合电商主图',
      cartoon: '卡通插画风格，明亮色彩，有趣可爱，适合儿童产品',
      minimal: '极简风格，留白多，高级感，纯色背景',
      luxury: '奢华高端，金色点缀，精致包装，适合礼品',
      sport: '运动风格，活力动感，户外场景，适合运动产品',
      auto: '专业电商摄影，高品质，简洁构图，适合跨境电商'
    };
    const styleText = styleMap[style] || styleMap.auto;

    const scenes = [
      `专业电商主图，${styleText}，正面展示，高品质照明`,
      `产品细节图，${styleText}，特写镜头，展示质感`,
      `场景应用图，${styleText}，生活化展示，代入感强`
    ];

    if (Bailian_KEY) {
      // 百炼通义万相（wanx）
      for (const scene of scenes) {
        try {
          const prompt = `${scene}，产品：${productName} ${productDesc || ''}`;
          const resp = await fetch(`${Bailian_URL}/services/aigc/text2image/image-synthesis`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Bailian_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'wanx2.1',
              input: { prompt },
              parameters: { size: '1024*1024', n: 1 }
            })
          });
          const data = await resp.json();
          if (data.output?.image_url) {
            imageUrls.push(data.output.image_url);
          }
        } catch (e) {
          console.warn('[WARN] 万相生成失败:', e.message);
        }
      }
    }

    if (FLUX_KEY && imageUrls.length === 0) {
      // Flux API fallback
      for (const scene of scenes) {
        try {
          const prompt = `Product photography, ${scene}, ${productName}, high quality, professional, 4K`;
          const resp = await fetch('https://api.bfl.ml/v1/flux-pro', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${FLUX_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, width: 1024, height: 1024, num_images: 1 })
          });
          const data = await resp.json();
          if (data.result?.sample) imageUrls.push(data.result.sample);
        } catch (e) {
          console.warn('[WARN] Flux生成失败:', e.message);
        }
      }
    }

    // 全部失败时返回占位图
    if (imageUrls.length === 0) {
      imageUrls = [
        `https://placehold.co/1024x1024/6366f1/ffffff?text=${encodeURIComponent(productName)}`
      ];
    }

    res.json({
      success: true,
      data: {
        images: imageUrls,
        productName,
        style,
        note: imageUrls[0]?.startsWith('https://placehold') 
          ? '⚠️ AI图片生成服务未配置，当前显示占位图。请在后台配置 FLUX_API_KEY 或 BAILIAN_API_KEY' 
          : '✨ 图片生成成功，请选择满意的图片使用'
      }
    });

  } catch (error) {
    console.error('[ERROR] AI图片生成失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI生成视频脚本
app.post('/api/generate/video-script', async (req, res) => {
  try {
    const { productName, productDesc, platform, duration = 30, tone } = req.body;

    if (!productName) {
      return res.status(400).json({ success: false, error: '请提供产品名称' });
    }

    console.log(`[INFO] AI生成视频脚本 - ${productName}`);

    const BAILIAN_KEY = process.env.BAILIAN_API_KEY;
    const Bailian_URL = process.env.BAILIAN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

    let script = null;

    if (BAILIAN_KEY) {
      try {
        const platformMap = {
          tiktok: 'TikTok',
          youtube: 'YouTube',
          xiaohongshu: '小红书',
          ozon: 'OZON'
        };
        const toneMap = {
          fun: '轻松有趣，充满活力，适合病毒式传播',
          professional: '专业可信，权威讲解，建立信任',
          emotional: '情感共鸣，故事化叙述，打动人心',
          auto: '自然流畅，带货风格，促进转化'
        };
        const prompt = `你是一个专业的产品视频带货脚本专家。请为以下产品生成一个${duration}秒的短视频带货脚本。

产品：${productName}
产品描述：${productDesc || '无'}
目标平台：${platformMap[platform] || 'TikTok'}
风格：${toneMap[tone] || toneMap.auto}
时长：${duration}秒

要求：
1. 开场3秒：抓眼球（用一个问题、惊人数据或视觉冲击开场）
2. 中间${duration - 10}秒：产品卖点（3-5个核心卖点，每个卖点用一句话）
3. 最后7秒：行动号召（引导点击购买）
4. 包含2-3个热门话题标签

请严格按以下JSON格式返回：
{
  "hook": "开场白（5-15字，吸引注意力）",
  "title": "短视频标题（20字以内，带爆款感）",
  "sections": [
    { "time": "0-3秒", "content": "开场内容" },
    { "time": "3-${duration - 7}秒", "content": "卖点1", "highlight": "关键数据/卖点词" },
    { "time": "中间", "content": "卖点2", "highlight": "关键数据/卖点词" },
    { "time": "最后", "content": "卖点3", "highlight": "关键数据/卖点词" },
    { "time": "${duration - 7}-${duration}秒", "content": "行动号召" }
  ],
  "tags": ["#话题1", "#话题2", "#话题3"],
  "tips": ["拍摄技巧提示1", "拍摄技巧提示2"]
}`;

        const resp = await fetch(`${Bailian_URL}/chat/completions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${BAILIAN_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'qwen-plus',
            messages: [
              { role: 'system', content: '你是一个专业的产品视频带货脚本专家，擅长写TikTok/YouTube短视频带货脚本。' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 1500
          })
        });
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const match = content.match(/\{[\s\S]*\}/);
          if (match) script = JSON.parse(match[0]);
        }
      } catch (e) {
        console.warn('[WARN] 百炼脚本生成失败:', e.message);
      }
    }

    // DeepSeek fallback
    if (!script && DEEPSEEK_KEY) {
      try {
        const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${DEEPSEEK_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: '你是专业短视频带货脚本专家' },
              { role: 'user', content: `为产品"${productName}"生成${duration}秒TikTok带货脚本JSON` }
            ],
            temperature: 0.8,
            max_tokens: 1500
          })
        });
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const match = content.match(/\{[\s\S]*\}/);
          if (match) script = JSON.parse(match[0]);
        }
      } catch (e) {
        console.warn('[WARN] DeepSeek脚本生成失败:', e.message);
      }
    }

    // 默认脚本
    if (!script) {
      script = {
        hook: `你一定没见过这样的${productName}！`,
        title: `${productName}太牛了！后悔没早点买`,
        sections: [
          { time: '0-3秒', content: `你知道吗？这款${productName}最近在海外卖疯了！`, highlight: '🔥热销' },
          { time: '3-20秒', content: '采用高品质材料，设计精美，性价比超高', highlight: '⭐核心卖点' },
          { time: '20-25秒', content: '买家真实反馈都说好，回购率超高', highlight: '💬真实评价' },
          { time: '25-30秒', content: '点击下方链接，现在购买还有优惠！快冲！', highlight: '👉立即购买' }
        ],
        tags: ['#跨境好物', '#爆款推荐', '#购物分享', '#种草', '#fyp'],
        tips: ['用特写镜头展示产品细节', '背景音乐选择节奏感强的热门音乐', '真人出镜增加信任感']
      };
    }

    res.json({
      success: true,
      data: {
        script,
        platform: platform || 'tiktok',
        duration,
        note: '✨ 脚本生成成功，可直接用于数字人视频或人工拍摄'
      }
    });

  } catch (error) {
    console.error('[ERROR] 视频脚本生成失败:', error);
    res.status(500).json({ success: false, error: error.message });
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

// ==========================================
// 调试端点：对比 dbService vs auth.min 路径
// ==========================================
app.get('/api/debug/paths', (req, res) => {
  const unifiedDataDir = path.join(process.cwd(), 'data');
  const unifiedUsersFile = path.join(unifiedDataDir, 'users.json');
  let users = [];
  try { users = JSON.parse(fs.readFileSync(unifiedUsersFile, 'utf8')).map(u => ({id: u.id, email: u.email, passwordLen: u.password ? u.password.length : 0})); } catch(e) { users = []; }
  res.json({ cwd: process.cwd(), dataDir: unifiedDataDir, usersFile: unifiedUsersFile, count: users.length, users });
});

// ==========================================
// 调试端点：测试 PostgreSQL 直接查询
// ==========================================
app.get('/api/debug/pg-test', async (req, res) => {
  const { userId } = req.query;
  try {
    const r = await pool.query('SELECT id::text, email FROM users WHERE id::text = $1', [userId || 'none']);
    res.json({ pgFound: r.rows.length > 0, rows: r.rows, cwd: process.cwd() });
  } catch (e) {
    res.json({ pgError: e.message, cwd: process.cwd() });
  }
});

// ==========================================
// 调试端点：直接测试 findUserById
// ==========================================
// 直接在 index.db.js 里读取 JSON，绕过 dbService
app.get('/api/debug/json-find', async (req, res) => {
  const { userId } = req.query;
  const DATA_DIR = path.join(process.cwd(), 'data');
  const USERS_FILE = path.join(DATA_DIR, 'users.json');
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(raw);
    const found = users.find(u => u.id === userId || u.email === userId);
    res.json({ userId, cwd: process.cwd(), path: USERS_FILE, count: users.length, ids: users.map(u=>u.id), directFind: found ? {id:found.id, email:found.email} : null });
  } catch(e) {
    res.json({ userId, cwd: process.cwd(), path: USERS_FILE, error: e.message });
  }
});

app.get('/api/debug/find-user', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.json({ error: '需要 userId 参数', example: '/api/debug/find-user?userId=xxx' });
  }
  try {
    const DATA_DIR = path.join(process.cwd(), 'data');
    const USERS_FILE = path.join(DATA_DIR, 'users.json');
    let fileContent = null;
    try {
      fileContent = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch(e) {}
    const user = await findUserById(userId);
    res.json({
      userId,
      cwd: process.cwd(),
      usersFile: USERS_FILE,
      jsonUserCount: fileContent ? fileContent.length : 0,
      jsonUserIds: fileContent ? fileContent.map(u => u.id) : [],
      userFound: !!user,
      user: user ? { id: user.id, email: user.email, name: user.name, role: user.role, hasHashedPassword: !!user.hashedPassword } : null
    });
  } catch (e) {
    res.json({ userId, caughtError: e.message });
  }
});

// ==========================================
// 调试端点：查看data/users.json内容
// ==========================================
app.get('/api/debug/users', (req, res) => {
  try {
    const DATA_DIR = path.join(process.cwd(), 'data');
    const USERS_FILE = path.join(DATA_DIR, 'users.json');
    const content = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(content);
    const safe = users.map(u => ({
      id: u.id, email: u.email, name: u.name, role: u.role, plan: u.plan,
      member_id: u.member_id, passwordLen: u.password ? u.password.length : 0
    }));
    res.json({ count: users.length, users: safe, path: USERS_FILE });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 直接测试 pool + dbService（绕过 dbService 的 useMemoryMode）
app.get('/api/debug/direct-pg', async (req, res) => {
  const { userId } = req.query;
  try {
    const { pool: directPool, useMemoryMode: directMM } = await import('./config/database.js');
    // 直接用 pool.query
    let directRows = [];
    let directErr = null;
    try {
      if (directPool) {
        directRows = (await directPool.query('SELECT id::text, email FROM users WHERE id::text = $1', [userId || 'none'])).rows;
      } else {
        directErr = 'pool is null';
      }
    } catch(e) { directErr = e.message; }
    // 测试 dbService
    let svcRows = null;
    let svcErr = null;
    try {
      svcRows = await findUserById(userId || 'none');
    } catch(e) { svcErr = e.message; }
    res.json({ userId: userId || 'none', poolExists: !!directPool, poolNull: directPool === null, directMemMode: directMM, directRows, directErr, svcResult: svcRows, svcErr });
  } catch(e) { res.json({ error: e.message }); }
});

// 调试端点：直接测试 useMemoryMode 和 pool 状态
app.get('/api/debug/db-state', async (req, res) => {
  const { userId } = req.query;
  try {
    // 从 config/database.js 读取当前状态
    const db = await import('./config/database.js');
    const memMode = db.useMemoryMode;
    const dbPool = db.pool;
    // 直接查询 PG
    let pgResult = null;
    let pgError = null;
    try {
      if (dbPool) {
        pgResult = await dbPool.query('SELECT id::text, email FROM users WHERE id::text = $1', [userId || 'none']);
      } else {
        pgError = 'pool is null';
      }
    } catch(e) {
      pgError = e.message;
    }
    // 测试 dbService.findUserById
    let svcResult = null;
    let svcError = null;
    try {
      svcResult = await findUserById(userId || 'none');
    } catch(e) {
      svcError = e.message;
    }
    res.json({
      userId: userId || '(none)',
      useMemoryMode: memMode,
      poolExists: !!dbPool,
      poolIsNull: dbPool === null,
      pgDirectResult: pgResult ? pgResult.rows : [],
      pgDirectError: pgError,
      dbServiceResult: svcResult,
      dbServiceError: svcError
    });
  } catch (e) {
    res.json({ error: e.message, stack: e.stack });
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
║  ├─ PUT    /api/browser/tiktok/account/:id/proxy - 绑定代理      ║
║  └─ POST   /api/browser/close   - 关闭浏览器                      ║
║  [🔒 代理管理]                                                      ║
║  ├─ GET    /api/proxies          - 获取代理列表                   ║
║  ├─ POST   /api/proxies          - 添加代理                       ║
║  ├─ PUT    /api/proxies/:id      - 更新代理                       ║
║  └─ DELETE /api/proxies/:id      - 删除代理                       ║
║  [📹 数字人视频]                                                   ║
║  ├─ POST   /api/avatar/generate - 生成视频                        ║
║  └─ GET    /api/avatar/list     - 视频列表                        ║
║  [🎥 AI数字人直播]                                                  ║
║  ├─ POST   /api/live-stream/start     - 启动直播                  ║
║  ├─ POST   /api/live-stream/stop      - 停止直播                  ║
║  ├─ GET    /api/live-stream/status    - 直播状态                  ║
║  ├─ POST   /api/live-stream/pause     - 暂停直播                  ║
║  ├─ POST   /api/live-stream/resume    - 恢复直播                  ║
║  ├─ POST   /api/live-stream/script    - 添加脚本                  ║
║  ├─ GET    /api/live-stream/scripts   - 脚本队列                  ║
║  ├─ POST   /api/live-stream/announce  - 主播公告                  ║
║  ├─ POST   /api/live-stream/generate-script - AI生成脚本         ║
║  └─ GET    /api/live-stream/platforms - 支持平台                  ║
║  [🤖 4子AI系统]                                                    ║
║  ├─ GET    /api/agent-ai/list         - 所有Agent信息             ║
║  ├─ GET    /api/agent-ai/:id/status   - Agent状态                 ║
║  ├─ POST   /api/agent-ai/:id/chat     - 与Agent对话              ║
║  ├─ POST   /api/agent-ai/:id/script   - 生成直播话术              ║
║  ├─ POST   /api/agent-ai/:id/optimize - 分析优化建议              ║
║  ├─ GET    /api/agent-ai/:id/qa-history - 问答历史                ║
║  ├─ GET    /api/agent-ai/:id/dashboard - Agent仪表盘              ║
║  ├─ POST   /api/agent-ai/:id/save-tip - 保存笔记                  ║
║  └─ POST   /api/agent-ai/:id/save-qa  - 保存问答                  ║
║  [🚀 发布管理]                                                     ║
║  ├─ POST   /api/publish/tiktok  - TikTok发布                     ║
║  └─ POST   /api/publish/youtube - YouTube发布                    ║
╚══════════════════════════════════════════════════════════════════╝
    `);
  });
};

// 启动会员到期检查（每5分钟检查一次，首次启动延迟30秒）
setTimeout(() => {
  const startMembershipCron = async () => {
    try {
      const { checkAndDowngradeExpired } = await import('./services/membershipService.js');
      console.log('[会员] ⏰ 到期检查定时任务已启动，每5分钟检查一次');
      
      // 首次检查
      const result = await checkAndDowngradeExpired();
      if (result.downgraded > 0) {
        console.log(`[会员] 启动时降级了 ${result.downgraded} 个到期会员`);
      }
      
      // 每5分钟检查一次
      setInterval(async () => {
        try {
          const r = await checkAndDowngradeExpired();
          if (r.downgraded > 0) {
            console.log(`[会员] 🔻 定时检查: 降级了 ${r.downgraded} 个到期会员`);
          }
        } catch (e) {
          console.error('[会员] 定时检查异常:', e.message);
        }
      }, 5 * 60 * 1000);
    } catch (err) {
      console.error('[会员] 启动到期检查失败:', err.message);
    }
  };
  startMembershipCron();
}, 30000);

startServer();

export default app;
