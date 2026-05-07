import express from 'express';
import { generateOutline, generateChapter, continueChapter, generateFullNovel } from '../services/writer/NovelGenerator.js';
import { generateLiveScript, generateShortVideoScript, generateDramaScript } from '../services/writer/ScriptGenerator.js';
import { generateMarketingCopy, generateProductDescription } from '../services/writer/CopyGenerator.js';

const router = express.Router();

router.post('/novel/outline', async (req, res) => {
  try {
    const { title, genre, synopsis, chapters } = req.body;
    if (!title) return res.json({ success: false, error: '请输入小说标题' });
    const result = await generateOutline({ title, genre, synopsis, chapters });
    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/novel/chapter', async (req, res) => {
  try {
    const { outline, chapterNumber, chapterTitle, previousSummary, genre } = req.body;
    if (!outline || !chapterNumber) return res.json({ success: false, error: '缺少参数' });
    const result = await generateChapter({ outline, chapterNumber, chapterTitle, previousSummary, genre });
    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/novel/full', async (req, res) => {
  try {
    const { title, genre, synopsis, chapterCount } = req.body;
    if (!title) return res.json({ success: false, error: '请输入小说标题' });
    const result = await generateFullNovel({ title, genre, synopsis, chapterCount });
    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/novel/continue', async (req, res) => {
  try {
    const { previousChapters, outline, nextChapterTitle, genre } = req.body;
    if (!previousChapters || !outline) return res.json({ success: false, error: '缺少参数' });
    const result = await continueChapter({ previousChapters, outline, nextChapterTitle, genre });
    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/script/live', async (req, res) => {
  try {
    const { productName, productDesc, platform, duration } = req.body;
    if (!productName) return res.json({ success: false, error: '请输入产品名称' });
    const result = await generateLiveScript({ productName, productDesc, platform, duration });
    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/script/video', async (req, res) => {
  try {
    const { topic, style, platform, duration } = req.body;
    if (!topic) return res.json({ success: false, error: '请输入视频主题' });
    const result = await generateShortVideoScript({ topic, style, platform, duration });
    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/script/drama', async (req, res) => {
  try {
    const { title, genre, episodes, scenesPerEpisode } = req.body;
    if (!title) return res.json({ success: false, error: '请输入短剧标题' });
    const result = await generateDramaScript({ title, genre, episodes, scenesPerEpisode });
    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/copy/marketing', async (req, res) => {
  try {
    const { productName, productDesc, platforms } = req.body;
    if (!productName) return res.json({ success: false, error: '请输入产品名称' });
    const result = await generateMarketingCopy({ productName, productDesc, platforms });
    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

router.post('/copy/product', async (req, res) => {
  try {
    const { productName, productDesc, features } = req.body;
    if (!productName) return res.json({ success: false, error: '请输入产品名称' });
    const result = await generateProductDescription({ productName, productDesc, features });
    res.json({ success: true, data: result });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

export default router;
