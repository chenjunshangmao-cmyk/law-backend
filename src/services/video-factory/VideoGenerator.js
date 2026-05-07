/**
 * AI视频生成器 - Kling/可灵 API
 * 图生视频 & 文生视频
 */
import fs from 'fs';
import path from 'path';

const KLING_API_KEY = process.env.KLING_API_KEY || '';
const KLING_BASE = 'https://api.klingai.com/v1';
const VIDEO_DIR = path.join(process.cwd(), 'generated-videos');
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

async function klingRequest(endpoint, body) {
  const res = await fetch(`${KLING_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KLING_API_KEY}` },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function pollKlingTask(taskId, maxRetries = 60, interval = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(r => setTimeout(r, interval));
    const result = await klingRequest(`/images/generations/${taskId}`, {});
    if (result.data?.task_status === 'succeed') {
      return { success: true, videoUrl: result.data.task_result?.videos?.[0]?.url };
    }
    if (result.data?.task_status === 'failed') {
      return { success: false, error: result.data.task_status_msg || '生成失败' };
    }
  }
  return { success: false, error: '超时' };
}

async function imageToVideo({ imageUrl, prompt = '', duration = 5, cfgScale = 0.5 }) {
  try {
    const body = {
      model_name: 'kling-v1',
      image: imageUrl,
      prompt: prompt || 'cinematic movement, smooth camera',
      duration: String(duration),
      cfg_scale: cfgScale
    };
    const res = await klingRequest('/videos/image2video', body);
    if (res.code !== 0) return { success: false, error: res.message };
    return pollKlingTask(res.data.task_id);
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function textToVideo({ prompt, duration = 5, aspectRatio = '16:9' }) {
  try {
    const body = { model_name: 'kling-v1', prompt, duration: String(duration), aspect_ratio: aspectRatio };
    const res = await klingRequest('/videos/text2video', body);
    if (res.code !== 0) return { success: false, error: res.message };
    return pollKlingTask(res.data.task_id);
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function downloadVideo(url, name) {
  const filePath = path.join(VIDEO_DIR, name);
  try {
    const res = await fetch(url);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    return { path: filePath, size: buffer.length };
  } catch (e) {
    return { path: filePath, error: e.message };
  }
}

export { imageToVideo, textToVideo, downloadVideo };
