/**
 * 直播推流 API 路由 v1.0
 * 
 * 端点：
 * POST   /api/live-stream/start       - 启动直播
 * POST   /api/live-stream/stop        - 停止直播
 * GET    /api/live-stream/status      - 直播状态
 * POST   /api/live-stream/pause       - 暂停直播
 * POST   /api/live-stream/resume      - 恢复直播
 * POST   /api/live-stream/script      - 添加脚本
 * GET    /api/live-stream/scripts     - 查看脚本队列
 * POST   /api/live-stream/announce    - 主播公告
 * GET    /api/live-stream/platforms   - 支持的平台列表
 * POST   /api/live-stream/generate-script - AI生成直播脚本
 */

import express from 'express';
import { getLiveStreamEngine, resetLiveStreamEngine, LiveStatus } from '../services/avatar/LiveStreamEngine.js';

const router = express.Router();

// ─── 中间件：确保引擎已初始化 ───
function ensureEngine(req, res, next) {
  try {
    const engine = getLiveStreamEngine();
    req.engine = engine;
    next();
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
}

// ─── 直播控制 ───

/**
 * POST /api/live-stream/start
 * 启动AI数字人直播
 */
router.post('/start', ensureEngine, async (req, res) => {
  try {
    const {
      platform = 'custom',
      streamKey,
      rtmpUrl,
      avatarName,
      voice,
      autoReply,
      width = 1080,
      height = 1920,
      fps = 25,
      scripts,  // 初始脚本列表
    } = req.body;

    const engine = req.engine;

    // 如果引擎已存在且不在空闲状态，重置
    if (engine.status !== LiveStatus.IDLE) {
      return res.json({
        success: false,
        error: `直播引擎当前状态: ${engine.status}，请先停止当前直播`,
      });
    }

    // 更新配置
    if (platform) engine.platform = platform;
    if (streamKey) engine.streamKey = streamKey;
    if (rtmpUrl) engine.rtmpUrl = rtmpUrl;
    if (avatarName) engine.avatarConfig.name = avatarName;
    if (voice) engine.avatarConfig.voice = voice;
    if (autoReply !== undefined) engine.autoReplyEnabled = autoReply;
    if (width) engine.width = width;
    if (height) engine.height = height;
    if (fps) engine.fps = fps;

    // 添加初始脚本
    if (scripts && scripts.length > 0) {
      engine.addScripts(scripts);
    }

    // 启动直播
    await engine.startLive();

    res.json({
      success: true,
      data: {
        message: '直播已启动',
        status: engine.getStats(),
      },
    });
  } catch (e) {
    console.error('[LiveStream] 启动失败:', e);
    res.json({ success: false, error: e.message });
  }
});

/**
 * POST /api/live-stream/stop
 * 停止直播
 */
router.post('/stop', ensureEngine, async (req, res) => {
  try {
    const stats = await req.engine.stopLive();
    
    res.json({
      success: true,
      data: {
        message: '直播已停止',
        stats,
      },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/live-stream/status
 * 获取直播状态
 */
router.get('/status', ensureEngine, (req, res) => {
  res.json({
    success: true,
    data: req.engine.getStats(),
  });
});

/**
 * POST /api/live-stream/pause
 * 暂停直播
 */
router.post('/pause', ensureEngine, (req, res) => {
  try {
    req.engine.pauseLive();
    res.json({
      success: true,
      data: {
        message: '直播已暂停',
        status: req.engine.status,
      },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * POST /api/live-stream/resume
 * 恢复直播
 */
router.post('/resume', ensureEngine, (req, res) => {
  try {
    req.engine.resumeLive();
    res.json({
      success: true,
      data: {
        message: '直播已恢复',
        status: req.engine.status,
      },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ─── 脚本管理 ───

/**
 * POST /api/live-stream/script
 * 添加直播脚本
 */
router.post('/script', ensureEngine, (req, res) => {
  try {
    const { text, duration, priority, tags } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.json({ success: false, error: '脚本内容不能为空' });
    }

    req.engine.addScript({
      text: text.trim(),
      duration: duration || 30,
      priority: priority || 0,
      tags: tags || [],
    });

    res.json({
      success: true,
      data: {
        message: '脚本已添加',
        queueSize: req.engine.scriptQueue.length,
      },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/live-stream/scripts
 * 查看脚本队列
 */
router.get('/scripts', ensureEngine, (req, res) => {
  res.json({
    success: true,
    data: {
      current: req.engine.currentScript,
      queue: req.engine.scriptQueue,
      queueSize: req.engine.scriptQueue.length,
    },
  });
});

/**
 * POST /api/live-stream/announce
 * 发送主播公告（高优先级插入）
 */
router.post('/announce', ensureEngine, (req, res) => {
  try {
    const { text, priority = 10 } = req.body;
    
    if (!text) {
      return res.json({ success: false, error: '公告内容不能为空' });
    }

    req.engine.announce(text, priority);

    res.json({
      success: true,
      data: { message: '公告已发送' },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// ─── AI脚本生成 ───

import { generateLiveScript } from '../services/writer/ScriptGenerator.js';
import { generateMarketingCopy } from '../services/writer/CopyGenerator.js';

/**
 * POST /api/live-stream/generate-script
 * AI生成直播脚本
 */
router.post('/generate-script', async (req, res) => {
  try {
    const {
      productName,
      productDesc,
      scene = '产品介绍',
      platform = 'TikTok',
      count = 5,
    } = req.body;

    if (!productName) {
      return res.json({ success: false, error: '请输入产品名称' });
    }

    console.log(`[LiveStream] 🤖 生成直播脚本: ${productName}`);

    // 生成直播脚本和营销文案
    const [script, copy] = await Promise.all([
      generateLiveScript({ productName, productDesc, scene, platform }),
      generateMarketingCopy({ productName, productDesc, platform }),
    ]);

    // 将脚本拆分为多个片段（适合直播循环播放）
    const segments = [];
    if (script) {
      // 按句号/换行拆分
      const parts = script.split(/[。\n]+/).filter(s => s.trim().length > 5);
      parts.forEach((text, i) => {
        segments.push({
          id: `gen_${i}`,
          text: text.trim(),
          duration: Math.max(10, Math.min(60, text.length * 0.3)), // ~0.3秒/字
          priority: 0,
        });
      });
    }

    res.json({
      success: true,
      data: {
        productName,
        script,
        copy,
        segments,
        segmentCount: segments.length,
        message: `已生成${segments.length}段直播脚本和营销文案`,
      },
    });
  } catch (e) {
    console.error('[LiveStream] 脚本生成失败:', e);
    res.json({ success: false, error: e.message });
  }
});

// ─── 平台信息 ───

/**
 * GET /api/live-stream/platforms
 * 获取支持的直播平台及RTMP配置
 */
router.get('/platforms', (req, res) => {
  res.json({
    success: true,
    data: {
      platforms: [
        {
          id: 'youtube',
          name: 'YouTube Live',
          rtmpTemplate: 'rtmp://a.rtmp.youtube.com/live2/{streamKey}',
          needStreamKey: true,
          icon: 'youtube',
          maxBitrate: '9000k',
          maxResolution: '3840x2160',
        },
        {
          id: 'tiktok',
          name: 'TikTok Live',
          rtmpTemplate: 'rtmp://push-rtmp.tiktoklive.com/live/{streamKey}',
          needStreamKey: true,
          icon: 'tiktok',
          maxBitrate: '6000k',
          maxResolution: '1080x1920',
        },
        {
          id: 'facebook',
          name: 'Facebook Live',
          rtmpTemplate: 'rtmp://live-api-s.facebook.com:443/rtmp/{streamKey}',
          needStreamKey: true,
          icon: 'facebook',
          maxBitrate: '6000k',
          maxResolution: '1920x1080',
        },
        {
          id: 'bilibili',
          name: 'B站直播',
          rtmpTemplate: 'rtmp://live-push.bilivideo.com/live-bvc/{streamKey}',
          needStreamKey: true,
          icon: 'bilibili',
          maxBitrate: '10000k',
          maxResolution: '1920x1080',
        },
        {
          id: 'douyin',
          name: '抖音直播',
          rtmpTemplate: 'rtmp://push-rtmp.douyin.com/live/{streamKey}',
          needStreamKey: true,
          icon: 'douyin',
          maxBitrate: '6000k',
          maxResolution: '1080x1920',
        },
        {
          id: 'kuaishou',
          name: '快手直播',
          rtmpTemplate: 'rtmp://live-push.kuaishou.com/live/{streamKey}',
          needStreamKey: true,
          icon: 'kuaishou',
          maxBitrate: '4000k',
          maxResolution: '1080x1920',
        },
        {
          id: 'twitch',
          name: 'Twitch',
          rtmpTemplate: 'rtmp://live.twitch.tv/app/{streamKey}',
          needStreamKey: true,
          icon: 'twitch',
          maxBitrate: '6000k',
          maxResolution: '1920x1080',
        },
        {
          id: 'custom',
          name: '自定义RTMP',
          rtmpTemplate: 'rtmp://your-server/live/{streamKey}',
          needStreamKey: false,
          icon: 'server',
          maxBitrate: '10000k',
          maxResolution: '3840x2160',
        },
      ],
    },
  });
});

export default router;
