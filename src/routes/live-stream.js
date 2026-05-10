/**
 * 直播推流 API 路由 v2.0
 * 
 * 端点：
 * POST   /api/live-stream/start          - 启动直播（含sceneConfig）
 * POST   /api/live-stream/stop           - 停止直播
 * GET    /api/live-stream/status         - 直播状态
 * POST   /api/live-stream/pause          - 暂停直播
 * POST   /api/live-stream/resume         - 恢复直播
 * POST   /api/live-stream/script         - 添加脚本
 * GET    /api/live-stream/scripts        - 查看脚本队列
 * POST   /api/live-stream/announce       - 主播公告
 * GET    /api/live-stream/platforms      - 支持的平台列表
 * POST   /api/live-stream/generate-script - AI生成直播脚本
 * GET    /api/live-stream/scene-config   - 获取场景布局配置
 * PUT    /api/live-stream/scene-config   - 保存场景布局配置
 * POST   /api/live-stream/preview        - 生成预览帧画面
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { getLiveStreamEngine, resetLiveStreamEngine, LiveStatus } from '../services/avatar/LiveStreamEngine.js';
import { getProfileList, getProfile } from '../services/avatar/AvatarProfiles.js';
import { Avatar2DRenderer, loadImageBase64 } from '../services/avatar/VRMRenderer.js';
import { textToSpeech } from '../services/avatar/TTSEngine.js';

const router = express.Router();

// 静态文件服务：主播照片
router.use('/avatar-photos', express.static(path.join(process.cwd(), 'generated-avatars')));
// 静态文件服务：TTS试听音频
router.use('/preview-audio', express.static(path.join(process.cwd(), 'generated-audio')));

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
      profileId = 'xiaorui',  // 主播形象
      avatarName,
      voice,
      autoReply,
      width = 1080,
      height = 1920,
      fps = 25,
      scripts,  // 初始脚本列表
      // 代理配置
      proxyEnabled = false,
      proxyRegion,
      useOwnProxy = false,
      ownProxyUrl,
      // 场景布局配置
      sceneConfig,
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
    if (profileId) { engine.profileId = profileId; engine._loadProfile(); }
    if (avatarName) engine.avatarConfig.name = avatarName;
    if (voice) engine.avatarConfig.voice = voice;
    if (autoReply !== undefined) engine.autoReplyEnabled = autoReply;
    if (width) engine.width = width;
    if (height) engine.height = height;
    if (fps) engine.fps = fps;

    // 设置场景布局配置
    if (sceneConfig) {
      engine.sceneConfig = sceneConfig;
      console.log(`[LiveStream] 🎬 场景布局: ${sceneConfig.orientation}, ${sceneConfig.overlays?.length || 0}个叠加元素`);
    }

    // 添加初始脚本
    if (scripts && scripts.length > 0) {
      engine.addScripts(scripts);
    }

    // 配置代理
    engine.proxyEnabled = proxyEnabled;
    engine.useOwnProxy = useOwnProxy;
    if (useOwnProxy && ownProxyUrl) {
      engine.ownProxyUrl = ownProxyUrl;
      // 同时解析为 proxyConfig（供 LiveStreamEngine.prepare() 使用）
      try {
        const url = new URL(ownProxyUrl);
        engine.proxyConfig = {
          type: url.protocol.replace(':', '') || 'socks5',
          host: url.hostname,
          port: parseInt(url.port) || 1080,
          username: decodeURIComponent(url.username || ''),
          password: decodeURIComponent(url.password || ''),
          region: 'custom',
        };
        console.log(`[LiveStream] 🔧 自带代理已配置: ${engine.proxyConfig.type}://${engine.proxyConfig.host}:${engine.proxyConfig.port}`);
      } catch (e) {
        console.warn('[LiveStream] 自带代理URL解析失败:', e.message);
      }
    }
    if (proxyEnabled && proxyRegion) {
      // 从代理池获取配置
      try {
        const { getProxyPool } = await import('../services/ProxyPool.js');
        const pool = getProxyPool();
        await pool.init();
        const proxyConfig = await pool.getProxyConfig(req.user?.id || 1, proxyRegion, platform);
        engine.proxyConfig = proxyConfig;
        console.log(`[LiveStream] 🔒 代理已配置: ${proxyRegion} → ${proxyConfig.host}:${proxyConfig.port}`);
      } catch (proxyErr) {
        console.warn('[LiveStream] 代理配置失败（将直连推流）:', proxyErr.message);
        engine.proxyEnabled = false;
      }
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
 * AI生成直播脚本（增强版：优先使用Agent AI）
 */
router.post('/generate-script', async (req, res) => {
  try {
    const {
      productName,
      productDesc,
      scene = '产品介绍',
      platform = 'TikTok',
      count = 5,
      agentId,  // 可选：指定使用哪个Agent AI
      roomId,
    } = req.body;

    if (!productName) {
      return res.json({ success: false, error: '请输入产品名称' });
    }

    console.log(`[LiveStream] 🤖 生成直播脚本: ${productName} ${agentId ? `(Agent: ${agentId})` : ''}`);

    let script = '';
    let copy = '';
    let segments = [];

    // 优先使用Agent AI生成（如果指定了agentId）
    if (agentId) {
      try {
        const { getAgent } = await import('../services/ai/AgentAIManager.js');
        const agent = getAgent(agentId);
        const result = await agent.generateScript({ productName, productDesc, topic: scene, roomId });
        script = result;
        
        // 分段
        const parts = result.split(/[。\n]+/).filter(s => s.trim().length > 5);
        parts.forEach((text, i) => {
          segments.push({
            id: `agent_${agentId}_${i}`,
            text: text.trim(),
            duration: Math.max(10, Math.min(60, text.length * 0.3)),
            priority: 0,
            agentId,
          });
        });
      } catch (agentErr) {
        console.warn('[LiveStream] Agent AI生成失败，回退到默认:', agentErr.message);
      }
    }
    
    // 如果Agent没生成或者没指定，使用默认方式
    if (!script) {
      const [s, c] = await Promise.all([
        generateLiveScript({ productName, productDesc, scene, platform }),
        generateMarketingCopy({ productName, productDesc, platform }),
      ]);
      script = s;
      copy = c;
      
      if (script) {
        const parts = script.split(/[。\n]+/).filter(s => s.trim().length > 5);
        parts.forEach((text, i) => {
          segments.push({
            id: `gen_${i}`,
            text: text.trim(),
            duration: Math.max(10, Math.min(60, text.length * 0.3)),
            priority: 0,
          });
        });
      }
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

// ─── 主播形象管理 ───

/**
 * GET /api/live-stream/profiles
 * 获取所有可用主播形象列表
 */
router.get('/profiles', (req, res) => {
  res.json({
    success: true,
    data: {
      profiles: getProfileList(),
      default: 'xiaorui',
    },
  });
});

/**
 * GET /api/live-stream/profiles/:id
 * 获取单个形象详情（含外观参数）
 */
router.get('/profiles/:id', (req, res) => {
  const profile = getProfile(req.params.id);
  if (!profile) {
    return res.json({ success: false, error: '形象不存在' });
  }
  res.json({ success: true, data: profile });
});

/**
 * POST /api/live-stream/profile
 * 切换主播形象（直播中实时切换）
 */
router.post('/profile', ensureEngine, (req, res) => {
  try {
    const { profileId } = req.body;
    if (!profileId) {
      return res.json({ success: false, error: '请选择形象' });
    }

    const profile = getProfile(profileId);
    if (!profile) {
      return res.json({ success: false, error: '形象不存在' });
    }

    req.engine.setProfile(profileId);

    res.json({
      success: true,
      data: {
        message: `已切换到 ${profile.avatar} ${profile.name}`,
        profile: {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
          voice: profile.voice,
          voiceLabel: profile.voiceLabel,
        },
      },
    });
  } catch (e) {
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

// ─── 场景布局配置 ───

// 场景配置内存存储（每个用户一份，生产环境可接数据库）
const sceneConfigStore = new Map();

/**
 * GET /api/live-stream/scene-config
 * 获取当前场景布局配置
 */
router.get('/scene-config', (req, res) => {
  const userId = req.user?.id || 'default';
  const config = sceneConfigStore.get(userId) || null;
  res.json({
    success: true,
    data: config,
  });
});

/**
 * PUT /api/live-stream/scene-config
 * 保存场景布局配置
 */
router.put('/scene-config', (req, res) => {
  try {
    const userId = req.user?.id || 'default';
    const { sceneConfig } = req.body;
    
    if (!sceneConfig) {
      return res.json({ success: false, error: '请提供 sceneConfig' });
    }

    sceneConfigStore.set(userId, sceneConfig);
    
    // 同步到当前引擎
    try {
      const engine = getLiveStreamEngine();
      if (engine && engine.renderer) {
        engine.renderer.setSceneConfig(sceneConfig);
      }
    } catch (e) {
      // 引擎未初始化时忽略
    }

    console.log(`[LiveStream] 💾 场景配置已保存: ${sceneConfig.orientation}, ${sceneConfig.overlays?.length || 0}个元素`);
    
    res.json({
      success: true,
      data: { message: '场景配置已保存' },
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/**
 * POST /api/live-stream/preview
 * 生成单帧预览画面（SVG）
 */
router.post('/preview', async (req, res) => {
  try {
    const {
      profileId = 'xiaorui',
      sceneConfig,
      orientation,
    } = req.body;

    // 1. 获取主播形象
    const profile = getProfile(profileId);
    if (!profile) {
      return res.json({ success: false, error: '主播形象不存在' });
    }

    // 2. 确定分辨率
    const isLandscape = (orientation || sceneConfig?.orientation) === 'landscape';
    const width = isLandscape ? 1920 : 1080;
    const height = isLandscape ? 1080 : 1920;

    // 3. 创建渲染器
    const avatarImagePath = profile.imagePath 
      ? path.resolve(profile.imagePath)
      : null;

    const renderer = new Avatar2DRenderer({
      width,
      height,
      fps: 25,
      appearance: profile.appearance,
      avatarName: profile.name,
      avatarImagePath,
      mouthPosition: profile.mouthPosition || { x: 0.49, y: 0.57, w: 0.06, h: 0.025 },
      sceneConfig: sceneConfig || null,
    });

    // 4. 渲染一帧（微张口自然状态）
    const frame = renderer.renderFrame({
      A: 0.08,
      I: 0,
      U: 0,
      E: 0,
      O: 0,
    }, 0);

    // 5. 返回 SVG
    res.json({
      success: true,
      data: {
        svg: frame.svg,
        width: frame.width,
        height: frame.height,
        orientation: isLandscape ? 'landscape' : 'portrait',
        profile: {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
        },
      },
    });
  } catch (e) {
    console.error('[LiveStream] 预览生成失败:', e);
    res.json({ success: false, error: e.message });
  }
});

/**
 * GET /api/live-stream/preview-stream
 * SSE实时预览流 — 服务端持续渲染动画帧推送到前端
 * Query: profileId, orientation, width, height, fps
 * 前端通过 EventSource 接收 SVG 帧
 */
router.get('/preview-stream', async (req, res) => {
  const {
    profileId = 'xiaorui',
    orientation = 'portrait',
    width: widthStr,
    height: heightStr,
    fps: fpsStr,
  } = req.query;

  const isLandscape = orientation === 'landscape';
  const width = parseInt(widthStr) || (isLandscape ? 1920 : 1080);
  const height = parseInt(heightStr) || (isLandscape ? 1080 : 1920);
  const fps = parseInt(fpsStr) || 8; // 预览用低帧率减轻服务器压力

  // 获取主播形象
  const profile = getProfile(profileId);
  const avatarImagePath = profile?.imagePath ? path.resolve(profile.imagePath) : null;

  // 获取场景配置
  const userId = req.user?.id || 'default';
  const sceneConfig = sceneConfigStore.get(userId) || null;

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // 创建渲染器
  const renderer = new Avatar2DRenderer({
    width,
    height,
    fps,
    appearance: profile?.appearance,
    avatarName: profile?.name || 'AI主播',
    avatarImagePath,
    mouthPosition: profile?.mouthPosition || { x: 0.49, y: 0.57, w: 0.06, h: 0.025 },
    sceneConfig: sceneConfig || null,
  });

  console.log(`[LiveStream] 🎬 SSE预览流开始: ${orientation} ${width}x${height} ${fps}fps`);

  // 模拟话术文本（用于口型动画）
  const demoScripts = [
    '欢迎来到云南瑞丽翡翠直播间！',
    '今天给大家带来的都是缅甸A货翡翠，',
    '每一件都有鉴定证书，假一赔十！',
    '家人们右上角点个关注，每天都有源头好货！',
    '感谢家人们的支持，觉得主播讲得好的点点赞！',
  ];

  let frameNum = 0;
  let scriptIdx = 0;
  let scriptElapsed = 0;
  const scriptInterval = 3.0; // 每句3秒

  // 发送初始帧
  const initialFrame = renderer.renderSilentFrame(0);
  res.write(`event: init\ndata: ${JSON.stringify({
    width: initialFrame.width,
    height: initialFrame.height,
    orientation,
    profileName: profile?.name || 'AI主播',
    sceneConfig: sceneConfig ? { orientation: sceneConfig.orientation, overlayCount: sceneConfig.overlays?.length } : null,
  })}\n\n`);

  const frameInterval = setInterval(() => {
    const elapsed = frameNum / fps;
    
    // 脚本切换
    scriptElapsed += 1 / fps;
    if (scriptElapsed >= scriptInterval) {
      scriptElapsed = 0;
      scriptIdx = (scriptIdx + 1) % demoScripts.length;
    }

    // 模拟口型：说话时嘴巴动，不说话时微张
    const isSpeaking = scriptElapsed < scriptInterval * 0.8; // 80%时间说话
    const t = isSpeaking ? (scriptElapsed % 0.3) / 0.3 : 0; // 快速循环
    const mouthA = isSpeaking ? (Math.sin(t * Math.PI * 2) * 0.5 + 0.5) * 0.7 : 0.05;
    const mouthI = isSpeaking ? (Math.sin(t * Math.PI * 2 + 0.5) * 0.3 + 0.2) * 0.3 : 0.02;

    const frame = renderer.renderFrame({
      A: mouthA,
      I: mouthI,
      U: isSpeaking ? 0.1 : 0.02,
      E: isSpeaking ? 0.05 : 0.01,
      O: isSpeaking ? 0.08 : 0.02,
    }, elapsed);

    // 加上当前话术字幕信息
    const currentScript = isSpeaking ? demoScripts[scriptIdx] : '';
    
    res.write(`event: frame\ndata: ${JSON.stringify({
      svg: frame.svg,
      frame: frameNum,
      time: frame.time,
      speaking: isSpeaking,
      script: currentScript,
    })}\n\n`);

    frameNum++;
  }, 1000 / fps);

  // 客户端断开时清理
  req.on('close', () => {
    clearInterval(frameInterval);
    console.log(`[LiveStream] 🛑 SSE预览流结束 (${frameNum}帧)`);
  });
});

/**
 * POST /api/live-stream/preview-voice
 * 生成主播语音试听（TTS）
 * Body: { text, voice, profileId }
 * 返回: { success, data: { audioUrl, duration } }
 */
router.post('/preview-voice', async (req, res) => {
  try {
    const {
      text = '大家好，欢迎来到直播间！',
      voice = 'zh-CN-XiaoxiaoNeural',
      profileId,
    } = req.body;

    // 如果指定了 profileId，使用该形象的语音配置
    let finalVoice = voice;
    if (profileId) {
      const profile = getProfile(profileId);
      if (profile?.voice) {
        finalVoice = profile.voice;
      }
    }

    console.log(`[LiveStream] 🎙️ 语音试听: "${text.substring(0, 30)}..." (${finalVoice})`);

    const ttsResult = await textToSpeech(text, {
      voice: finalVoice,
      outputName: `preview_${profileId || 'default'}_${Date.now()}.mp3`,
    });

    const audioUrl = `/api/live-stream/preview-audio/${ttsResult.name}`;

    res.json({
      success: true,
      data: {
        audioUrl,
        voice: finalVoice,
        text: text.substring(0, 50),
      },
    });
  } catch (e) {
    console.error('[LiveStream] 语音试听失败:', e);
    res.json({ success: false, error: e.message });
  }
});

export default router;
