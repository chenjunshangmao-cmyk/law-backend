/**
 * YouTube Data API v3 视频上传路由
 * ============================================================
 * 使用 YouTube Data API (非浏览器自动化) 直接上传视频
 * 适用于服务器环境（Render），无需浏览器
 * 
 * API 端点：
 *   POST /api/youtube/upload        — 上传视频
 *   GET  /api/youtube/videos        — 视频列表
 *   GET  /api/youtube/video/:id     — 视频详情
 *   GET  /api/youtube/channel/:id   — 频道信息
 *   GET  /api/youtube/quota         — 配额检查
 *   GET  /api/youtube/oauth-url     — 获取授权链接
 *   GET  /api/youtube/accounts      — 已授权账号列表
 */

import express from 'express';
import {
  uploadVideo,
  listVideos,
  getVideoDetails,
  getChannelInfo,
  checkQuota,
  getOAuthUrl,
} from '../services/youtubeApiService.js';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// ============================================================
// GET /api/youtube/accounts — 已授权账号列表
// ============================================================
router.get('/accounts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, email, channel_id, channel_title, thumbnail_url, expires_at, created_at
      FROM youtube_authorizations
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const accounts = result.rows.map(row => ({
      id: row.id,
      email: row.email || '未知',
      channelId: row.channel_id,
      channelTitle: row.channel_title || '未命名频道',
      thumbnail: row.thumbnail_url,
      tokenValid: row.expires_at ? new Date(row.expires_at) > new Date() : false,
      createdAt: row.created_at,
    }));

    res.json({ success: true, accounts });
  } catch (err) {
    console.error('[YouTube API] 获取账号列表失败:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// GET /api/youtube/channel/:channelId — 频道信息
// ============================================================
router.get('/channel/:channelId', async (req, res) => {
  try {
    const info = await getChannelInfo(req.params.channelId);
    res.json({ success: true, channel: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// GET /api/youtube/quota — 配额检查
// ============================================================
router.get('/quota', async (req, res) => {
  try {
    // 用第一个可用账号检查
    const accounts = await pool.query(
      'SELECT channel_id FROM youtube_authorizations ORDER BY created_at DESC LIMIT 1'
    );

    if (accounts.rows.length === 0) {
      return res.json({ success: false, error: '暂无已授权账号' });
    }

    const result = await checkQuota(accounts.rows[0].channel_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// GET /api/youtube/oauth-url — OAuth 授权链接
// ============================================================
router.get('/oauth-url', (req, res) => {
  try {
    const mode = req.query.mode || 'popup';
    const callbackBase = getCallbackBase(req);
    const result = getOAuthUrl(mode, callbackBase);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// POST /api/youtube/upload — 上传视频
// ============================================================
router.post('/upload', async (req, res) => {
  try {
    const {
      channelId,    // YouTube 频道 ID（必填）
      videoPath,     // 视频文件路径（必填）
      title,         // 视频标题（必填）
      description = '',
      tags = [],
      categoryId = '22',
      privacyStatus = 'public',
      thumbnailPath = null,
    } = req.body;

    // 参数校验
    if (!channelId) {
      return res.json({ 
        success: false, 
        error: '缺少 channelId，请先授权 YouTube 账号',
        help: 'GET /api/youtube/accounts 获取已授权账号'
      });
    }
    if (!videoPath) {
      return res.json({ success: false, error: '缺少视频路径 videoPath' });
    }
    if (!title) {
      return res.json({ success: false, error: '缺少视频标题 title' });
    }

    console.log(`[YouTube Upload] 开始上传: ${title} → ${channelId}`);

    const result = await uploadVideo({
      channelId,
      videoPath,
      title,
      description,
      tags,
      categoryId,
      privacyStatus,
      thumbnailPath,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[YouTube Upload] 上传失败:', err.message);
    
    // 处理已知错误
    if (err.message.includes('未找到该频道授权')) {
      return res.json({ success: false, error: '未授权，请先进行 YouTube OAuth 授权' });
    }
    if (err.message.includes('配额已用完')) {
      return res.json({ success: false, error: '配额已用完，请等待明天重置' });
    }
    if (err.response?.status === 401) {
      return res.json({ success: false, error: '授权已失效，请重新授权' });
    }
    
    res.json({ success: false, error: err.message });
  }
});

// ============================================================
// GET /api/youtube/videos — 视频列表
// ============================================================
router.get('/videos', async (req, res) => {
  try {
    const { channelId, maxResults = '10' } = req.query;
    if (!channelId) {
      return res.json({ success: false, error: '缺少 channelId 参数' });
    }

    const result = await listVideos(channelId, parseInt(maxResults));
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// GET /api/youtube/video/:videoId — 视频详情
// ============================================================
router.get('/video/:videoId', async (req, res) => {
  try {
    const { channelId } = req.query;
    if (!channelId) {
      return res.json({ success: false, error: '缺少 channelId 参数' });
    }

    const result = await getVideoDetails(req.params.videoId, channelId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// 工具函数
// ============================================================
function getCallbackBase(req) {
  const host = req.get('host') || '';
  const isSecure = req.secure || req.get('x-forwarded-proto') === 'https'
    || host.includes('.onrender.com') || host.includes('chenjuntrading.cn');
  const protocol = isSecure ? 'https' : 'http';

  if (host.includes('chenjuntrading.cn')) return 'https://api.chenjuntrading.cn';
  if (host.includes('localhost') || host.includes('127.0.0.1')) return 'http://localhost:8089';
  if (host.includes('.onrender.com')) return `https://${host}`;
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL;
  return 'https://claw-backend-2026.onrender.com';
}

export default router;
