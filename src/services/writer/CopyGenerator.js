import { callLLM } from './NovelGenerator.js';

async function generateMarketingCopy({ productName, productDesc, platforms = ['wechat', 'douyin', 'xiaohongshu', 'taobao', 'ads'] }) {
  const prompt = `为以下产品创作营销文案，每个平台一份：
产品: ${productName}
卖点: ${productDesc || '高品质、性价比'}
需要平台: ${platforms.join('、')}

要求:
- 朋友圈: 150字，带emoji，亲切口语化
- 抖音: 100字，短视频口播风格，有节奏感
- 小红书: 200字，种草风格，去营销化自然分享
- 淘宝详情: 300字，突出卖点、材质、适用场景、售后保障
- 广告投放: 5个标题+描述，适合Google/Facebook/TikTok广告

输出格式: 每个平台用 ##平台名 分隔。`;

  return callLLM([
    { role: 'system', content: '你是专业电商营销文案写手，精通各平台文案风格。' },
    { role: 'user', content: prompt }
  ], { temperature: 0.7, maxTokens: 4096 });
}

async function generateProductDescription({ productName, productDesc, features = [] }) {
  const featuresText = features.length > 0 ? `产品特点: ${features.join('、')}` : '';
  const prompt = `写一份完整的产品描述: ${productName}。${productDesc}。${featuresText}

要求: 主标题、副标题、核心卖点(3-5条)、详细描述(材质/规格/场景)、FAQ(3条)。适合电商详情页。`;

  return callLLM([
    { role: 'system', content: '你是电商产品描述专家。' },
    { role: 'user', content: prompt }
  ], { temperature: 0.5, maxTokens: 2048 });
}

export { generateMarketingCopy, generateProductDescription };
