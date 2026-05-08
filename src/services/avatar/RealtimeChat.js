/**
 * RealtimeChat.js — 直播实时互动引擎 v1.0
 * 
 * 功能：
 * - WebSocket服务，接收直播间实时消息/弹幕
 * - 调用LLM AI自动生成回复
 * - 触发TTS语音播报
 * - 敏感词过滤
 * - 礼物/点赞统计
 * 
 * 架构：
 *   直播间弹幕 → WebSocket → AI分析 → 生成回复 → TTS播报
 *                             ↓
 *                          敏感词拦截
 */

import { EventEmitter } from 'events';
import http from 'http';
import { WebSocketServer } from 'ws';

// 敏感词列表（翡翠珠宝直播场景）
const SENSITIVE_WORDS = [
  '假货', '骗子', '坑人', '垃圾', '骗钱', '滚',
  '贵了', '不值', '智商税', '收割',
  '投诉', '举报', '退款', '差评',
  '骂人词汇', 'SB', '傻逼', 'cnm',
];

// 预设快捷回复模板
const QUICK_REPLIES = {
  welcome: [
    '欢迎{user}来到直播间！今天给大家带来云南瑞丽源头的翡翠好货~',
    '欢迎{user}！家人们点个关注不迷路！',
    '感谢{user}的支持！新进来的家人右上角点个关注~',
  ],
  product: [
    '这款是我们瑞丽工厂直销的，没有中间商赚差价！',
    '家人们看好了，真正缅甸A货翡翠，带证书的！',
    '这个种水这个色，商场至少要加3倍价格！',
  ],
  price: [
    '价格直接给到底，今天新号开播不赚钱，只为交朋友！',
    '家人们，这个价格只限今天直播间，下了播就恢复原价！',
    '外面你找不到这个价的，因为我们是一手货源！',
  ],
  thanks: [
    '感谢{user}的支持！',
    '谢谢{user}！祝老板发财！',
    '感谢{user}的大气！',
  ],
  goodbye: [
    '感谢家人们的陪伴，明天同一时间不见不散！',
    '直播马上结束了，没点关注的抓紧点个关注，明天继续放漏！',
  ],
  generic: [
    '家人们点点赞，支持一下主播！',
    '新来的家人右上角点个关注，开播第一时间通知你！',
    '觉得主播讲得好的，给主播点点赞！',
  ],
};

/**
 * 实时聊天引擎
 */
class RealtimeChat extends EventEmitter {
  constructor(options = {}) {
    super();
    this.port = options.port || 3002;
    this.host = options.host || '0.0.0.0';
    this.autoReply = options.autoReply !== false;  // 默认开启自动回复
    this.replyDelay = options.replyDelay || 3000;    // 自动回复延迟(ms)
    this.filterSensitive = options.filterSensitive !== false;
    this.maxHistory = options.maxHistory || 200;
    this.llmProvider = options.llmProvider || null;  // LLM函数引用
    
    // 内部状态
    this.wss = null;
    this.server = null;
    this.clients = new Set();
    this.messageHistory = [];
    this.stats = {
      totalMessages: 0,
      totalLikes: 0,
      totalGifts: 0,
      uniqueUsers: new Set(),
      startTime: null,
    };
    
    // 回复冷却（同一用户30秒内不重复回复）
    this.replyCooldown = new Map();
    this.cooldownMs = options.cooldownMs || 30000;
  }

  /**
   * 启动WebSocket服务
   */
  start() {
    if (this.wss) {
      console.warn('[RealtimeChat] WebSocket已在运行');
      return this;
    }

    this.server = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', clients: this.clients.size }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      this.clients.add(ws);
      this.stats.uniqueUsers.add(clientId);
      this.stats.startTime = this.stats.startTime || Date.now();

      console.log(`[RealtimeChat] 客户端连接: ${clientId} (来自 ${req.socket.remoteAddress})`);

      // 发送欢迎消息和当前状态
      ws.send(JSON.stringify({
        type: 'welcome',
        clientId,
        stats: this.getStats(),
        recentMessages: this.messageHistory.slice(-10),
      }));

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(message, ws, clientId);
        } catch (e) {
          console.error('[RealtimeChat] 消息解析失败:', e.message);
          ws.send(JSON.stringify({ type: 'error', message: '消息格式错误' }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[RealtimeChat] 客户端断开: ${clientId}`);
      });

      ws.on('error', (err) => {
        console.error(`[RealtimeChat] WebSocket错误 (${clientId}):`, err.message);
        this.clients.delete(ws);
      });
    });

    this.server.listen(this.port, this.host, () => {
      console.log(`[RealtimeChat] WebSocket服务启动在 ${this.host}:${this.port}`);
      this.emit('started', { port: this.port });
    });

    return this;
  }

  /**
   * 处理收到的消息
   */
  async handleMessage(message, ws, clientId) {
    const { type, text, user, platform } = message;

    this.stats.totalMessages++;

    switch (type) {
      case 'chat':
        // 弹幕消息
        await this.handleChatMessage(text, user, platform, ws);
        break;

      case 'like':
        this.stats.totalLikes += message.count || 1;
        this.broadcast({ type: 'like', user, count: message.count || 1 });
        break;

      case 'gift':
        this.stats.totalGifts++;
        this.broadcast({
          type: 'gift',
          user,
          giftName: message.giftName || '礼物',
          count: message.count || 1,
          value: message.value || 0,
        });
        // 礼物自动感谢
        if (this.autoReply) {
          const thanks = this.pickReply('thanks', { user: user || '老板' });
          this.scheduleReply(thanks, user);
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      case 'command':
        // 主播控制命令
        await this.handleCommand(message.command, message.params, ws);
        break;

      default:
        console.log(`[RealtimeChat] 未知消息类型: ${type}`);
    }
  }

  /**
   * 处理弹幕聊天消息
   */
  async handleChatMessage(text, user, platform, ws) {
    if (!text) return;

    // 敏感词过滤
    if (this.filterSensitive) {
      const filtered = this.filterText(text);
      if (filtered.blocked) {
        console.log(`[RealtimeChat] 敏感词拦截: "${text}" by ${user}`);
        // 静默处理，不广播
        return;
      }
    }

    const chatMsg = {
      type: 'chat',
      user: user || '观众',
      text,
      platform: platform || 'web',
      timestamp: Date.now(),
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };

    // 添加到历史
    this.messageHistory.push(chatMsg);
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.shift();
    }

    // 广播给所有客户端
    this.broadcast(chatMsg);

    // AI自动回复
    if (this.autoReply) {
      const reply = await this.generateAIReply(text, user);
      if (reply) {
        this.scheduleReply(reply, user);
      }
    }

    this.emit('message', chatMsg);
  }

  /**
   * AI自动回复生成
   */
  async generateAIReply(text, user) {
    // 冷却检查
    const lastReply = this.replyCooldown.get(user);
    if (lastReply && Date.now() - lastReply < this.cooldownMs) {
      return null;
    }

    // 简单意图识别
    const lowerText = text.toLowerCase().trim();
    
    // 问产品
    if (/什么(东西|产品|料|种|水)|介绍一下|看看|展示/i.test(text)) {
      return this.pickReply('product');
    }
    
    // 问价格
    if (/多(少钱|少米)|价格|怎么卖|便宜|贵/i.test(text)) {
      return this.pickReply('price');
    }
    
    // 打招呼
    if (/你好|哈喽|hello|hi|在吗|来了/i.test(text)) {
      return this.pickReply('welcome', { user: user || '家人' });
    }
    
    // 道别
    if (/走了|拜拜|再见|下次|明天/i.test(text)) {
      return this.pickReply('goodbye');
    }

    // 有LLM就用LLM
    if (this.llmProvider) {
      try {
        const context = this.messageHistory.slice(-5).map(m => `${m.user}: ${m.text}`).join('\n');
        const prompt = `你是一个翡翠珠宝直播间的主播。观众说了："${text}"。请用自然口语化的方式回复，20字以内，要有互动感。前文：\n${context}`;
        
        const llmReply = await this.llmProvider(prompt);
        if (llmReply && typeof llmReply === 'string') {
          return llmReply.substring(0, 100);
        }
      } catch (e) {
        console.warn('[RealtimeChat] LLM回复失败:', e.message);
      }
    }

    // 兜底：随机通用回复
    if (Math.random() < 0.3) { // 30%概率回复，避免过度
      return this.pickReply('generic');
    }

    return null;
  }

  /**
   * 延迟发送回复（模拟人类反应时间）
   */
  scheduleReply(text, user) {
    const delay = this.replyDelay + Math.random() * 2000; // 3-5秒随机延迟
    setTimeout(() => {
      this.broadcast({
        type: 'reply',
        user: 'AI主播',
        text,
        timestamp: Date.now(),
        id: `reply_${Date.now()}`,
      });
      this.replyCooldown.set(user, Date.now());
      this.emit('reply', { text, targetUser: user });
    }, delay);
  }

  /**
   * 文本敏感词过滤
   */
  filterText(text) {
    const lowerText = text.toLowerCase();
    for (const word of SENSITIVE_WORDS) {
      if (lowerText.includes(word.toLowerCase())) {
        return { blocked: true, word };
      }
    }
    return { blocked: false };
  }

  /**
   * 随机选择预设回复
   */
  pickReply(type, vars = {}) {
    const templates = QUICK_REPLIES[type] || QUICK_REPLIES.generic;
    let reply = templates[Math.floor(Math.random() * templates.length)];
    // 替换变量
    Object.entries(vars).forEach(([key, value]) => {
      reply = reply.replace(`{${key}}`, value);
    });
    return reply;
  }

  /**
   * 处理主播控制命令
   */
  async handleCommand(command, params, ws) {
    switch (command) {
      case 'clear-chat':
        this.messageHistory = [];
        this.broadcast({ type: 'chat-cleared' });
        break;
      case 'mute':
        // 禁言用户
        this.broadcast({ type: 'user-muted', user: params?.user });
        break;
      case 'announce':
        // 主播公告
        if (params?.text) {
          this.broadcast({ type: 'announcement', text: params.text });
        }
        break;
      default:
        console.log(`[RealtimeChat] 未知命令: ${command}`);
    }
  }

  /**
   * 广播消息给所有客户端
   */
  broadcast(message) {
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(data);
        } catch (e) {
          console.error('[RealtimeChat] 广播失败:', e.message);
          this.clients.delete(client);
        }
      }
    }
  }

  /**
   * 注入LLM提供商
   */
  setLLMProvider(providerFn) {
    this.llmProvider = providerFn;
    console.log('[RealtimeChat] LLM Provider 已设置');
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalMessages: this.stats.totalMessages,
      totalLikes: this.stats.totalLikes,
      totalGifts: this.stats.totalGifts,
      uniqueUsers: this.stats.uniqueUsers.size,
      onlineClients: this.clients.size,
      uptime: this.stats.startTime ? (Date.now() - this.stats.startTime) / 1000 : 0,
      startTime: this.stats.startTime,
    };
  }

  /**
   * 停止服务
   */
  async stop() {
    console.log('[RealtimeChat] 停止服务...');
    
    // 关闭所有WebSocket连接
    for (const client of this.clients) {
      try {
        client.close(1000, '服务器关闭');
      } catch (e) {
        // ignore
      }
    }
    this.clients.clear();

    // 关闭服务器
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          if (this.server) {
            this.server.close(() => {
              this.wss = null;
              this.server = null;
              console.log('[RealtimeChat] 服务已完全停止');
              resolve();
            });
          } else {
            this.wss = null;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

export { RealtimeChat, QUICK_REPLIES, SENSITIVE_WORDS };
