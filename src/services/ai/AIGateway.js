/**
 * AIGateway.js — 免费AI API 统一网关
 * 
 * 核心功能：
 *   1. 聚合多家免费/低价AI API
 *   2. 自动切换可用平台（免费额度优先）
 *   3. 用量统计和额度监控
 *   4. 对外提供统一API接口
 * 
 * 使用方式：
 *   import gateway from './AIGateway.js';
 *   const reply = await gateway.chat(messages, 'translation');
 * 
 * .env 配置所有 API Key 和免费额度信息
 */

// ─── 免费模型价格表（零成本优先） ───
const FREE_MODELS = {
  // 完全免费（不限量）
  'ernie-speed': { provider: 'baidu', name: '百度ERNIE Speed', cost: 0, quota: Infinity },
  'ernie-speed-128k': { provider: 'baidu', name: '百度ERNIE Speed-128K', cost: 0, quota: Infinity },
  'glm-4-flash': { provider: 'zhipu', name: '智谱GLM-4-Flash', cost: 0, quota: Infinity },
  'hunyuan-lite': { provider: 'tencent', name: '腾讯混元Lite', cost: 0, quota: Infinity },
  // 有初始免费额度
  'deepseek-chat': { provider: 'deepseek', name: 'DeepSeek', cost: 0.001, initialCredits: 10 },
  'qwen-turbo': { provider: 'aliyun', name: '通义千问Turbo', cost: 0.0002, initialCredits: 100 },
  'moonshot-v1': { provider: 'moonshot', name: '月之暗面', cost: 0.001, initialCredits: 15 },
  'doubao-pro': { provider: 'bytedance', name: '字节豆包Pro', cost: 0.0008, initialCredits: 50 },
};

class AIGateway {
  constructor() {
    this.providers = new Map();     // provider名 → 配置
    this.usageRecords = new Map();  // 用量记录
    this.failCount = new Map();     // 失败计数
    this.currentProvider = null;    // 当前在用Provider
    this._initialized = false;
  }

  _ensureInit() {
    if (!this._initialized) {
      this.init();
      this._initialized = true;
    }
  }

  init() {
    // 从环境变量加载各平台API Key（Render/本地环境变量优先，fallback到src/.env默认值）
    // Bun runtime要求纯ASCII，自动清洗
    const _clean = (s) => String(s || '').trim().replace(/[^\x20-\x7E]/g, '');
    const _env = (k, fb) => _clean(process.env[k]) || fb;
    
    const configs = {
      deepseek: { apiKey: 'sk-4848b41dad43443c85e4cb57d428273d', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat'] },
      aliyun: { apiKey: _env('BAILIAN_API_KEY', 'sk-8a07c75081df49ac877d6950a95b06ec'), baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: ['qwen-turbo'] },
      baidu: { apiKey: _env('BAIDU_API_KEY', ''), baseUrl: '', models: ['ernie-speed', 'ernie-speed-128k'] },
      zhipu: { apiKey: _env('ZHIPU_API_KEY', '920e782d91584c8d8b032c1abe48a65f.MOlpCPK3QB1Ktfn8'), baseUrl: 'https://open.bigmodel.cn/api/paas/v4', models: ['glm-4-flash'] },
      tencent: { apiKey: _env('HUNYUAN_API_KEY', 'sk-uCrsS2tD3YBwzYR6Wgmw3brZcxj6z4K4lfj1JpWhpu4dx8cJ'), baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1', models: ['hunyuan-lite'] },
      bytedance: { apiKey: _env('ARK_API_KEY', 'ark-c8b1fb82-d5ec-44f4-88bd-cc86929d4fb6-13b29'), baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', models: ['ep-20250423235039-7ntcd', 'doubao-lite-128k'] },
      moonshot: { apiKey: _env('MOONSHOT_API_KEY', ''), baseUrl: 'https://api.moonshot.cn/v1', models: ['moonshot-v1'] },
      gemini: { apiKey: _env('GOOGLE_API_KEY', 'AIzaSyBWm8kkLXqVfXv2pOgzDBgjh2pow9oXTX0'), baseUrl: 'https://generativelanguage.googleapis.com/v1beta', models: ['gemini-2.0-flash', 'gemini-2.0-flash-lite'] },
      siliconflow: { apiKey: _env('SILICONFLOW_API_KEY', ''), baseUrl: 'https://api.siliconflow.cn/v1', models: ['deepseek-chat'] },
    };

    for (const [name, cfg] of Object.entries(configs)) {
      // 清洗API Key：Bun runtime 要求 fetch headers/URL 必须是纯 ASCII
      const cleanKey = String(cfg.apiKey).trim().replace(/[^\x20-\x7E]/g, '');
      this.providers.set(name, {
        ...cfg,
        apiKey: cleanKey,
        enabled: !!cleanKey,
        usage: { calls: 0, tokens: 0, cost: 0, lastUsed: null },
      });
    }

    this._log('[AIGateway] 初始化完成，可用Provider:', 
      [...this.providers.entries()].filter(([_, p]) => p.enabled).map(([n]) => n).join(', ') || '无');
  }

  /**
   * 核心调用：发送消息，自动选择最优Provider
   */
  async chat(messages, scene = 'default', options = {}) {
    this._ensureInit();
    const bestProvider = this._selectBestProvider(scene);
    if (!bestProvider) {
      throw new Error('[AIGateway] 所有Provider均不可用，请检查API Key配置');
    }

    const errors = [];
    // 按优先级尝试
    for (const provider of bestProvider) {
      try {
        const result = await this._callProvider(provider, messages, options);
        this._recordUsage(provider, result);
        return result;
      } catch (e) {
        errors.push(`${provider.name}: ${e.message}`);
        this.failCount.set(provider.name, (this.failCount.get(provider.name) || 0) + 1);
        // 失败超过3次暂时禁用
        if (this.failCount.get(provider.name) >= 3) {
          const p = this.providers.get(provider.id);
          if (p) p.enabled = false;
          this._log(`[AIGateway] ⛔ ${provider.name} 失败3次，已暂时禁用`);
        }
      }
    }

    throw new Error(`[AIGateway] 所有Provider均失败:\n${errors.join('\n')}`);
  }

  /**
   * 选择最优Provider
   * 策略：免费 > 有余额 > 付费，同级别轮询
   */
  _selectBestProvider(scene) {
    const available = [...this.providers.entries()]
      .filter(([_, p]) => p.enabled && !!p.apiKey)
      .sort((a, b) => {
        // 按倾向性排序
        const aIsFree = FREE_MODELS[a[1].models[0]]?.cost === 0;
        const bIsFree = FREE_MODELS[b[1].models[0]]?.cost === 0;
        if (aIsFree && !bIsFree) return -1;
        if (!aIsFree && bIsFree) return 1;
        return 0;
      });

    return available.map(([id, cfg]) => ({
      id,
      name: cfg.models[0],
      baseUrl: cfg.baseUrl,
      apiKey: cfg.apiKey,
      models: cfg.models,
      free: FREE_MODELS[cfg.models[0]]?.cost === 0,
    }));
  }

  /**
   * 调用具体Provider
   */
  async _callProvider(provider, messages, options) {
    const model = options.model || provider.models[0];
    const maxTokens = options.maxTokens || 2000;
    const temperature = options.temperature ?? 0.7;

    // 百度千帆特殊处理
    if (provider.id === 'baidu') {
      return await this._callBaidu(provider, messages, { model, maxTokens, temperature });
    }

    // Google Gemini 特殊格式
    if (provider.id === 'gemini') {
      return await this._callGemini(provider, messages, { model, maxTokens, temperature });
    }

    // 标准 OpenAI 兼容接口（Bun fetch 要求 headers 纯 ASCII）
    const payload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    // 安全编码 headers，确保 Bun runtime 兼容
    const safeApiKey = String(provider.apiKey).trim().replace(/[^\x20-\x7E]/g, '');
    const resp = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${safeApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`${resp.status} ${err}`);
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // 估算token消耗
    const promptTokens = data.usage?.prompt_tokens || Math.ceil(JSON.stringify(messages).length / 2);
    const completionTokens = data.usage?.completion_tokens || Math.ceil(content.length / 2);

    return { content, promptTokens, completionTokens, model: provider.name };
  }

  /**
   * 百度千帆特殊调用（获取access_token）
   */
  async _callBaidu(provider, messages, { model, maxTokens, temperature }) {
    // 百度需要先拿 access_token
    const [ak, sk] = provider.apiKey.split('|');
    if (!ak || !sk) throw new Error('[百度千帆] API Key格式需为 API_KEY|SECRET_KEY');

    const tokenResp = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${ak}&client_secret=${sk}`
    );
    const tokenData = await tokenResp.json();
    if (!tokenData.access_token) throw new Error('[百度千帆] 获取token失败');

    const resp = await fetch(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${model}?access_token=${tokenData.access_token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, temperature, max_output_tokens: maxTokens }),
      }
    );

    const data = await resp.json();
    if (data.error_code) throw new Error(`[百度千帆] ${data.error_msg}`);
    
    const content = data.result || '';
    return {
      content,
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      model: provider.name,
    };
  }

  /**
   * Google Gemini 调用（API格式不同）
   */
  async _callGemini(provider, messages, { model, maxTokens, temperature }) {
    // Gemini 需要把系统消息和对话分开
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const payload = {
      contents: userMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    // 如果有系统提示词加到第一个user消息前
    if (systemMsg) {
      if (!payload.contents[0]) {
        payload.contents = [{ role: 'user', parts: [{ text: systemMsg }] }];
      } else {
        payload.contents[0].parts.unshift({ text: systemMsg });
      }
    }

    const resp = await fetch(
      `${provider.baseUrl}/models/${model}:generateContent?key=${provider.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(`[Gemini] ${data.error?.message || resp.statusText}`);
    }

    const content = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    
    return {
      content,
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      model: provider.name,
    };
  }

  /**
   * 记录用量
   */
  _recordUsage(provider, result) {
    const date = new Date().toISOString().slice(0, 10);
    const key = `${date}_${provider.id}`;
    
    if (!this.usageRecords.has(key)) {
      this.usageRecords.set(key, { date, provider: provider.id, calls: 0, tokens: 0, cost: 0 });
    }
    
    const record = this.usageRecords.get(key);
    record.calls++;
    record.tokens += (result.promptTokens || 0) + (result.completionTokens || 0);
    record.cost += ((result.promptTokens || 0) + (result.completionTokens || 0)) * (FREE_MODELS[provider.name]?.cost || 0.001);
    
    // 更新provider用量
    const p = this.providers.get(provider.id);
    if (p) {
      p.usage.calls++;
      p.usage.tokens += (result.promptTokens || 0) + (result.completionTokens || 0);
      p.usage.lastUsed = new Date().toISOString();
    }

    this.currentProvider = provider.id;
  }

  /**
   * 获取用量和额度状态
   */
  getStatus() {
    this._ensureInit();
    const providers = [...this.providers.entries()].map(([id, p]) => ({
      id,
      name: id,
      enabled: p.enabled && !!p.apiKey,
      hasKey: !!p.apiKey,
      models: p.models,
      usage: p.usage,
      freeModel: FREE_MODELS[p.models[0]],
    }));

    const today = new Date().toISOString().slice(0, 10);
    const todayUsage = [...this.usageRecords.entries()]
      .filter(([k]) => k.startsWith(today))
      .reduce((sum, [_, r]) => ({ calls: sum.calls + r.calls, tokens: sum.tokens + r.tokens, cost: sum.cost + r.cost }), 
        { calls: 0, tokens: 0, cost: 0 });

    return {
      currentProvider: this.currentProvider,
      todayUsage,
      providers,
      failCounts: [...this.failCount.entries()].map(([k, v]) => ({ provider: k, fails: v })),
    };
  }

  /**
   * 重置禁用状态（定时任务调用）
   */
  resetDisabled() {
    [...this.providers.entries()].forEach(([id, p]) => {
      if (!p.enabled && p.apiKey) {
        p.enabled = true;
        this.failCount.set(id, 0);
      }
    });
    this._log('[AIGateway] 已重置所有禁用Provider');
  }

  /**
   * 测试指定Provider的连接（用于管理面板一键测试）
   */
  async testProvider(providerId) {
    this._ensureInit();
    const cfg = this.providers.get(providerId);
    if (!cfg) throw new Error(`Provider [${providerId}] 不存在`);
    if (!cfg.apiKey) throw new Error(`Provider [${providerId}] 未配置 API Key`);

    const provider = {
      id: providerId,
      name: cfg.models[0],
      baseUrl: cfg.baseUrl,
      apiKey: cfg.apiKey,
      models: cfg.models,
    };

    const result = await this._callProvider(provider, [
      { role: 'user', content: 'Reply "ok" if you can read this.' }
    ], { model: cfg.models[0], maxTokens: 50, temperature: 0.1 });

    return { provider: providerId, model: result.model, content: result.content };
  }

  _log(...args) {
    console.log('[AIGateway]', ...args);
  }
}

// 单例
let instance = null;
export function getGateway() {
  if (!instance) instance = new AIGateway();
  return instance;
}

export default getGateway();
