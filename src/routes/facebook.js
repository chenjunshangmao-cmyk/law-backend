/**
 * Facebook 发布路由
 * - 个人主页：图片/视频发布
 * - 公共主页：图片/视频发布
 */
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import facebookAutomation from '../services/facebookAutomation.js';

const router = Router();

// 临时文件上传目录
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'facebook');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${unique}${ext}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

// JWT 验证中间件
function auth(req, res, next) {
  if (req.user) return next();

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      if (global.jwtVerify) {
        const decoded = global.jwtVerify(token);
        req.user = decoded;
        return next();
      }
    } catch {}
  }

  // 开发环境宽松
  if (process.env.NODE_ENV !== 'production') {
    req.user = { id: 'dev-user' };
    return next();
  }

  return res.status(401).json({ error: '请先登录' });
}

router.use(auth);

// ============================================================
// 文件上传（临时目录）
// ============================================================

router.post('/upload/temp', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]), async (req, res) => {
  try {
    const result = { success: true };
    if (req.files?.video?.[0]) {
      result.filePath = req.files.video[0].path;
    }
    if (req.files?.images?.length > 0) {
      result.filePaths = req.files.images.map(f => f.path);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 登录 & 状态
// ============================================================

router.post('/login', async (req, res) => {
  try {
    const { accountId, email, password } = req.body;
    if (!accountId) return res.status(400).json({ error: '缺少 accountId' });
    const result = await facebookAutomation.login(accountId, email, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/2fa', async (req, res) => {
  try {
    const { accountId, code } = req.body;
    if (!accountId || !code) return res.status(400).json({ error: '缺少参数' });
    const result = await facebookAutomation.submit2fa(accountId, code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId) return res.status(400).json({ error: '缺少 accountId' });
    const result = await facebookAutomation.getStatus(accountId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pages', async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId) return res.status(400).json({ error: '缺少 accountId' });
    const result = await facebookAutomation.getPages(accountId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { accountId } = req.body;
    if (!accountId) return res.status(400).json({ error: '缺少 accountId' });
    const result = await facebookAutomation.logout(accountId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 发布 - 个人主页
// ============================================================

router.post('/publish/profile/image', async (req, res) => {
  try {
    const { accountId, text, imagePaths } = req.body;
    if (!accountId) return res.status(400).json({ error: '缺少 accountId' });
    if (!imagePaths || imagePaths.length === 0) return res.status(400).json({ error: '请选择图片' });
    const result = await facebookAutomation.publishToProfile(accountId, { text, imagePaths });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/publish/profile/video', async (req, res) => {
  try {
    const { accountId, text, videoPath } = req.body;
    if (!accountId) return res.status(400).json({ error: '缺少 accountId' });
    if (!videoPath) return res.status(400).json({ error: '请选择视频' });
    const result = await facebookAutomation.publishToProfile(accountId, { text, videoPath });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// 发布 - 公共主页
// ============================================================

router.post('/publish/page/image', async (req, res) => {
  try {
    const { accountId, pageId, pageName, text, imagePaths } = req.body;
    if (!accountId) return res.status(400).json({ error: '缺少 accountId' });
    if (!pageId && !pageName) return res.status(400).json({ error: '请指定公共主页' });
    if (!imagePaths || imagePaths.length === 0) return res.status(400).json({ error: '请选择图片' });
    const result = await facebookAutomation.publishToPage(accountId, { pageId, pageName, text, imagePaths });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/publish/page/video', async (req, res) => {
  try {
    const { accountId, pageId, pageName, text, videoPath } = req.body;
    if (!accountId) return res.status(400).json({ error: '缺少 accountId' });
    if (!pageId && !pageName) return res.status(400).json({ error: '请指定公共主页' });
    if (!videoPath) return res.status(400).json({ error: '请选择视频' });
    const result = await facebookAutomation.publishToPage(accountId, { pageId, pageName, text, videoPath });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
