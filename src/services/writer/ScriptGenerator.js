import { callLLM } from './NovelGenerator.js';

async function generateLiveScript({ productName, productDesc, platform = 'tiktok', duration = 90 }) {
  const prompt = `你是翡翠珠宝直播带货专业主播。产品: ${productName}。卖点: ${productDesc || '天然A货翡翠，云南瑞丽源头直供'}。平台: ${platform}。时长: ${duration}秒。

要求输出: 开场白、产品介绍、逼单话术(2轮)、收尾引导下单、3个#标签。口语化、有互动感。`;
  return callLLM([{ role: 'system', content: '你是专业直播带货主播，输出中文直播脚本。' }, { role: 'user', content: prompt }], { temperature: 0.7, maxTokens: 2048 });
}

async function generateShortVideoScript({ topic, style = 'tutorial', platform = 'tiktok', duration = 60 }) {
  const prompt = `创作一个${duration}秒${style}风格短视频脚本。主题: ${topic}。平台: ${platform}。

要求: 分5-8个镜头描述、每镜配文案、3个#标签、开头3秒必须有钩子。输出格式: 【镜头1】画面:... 文案:...`;
  return callLLM([{ role: 'system', content: '你是短视频脚本专家。' }, { role: 'user', content: prompt }], { temperature: 0.8, maxTokens: 2048 });
}

async function generateDramaScript({ title, genre = '都市', episodes = 5, scenesPerEpisode = 5 }) {
  const prompt = `创作一部${genre}短剧，共${episodes}集，每集${scenesPerEpisode}个场景。

标题: ${title}
要求: 每集2-3分钟剧本、含对白和场景描述、每集结尾留悬念、角色名用人名。输出Markdown格式完整剧本。`;
  return callLLM([{ role: 'system', content: '你是专业短剧编剧。' }, { role: 'user', content: prompt }], { temperature: 0.85, maxTokens: 8192 });
}

export { generateLiveScript, generateShortVideoScript, generateDramaScript };
