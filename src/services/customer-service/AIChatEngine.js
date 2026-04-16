/**
 * AI客服对话引擎
 * 支持多模型切换、知识库检索、上下文管理
 */

import { OpenAI } from 'openai';
import axios from 'axios';

class AIChatEngine {
  constructor() {
    this.sessions = new Map(); // 会话缓存
    this.knowledgeBase = new Map(); // 知识库
    this.initializeKnowledgeBase();
  }

  // 初始化知识库
  initializeKnowledgeBase() {
    this.knowledgeBase.set('铺货流程', {
      keywords: ['铺货', '上架', '发布', '流程'],
      response: `TikTok铺货有两种模式：

**模式一：链接抓取**
1. 复制1688/淘宝/拼多多商品链接
2. 粘贴到输入框，点击"开始抓取"
3. 系统自动获取商品信息、图片、规格
4. AI分析竞品并生成优化内容
5. 确认后一键发布

**模式二：图片上传**
1. 上传商品图片（最多9张）
2. AI全网搜索相似竞品
3. 分析爆款元素和定价
4. 生成同款商品信息
5. 确认后一键发布

需要我详细说明哪个步骤？`
    });

    this.knowledgeBase.set('定价计算', {
      keywords: ['定价', '价格', '利润', '成本', '计算'],
      response: `智能定价公式：

**基础定价**
- 售价 = (成本 + 运费) ÷ 汇率 × 利润率
- 默认汇率：5.2（新币/人民币）
- 默认利润率：2.5倍（毛利≥50%）
- 取整规则：X.90 结尾

**竞品参考**
- 系统会抓取TikTok同款商品
- 分析竞品价格区间
- 建议定价在竞品中位价

**示例**
成本20元 + 运费15元 = 35元
35 ÷ 5.2 × 2.5 = 16.83新币
取整后：16.90新币

需要我帮你计算具体商品的价格吗？`
    });

    this.knowledgeBase.set('发布失败', {
      keywords: ['失败', '错误', '发布不了', '提交失败', '报错'],
      response: `发布失败的常见原因及解决方法：

**1. 网络问题**
- 检查网络连接
- 刷新页面重试
- 切换网络环境

**2. 账号问题**
- 确认TikTok账号已登录
- 检查账号状态是否正常
- 重新授权店铺

**3. 商品信息不完整**
- 检查必填项是否填写
- 图片数量是否符合要求
- 规格信息是否完整

**4. 平台限制**
- 检查是否触发风控
- 商品类目是否受限
- 价格是否在合理区间

**5. 系统问题**
- 清除浏览器缓存
- 重启浏览器
- 联系技术支持

如果问题持续，请联系人工客服处理。`
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
      keywords: ['登录', '授权', '账号', '店铺', '绑定'],
      response: `店铺授权说明：

**TikTok Shop授权**
1. 进入"店铺管理"页面
2. 点击"添加店铺"
3. 选择"TikTok Shop"
4. 扫码或输入账号密码登录
5. 授权成功后即可使用

**支持的店铺**
- TikTok Shop 新加坡
- TikTok Shop 马来西亚
- TikTok Shop 菲律宾
- OZON 俄罗斯

**常见问题**
- 授权有效期30天，到期需重新授权
- 一个账号可以绑定多个店铺
- 支持随时切换店铺

**安全说明**
- 账号信息加密存储
- 不会保存密码
- 使用官方API接口

需要授权新店铺吗？`
    });

    this.knowledgeBase.set('人工客服', {
      keywords: ['人工', '客服', '联系', '电话', '微信'],
      response: `联系人工客服：

**在线时间**
- 工作日：9:00 - 21:00
- 周末：10:00 - 18:00

**联系方式**
- 微信：claw_support
- 邮箱：support@claw.ai
- 电话：400-XXX-XXXX

**紧急问题**
如果是系统故障或紧急问题，请直接电话联系。

**反馈建议**
欢迎提出功能建议和使用反馈，我们会持续优化产品体验。

需要我帮你转接人工客服吗？`
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

  // 主对话方法
  async chat(message, sessionId, context = {}) {
    const { sessionId: sid, session } = this.getOrCreateSession(sessionId);
    
    // 添加用户消息
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // 限制历史消息数量（保留最近10轮）
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
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

    return {
      sessionId: sid,
      response,
      source
    };
  }

  // 调用AI模型
  async callAIModel(message, history, context) {
    const provider = process.env.AI_PROVIDER || 'deepseek';
    
    // 构建系统提示词
    const systemPrompt = `你是Claw智能客服助手"小芸"，专业帮助用户解决TikTok电商铺货相关问题。

你的职责：
1. 解答铺货流程、定价计算、发布操作等问题
2. 指导用户使用AI生成、竞品分析等功能
3. 处理常见错误和故障排查
4. 提供运营建议和最佳实践

回答风格：
- 友好亲切，使用emoji增加亲和力
- 结构清晰，使用序号和分段
- 具体实用，给出可操作的建议
- 如果无法回答，引导用户联系人工客服

当前页面：${context.page || '未知'}
用户环境：${context.userAgent ? 'Web' : '未知'}`;

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
    const apiKey = process.env.BAILIAN_API_KEY;
    if (!apiKey) {
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
