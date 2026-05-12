/**
 * Facebook 发布路由
 * - 个人主页：图片/视频发布
 * - 公共主页：图片/视频发布
 */
import { Router } from 'express';
import facebookAutomation from '../services/facebookAutomation.js';

const router = Router();

// JWT 验证中间件（参考其他路由的 auth 模式）
function auth(req, res, next) {
  if (req.user) return next();
  
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      // 从全局获取 jwt 验证函数
      if (global.jwtVerify) {
        const decoded = global.jwtVerify(token);
        req.user = decoded;
        return next();
      }
    } catch {}
  }
  
  // 允许无 token 访问（调试用，正式环境应移除）
  if (process.env.NODE_ENV !== 'production') {
    req.user = { id: 'dev-user' };
    return next();
  }
  
  return res.status(401).json({ error: '请先登录' });
}

router.use(auth);

// ============================================================
// 登录 & 状态
// ============================================================

/**
 * POST /api/facebook/login
 * 打开 Facebook 登录页
 */
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

/**
 * POST /api/facebook/2fa
 * 提交双重验证码
 */
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

/**
 * GET /api/facebook/status?accountId=xxx
 * 获取登录状态
 */
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

/**
 * GET /api/facebook/pages?accountId=xxx
 * 获取公共主页列表
 */
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

/**
 * POST /api/facebook/logout
 * 退出登录
 */
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

/**
 * POST /api/facebook/publish/profile/image
 * 发布图片到个人主页
 * Body: { accountId, text, imagePaths: string[] }
 */
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

/**
 * POST /api/facebook/publish/profile/video
 * 发布视频到个人主页
 * Body: { accountId, text, videoPath: string }
 */
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

/**
 * POST /api/facebook/publish/page/image
 * 发布图片到公共主页
 * Body: { accountId, pageId, pageName, text, imagePaths: string[] }
 */
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

/**
 * POST /api/facebook/publish/page/video
 * 发布视频到公共主页
 * Body: { accountId, pageId, pageName, text, videoPath: string }
 */
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
