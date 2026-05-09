/**
 * AgentAIManager.js — 4子AI管理系统
 * 
 * 管理4个独立运行的AI Agent，每个对应一个主播形象。
 * 每个Agent具备：
 *   1. 独立记忆（聊天历史 + 知识库）
 *   2. 数据库问答记录存取
 *   3. 直播话术自动生成与优化
 *   4. 接入LiveStreamEngine自动回复
 * 
 * 4个Agent:
 *   xiaorui  → 小瑞（温柔亲切，翡翠珠宝）
 *   xiaoqing → 小青（活泼元气，快节奏带货）
 *   xiaoyun  → 小云（磁性低沉，高端鉴赏）
 *   xiaowang → 小王（专业干练，技术科普）
 */

import fs from 'fs';
import path from 'path';
import { pool, useMemoryMode } from '../../config/database.js';

// ─── Agent 人格配置 ───
const AGENT_PERSONALITIES = {
  xiaorui: {
    id: 'xiaorui',
    name: '小瑞',
    gender: 'female',
    style: 'warm',
    systemPrompt: `你是小瑞，一个温柔亲切的翡翠女主播，擅长慢直播节奏。

你的性格特点：
- 声音温柔，语速适中，给人亲切感
- 懂翡翠：缅甸A货、种水色、鉴定证书、假一赔十
- 风格温馨：像朋友聊天一样介绍产品
- 擅长讲故事：每件翡翠背后的文化寓意

话术风格：
- 开场："欢迎来到云南瑞丽翡翠直播间，家人们下午好~"
- 介绍："这一件是缅甸A货冰种翡翠手镯，种水通透，底子干净..."
- 互动："家人们觉得这个颜色怎么样？喜欢飘花还是纯色的？"
- 收尾："感谢大家的陪伴，明天同一时间咱们不见不散~"

产品知识库：
- 翡翠种类：冰种、玻璃种、糯种、豆种
- 颜色：帝王绿、阳绿、紫罗兰、墨翠、飘花
- 形制：手镯、吊坠、蛋面、挂件、摆件
- 鉴定：国检证书(NGTC)、省检证书`,
  },
  xiaoqing: {
    id: 'xiaoqing',
    name: '小青',
    gender: 'female',
    style: 'lively',
    systemPrompt: `你是小青，一个活泼元气的女主播，擅长快节奏带货和秒杀氛围。

你的性格特点：
- 声音清脆响亮，语速快，充满活力
- 懂童装：面料安全、婴儿A类标准、款式搭配
- 氛围制造者：倒计时、限量、粉丝福利
- 宝妈视角：懂妈妈们关心的点

话术风格：
- 开场："哈喽宝宝们！欢迎来到直播间，今天福利超级多！"
- 产品："这件纯棉连体衣是A类面料，给宝宝穿最放心！"
- 限时："只有50件！3、2、1上链接！"
- 互动："家里有男宝还是女宝呀？评论区告诉主播~"

产品知识库：
- 面料：纯棉、有机棉、竹纤维、莫代尔
- 安全标准：A类（婴幼儿）、B类（直接接触）
- 品类：连体衣、T恤、裤子、外套、套装
- 季节：春夏薄款、秋冬加厚
- 尺码：66-160cm（0-12岁）`,
  },
  xiaoyun: {
    id: 'xiaoyun',
    name: '小云',
    gender: 'male',
    style: 'magnetic',
    systemPrompt: `你是小云，一个磁性低沉的男主播，擅长高端翡翠鉴赏和收藏投资讲解。

你的性格特点：
- 声音低沉磁性，语速沉稳，有高级感
- 懂翡翠文化：千年玉文化、收藏价值、投资增值
- 专业眼光：从种水色工瑕全方位品鉴
- 讲品味：翡翠不只是饰品，更是传承

话术风格：
- 开场："各位藏友好，欢迎来到小云的翡翠品鉴直播间。"
- 品鉴："这件帝王绿蛋面，颜色浓郁饱满，荧光感强..."
- 科普："冰种的形成需要高压低温的地质环境..."
- 收藏："现在收藏高货翡翠，三年后看都是白菜价。"

产品知识库：
- 种水分级：玻璃种>冰种>糯冰种>糯种
- 颜色等级：帝王绿>阳绿>苹果绿>豆绿
- 工艺：雕工、镶嵌、抛光
- 收藏价值：稀缺性、品质、尺寸、出处
- 市场行情：缅甸公盘、国内拍卖会价格参考`,
  },
  xiaowang: {
    id: 'xiaowang',
    name: '小王',
    gender: 'male',
    style: 'professional',
    systemPrompt: `你是小王，一个专业干练的男主播，擅长制冷配件行业知识科普和技术讲解。

你的性格特点：
- 声音专业沉稳，条理清晰，可信度高
- 懂制冷：压缩机、冷凝器、蒸发器、制冷剂
- 技术派：讲参数、讲原理、讲解决方案
- 实用导向：帮维修师傅和采购解决实际问题

话术风格：
- 开场："各位师傅好，欢迎来到小王的技术分享直播间。"
- 产品："这款R410A压缩机，排量30cc，COP值3.2..."
- 技术："空调不制冷，先查这两点：制冷剂压力和电容..."
- 问答："师傅刚才问的这个问题很专业，我来详细解答..."

产品知识库：
- 压缩机：涡旋式、活塞式、转子式
- 制冷剂：R22、R410A、R32、R134a
- 配件：冷凝器、蒸发器、膨胀阀、四通阀
- 工具：压力表、真空泵、检漏仪、焊枪
- 常见故障：不制冷、噪音大、泄漏、冰堵`,
  },
};

// ─── AI Agent 类 ───
class AIAgent {
  constructor(agentId) {
    const config = AGENT_PERSONALITIES[agentId];
    if (!config) throw new Error(`Agent ${agentId} not found`);

    this.id = agentId;
    this.name = config.name;
    this.personality = config;
    this.systemPrompt = config.systemPrompt;
    
    // 对话历史
    this.conversations = new Map(); // 按sessionId存储
    
    // 记忆存储
    this.memoryPath = path.join(process.cwd(), 'data', 'ai-memory', agentId);
    if (!fs.existsSync(this.memoryPath)) {
      fs.mkdirSync(this.memoryPath, { recursive: true });
    }
    
    // 知识库（从数据库加载）
    this.knowledgeBase = {
      productFAQs: [],     // 产品问答
      viewerQuestions: [], // 观众常见问题
      scripts: [],         // 历史话术
      tips: [],            // 经验笔记
    };

    console.log(`[AgentAI] ✅ ${config.name} (${agentId}) 已初始化`);
  }

  /**
   * 获取AI回复（对接AI模型）
   */
  async getReply(context) {
    const { message, sessionId, roomId } = context;
    
    // 从数据库获取历史问答
    const historyQA = await this.getHistoryQA(roomId, 20);
    
    // 获取会话历史
    let session = this.conversations.get(sessionId || 'default');
    if (!session) {
      session = [
        { role: 'system', content: this.systemPrompt },
        { role: 'system', content: `📚 历史问答参考(最近20条):\n${historyQA.slice(-10).map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n')}` },
      ];
      this.conversations.set(sessionId || 'default', session);
    }

    // 添加用户消息
    session.push({ role: 'user', content: message });

    // 构建AI请求
    const aiResponse = await this._callAI(session);
    
    // 保存到会话
    session.push({ role: 'assistant', content: aiResponse });
    
    // 保存到数据库
    await this.saveQA(roomId, message, aiResponse);
    
    return aiResponse;
  }

  /**
   * 从数据库获取历史问答
   */
  async getHistoryQA(roomId, limit = 50) {
    try {
      if (useMemoryMode) {
        return this.knowledgeBase.viewerQuestions.slice(-limit);
      }
      const result = await pool.query(
        `SELECT question, answer, created_at FROM ai_qa_records 
         WHERE agent_id = $1 AND room_id = $2 
         ORDER BY created_at DESC LIMIT $3`,
        [this.id, roomId || '', limit]
      );
      return result.rows.reverse();
    } catch (e) {
      // 表不存在时返回空
      return [];
    }
  }

  /**
   * 获取所有房间的问答分析（用于智能优化）
   */
  async getAllQAForOptimization(agentId, limit = 200) {
    try {
      if (useMemoryMode) {
        return this.knowledgeBase.viewerQuestions.slice(-limit);
      }
      const result = await pool.query(
        `SELECT question, answer, room_id, created_at FROM ai_qa_records 
         WHERE agent_id = $1 
         ORDER BY created_at DESC LIMIT $2`,
        [agentId || this.id, limit]
      );
      return result.rows;
    } catch (e) {
      return [];
    }
  }

  /**
   * 保存问答记录到数据库
   */
  async saveQA(roomId, question, answer) {
    try {
      if (useMemoryMode) {
        this.knowledgeBase.viewerQuestions.push({
          question,
          answer,
          room_id: roomId || 'default',
          created_at: new Date().toISOString(),
        });
        return true;
      }
      await pool.query(
        `INSERT INTO ai_qa_records (agent_id, room_id, question, answer) 
         VALUES ($1, $2, $3, $4)`,
        [this.id, roomId || '', question, answer]
      );
      return true;
    } catch (e) {
      console.warn(`[AgentAI] 保存QA失败:`, e.message);
      return false;
    }
  }

  /**
   * 保存知识笔记
   */
  async saveTip(content, tags = []) {
    const tip = {
      content,
      tags,
      created_at: new Date().toISOString(),
    };
    
    try {
      if (useMemoryMode) {
        this.knowledgeBase.tips.push(tip);
        return true;
      }
      await pool.query(
        `INSERT INTO ai_knowledge_tips (agent_id, content, tags) VALUES ($1, $2, $3)`,
        [this.id, content, JSON.stringify(tags)]
      );
    } catch (e) {
      // 存本地文件兜底
      const memoFile = path.join(this.memoryPath, 'tips.json');
      const tips = JSON.parse(fs.readFileSync(memoFile, 'utf-8').catch(() => '[]'));
      tips.push(tip);
      fs.writeFileSync(memoFile, JSON.stringify(tips, null, 2));
    }
    return true;
  }

  /**
   * 生成直播话术（结合数据库历史优化）
   */
  async generateScript(context) {
    const { productName, productDesc, topic, roomId } = context;
    
    // 获取历史问答中相关的问题
    const historyQA = await this.getHistoryQA(roomId, 30);
    const commonQuestions = historyQA.slice(-10).map(q => q.question).filter(Boolean);

    const prompt = `你是一个直播主播${this.name}，请根据以下信息生成一段自然流畅的直播话术（约100-200字）：

${productName ? `产品：${productName}` : ''}
${productDesc ? `描述：${productDesc}` : ''}
${topic ? `主题：${topic}` : ''}

${commonQuestions.length > 0 ? `最近观众常问的问题（回复时可引用）：\n${commonQuestions.map(q => `- ${q}`).join('\n')}` : ''}

要求：
1. 符合${this.name}的性格特点
2. 自然口语化，不要说教
3. 如果存在常见问题，在话术中自然地解答
4. 结尾引导互动`;

    return await this._callAI([
      { role: 'system', content: this.systemPrompt },
      { role: 'system', content: `📚 最近常见问题参考:\n${commonQuestions.map(q => `- ${q}`).join('\n')}` },
      { role: 'user', content: prompt },
    ]);
  }

  /**
   * 分析问答数据，生成优化建议
   */
  async analyzeAndOptimize(roomId) {
    const allQA = await this.getAllQAForOptimization(this.id, 100);
    
    if (allQA.length < 5) {
      return { needsOptimization: false, message: '数据量不足，暂不需要优化' };
    }

    // 统计高频问题
    const questionMap = new Map();
    allQA.forEach(qa => {
      const key = qa.question.substring(0, 20);
      questionMap.set(key, (questionMap.get(key) || 0) + 1);
    });

    const topQuestions = [...questionMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([q, count]) => ({ question: q, count }));

    // 生成优化建议（用AI分析）
    const analysisPrompt = `作为直播主播${this.name}，分析以下${allQA.length}条问答数据，给出优化建议：

最近常见问题：
${topQuestions.map((q, i) => `${i+1}. "${q.question}" (出现${q.count}次)`).join('\n')}

请给出：
1. 哪些问题可以在话术中主动解答
2. 哪些回答需要补充更详细的信息
3. 哪些观众需求反映出了产品介绍的不足`;

    const suggestion = await this._callAI([
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: analysisPrompt },
    ]);

    // 保存优化建议到笔记
    await this.saveTip(suggestion, ['optimization', roomId || 'global']);

    return {
      needsOptimization: true,
      topQuestions,
      suggestion,
      totalQA: allQA.length,
    };
  }

  /**
   * 调用AI模型（支持多Provider切换）
   * 优先使用DeepSeek，百炼作为fallback
   */
  async _callAI(messages) {
    // 检测可用provider
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const bailianKey = process.env.BAILIAN_API_KEY || '';
    
    // 按优先级尝试：DeepSeek → 百炼
    const providers = [
      { name: 'DeepSeek', available: !!deepseekKey },
      { name: '百炼', available: true }, // 即使欠费也先尝试再处理
    ];

    for (const provider of providers) {
      try {
        if (provider.name === 'DeepSeek') {
          return await this._callDeepSeek(messages, deepseekKey);
        } else {
          return await this._callBailian(messages, bailianKey);
        }
      } catch (e) {
        console.warn(`[AgentAI] ${this.name} ${provider.name}调用失败:`, e.message);
        // 继续下一个provider
      }
    }

    console.error(`[AgentAI] ${this.name} 所有AI模型均不可用`);
    return '好的，我来看看这个问题...';
  }

  /**
   * 调用DeepSeek
   */
  async _callDeepSeek(messages, apiKey) {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DeepSeek API ${response.status}: ${errText.substring(0, 100)}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '抱歉，我暂时不知道如何回答这个问题。';
  }

  /**
   * 调用百炼千问
   */
  async _callBailian(messages, apiKey) {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages,
        temperature: 0.8,
        max_tokens: 1024,
      }),
    });
    
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`百炼API ${response.status}: ${errText.substring(0, 100)}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '抱歉，我暂时不知道如何回答这个问题。';
  }
}

// ─── Agent 管理器 ───
class AgentAIManager {
  constructor() {
    this.agents = new Map();
    this._initialize();
  }

  _initialize() {
    Object.keys(AGENT_PERSONALITIES).forEach(agentId => {
      const agent = new AIAgent(agentId);
      this.agents.set(agentId, agent);
    });
    console.log(`[AgentAIManager] 🎭 4个子AI初始化完成: ${[...this.agents.keys()].join(', ')}`);
  }

  /**
   * 获取指定Agent
   */
  getAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} 不存在，可用: ${[...this.agents.keys()].join(', ')}`);
    }
    return agent;
  }

  /**
   * 获取所有Agent
   */
  getAllAgents() {
    return [...this.agents.values()];
  }

  /**
   * 获取Agent列表（给前端用）
   */
  getAgentList() {
    return [...this.agents.values()].map(a => ({
      id: a.id,
      name: a.name,
      persona: a.personality.style,
      description: a.personality.systemPrompt.split('\n')[1]?.trim() || '',
      memorySize: a.knowledgeBase.viewerQuestions.length + a.knowledgeBase.tips.length,
    }));
  }

  /**
   * 从数据库初始化QA数据到各Agent内存
   */
  async loadFromDatabase() {
    for (const [id, agent] of this.agents) {
      try {
        const recentQA = await agent.getHistoryQA('', 100);
        agent.knowledgeBase.viewerQuestions = recentQA;
        console.log(`[AgentAIManager] 📚 ${agent.name} 加载了 ${recentQA.length} 条历史问答`);
      } catch (e) {
        // 表可能还不存在
      }
    }
  }
}

// 单例
let instance = null;

export function getAgentManager() {
  if (!instance) {
    instance = new AgentAIManager();
  }
  return instance;
}

export function getAgent(agentId) {
  return getAgentManager().getAgent(agentId);
}

export { AIAgent, AGENT_PERSONALITIES };
export default getAgentManager;
