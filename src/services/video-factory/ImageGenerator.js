/**
 * AI图片生成器 - DALL-E 3 / Flux API
 */
import { callLLM } from '../writer/NovelGenerator.js';

async function generateImage({ prompt, size = '1024x1024', style = 'vivid' }) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, quality: 'standard' })
    });
    const data = await res.json();
    return data.data?.[0]?.url || null;
  } catch (e) {
    console.error('[ImageGen] DALL-E error:', e.message);
    return null;
  }
}

async function generateSceneImages({ scenes, style = 'realistic' }) {
  const results = [];
  for (const scene of scenes) {
    const prompt = `${style} style, high quality, cinematic lighting. ${scene.description || scene}`;
    const url = await generateImage({ prompt, size: '1792x1024' });
    results.push({ scene, imageUrl: url });
  }
  return results;
}

export { generateImage, generateSceneImages };
