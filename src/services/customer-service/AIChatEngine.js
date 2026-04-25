/**
 * AI客服对话引擎
 * 支持多模型切换、知识库检索、上下文管理
 */

import { OpenAI } from 'openai';
import axios from 'axios';
import { pool, useMemoryMode } from '../../config/database.js';

class AIChatEngine {
  constructor() {
    this.sessions = new Map(); // 会话缓存
    this.knowledgeBase = new Map(); // 知识库
    this.initializeKnowledgeBase();
  }

  // 初始化知识库
  initializeKnowledgeBase() {
    this.knowledgeBase.set('铺货流程', {
      keywords: ['铺货', '上架', '发布', '流程', '怎么卖', '怎么开始'],
      response: `📦 <b>上架操作指南</b>

您绑定的店铺可以通过以下方式上架商品：

<b>🔗 链接抓取（最常用）</b>
1. 复制1688/淘宝/拼多多商品链接
2. 粘贴到「AI工作台」→「智能铺货」
3. 系统自动抓取商品信息、图片、规格
4. AI自动翻译并优化标题和描述
5. 支持多语言发布（中文→俄语/英语）
6. 一键发布到OZON店铺

<b>📷 图片上传</b>
1. 上传商品图片（最多9张）
2. AI搜索相似竞品
3. 参考爆款元素生成商品信息
4. 确认后发布

<b>💡 小贴士：</b>
- OZON俄罗斯站建议用俄语标题，转化率高
- 定价建议使用「定价计算器」自动算
- 首次上架建议先发1-2个商品测试流程

需要我引导您操作哪个步骤？`
    });

    this.knowledgeBase.set('定价计算', {
      keywords: ['定价', '价格', '利润', '成本', '计算', '多少钱', '运费'],
      response: `💰 <b>智能定价计算器</b>

系统内置定价计算器，支持三种模式：

<b>📐 基础定价（成本加成）</b>
售价 = (采购成本 + 运费) × 目标利润率
- 默认利润率：2.0 ~ 2.5倍（毛利≥50%）
- OZON俄罗斯站：考虑跨境物流成本
- 系统自动取整为市场可接受的价格

<b>📊 竞品参考定价</b>
- 系统搜索同款商品在平台上的售价
- 分析价格区间、销量分布
- 建议定价在中位价附近

<b>🧮 定价计算器入口：</b>
在「AI工作台」→「定价计算器」中：
1. 输入采购成本
2. 选择平台（OZON/TikTok）
3. 输入运费
4. 点击「开始计算」
5. 系统自动给出建议售价

<b>⚡ 快速示例：</b>
成本¥35 + 运费¥30 = ¥65
OZON售价建议：₽1500~₽1890（约¥120~¥150）
利润率：约85%~130%

想让我帮您具体算一算吗？`
    });

    this.knowledgeBase.set('发布失败', {
      keywords: ['失败', '错误', '发布不了', '提交失败', '报错', '出错', '不行', '没反应', '异常'],
      response: `❌ <b>发布失败排查指南</b>

<b>🔍 按原因排查：</b>

<b>1. 网络不稳定</b>
→ 刷新页面重新尝试
→ 检查网络连接是否正常
→ 可尝试切换网络环境

<b>2. 商品信息不完整</b>
→ 检查必填项是否都已填写
→ 图片是否已上传（至少1张，建议3-9张）
→ 规格/尺寸信息是否完整
→ 价格是否填写

<b>3. 平台风控/限制</b>
→ 商品类目是否在平台限制范围内
→ 价格是否在合理区间（过低或过高都会触发审核）
→ 标题是否包含违禁词

<b>4. 店铺授权问题</b>
→ 店铺授权是否过期？重新授权即可
→ 进入「店铺管理」查看授权状态

<b>5. 系统问题</b>
→ 清除浏览器缓存后重试
→ 刷新页面重试
→ 如果持续报错，请联系技术支持

<b>📞 如果以上都无法解决：</b>
联系人工客服（页面右下角或微信 claw_support）`
    });

    this.knowledgeBase.set('OZON店铺', {
      keywords: ['ozon', 'ozon店铺', '俄罗斯', '俄语', '俄罗斯站', '店铺管理', 'qiming', 'chenjun'],
      response: `🇷🇺 <b>OZON俄罗斯店铺管理</b>

您已绑定的OZON店铺：
• <b>Chenjun Trading</b> — 主营制冷配件
• <b>Chenjun Mall</b> — 综合店铺
• <b>qiming Trading</b> — 主营制冷配件 + LED灯泡

<b>📋 OZON运营要点：</b>

• <b>语言：</b>商品标题和描述建议用俄语，转化率高30%+
• <b>物流：</b>支持跨境直发和本地仓，建议用平台物流FBO
• <b>定价：</b>建议利润率≥50%，俄罗斯消费者对价格敏感
• <b>品类：</b>制冷配件和LED灯泡在OZON上竞争较小，毛利高

<b>🚀 常用操作：</b>
• 切换店铺：在「店铺管理」一键切换
• 查看数据：在「工作台」查看各店铺销售情况
• 批量上架：使用「智能铺货」同时发布到多个店铺
• 数据同步：系统自动同步订单和库存

有什么具体问题吗？`
    });

    this.knowledgeBase.set('AI生成', {
      keywords: ['AI', '生成', '图片生成', '文案', '智能'],
      response: `AI生成功能说明：

**AI图片生成**
- 基于商品原图重新生成
- 参考竞品爆款风格
- 自动优化背景和构图
- 生成符合TikTok审美的图片

**AI文案生成**
- 自动生成英文标题
- 编写商品描述
- 提炼5个核心卖点
- 参考竞品爆款文案

**竞品分析**
- 全网搜索相似商品
- 分析销量、价格、评价
- 提取爆款元素
- 给出优化建议

**使用建议**
- 提供清晰的商品图片效果更好
- 可以多次生成选择最佳结果
- 生成内容可以手动编辑调整

有什么具体想了解的？`
    });

    this.knowledgeBase.set('账号授权', {
      keywords: ['登录', '授权', '账号', '店铺', '绑定', '注册', '开通', '添加', '入驻'],
      response: `🔗 <b>店铺绑定与账号管理</b>

<b>支持绑定的平台：</b>
• 🇷🇺 OZON 俄罗斯 — 已绑定3个店铺
• 🇸🇬 TikTok Shop 新加坡 — 可绑定
• 🇺🇸 YouTube — 视频发布（即将支持）

<b>📝 如何绑定新店铺：</b>
1. 进入「店铺管理」页面
2. 点击「添加店铺」
3. 选择平台（OZON/TikTok等）
4. 输入API信息或扫码授权
5. 绑定成功即可使用

<b>OZON店铺绑定需要：</b>
• <b>Client ID</b> — 在OZON Seller Center获取
• <b>API Key</b> — 在OZON Seller Center生成

<b>🔐 安全说明</b>
• API信息加密存储，不会泄露
• 一个会员账号可以绑定多个店铺
• 会员等级决定可绑定的店铺数量上限
• 支持随时解绑和切换

<b>当前您的店铺：</b>
3个OZON店铺已绑定（Chenjun Trading / Chenjun Mall / qiming Trading）
想绑定更多店铺吗？`
    });

    this.knowledgeBase.set('会员权益', {
      keywords: ['会员', '套餐', '收费', '多少钱', '价格', '付费', '升级', '免费', 'vip', 'pro', '企业', '权益'],
      response: `⭐ <b>会员权益说明</b>

<b>🆓 免费版</b>
• 绑定1个店铺
• 每月50次AI客服咨询
• 基础定价计算器
• 每日数据简报

<b>💎 专业版 （Pro）</b>
• 绑定最多5个店铺
• 无限AI客服咨询
• AI智能选品分析
• 高级定价策略建议
• 多平台数据看板
• 自动生成运营周报

<b>🏢 企业版</b>
• 绑定最多20个店铺
• 所有专业版功能
• 专属AI运营顾问
• API接口开放
• 团队协作功能
• 优先技术支持
• 定制化功能开发

<b>当前您的会员：</b>企业版 ✅
已有3个OZON店铺绑定，可使用所有功能

想了解某个功能的具体用法吗？`
    });

    this.knowledgeBase.set('功能介绍', {
      keywords: ['功能', '有什么功能', '能干什么', '用途', '特色', '优势', '能用'],
      response: `🚀 <b>Claw 跨境智造 — 核心功能</b>

<b>🤖 AI智能铺货</b>
• 链接抓取：1688/淘宝链接→自动提取→AI优化→一键发布到OZON
• 多语言翻译：中文→俄语/英语，标题描述自动适配
• 批量操作：一次上架多个商品，效率翻倍

<b>💰 智能定价计算器</b>
• 成本自动核算
• 竞品价格参考
• 建议售价和利润分析

<b>📊 数据看板</b>
• 各店铺销售总览
• 订单趋势分析
• 热销商品排行
• 利润核算

<b>🎬 数字人视频</b>
• 自动生成产品展示视频
• 多语言配音
• 适用于TikTok/YouTube

<b>🏪 多店铺管理</b>
• 绑定多个OZON店铺
• 一键切换
• 统一数据看板

想了解哪个功能的详细用法？`
    });

    this.knowledgeBase.set('数据问题', {
      keywords: ['数据', '分析', '报表', '统计', '销售', '订单', '销量', '利润', '赚了多少'],
      response: `📊 <b>数据与报表</b>

<b>可查看的数据：</b>
• <b>销售总览：</b>各店铺的今日、本周、本月销售额
• <b>订单管理：</b>最新订单、待处理订单
• <b>利润分析：</b>销售额 - 成本 - 运费 = 净利润
• <b>热销商品：</b>按销量排名，分析爆款特征
• <b>趋势图表：</b>销售额/订单量变化趋势

<b>查看入口：</b>
「工作台」→「数据看板」→ 选择店铺和时间范围

<b>数据同步说明：</b>
• 系统每4小时自动同步一次
• 也可以手动点击「立即同步」
• 最新订单实时更新

需要我帮您看具体哪个数据？`
    });

    this.knowledgeBase.set('人工客服', {
      keywords: ['人工', '真人', '转人工', '联系', '电话', '微信', '投诉'],
      response: `📞 <b>联系人工客服</b>

<b>在线时间</b>
• 工作日：9:00 - 21:00
• 周末：10:00 - 18:00

<b>📱 联系方式</b>
• 微信：claw_support
• 邮箱：support@claw.ai

<b>⚡ 紧急问题</b>
系统故障或账号异常 → 建议立即微信联系

<b>💬 转接人工</b>
· 您可以直接描述问题，我先尝试帮您解决
· 如果解决不了，再帮您转接人工客服

有什么问题我可以先帮您看看？`
    });
  }

  // 获取或创建会话
  getOrCreateSession(sessionId) {
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        context: {}
      });
    }

    const session = this.sessions.get(sessionId);
    session.lastActivity = new Date();
    return { sessionId, session };
  }

  // 知识库匹配
  matchKnowledgeBase(message) {
    const lowerMessage = message.toLowerCase();
    
    for (const [topic, data] of this.knowledgeBase) {
      for (const keyword of data.keywords) {
        if (lowerMessage.includes(keyword.toLowerCase())) {
          return data.response;
        }
      }
    }
    return null;
  }

  // 保存消息到数据库
  async saveMessageToDB(sessionId, role, content, source) {
    if (useMemoryMode) return;
    try {
      await pool.query(
        `INSERT INTO chat_messages (session_id, role, content, source) VALUES ($1, $2, $3, $4)`,
        [sessionId, role, content, source || null]
      );
    } catch (err) {
      // 静默失败，不影响对话流程
      console.error('[AI客服] 保存消息失败:', err.message);
    }
  }

  // 从数据库加载会话历史
  async loadHistoryFromDB(sessionId, limit = 20) {
    if (useMemoryMode) return [];
    try {
      const result = await pool.query(
        `SELECT role, content, source, created_at as timestamp 
         FROM chat_messages 
         WHERE session_id = $1 
         ORDER BY created_at ASC 
         LIMIT $2`,
        [sessionId, limit]
      );
      return result.rows.map(r => ({
        role: r.role,
        content: r.content,
        source: r.source,
        timestamp: r.timestamp
      }));
    } catch (err) {
      console.error('[AI客服] 加载历史失败:', err.message);
      return [];
    }
  }

  // 关联会话与用户
  async linkSessionToUser(sessionId, userId) {
    if (useMemoryMode) return;
    try {
      await pool.query(
        `INSERT INTO chat_sessions (session_id, user_id) VALUES ($1, $2)
         ON CONFLICT (session_id) DO UPDATE SET user_id = EXCLUDED.user_id`,
        [sessionId, userId]
      );
    } catch (err) {
      console.error('[AI客服] 关联会话失败:', err.message);
    }
  }

  // 获取用户最近的会话列表
  async getUserSessions(userId, limit = 10) {
    if (useMemoryMode) return [];
    try {
      // 获取用户最近的会话，并带上首条消息预览
      const result = await pool.query(
        `SELECT cs.session_id, cs.created_at, cs.updated_at,
                (SELECT content FROM chat_messages 
                 WHERE session_id = cs.session_id AND role = 'user' 
                 ORDER BY created_at ASC LIMIT 1) as first_question,
                (SELECT content FROM chat_messages 
                 WHERE session_id = cs.session_id AND role = 'assistant' 
                 ORDER BY created_at DESC LIMIT 1) as last_reply
         FROM chat_sessions cs
         WHERE cs.user_id = $1
         ORDER BY cs.updated_at DESC
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (err) {
      console.error('[AI客服] 获取会话列表失败:', err.message);
      return [];
    }
  }

  // 主对话方法
  async chat(message, sessionId, context = {}) {
    const { sessionId: sid, session } = this.getOrCreateSession(sessionId);

    // 如果是新会话（没有消息），尝试从数据库加载历史
    if (session.messages.length === 0) {
      const history = await this.loadHistoryFromDB(sid);
      if (history.length > 0) {
        session.messages = history;
      }
    }
    
    // 如果传入了userId，关联会话
    if (context.userId) {
      await this.linkSessionToUser(sid, context.userId);
    }
    
    // 添加用户消息
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // 保存到数据库
    await this.saveMessageToDB(sid, 'user', message);

    // 限制历史消息数量（保留最近30轮，充分利用长上下文）
    if (session.messages.length > 60) {
      session.messages = session.messages.slice(-60);
    }

    let response;
    let source = 'knowledge';

    // 1. 先尝试知识库匹配
    const knowledgeResponse = this.matchKnowledgeBase(message);
    
    if (knowledgeResponse) {
      response = knowledgeResponse;
    } else {
      // 2. 知识库未匹配，调用AI模型
      source = 'ai';
      try {
        response = await this.callAIModel(message, session.messages, context);
      } catch (error) {
        console.error('AI模型调用失败:', error);
        response = '抱歉，我暂时无法处理这个问题。请稍后再试，或联系人工客服。';
        source = 'error';
      }
    }

    // 添加助手回复
    session.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      source
    });

    // 保存到数据库
    await this.saveMessageToDB(sid, 'assistant', response, source);

    return {
      sessionId: sid,
      response,
      source
    };
  }

  // 调用AI模型
  async callAIModel(message, history, context) {
    // 默认使用 bailian（百炼），因为我们有有效的百炼 API key
    const provider = process.env.AI_PROVIDER || 'bailian';
    
    // 构建系统提示词
    const systemPrompt = `你是Claw跨境智造平台的AI运营顾问"小芸"，专业帮助跨境卖家解决电商运营问题。

你的身份：Claw平台首席AI运营顾问

你的职责范围：
1. 解答OZON/TikTok等平台的店铺管理、商品上架、定价策略等问题
2. 指导用户使用AI铺货、智能定价、多语言发布等功能
3. 分析销售数据和运营指标，提供优化建议
4. 处理常见报错和故障排查
5. 介绍平台功能和会员权益

回答风格：
- 专业且亲切：像一个懂行的运营顾问，不是冷冰冰的机器人
- 结构化：用分段、要点让回复清晰易读（纯文本，不要用HTML标签）
- 实用导向：给出可操作的具体建议，而不是泛泛而谈
- 有温度：适当使用emoji，表达理解和共情
- 坦诚：不确定或超出能力的，诚实告知并引导联系人工客服

用户上下文信息：
- 当前页面：${context.page || '客户中心'}
- 用户环境：${context.userAgent ? 'Web' : '未知'}
- 记住用户之前问过什么，保持对话连贯性。用户可能会接着上次的话题继续问。`;

    // 构建消息历史
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: message }
    ];

    // 根据provider调用不同模型
    switch (provider) {
      case 'deepseek':
        return await this.callDeepSeek(messages);
      case 'openai':
        return await this.callOpenAI(messages);
      case 'bailian':
        return await this.callBailian(messages);
      default:
        return await this.callDeepSeek(messages);
    }
  }

  // DeepSeek API
  async callDeepSeek(messages) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DeepSeek API Key未配置');
    }

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;
  }

  // OpenAI API
  async callOpenAI(messages) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API Key未配置');
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content;
  }

  // 百炼/通义千问 API
  async callBailian(messages) {
    const apiKey = process.env.BAILIAN_API_KEY || 'sk-8a07c75081df49ac877d6950a95b06ec';
    if (!apiKey || apiKey === 'your_bailian_api_key') {
      throw new Error('百炼 API Key未配置');
    }

    const response = await axios.post(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        model: 'qwen-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;
  }

  // 获取会话统计
  getSessionStats() {
    const now = new Date();
    let activeSessions = 0;
    let totalMessages = 0;

    for (const session of this.sessions.values()) {
      // 30分钟内活跃的会话
      if (now - session.lastActivity < 30 * 60 * 1000) {
        activeSessions++;
      }
      totalMessages += session.messages.length;
    }

    return {
      totalSessions: this.sessions.size,
      activeSessions,
      totalMessages,
      knowledgeBaseSize: this.knowledgeBase.size
    };
  }

  // 清理过期会话
  cleanupSessions() {
    const now = new Date();
    const expiredSessions = [];

    for (const [id, session] of this.sessions) {
      // 24小时无活动的会话
      if (now - session.lastActivity > 24 * 60 * 60 * 1000) {
        expiredSessions.push(id);
      }
    }

    for (const id of expiredSessions) {
      this.sessions.delete(id);
    }

    return expiredSessions.length;
  }
}

// 单例模式
let instance = null;

export const getInstance = () => {
  if (!instance) {
    instance = new AIChatEngine();
  }
  return instance;
};

export { AIChatEngine };
