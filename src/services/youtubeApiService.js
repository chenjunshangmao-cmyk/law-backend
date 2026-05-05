/**
 * YouTube Data API v3 视频上传服务
 * ============================================================
 * 使用 OAuth 2.0 token 直接调用 YouTube API 上传视频
 * 无需浏览器，服务器端可直接运行
 * 
 * 依赖：
 *   - youtube_authorizations 表中的 OAuth token
 *   - axios（已安装）
 * 
 * 配额说明：
 *   - 上传视频消耗 1600 配额单位
 *   - 每日默认配额上限 10,000 单位
 *   - 即每天最多上传 ~6 个视频
 *   - 可以申请提升配额
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { pool } from '../config/database.js';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Google OAuth 凭据（与 auth.youtube.js 共用）
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

/**
 * 从数据库获取有效的 YouTube OAuth token（自动刷新过期 token）
 */
async function getValidToken(channelId) {
  const result = await pool.query(
    'SELECT * FROM youtube_authorizations WHERE channel_id = $1 ORDER BY updated_at DESC LIMIT 1',
    [channelId]
  );

  if (result.rows.length === 0) {
    throw new Error('未找到该频道授权信息，请先进行 YouTube OAuth 授权');
  }

  const auth = result.rows[0];
  
  // 检查 token 是否过期
  const now = new Date();
  const expiresAt = new Date(auth.expires_at);

  if (expiresAt > now) {
    // Token 未过期，直接使用
    return {
      accessToken: auth.access_token,
      channelId: auth.channel_id,
      channelTitle: auth.channel_title,
      email: auth.email,
    };
  }

  // Token 过期，用 refresh_token 换取新 token
  if (!auth.refresh_token) {
    throw new Error('Token 已过期且无 refresh_token，请重新授权');
  }

  console.log('[YouTube API] Token 过期，正在刷新...');
  
  try {
    const tokenRes = await axios.post(OAUTH_TOKEN_URL, new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: auth.refresh_token,
      grant_type: 'refresh_token',
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, expires_in } = tokenRes.data;
    const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // 更新数据库
    await pool.query(
      'UPDATE youtube_authorizations SET access_token=$1, expires_at=$2, updated_at=NOW() WHERE channel_id=$3',
      [access_token, newExpiresAt, channelId]
    );

    console.log('[YouTube API] Token 刷新成功');
    
    return {
      accessToken: access_token,
      channelId: auth.channel_id,
      channelTitle: auth.channel_title,
      email: auth.email,
    };
  } catch (err) {
    console.error('[YouTube API] Token 刷新失败:', err.response?.data || err.message);
    throw new Error('Token 刷新失败，请重新授权 (refresh_token 可能已失效)');
  }
}

/**
 * 获取频道信息
 */
async function getChannelInfo(channelId) {
  const { accessToken } = await getValidToken(channelId);

  const res = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { part: 'snippet,contentDetails,statistics', id: channelId },
  });

  const channel = res.data.items?.[0];
  if (!channel) throw new Error('未找到该频道');

  return {
    channelId: channel.id,
    title: channel.snippet.title,
    description: channel.snippet.description,
    thumbnail: channel.snippet.thumbnails?.default?.url,
    subscriberCount: channel.statistics.subscriberCount,
    videoCount: channel.statistics.videoCount,
    uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
  };
}

/**
 * 可恢复上传（Resumable Upload）
 * 
 * YouTube Data API v3 视频上传流程：
 * Step 1: 发送初始化请求（获得上传 URL）
 * Step 2: 分块上传视频数据
 * Step 3: 获取返回的视频 ID
 */
async function uploadVideo({
  channelId,     // 频道 ID（从授权列表获取）
  videoPath,     // 本地视频文件路径 或 URL
  title,         // 视频标题
  description = '',
  tags = [],
  categoryId = '22',  // 默认分类: 22 = People & Blogs
  privacyStatus = 'public', // public | unlisted | private
  thumbnailPath = null, // 缩略图路径（可选）
}) {
  // 1. 获取有效 token
  const auth = await getValidToken(channelId);
  const accessToken = auth.accessToken;
  
  console.log(`[YouTube API] 开始上传视频 → ${auth.channelTitle}`);
  console.log(`  标题: ${title}`);

  // 2. 读取视频文件
  let videoBuffer;
  let fileSize;

  if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
    // URL 下载
    console.log(`  下载视频: ${videoPath}`);
    const downloadRes = await axios.get(videoPath, { responseType: 'arraybuffer', timeout: 600000 });
    videoBuffer = Buffer.from(downloadRes.data);
    fileSize = videoBuffer.length;
  } else {
    // 本地文件
    const absPath = path.resolve(videoPath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`视频文件不存在: ${absPath}`);
    }
    videoBuffer = fs.readFileSync(absPath);
    fileSize = videoBuffer.length;
  }

  console.log(`  文件大小: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

  if (fileSize > 137438953472) { // 128 GB
    throw new Error('视频文件超过 YouTube 128GB 上限');
  }

  // 3. 构建视频元数据（snippet + status）
  const snippet = {
    title: title.slice(0, 100),  // YouTube 标题限制 100 字符
    description: description.slice(0, 5000),
    tags: tags.slice(0, 500),     // 最多 500 个标签
    categoryId: categoryId,
    defaultLanguage: 'zh',
    defaultAudioLanguage: 'zh',
  };

  const requestBody = JSON.stringify({
    snippet,
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: false,
    },
  });

  // 4. 开始可恢复上传
  // Step 1: 初始化上传会话
  console.log('[YouTube API]   Step 1/3: 初始化上传会话...');
  
  const initRes = await axios.post(
    `${YOUTUBE_API_BASE}/videos?part=snippet,status,contentDetails`,
    requestBody,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': fileSize.toString(),
        'X-Upload-Content-Type': 'video/*',
      },
    }
  );

  const uploadUrl = initRes.headers['location'];
  if (!uploadUrl) {
    throw new Error('未获取到上传 URL（上传初始化失败）');
  }

  console.log('[YouTube API]   Step 2/3: 上传视频数据...');

  // Step 2: 上传视频数据
  const uploadRes = await axios.put(uploadUrl, videoBuffer, {
    headers: {
      'Content-Type': 'video/*',
      'Content-Length': fileSize.toString(),
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    timeout: 1800000, // 30 分钟超时（大文件）
    onUploadProgress: (progressEvent) => {
      const percent = ((progressEvent.loaded / fileSize) * 100).toFixed(1);
      if (progressEvent.loaded % (1024 * 1024 * 5) < 200000) { // 每 5MB 打印一次
        console.log(`  上传进度: ${percent}%`);
      }
    },
  });

  const videoId = uploadRes.data.id;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  console.log(`[YouTube API]   Step 3/3: 上传完成! videoId=${videoId}`);
  console.log(`  视频链接: ${videoUrl}`);

  // 5. 上传缩略图（可选）
  if (thumbnailPath && fs.existsSync(thumbnailPath)) {
    try {
      const thumbBuffer = fs.readFileSync(thumbnailPath);
      await axios.post(
        `${YOUTUBE_API_BASE}/thumbnails/set`,
        { videoId },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { videoId },
          data: thumbBuffer,
          maxContentLength: Infinity,
        }
      );
      console.log('  缩略图已设置');
    } catch (err) {
      console.warn('  ⚠️ 设置缩略图失败:', err.response?.data?.error?.message || err.message);
    }
  }

  return {
    success: true,
    videoId,
    videoUrl,
    title,
    channelTitle: auth.channelTitle,
    privacyStatus,
    fileSizeMB: (fileSize / 1024 / 1024).toFixed(2),
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * 获取视频列表
 */
async function listVideos(channelId, maxResults = 10) {
  const { accessToken } = await getValidToken(channelId);

  const res = await axios.get(`${YOUTUBE_API_BASE}/search`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      part: 'snippet',
      forMine: true,
      type: 'video',
      maxResults,
      order: 'date',
    },
  });

  return {
    success: true,
    videos: res.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    })),
    totalResults: res.data.pageInfo?.totalResults || 0,
  };
}

/**
 * 获取视频详情
 */
async function getVideoDetails(videoId, channelId) {
  const { accessToken } = await getValidToken(channelId);

  const res = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      part: 'snippet,statistics,status,contentDetails',
      id: videoId,
    },
  });

  const video = res.data.items?.[0];
  if (!video) throw new Error('未找到该视频');

  return {
    success: true,
    video: {
      videoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnail: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url,
      publishedAt: video.snippet.publishedAt,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      commentCount: video.statistics.commentCount,
      privacyStatus: video.status.privacyStatus,
      url: `https://www.youtube.com/watch?v=${video.id}`,
    },
  };
}

/**
 * 检查配额使用情况（估算）
 */
async function checkQuota(channelId) {
  try {
    const { accessToken } = await getValidToken(channelId);
    
    // YouTube API 不直接提供配额查询，我们用频道信息作为连通性检查
    await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { part: 'id', mine: true },
    });

    return {
      success: true,
      connected: true,
      note: 'YouTube API 连接正常。每日配额 10,000 单位，上传一个视频消耗 ~1,600 单位。',
    };
  } catch (err) {
    if (err.response?.status === 403 && err.response?.data?.error?.errors?.[0]?.reason === 'quotaExceeded') {
      return {
        success: false,
        connected: false,
        error: 'YouTube API 配额已用完，请等待明天重置（太平洋时间午夜）',
      };
    }
    return { success: false, connected: false, error: err.message };
  }
}

/**
 * 获取 OAuth 授权 URL（供前端直接调用 YouTube API 模式）
 */
function getOAuthUrl(mode = 'popup', callbackBase = '') {
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.readonly',
  ].join(' ');

  const redirectUri = `${callbackBase}/api/auth/youtube/callback`;

  const state = Buffer.from(JSON.stringify({
    mode,
    source: 'api_upload',
    ts: Date.now(),
  })).toString('base64url');

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });

  return {
    authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    scopes: ['youtube.upload', 'youtube', 'youtube.readonly'],
  };
}

export {
  getValidToken,
  getChannelInfo,
  uploadVideo,
  listVideos,
  getVideoDetails,
  checkQuota,
  getOAuthUrl,
};
