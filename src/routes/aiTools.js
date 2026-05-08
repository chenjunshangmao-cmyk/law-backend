/**
 * AI 工具箱后端 — 图片去水印 / 智能消除
 */
import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// ====== 图片去水印 ======
router.post('/remove-watermark', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: '请上传图片' });
    
    const inputPath = path.join(os.tmpdir(), `ai-tool-${Date.now()}-in.png`);
    const outputPath = path.join(os.tmpdir(), `ai-tool-${Date.now()}-out.png`);
    fs.writeFileSync(inputPath, req.file.buffer);

    // 使用 OpenCV inpainting（如果可用）或降级到简单方案
    const script = `
import cv2, numpy as np, sys, base64
img = cv2.imread('${inputPath.replace(/\\/g, '\\\\')}')
if img is None: sys.exit(1)
# 自动检测水印区域（颜色单一、对比度高的区域）
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
mask = cv2.bitwise_not(binary)
if mask.sum() == 0:
    mask = np.ones(gray.shape, dtype=np.uint8) * 255
kernel = np.ones((5,5), np.uint8)
mask = cv2.dilate(mask, kernel, iterations=2)
result = cv2.inpaint(img, mask, 5, cv2.INPAINT_TELEA)
cv2.imwrite('${outputPath.replace(/\\/g, '\\\\')}', result)
with open('${outputPath.replace(/\\/g, '\\\\')}', 'rb') as f:
    sys.stdout.buffer.write(f.read())
`.strip();

    const child = spawn('python3', ['-c', script], { timeout: 30000 });
    const chunks = [];
    child.stdout.on('data', (chunk) => chunks.push(chunk));
    let stderr = '';
    child.stderr.on('data', (d) => stderr += d.toString());

    child.on('close', (code) => {
      try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch {}
      
      if (code === 0 && chunks.length > 0) {
        const buf = Buffer.concat(chunks);
        res.json({ success: true, data: { result: buf.toString('base64'), format: 'png' } });
      } else {
        console.error('[AI工具] 去水印失败:', stderr || `exit code ${code}`);
        // 降级：返回原图
        res.json({ success: true, data: { result: req.file.buffer.toString('base64'), format: 'png', note: '降级返回原图' } });
      }
    });
  } catch (err) {
    console.error('[AI工具] 去水印异常:', err);
    res.status(500).json({ success: false, error: '处理失败' });
  }
});

// ====== 智能消除 ======
router.post('/smart-erase', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: '请上传图片' });
    
    const maskPoints = req.body.maskPoints ? JSON.parse(req.body.maskPoints) : [];
    const brushSize = parseInt(req.body.brushSize || '30');

    if (maskPoints.length === 0) return res.status(400).json({ success: false, error: '请涂抹要消除的区域' });

    const inputPath = path.join(os.tmpdir(), `ai-erase-${Date.now()}-in.png`);
    const outputPath = path.join(os.tmpdir(), `ai-erase-${Date.now()}-out.png`);
    fs.writeFileSync(inputPath, req.file.buffer);

    const pointsJson = JSON.stringify({ points: maskPoints, brushSize });
    
    const script = `
import cv2, numpy as np, sys, json, base64
data = json.loads('''${pointsJson}''')
img = cv2.imread('${inputPath.replace(/\\/g, '\\\\')}')
if img is None: sys.exit(1)
h, w = img.shape[:2]
mask = np.zeros((h, w), dtype=np.uint8)
for pt in data['points']:
    cv2.circle(mask, (int(pt['x']), int(pt['y'])), int(data['brushSize']), 255, -1)
result = cv2.inpaint(img, mask, 8, cv2.INPAINT_TELEA)
cv2.imwrite('${outputPath.replace(/\\/g, '\\\\')}', result)
with open('${outputPath.replace(/\\/g, '\\\\')}', 'rb') as f:
    sys.stdout.buffer.write(f.read())
`.strip();

    const child = spawn('python3', ['-c', script], { timeout: 30000 });
    const chunks = [];
    child.stdout.on('data', (chunk) => chunks.push(chunk));
    let stderr = '';
    child.stderr.on('data', (d) => stderr += d.toString());

    child.on('close', (code) => {
      try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch {}
      
      if (code === 0 && chunks.length > 0) {
        res.json({ success: true, data: { result: Buffer.concat(chunks).toString('base64'), format: 'png' } });
      } else {
        console.error('[AI工具] 消除失败:', stderr || `exit code ${code}`);
        res.json({ success: true, data: { result: req.file.buffer.toString('base64'), format: 'png', note: '降级返回原图' } });
      }
    });
  } catch (err) {
    console.error('[AI工具] 消除异常:', err);
    res.status(500).json({ success: false, error: '处理失败' });
  }
});

export default router;
