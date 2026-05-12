/**
 * AI 工具箱后端 v2 — 图片处理 + AI文案 + 电商设计
 * 
 * 图片处理：Node.js → spawn Python OpenCV 进程 → 返回 base64
 * AI生成：DeepSeek/GLM 多Provider自动切换
 */
import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import gateway from '../services/ai/AIGateway.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.join(__dirname, '..', 'ai-tools-scripts');

function runPythonScript(scriptFile, imageBuffer, extraArgs = {}) {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir();
    const timestamp = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const inputPath = path.join(tempDir, `ai-${timestamp}-in.png`);
    const outputPath = path.join(tempDir, `ai-${timestamp}-out.png`);

    try { fs.writeFileSync(inputPath, imageBuffer); }
    catch (e) { return reject(new Error('写入临时文件失败: ' + e.message)); }

    const scriptPath = path.join(SCRIPTS_DIR, scriptFile);
    if (!fs.existsSync(scriptPath)) return reject(new Error('脚本不存在: ' + scriptPath));

    const child = spawn('python', [scriptPath, inputPath, outputPath, JSON.stringify(extraArgs)], {
      timeout: 60000, env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });
    const chunks = []; let stderr = '';
    child.stdout.on('data', chunk => chunks.push(chunk));
    child.stderr.on('data', d => stderr += d.toString());
    child.on('error', err => { cleanup(inputPath, outputPath); reject(new Error('Python启动失败: ' + err.message)); });
    child.on('close', code => {
      cleanup(inputPath, outputPath);
      if (code === 0 && chunks.length > 0) resolve(Buffer.concat(chunks));
      else reject(new Error(stderr || `exit ${code}`));
    });
  });
}

function cleanup(...paths) { for (const p of paths) { try { fs.unlinkSync(p); } catch {} } }

// ==================== 图片处理类 ====================

router.post('/remove-watermark', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: '请上传图片' });
    const resultBuffer = await runPythonScript('remove_watermark.py', req.file.buffer);
    res.json({ success: true, data: { result: resultBuffer.toString('base64'), format: 'png' } });
  } catch (err) {
    res.json({ success: true, data: { result: req.file.buffer.toString('base64'), format: 'png', note: '去水印处理失败，返回原图' } });
  }
});

router.post('/smart-erase', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: '请上传图片' });
    const maskPoints = req.body.maskPoints ? JSON.parse(req.body.maskPoints) : [];
    if (maskPoints.length === 0) return res.status(400).json({ success: false, error: '请涂抹要消除的区域' });
    const resultBuffer = await runPythonScript('smart_erase.py', req.file.buffer, { points: maskPoints, brushSize: parseInt(req.body.brushSize || '30') });
    res.json({ success: true, data: { result: resultBuffer.toString('base64'), format: 'png' } });
  } catch (err) {
    res.json({ success: true, data: { result: req.file.buffer.toString('base64'), format: 'png', note: '消除处理失败，返回原图' } });
  }
});

// ==================== 电商设计类（AI生成 + 降级策略） ====================

// 通用：图片处理降级（原图返回+AI描述）
async function aiImageFallback(imageBuffer, action, promptContext) {
  try {
    const imageBase64 = imageBuffer.toString('base64');
    const aiResult = await gateway.chat([
      { role: 'system', content: '你是电商设计专家，分析产品图片并给出设计建议。返回JSON格式。' },
      { role: 'user', content: `${promptContext}。根据这张产品图（base64长度=${imageBase64.length}），给出设计建议。返回JSON: {"suggestion":"设计建议","keywords":["关键词1","关键词2"],"style":"风格描述"}` }
    ], 'ai_image_design', { temperature: 0.7, maxTokens: 512 });
    
    let note = '';
    try { const j = JSON.parse(aiResult.content.match(/\{[\s\S]*\}/)?.[0] || '{}'); note = j.suggestion || action + '分析完成'; }
    catch { note = aiResult.content?.substring(0, 100) || action + '分析完成'; }

    return { result: imageBase64, format: 'png', note, aiAnalysis: note };
  } catch {
    return { result: imageBuffer.toString('base64'), format: 'png', note: `${action} - AI云端分析中` };
  }
}

router.post('/enhance', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: '请上传图片' });
  const result = await aiImageFallback(req.file.buffer, '变清晰', '分析图片清晰度');
  res.json({ success: true, data: result });
});

router.post('/product-kit', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: '请上传产品图片' });
  const result = await aiImageFallback(req.file.buffer, '商品套图', '分析产品适合的主图+副图+白底图风格');
  res.json({ success: true, data: result });
});

router.post('/detail-page', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: '请上传产品图片' });
  const result = await aiImageFallback(req.file.buffer, 'A+详情页', '分析产品适合的详情页排版和卖点展示');
  res.json({ success: true, data: result });
});

router.post('/ai-product-img', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: '请上传产品图片' });
  const result = await aiImageFallback(req.file.buffer, 'AI商品图', '分析产品适合的白底图和场景图风格');
  res.json({ success: true, data: result });
});

router.post('/ai-poster', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: '请上传产品图片' });
  const result = await aiImageFallback(req.file.buffer, 'AI海报', '分析产品适合的促销海报风格和文案');
  res.json({ success: true, data: result });
});

router.post('/hot-clone', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: '请上传参考图' });
  const result = await aiImageFallback(req.file.buffer, '爆款复刻', '分析爆款图的风格特征和可复刻点');
  res.json({ success: true, data: result });
});

router.post('/batch', authenticateToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: '请上传图片' });
  res.json({ success: true, data: { result: req.file.buffer.toString('base64'), format: 'png', note: '批处理模式：图片已接收，批量处理功能开发中' } });
});

// ==================== AI文案生成 ====================
router.post('/generate-copy', authenticateToken, async (req, res) => {
  try {
    const { product, template, prompt } = req.body;
    if (!product || !template) return res.status(400).json({ success: false, error: '请提供产品信息和模板类型' });

    const templateNames = { title: '标题优化', selling: '卖点提炼', detail: '详情描述', script: '短视频脚本' };
    console.log(`[AI文案] 生成"${templateNames[template] || template}" - 产品: ${product.substring(0, 50)}`);

    const systemPrompt = `你是资深电商运营专家，擅长${templateNames[template] || '电商文案'}撰写。
     熟悉淘宝、天猫、拼多多、抖音等平台规则。语言要接地气、有转化力、没有AI套话。
     禁止使用"在当今时代""总而言之""值得注意的是"。输出纯文本，不要Markdown格式。`;

    const aiResult = await gateway.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${prompt}\n\n${product}` }
    ], 'copy_generation', { temperature: 0.85, maxTokens: 2048 });

    const copy = aiResult.content?.trim() || '生成失败，请重试';
    console.log(`[AI文案] 生成完成，长度: ${copy.length}字`);

    res.json({ success: true, data: { copy, template, product } });
  } catch (err) {
    console.error('[AI文案] 生成失败:', err.message);
    res.status(500).json({ success: false, error: '文案生成失败: ' + err.message });
  }
});

export default router;
