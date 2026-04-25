/**
 * 小红书 API 路由
 * 支持：登录、发布图文、发布视频、店铺绑定
 * 文件通过 Base64 传输，不依赖 multer
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { getXiaohongshuInstance } from '../services/xiaohongshuAutomation.js';

const router = express.Router();
const xhs = getXiaohongshuInstance();

const STATE_DIR = path.join(process.cwd(), 'browser-states');
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'xiaohongshu');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * 保存 base64 文件到临时目录
 */
function saveBase64File(base64Data, filename) {
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error('无效的 base64 数据');

  const mimeType = matches[1];
  const data = Buffer.from(matches[2], 'base64');
  const ext = mimeType.split('/')[1] || 'jpg';

  // 生成唯一文件名
  const finalName = `${Date.now()}_${filename || `file.${ext}`}`;
  const filePath = path.join(UPLOAD_DIR, finalName);
  fs.writeFileSync(filePath, data);

  return {
    path: filePath,
    mimeType,
    ext,
    originalName: filename || finalName,
  };
}

// =============================================================
// 1. 获取登录二维码
// =============================================================
router.post('/login/qrcode', async (req, res) => {
  try {
    const { accountId } = req.body || {};
    await xhs.createContext(accountId, { headless: false });
    const qrData = await xhs.getLoginQRCode();

    res.json({
      success: true,
      data: {
        qrImage: qrData.screenshot,
        loginUrl: qrData.loginUrl,
        tip: '请使用小红书App扫码登录',
      },
    });
  } catch (error) {
    console.error('[小红书] 获取二维码失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 2. 轮询等待登录完成
// =============================================================
router.post('/login/wait', async (req, res) => {
  try {
    const { accountId, timeout = 120000 } = req.body || {};
    const loggedIn = await xhs.waitForLogin(timeout);

    if (loggedIn) {
      await xhs.saveSession(accountId);
      res.json({ success: true, data: { loggedIn: true } });
    } else {
      res.json({ success: false, error: '登录超时', code: 'TIMEOUT' });
    }
  } catch (error) {
    console.error('[小红书] 等待登录失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 3. 检查登录状态
// =============================================================
router.get('/login/status', async (req, res) => {
  try {
    const accountId = req.query.accountId;
    const hasSession = xhs.hasSavedSession(accountId);

    let isValid = false;
    if (hasSession) {
      isValid = await xhs.validateSession(accountId);
    }

    res.json({
      success: true,
      data: {
        hasSession,
        loggedIn: isValid,
        accountId: accountId || null,
      },
    });
  } catch (error) {
    console.error('[小红书] 检查状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 4. 发布图文笔记
// =============================================================
router.post('/publish/note', async (req, res) => {
  try {
    const {
      accountId,
      title,
      content,
      images,      // base64 图片数组
      tags,
      location,
      isPrivate,
    } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({ success: false, error: '标题和正文不能为空' });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ success: false, error: '请提供至少一张图片（base64）' });
    }

    const hasSession = xhs.hasSavedSession(accountId);
    if (!hasSession) {
      return res.status(401).json({ success: false, error: '请先登录小红书账号', code: 'NEED_LOGIN' });
    }

    // 将 base64 图片保存为临时文件
    const imageFiles = images.map((img, i) => saveBase64File(img, `image_${i}.jpg`));

    await xhs.createContext(accountId, { headless: true });

    const result = await xhs.publishNote({
      images: imageFiles.map(f => f.path),
      title,
      content,
      tags: tags || [],
      location: location || '',
      isPrivate: isPrivate || false,
    });

    await xhs.close();

    // 清理临时图片文件
    imageFiles.forEach(f => {
      try { fs.unlinkSync(f.path); } catch {}
    });

    res.json({
      success: true,
      data: result,
      message: '图文发布成功！',
    });
  } catch (error) {
    console.error('[小红书] 发布图文失败:', error);
    await xhs.close().catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 5. 发布视频笔记
// =============================================================
router.post('/publish/video', async (req, res) => {
  try {
    const {
      accountId,
      title,
      content,
      videoBase64,    // 视频文件的 base64
      coverBase64,    // 封面图片 base64（可选）
      videoName,      // 视频文件名（可选）
      tags,
      location,
      isPrivate,
    } = req.body || {};

    if (!title || !content) {
      return res.status(400).json({ success: false, error: '标题和正文不能为空' });
    }

    if (!videoBase64) {
      return res.status(400).json({ success: false, error: '请提供视频文件（base64）' });
    }

    const hasSession = xhs.hasSavedSession(accountId);
    if (!hasSession) {
      return res.status(401).json({ success: false, error: '请先登录小红书账号', code: 'NEED_LOGIN' });
    }

    // 保存视频文件
    const videoFile = saveBase64File(videoBase64, videoName || 'video.mp4');

    // 保存封面（如果有）
    let coverFile = null;
    if (coverBase64) {
      coverFile = saveBase64File(coverBase64, 'cover.jpg');
    }

    await xhs.createContext(accountId, { headless: true });

    const result = await xhs.publishVideo({
      videoPath: videoFile.path,
      coverImage: coverFile?.path,
      title,
      content,
      tags: tags || [],
      location: location || '',
      isPrivate: isPrivate || false,
    });

    await xhs.close();

    // 清理临时文件
    try { fs.unlinkSync(videoFile.path); } catch {}
    if (coverFile) { try { fs.unlinkSync(coverFile.path); } catch {} }

    res.json({
      success: true,
      data: result,
      message: '视频发布成功！',
    });
  } catch (error) {
    console.error('[小红书] 发布视频失败:', error);
    await xhs.close().catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 6. 获取店铺/账号信息
// =============================================================
router.get('/shop/info', async (req, res) => {
  try {
    const accountId = req.query.accountId;
    const hasSession = xhs.hasSavedSession(accountId);

    if (!hasSession) {
      return res.status(401).json({ success: false, error: '请先登录小红书账号', code: 'NEED_LOGIN' });
    }

    await xhs.createContext(accountId, { headless: true });
    const shopInfo = await xhs.getShopInfo();
    await xhs.close();

    res.json({
      success: true,
      data: shopInfo,
    });
  } catch (error) {
    console.error('[小红书] 获取店铺信息失败:', error);
    await xhs.close().catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 7. 启动绑定店铺流程
// =============================================================
router.post('/shop/bind', async (req, res) => {
  try {
    const { accountId } = req.body || {};
    if (!accountId) {
      return res.status(400).json({ success: false, error: '请提供账号标识' });
    }

    // 启动浏览器让用户手动登录小红书创作者中心
    await xhs.createContext(accountId, { headless: false });
    await xhs.gotoLogin();

    res.json({
      success: true,
      data: {
        message: '浏览器已打开，请在小红书登录页面完成登录',
        tip: '登录后调用 /api/xiaohongshu/login/wait 等待登录完成',
      },
    });
  } catch (error) {
    console.error('[小红书] 绑定店铺失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 8. 获取已绑定的账号列表
// =============================================================
router.get('/accounts', async (req, res) => {
  try {
    if (!fs.existsSync(STATE_DIR)) {
      return res.json({ success: true, data: { accounts: [], total: 0 } });
    }

    const accounts = fs.readdirSync(STATE_DIR)
      .filter(f => f.startsWith('xiaohongshu_') && f.endsWith('.json'))
      .map(f => ({
        accountId: f.replace('xiaohongshu_', '').replace('.json', ''),
        displayName: f === 'xiaohongshu_default.json' ? '默认账号' : f.replace('xiaohongshu_', '').replace('.json', ''),
        bound: true,
        boundAt: fs.statSync(path.join(STATE_DIR, f)).mtime.toISOString(),
      }));

    res.json({
      success: true,
      data: { accounts, total: accounts.length },
    });
  } catch (error) {
    console.error('[小红书] 获取账号列表失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 9. 解绑/移除账号
// =============================================================
router.delete('/accounts/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    const stateFile = path.join(STATE_DIR, `xiaohongshu_${accountId}.json`);

    if (fs.existsSync(stateFile)) {
      fs.unlinkSync(stateFile);
    }

    res.json({ success: true, message: `账号 ${accountId} 已解绑` });
  } catch (error) {
    console.error('[小红书] 解绑失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// 10. 系统状态
// =============================================================
router.get('/status', async (req, res) => {
  try {
    const sessions = fs.existsSync(STATE_DIR)
      ? fs.readdirSync(STATE_DIR).filter(f => f.startsWith('xiaohongshu_'))
      : [];

    res.json({
      success: true,
      data: {
        boundAccounts: sessions.map(f => ({
          id: f.replace('xiaohongshu_', '').replace('.json', ''),
        })),
        total: sessions.length,
        uploadDir: UPLOAD_DIR,
      },
    });
  } catch (error) {
    console.error('[小红书] 获取状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
