/**
 * YouTube OAuth 2.0 授权路由
 * 用于客户授权 Claw 操作其 YouTube 账号（发布视频/图文）
 * 与 Google 登录（网站认证）是两个完全不同的授权
 *
 * Scope 说明：
 *  - login 模式：email + profile（网站登录）
 *  - youtube 模式：youtube.upload + youtube（API 操作授权）
 */
import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { pool } from '../config/database.js';

const router = express.Router();

// ============================================================
// 初始化数据库表（启动时自动创建）
// ============================================================
async function initTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS youtube_authorizations (
        id VARCHAR(100) PRIMARY KEY,
        user_id INTEGER,
        email VARCHAR(255),
        channel_id VARCHAR(100) UNIQUE,
        channel_title VARCHAR(255),
        access_token TEXT,
        refresh_token TEXT,
        expires_at TIMESTAMP,
        thumbnail_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[YouTube OAuth] ✅ 数据库表就绪');
  } catch (err) {
    console.warn('[YouTube OAuth] ⚠️  表初始化失败:', err.message);
  }
}
initTable(); // 异步执行，不阻塞启动

// ============================================================
// YouTube OAuth 配置（使用与 Google 登录相同的 Client ID）
// ============================================================
const YT_CONFIG = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  auth_url: 'https://accounts.google.com/o/oauth2/v2/auth',
  token_url: 'https://oauth2.googleapis.com/token',
  scopes: [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.readonly',
  ].join(' '),
};

const JWT_SECRET = process.env.JWT_SECRET || 'claw-secret-key-2026';

if (!YT_CONFIG.client_id || !YT_CONFIG.client_secret) {
  console.warn('[YouTube OAuth] ⚠️  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 未设置，YouTube 授权不可用');
}

// ============================================================
// GET /api/auth/youtube - 发起 YouTube OAuth 授权
// ============================================================
router.get('/', (req, res) => {
  const mode = req.query.mode || 'popup';
  const callbackBase = getCallbackBase(req);
  // Google OAuth redirect_uri 必须完全匹配，不能带查询参数
  // mode 信息通过 state 参数传递
  const callbackUrl = `${callbackBase}/api/auth/youtube/callback`;

  const state = Buffer.from(JSON.stringify({
    mode,
    ts: Date.now(),
  })).toString('base64url');

  const params = new URLSearchParams({
    client_id: YT_CONFIG.client_id,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: YT_CONFIG.scopes,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  const authUrl = `${YT_CONFIG.auth_url}?${params}`;

  if (mode === 'redirect') {
    return res.redirect(authUrl);
  }

  // popup 模式：返回 authUrl 让前端打开 popup
  res.json({ success: true, authUrl });
});

// ============================================================
// GET /api/auth/youtube/callback - OAuth 回调
// ============================================================
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // 解析 state 获取 mode（Google OAuth redirect_uri 必须完全匹配，不能带查询参数）
  let stateData = {};
  try {
    if (state) stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
  } catch { /* ignore */ }
  const mode = stateData.mode || 'popup';

  if (error) {
    const errMsg = `用户拒绝授权: ${error}`;
    console.log('[YouTube OAuth]', errMsg);
    if (mode === 'redirect') {
      return res.redirect(`/?error=${encodeURIComponent(errMsg)}`);
    }
    return res.status(400).json({ success: false, message: errMsg });
  }

  if (!code) {
    return res.status(400).json({ success: false, message: '缺少授权码' });
  }

  const callbackBase = getCallbackBase(req);
  // Google OAuth redirect_uri 必须完全匹配，不能带查询参数
  const callbackUrl = `${callbackBase}/api/auth/youtube/callback`;

  try {
    // 用 code 换 token
    const tokenRes = await axios.post(YT_CONFIG.token_url, new URLSearchParams({
      code,
      client_id: YT_CONFIG.client_id,
      client_secret: YT_CONFIG.client_secret,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

    const { access_token, refresh_token, expires_in } = tokenRes.data;

    // 获取 YouTube 频道信息
    let channelInfo = {};
    try {
      const ytRes = await axios.get(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true',
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      const channel = ytRes.data.items?.[0];
      if (channel) {
        channelInfo = {
          channelId: channel.id,
          channelTitle: channel.snippet.title,
          thumbnail: channel.snippet.thumbnails?.default?.url,
          playlistId: channel.contentDetails.relatedPlaylists.uploads,
        };
      }
    } catch (e) {
      console.warn('[YouTube OAuth] 获取频道信息失败:', e.message);
    }

    // 获取 Google 用户信息（邮箱）
    let googleUser = {};
    try {
      const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      googleUser = {
        email: userRes.data.email,
        name: userRes.data.name,
        picture: userRes.data.picture,
      };
    } catch { /* ignore */ }

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // ============================================================
    // 保存到 youtube_authorizations 表
    // ============================================================
    try {
      const authId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      await pool.query(`
        INSERT INTO youtube_authorizations (
          id, user_id, email, channel_id, channel_title,
          access_token, refresh_token, expires_at,
          thumbnail_url, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
        ON CONFLICT (user_id, channel_id)
        DO UPDATE SET
          access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          expires_at = EXCLUDED.expires_at,
          updated_at = NOW()
      `, [
        authId,
        null, // user_id - 匿名用户，暂不关联
        googleUser.email || null,
        channelInfo.channelId || null,
        channelInfo.channelTitle || null,
        access_token,
        refresh_token,
        expiresAt,
        channelInfo.thumbnail || null,
      ]);
    } catch (dbErr) {
      // 表不存在不影响主流程
      console.warn('[YouTube OAuth] 保存授权失败（表可能不存在）:', dbErr.message);
    }

    console.log('[YouTube OAuth] 授权成功:', googleUser.email, channelInfo.channelTitle);

    if (mode === 'redirect') {
      return res.redirect(`/?youtube_authorized=1&channel=${encodeURIComponent(channelInfo.channelTitle || '')}`);
    }

    // popup 模式：通过 postMessage 返回结果
    const html = `<!DOCTYPE html><html><body>
    <script>
      try {
        window.opener.postMessage({
          type: 'youtube_auth_success',
          data: {
            email: ${JSON.stringify(googleUser.email || '')},
            channelId: ${JSON.stringify(channelInfo.channelId || '')},
            channelTitle: ${JSON.stringify(channelInfo.channelTitle || '')},
            thumbnail: ${JSON.stringify(channelInfo.thumbnail || '')},
            expiresAt: ${JSON.stringify(expiresAt)},
          }
        }, '*');
      } catch(e) {}
      setTimeout(() => window.close(), 500);
    </script>
    <p>授权成功！正在关闭...</p>
    </body></html>`;
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline';");
    res.type('html').send(html);

  } catch (err) {
    console.error('[YouTube OAuth] 回调失败:', err.response?.data || err.message);
    if (mode === 'redirect') {
      return res.redirect(`/?error=${encodeURIComponent('授权失败，请重试')}`);
    }
    res.status(500).json({ success: false, message: '授权失败，请重试' });
  }
});

// ============================================================
// GET /api/auth/youtube/accounts - 获取当前用户的已授权账号列表
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
      email: row.email,
      channelId: row.channel_id,
      channelTitle: row.channel_title,
      thumbnail: row.thumbnail_url,
      expiresAt: row.expires_at,
      valid: row.expires_at ? new Date(row.expires_at) > new Date() : null,
      createdAt: row.created_at,
    }));

    res.json({ success: true, accounts });
  } catch (err) {
    console.error('[YouTube OAuth] 获取账号列表失败:', err.message);
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// ============================================================
// DELETE /api/auth/youtube/accounts/:channelId - 撤销授权
// ============================================================
router.delete('/accounts/:channelId', async (req, res) => {
  try {
    await pool.query('DELETE FROM youtube_authorizations WHERE channel_id = $1', [req.params.channelId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[YouTube OAuth] 撤销授权失败:', err.message);
    res.status(500).json({ success: false, message: '撤销失败' });
  }
});

// ============================================================
// 工具函数
// ============================================================
function getCallbackBase(req) {
  const host = req.get('host') || '';
  // Render/生产环境使用 HTTPS，即使内部转发是 HTTP
  const isSecure = req.secure || req.get('x-forwarded-proto') === 'https'
    || host.includes('.onrender.com') || host.includes('chenjuntrading.cn');
  const protocol = isSecure ? 'https' : 'http';

  // 生产环境
  if (host.includes('chenjuntrading.cn')) {
    return 'https://api.chenjuntrading.cn';
  }
  
  // 开发环境
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return 'http://localhost:8089';
  }
  
  // Render环境 - 强制 HTTPS
  if (host.includes('.onrender.com')) {
    return `https://${host}`;
  }
  
  // 环境变量
  if (process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  // 兜底
  return 'https://claw-backend-2026.onrender.com';
}

export default router;
