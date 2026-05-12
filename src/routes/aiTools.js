/**
 * AI 工具箱后端 — 图片去水印 / 智能消除
 * 
 * 工作方式：Node.js → spawn Python OpenCV 进程 → 返回 base64
 * Python 依赖：opencv-python, numpy (pip install)
 */
import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = path.join(__dirname, '..', '..', '..', 'scripts');

/**
 * 执行 Python OpenCV 脚本进行图像处理
 * @param {string} scriptFile - Python脚本文件名 (在 scripts/ 目录下)
 * @param {Buffer} imageBuffer - 图片数据
 * @param {object} extraArgs - 额外参数JSON
 * @returns {Promise<Buffer>} 处理后图片数据
 */
function runPythonScript(scriptFile, imageBuffer, extraArgs = {}) {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir();
    const timestamp = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const inputPath = path.join(tempDir, `ai-${timestamp}-in.png`);
    const outputPath = path.join(tempDir, `ai-${timestamp}-out.png`);

    try {
      fs.writeFileSync(inputPath, imageBuffer);
    } catch (e) {
      return reject(new Error('写入临时文件失败: ' + e.message));
    }

    const scriptPath = path.join(SCRIPTS_DIR, scriptFile);

    // 检测 python 可用性
    if (!fs.existsSync(scriptPath)) {
      return reject(new Error('Python脚本不存在: ' + scriptPath));
    }

    console.log('[AI工具] 调用Python:', scriptPath, 'args:', JSON.stringify(extraArgs).slice(0,100));

    const child = spawn('python', [
      scriptPath,
      inputPath,
      outputPath,
      JSON.stringify(extraArgs),
    ], {
      timeout: 60000,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    const chunks = [];
    let stderr = '';

    child.stdout.on('data', (chunk) => chunks.push(chunk));
    child.stderr.on('data', (d) => stderr += d.toString());
    child.on('error', (err) => {
      cleanup(inputPath, outputPath);
      reject(new Error('启动Python失败: ' + err.message));
    });

    child.on('close', (code) => {
      cleanup(inputPath, outputPath);
      if (code === 0 && chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        const errMsg = stderr || `exit code ${code}`;
        console.error('[AI工具] Python执行失败:', errMsg);
        reject(new Error(errMsg));
      }
    });
  });
}

function cleanup(...paths) {
  for (const p of paths) {
    try { fs.unlinkSync(p); } catch {}
  }
}

// ====== 图片去水印 ======
router.post('/remove-watermark', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: '请上传图片' });

    console.log('[AI工具] 去水印开始, 图片大小:', (req.file.buffer.length / 1024).toFixed(1) + 'KB');
    
    const resultBuffer = await runPythonScript('remove_watermark.py', req.file.buffer);
    
    res.json({ 
      success: true, 
      data: { 
        result: resultBuffer.toString('base64'), 
        format: 'png' 
      } 
    });
  } catch (err) {
    console.error('[AI工具] 去水印失败:', err.message);
    // 降级返回原图
    res.json({ 
      success: true, 
      data: { 
        result: req.file.buffer.toString('base64'), 
        format: 'png', 
        note: '去水印处理失败，返回原图',
        error: err.message
      } 
    });
  }
});

// ====== 智能消除 ======
router.post('/smart-erase', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: '请上传图片' });

    const maskPoints = req.body.maskPoints ? JSON.parse(req.body.maskPoints) : [];
    const brushSize = parseInt(req.body.brushSize || '30');

    if (maskPoints.length === 0) return res.status(400).json({ success: false, error: '请涂抹要消除的区域' });

    console.log('[AI工具] 智能消除开始, 涂抹点数:', maskPoints.length, '笔刷:', brushSize);
    
    const resultBuffer = await runPythonScript('smart_erase.py', req.file.buffer, {
      points: maskPoints,
      brushSize: brushSize,
    });
    
    res.json({ 
      success: true, 
      data: { 
        result: resultBuffer.toString('base64'), 
        format: 'png' 
      } 
    });
  } catch (err) {
    console.error('[AI工具] 消除失败:', err.message);
    res.json({ 
      success: true, 
      data: { 
        result: req.file.buffer.toString('base64'), 
        format: 'png', 
        note: '消除处理失败，返回原图',
        error: err.message
      } 
    });
  }
});

export default router;
