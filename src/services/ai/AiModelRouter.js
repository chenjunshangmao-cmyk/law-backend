/**
 * AiModelRouter.js — 模型路由选择器
 * 
 * 根据 .env 中的 AI_MODEL_MAP 和 AI_PROVIDER 动态选择模型。
 * 改模型不需要改代码，改 .env 就行。
 * 
 * 用法：
 *   import { route } from '../services/ai/AiModelRouter.js';
 *   在原有的百炼调用代码前，直接替换模型名。
 *   比如原有 model: 'qwen-turbo' → 改为 model: route('translation')
 * 
 * .env 配置示例：
 *   AI_PROVIDER=deepseek
 *   DEEPSEEK_API_KEY=sk-xxx
 *   
 *   或精细配置（哪个场景用什么模型）：
 *   AI_MODEL_MAP={"live-stream":"deepseek-chat","translation":"deepseek-chat","chat":"deepseek-chat"}
 */

// 默认场景-模型映射（可被 .env 覆盖）
const DEFAULT_MODEL_MAP = {
  // 🎥 核心高质量场景
  'live-stream': 'deepseek-chat',    // AI直播脚本
  'video-script': 'deepseek-chat',   // 短视频脚本  
  'copywriting': 'deepseek-chat',    // 文案生成
  // 🔧 非核心
  'translation': 'deepseek-chat',    // 发布翻译
  'social-media': 'deepseek-chat',   // 小红书
  'chat': 'deepseek-chat',          // AI客服
  'agent': 'deepseek-chat',         // 4子AI
  'image': 'deepseek-chat',         // 图片生成prompt
  'default': 'deepseek-chat',       // 兜底
};

let modelMap = { ...DEFAULT_MODEL_MAP };

// 尝试从环境变量读取自定义映射
try {
  if (process.env.AI_MODEL_MAP) {
    const custom = JSON.parse(process.env.AI_MODEL_MAP);
    Object.assign(modelMap, custom);
  }
} catch (e) {
  console.warn('[AiModelRouter] ⚠️ AI_MODEL_MAP 解析失败，使用默认配置');
}

/**
 * 按场景获取模型名
 * @param {string} scene - 场景标识（translation / chat / live-stream / copywriting 等）
 * @returns {string} 模型名（如 deepseek-chat / qwen-turbo）
 */
export function route(scene) {
  return modelMap[scene] || modelMap.default;
}

/**
 * 获取当前所有配置
 */
export function getConfig() {
  return {
    provider: process.env.AI_PROVIDER || 'deepseek',
    modelMap,
  };
}

export default { route, getConfig };
