/**
 * ClawDifyAPI.js — 统一AI API网关
 * 
 * 全站所有AI调用统一走这里。
 * 切换Provider只需改 .env 的 AI_PROVIDER 和 API_KEY。
 * 
 * 支持：
 *   - DeepSeek（推荐）
 *   - 百度千帆 ERNIE
 *   - 腾讯混元
 *   - 阿里百炼（备用）
 *   - 智谱 GLM
 *   - OpenAI 兼容接口
 */

const defaultConfig = {
  provider: process.env.AI_PROVIDER || 'deepseek',
  // DeepSeek 配置
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  // 阿里百炼（备用）
  bailian: {
    apiKey: process.env.BAILIAN_API_KEY || '',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-turbo',
  },
  // 预留：百度千帆
  ernie: {
    apiKey: process.env.ERNIE_API_KEY || '',
    baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat',
    model: 'ernie-speed-128k',
  },
  // 预留：腾讯混元
  hunyuan: {
    apiKey: process.env.HUNYUAN_API_KEY || '',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    model: 'hunyuan-lite',
  },
  // 预留：智谱 GLM
  glm: {
    apiKey: process.env.GLM_API_KEY || '',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
  },
  // 预留：OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
};

/**
 * 核心调用函数
 * @param {string} provider - 模型提供商（deepseek/bailian/ernie/hunyuan/glm/openai）
 * @param {Array} messages - OpenAI 格式的消息数组
 * @param {Object} options - 额外选项 {temperature, maxTokens, model}
 * @returns {Promise<string>} 回复内容
 */
export async function callAI(provider, messages, options = {}) {
  const cfg = defaultConfig[provider] || defaultConfig[defaultConfig.provider];
  if (!cfg || !cfg.apiKey) {
    throw new Error(`[ClawDify] ${provider} 未配置 API Key`);
  }

  const model = options.model || cfg.model;
  const maxTokens = options.maxTokens || 2000;
  const temperature = options.temperature ?? 0.7;

  const body = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  // 各Provider的特殊参数
  if (provider === 'ernie') {
    // 百度千帆走不同的接口格式
    const accessToken = await getErnieToken(cfg.apiKey);
    const resp = await fetch(`${cfg.baseUrl}/${model}?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, temperature, max_output_tokens: maxTokens }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(`[百度千帆] ${data.error_msg || resp.statusText}`);
    return data.result || data.choices?.[0]?.message?.content || '';

  } else if (provider === 'hunyuan') {
    // 腾讯混元
    const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(`[腾讯混元] ${data.error?.message || resp.statusText}`);
    return data.choices?.[0]?.message?.content || '';

  } else {
    // OpenAI 兼容接口（DeepSeek、百炼、GLM、OpenAI）
    const resp = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(`[${provider}] ${data.error?.message || resp.statusText}`);
    return data.choices?.[0]?.message?.content || '';
  }
}

/**
 * 获取百度千帆 access_token
 */
async function getErnieToken(apiKey) {
  const [ak, sk] = apiKey.split('|');
  if (!ak || !sk) throw new Error('[百度千帆] API Key 格式错误，需为: API_KEY|SECRET_KEY');
  const resp = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${ak}&client_secret=${sk}`);
  const data = await resp.json();
  return data.access_token;
}

/**
 * 最佳模型选择（按场景）
 * 根据场景智能选择最合适的模型
 */
export function getBestModel(scene) {
  const provider = process.env.AI_PROVIDER || 'deepseek';
  const modelMap = {
    // 核心场景：用高质量模型
    'live-stream': { provider, model: 'deepseek-chat' },       // AI直播脚本
    'video-script': { provider, model: 'deepseek-chat' },      // 短视频脚本
    'copywriting': { provider, model: 'deepseek-chat' },       // 文案生成
    // 非核心：用轻量模型
    'customer-service': { provider, model: 'deepseek-chat' },  // 客服（速度优先）
    'translation': { provider, model: 'deepseek-chat' },       // 翻译
    'social-media': { provider, model: 'deepseek-chat' },      // 小红书
    'agent-chat': { provider, model: 'deepseek-chat' },        // 4子AI
    'image-prompt': { provider, model: 'deepseek-chat' },      // 图片prompt
  };
  return modelMap[scene] || modelMap['copywriting'];
}

/**
 * 快捷调用
 */
export async function chat(messages, scene = 'copywriting', options = {}) {
  const config = getBestModel(scene);
  return await callAI(config.provider, messages, {
    ...options,
    model: options.model || config.model,
  });
}

export default { callAI, chat, getBestModel };
