/**
 * LiveStreamEngine.js — AI数字人直播总控引擎 v1.0
 * 
 * 功能：整合TTS、LipSync、VRM渲染、RTMP推流、实时弹幕五大模块
 * 
 * 直播生命周期：
 *   初始化 → 预热(加载模型) → 开播 → 直播中(循环) → 下播 → 清理
 * 
 * 直播循环：
 *   脚本队列 → TTS生成音频 → LipSync计算口型 → VRM渲染帧 → RTMP推送
 *        ↑                                                    ↓
 *        └──────── AI自动回复 ←── 弹幕/礼物 ←── RealtimeChat ──┘
 * 
 * 使用方式：
 *   const engine = new LiveStreamEngine({ rtmpUrl: 'rtmp://...' });
 *   await engine.startLive();
 *   // ... 直播中
 *   await engine.stopLive();
 */

import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import { RTMPPusher, buildRTMPUrl } from './RTMPPusher.js';
import { RealtimeChat } from './RealtimeChat.js';
import { analyzeAndSync, streamLipSync } from './LipSyncEngine.js';
import { Avatar2DRenderer, renderLiveStream, loadImageBase64 } from './VRMRenderer.js';
import { textToSpeech } from './TTSEngine.js';
import { getProfile } from './AvatarProfiles.js';

const OUTPUT_DIR = path.join(process.cwd(), 'generated-stream');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * 直播状态枚举
 */
const LiveStatus = {
  IDLE: 'idle',           // 空闲
  PREPARING: 'preparing', // 准备中
  LIVE: 'live',           // 直播中
  PAUSED: 'paused',       // 暂停
  STOPPING: 'stopping',   // 停止中
  ERROR: 'error',         // 错误
};

/**
 * 直播引擎主类
 */
class LiveStreamEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // 推流配置
    this.rtmpUrl = options.rtmpUrl || null;
    this.platform = options.platform || 'custom';
    this.streamKey = options.streamKey || null;
    
    // 代理配置
    this.proxyConfig = options.proxy || null;  // { type, host, port, username, password, region }
    this.proxyEnabled = options.proxyEnabled || false;
    this.useOwnProxy = options.useOwnProxy || false;
    this.ownProxyUrl = options.ownProxyUrl || '';
    
    // 渲染配置
    this.width = options.width || 1080;
    this.height = options.height || 1920;
    this.fps = options.fps || 25;
    
    // AI配置
    this.profileId = options.profileId || 'xiaorui';
    this.avatarConfig = {
      name: options.avatarName || '小瑞',
      style: options.avatarStyle || 'warm',
      voice: options.voice || 'zh-CN-XiaoxiaoNeural',
    };
    // 加载完整形象
    this._loadProfile();
    
    // 自动回复配置
    this.autoReplyEnabled = options.autoReplyEnabled !== false;
    this.replyDelay = options.replyDelay || 3000;
    this.llmProvider = options.llmProvider || null;
    
    // 模块实例
    this.rtmpPusher = null;
    this.chatServer = null;
    this.renderer = null;
    
    // 直播状态
    this.status = LiveStatus.IDLE;
    this.startTime = null;
    this.abortController = null;
    
    // 脚本队列
    this.scriptQueue = [];
    this.currentScript = null;
    this.scriptIndex = 0;
    
    // 统计数据
    this.stats = {
      totalFrames: 0,
      totalAudioGenerated: 0,
      totalViews: 0,
      peakViewers: 0,
      totalMessages: 0,
      totalGifts: 0,
      uptime: 0,
      errors: 0,
    };

    // TTS音频缓存
    this.audioCache = new Map();
  }

  /**
   * 加载主播形象配置
   */
  _loadProfile() {
    const profile = getProfile(this.profileId);
    if (profile) {
      this.avatarConfig = {
        ...this.avatarConfig,
        name: this.avatarConfig.name || profile.name,
        voice: this.avatarConfig.voice || profile.voice,
        style: profile.style,
        gender: profile.gender,
        appearance: profile.appearance,
        avatar: profile.avatar,
        tags: profile.tags,
      };
      console.log(`[LiveStreamEngine] 👤 主播形象: ${profile.avatar} ${profile.name} (${profile.style})`);
    }
  }

  /**
   * 切换主播形象
   */
  setProfile(profileId) {
    this.profileId = profileId;
    this._loadProfile();
    // 如果已初始化渲染器，更新外观
    if (this.renderer) {
      this.renderer.appearance = this.avatarConfig.appearance;
      this.renderer.avatarName = this.avatarConfig.name;
      this.renderer.avatarImagePath = this.avatarConfig.imagePath;
      this.renderer.mouthPos = this.avatarConfig.mouthPosition;
      // 重新加载照片
      this.renderer.photoBase64 = this.avatarConfig.imagePath 
        ? loadImageBase64(this.avatarConfig.imagePath) : null;
      this.renderer.usePhoto = !!this.renderer.photoBase64;
    }
    this.emit('profile-changed', { profileId, name: this.avatarConfig.name });
  }

  /**
   * 初始化直播环境（预热）
   */
  async prepare(options = {}) {
    if (this.status !== LiveStatus.IDLE) {
      throw new Error(`无法准备，当前状态: ${this.status}`);
    }

    this.status = LiveStatus.PREPARING;
    this.emit('status-change', { status: this.status });

    console.log('[LiveStreamEngine] 🎬 准备直播环境...');
    console.log(`[LiveStreamEngine] 主播: ${this.avatarConfig.name}`);
    console.log(`[LiveStreamEngine] 分辨率: ${this.width}x${this.height} ${this.fps}fps`);

    // 处理平台推流地址
    if (this.platform !== 'custom' && this.streamKey) {
      this.rtmpUrl = buildRTMPUrl(this.platform, this.streamKey);
    }

    if (!this.rtmpUrl && options.requireRTMP !== false) {
      this.status = LiveStatus.IDLE;
      throw new Error('未配置RTMP推流地址，请设置platform+streamKey或rtmpUrl');
    }

    // 初始化渲染器（传入形象外观）
    this.renderer = new Avatar2DRenderer({
      width: this.width,
      height: this.height,
      fps: this.fps,
      appearance: this.avatarConfig.appearance,
      avatarName: this.avatarConfig.name,
      avatarImagePath: this.avatarConfig.imagePath,
      mouthPosition: this.avatarConfig.mouthPosition,
      sceneConfig: this.sceneConfig || null,
    });

    if (this.sceneConfig) {
      console.log(`[LiveStreamEngine] 🎬 场景布局: ${this.sceneConfig.orientation}, ${this.sceneConfig.overlays?.length || 0}个叠加元素`);
    }

    // 初始化实时聊天
    this.chatServer = new RealtimeChat({
      port: options.chatPort || 3002,
      autoReply: this.autoReplyEnabled,
      replyDelay: this.replyDelay,
    });
    
    if (this.llmProvider) {
      this.chatServer.setLLMProvider(this.llmProvider);
    }

    // 解析代理配置（支持 Claw代理池 + 自带代理）
    let activeProxyConfig = null;
    if (this.proxyEnabled) {
      if (this.useOwnProxy && this.ownProxyUrl) {
        // 解析自带代理 URL: socks5://[user:pass@]host:port
        try {
          const url = new URL(this.ownProxyUrl);
          activeProxyConfig = {
            type: url.protocol.replace(':', '') || 'socks5',
            host: url.hostname,
            port: parseInt(url.port) || 1080,
            username: decodeURIComponent(url.username || ''),
            password: decodeURIComponent(url.password || ''),
            region: 'custom',
          };
          console.log(`[LiveStreamEngine] 🔧 自带代理: ${activeProxyConfig.type}://${activeProxyConfig.host}:${activeProxyConfig.port}`);
        } catch (e) {
          console.warn('[LiveStreamEngine] 自带代理URL解析失败:', e.message);
        }
      } else if (this.proxyConfig) {
        activeProxyConfig = {
          ...this.proxyConfig,
          region: this.proxyConfig.region || 'unknown',
        };
      }
    }

    // 初始化RTMP推流器（含代理配置）
    this.rtmpPusher = new RTMPPusher({
      rtmpUrl: this.rtmpUrl,
      width: this.width,
      height: this.height,
      fps: this.fps,
      videoBitrate: options.videoBitrate || '2500k',
      audioBitrate: options.audioBitrate || '128k',
      proxy: activeProxyConfig,
    });

    // 监听推流事件
    this.rtmpPusher.on('stats', (info) => {
      this.stats.totalFrames = info.frames;
      this.emit('stream-stats', info);
    });

    this.rtmpPusher.on('heartbeat', (info) => {
      this.stats.uptime = info.uptime;
      this.emit('heartbeat', info);
    });

    this.rtmpPusher.on('error', (err) => {
      this.stats.errors++;
      this.emit('error', err);
    });

    this.rtmpPusher.on('stopped', (info) => {
      console.log('[LiveStreamEngine] 推流已停止');
      if (this.status === LiveStatus.LIVE) {
        this.status = LiveStatus.IDLE;
        this.emit('status-change', { status: this.status });
      }
    });

    // 监听聊天事件
    this.chatServer.on('message', (msg) => {
      this.stats.totalMessages++;
      this.emit('chat-message', msg);
      
      // 消息触发自动回应
      if (this.autoReplyEnabled && this.chatServer.autoReply) {
        this.handleViewerInteraction(msg);
      }
    });

    this.chatServer.on('reply', (reply) => {
      this.emit('auto-reply', reply);
    });

    console.log('[LiveStreamEngine] ✅ 环境准备完成');
    return this;
  }

  /**
   * 添加直播脚本到队列
   */
  addScript(script) {
    if (!script || !script.text) {
      throw new Error('脚本内容不能为空');
    }
    
    this.scriptQueue.push({
      id: `script_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: script.text,
      duration: script.duration || 30,  // 默认30秒一段
      priority: script.priority || 0,    // 优先级，越高越优先
      tags: script.tags || [],
    });

    // 按优先级排序
    this.scriptQueue.sort((a, b) => b.priority - a.priority);
    
    console.log(`[LiveStreamEngine] 添加脚本 #${this.scriptQueue.length}: "${script.text.substring(0, 30)}..."`);
    this.emit('script-added', { queueSize: this.scriptQueue.length });
  }

  /**
   * 批量添加脚本
   */
  addScripts(scripts) {
    scripts.forEach(s => this.addScript(s));
  }

  /**
   * 开始直播
   */
  async startLive(options = {}) {
    if (this.status === LiveStatus.LIVE) {
      throw new Error('直播已在进行中');
    }

    // 自动准备
    if (this.status === LiveStatus.IDLE) {
      await this.prepare(options);
    }

    this.status = LiveStatus.LIVE;
    this.startTime = Date.now();
    this.abortController = new AbortController();

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║  🎥 AI数字人直播 正式开始！         ║');
    console.log(`║  主播: ${this.avatarConfig.name.padEnd(20)} ║`);
    console.log(`║  平台: ${this.platform.padEnd(20)} ║`);
    console.log(`║  推流: ${(this.rtmpUrl || '本地').replace(/\/[^/]+$/, '/***').padEnd(20)} ║`);
    if (this.proxyEnabled && this.proxyConfig) {
      console.log(`║  🔒 代理: ${(this.proxyConfig.region || 'unknown').padEnd(20)} ║`);
    }
    console.log('╚══════════════════════════════════════╝\n');

    this.emit('status-change', { status: this.status });
    this.emit('live-started', {
      avatarName: this.avatarConfig.name,
      platform: this.platform,
      time: new Date().toISOString(),
    });

    // 启动聊天服务
    try {
      this.chatServer.start();
      console.log('[LiveStreamEngine] 💬 实时聊天已启动');
    } catch (e) {
      console.warn('[LiveStreamEngine] 聊天服务启动失败:', e.message);
    }

    // 启动推流（如果有RTMP地址）
    if (this.rtmpUrl) {
      try {
        this.rtmpPusher.start();
        console.log('[LiveStreamEngine] 📡 RTMP推流已启动');
      } catch (e) {
        console.error('[LiveStreamEngine] 推流启动失败:', e.message);
        this.status = LiveStatus.ERROR;
        this.emit('error', e);
        return this;
      }
    }

    // 启动渲染循环（如果正在推流）
    if (this.rtmpPusher && this.rtmpPusher.isStreaming) {
      this.startRenderLoop(this.abortController.signal);
    }

    // 启动脚本循环
    this.startScriptLoop(this.abortController.signal);

    return this;
  }

  /**
   * 渲染循环（生成推流帧）
   */
  async startRenderLoop(signal) {
    const frameInterval = 1000 / this.fps;
    let lastFrameTime = Date.now();
    let frameCount = 0;

    const loop = async () => {
      if (signal.aborted || this.status !== LiveStatus.LIVE) return;

      const now = Date.now();
      const elapsed = (now - this.startTime) / 1000;

      // 获取当前口型数据
      const blendshapes = this.getCurrentBlendshapes(elapsed);

      // 渲染帧
      const frame = this.renderer.renderFrame(blendshapes, elapsed);
      frameCount++;

      // 推流
      if (this.rtmpPusher && this.rtmpPusher.isStreaming) {
        this.rtmpPusher.pushSVGFrame(frame.svg);
      }

      lastFrameTime = now;

      // 帧率控制
      const nextFrameTime = lastFrameTime + frameInterval - Date.now();
      if (nextFrameTime > 0) {
        await new Promise(r => setTimeout(r, nextFrameTime));
      }

      // 下一帧
      setImmediate(loop);
    };

    loop();
  }

  /**
   * 获取当前时刻的口型数据
   */
  getCurrentBlendshapes(elapsedSeconds) {
    if (!this.currentLipSync || !this.currentLipSync.length) {
      // 无数据时使用默认微张口型
      return { A: 0.05, I: 0, U: 0, E: 0, O: 0 };
    }

    // 查找当前时刻的口型关键帧
    const keyframe = this.currentLipSync.find(kf => 
      kf.time <= elapsedSeconds && 
      (kf.time + (1 / this.fps)) >= elapsedSeconds
    );

    return keyframe ? keyframe.blendshapes : { A: 0.05, I: 0, U: 0, E: 0, O: 0 };
  }

  /**
   * 脚本播放循环
   */
  async startScriptLoop(signal) {
    const playNextScript = async () => {
      if (signal.aborted || this.status !== LiveStatus.LIVE) return;

      // 获取下一个脚本
      if (this.scriptQueue.length === 0) {
        // 没有脚本时用默认循环
        const defaults = [
          '欢迎来到云南瑞丽翡翠直播间！家人们右上角点个关注，每天都有源头好货！',
          '今天给大家带来的是缅甸A货翡翠，每一件都有鉴定证书，假一赔十！',
          '感谢家人们的支持，觉得主播讲得好的给主播点点赞！',
        ];
        this.currentScript = {
          text: defaults[this.scriptIndex % defaults.length],
          duration: 15,
        };
      } else {
        this.currentScript = this.scriptQueue.shift();
      }

      console.log(`[LiveStreamEngine] 📝 播放脚本: "${this.currentScript.text.substring(0, 50)}..."`);

      try {
        // 1. TTS生成音频
        const ttsResult = await textToSpeech(this.currentScript.text, {
          voice: this.avatarConfig.voice,
        });
        this.stats.totalAudioGenerated++;

        // 2. 生成唇形同步数据
        const lipSync = await analyzeAndSync(
          this.currentScript.text,
          ttsResult.path,
          { fps: this.fps, outputName: false }
        );
        this.currentLipSync = lipSync.keyframes;

        // 3. 等待脚本播放完毕
        const duration = (this.currentScript.duration || lipSync.audioDuration) * 1000;
        await new Promise(r => setTimeout(r, duration));

        // 4. 清理
        this.currentLipSync = null;
        this.scriptIndex++;

        // 5. 播放下一段
        setImmediate(playNextScript);
      } catch (e) {
        console.error('[LiveStreamEngine] 脚本播放错误:', e.message);
        this.stats.errors++;
        // 错误后继续下一段
        setTimeout(() => playNextScript(), 3000);
      }
    };

    playNextScript();
  }

  /**
   * 处理观众互动（触发AI回复）
   * 调用对应Agent AI生成智能回复
   */
  async handleViewerInteraction(message) {
    if (!message.text || !this.autoReplyEnabled) return;

    // 获取房间ID（平台+streamKey组合）
    const roomId = `${this.platform}_${this.streamKey || this.rtmpUrl?.split('/').pop() || 'default'}`;
    
    try {
      // 动态导入Agent AI（避免循环依赖）
      const { getAgent } = await import('../ai/AgentAIManager.js');
      const agent = getAgent(this.profileId);
      
      // Agent生成回复
      const reply = await agent.getReply({
        message: message.text,
        sessionId: message.user || roomId,
        roomId,
      });

      // 保存问答到数据库
      await agent.saveQA(roomId, message.text, reply);

      // 插入回复到脚本队列（高优先级，但不要过长）
      const duration = Math.max(5, Math.min(30, Math.round(reply.length * 0.2)));
      this.addScript({
        text: reply,
        duration,
        priority: 8 + Math.min(message.text.length / 50, 4), // 越长的问题优先级越高
      });

      console.log(`[LiveStreamEngine] 🤖 ${agent.name}回复: ${reply.substring(0, 40)}...`);
    } catch (e) {
      console.warn('[LiveStreamEngine] Agent AI回复失败，使用默认回复:', e.message);
      
      // 兜底回复
      if (message.text.includes('主播') || message.text.includes('？') || message.text.includes('?')) {
        this.addScript({
          text: `感谢${message.user || '家人'}的提问！我来看看这个问题~`,
          duration: 5,
          priority: 10,
        });
      }
    }
  }

  /**
   * 发送公告/插入临时脚本
   */
  async announce(text, priority = 5) {
    this.addScript({ text, duration: 10, priority });
    this.emit('announcement', { text });
  }

  /**
   * 停止直播
   */
  async stopLive() {
    if (this.status !== LiveStatus.LIVE && this.status !== LiveStatus.PAUSED) {
      console.warn(`[LiveStreamEngine] 当前状态: ${this.status}, 无需停止`);
      return this;
    }

    this.status = LiveStatus.STOPPING;
    this.emit('status-change', { status: this.status });

    console.log('[LiveStreamEngine] 🛑 停止直播...');

    // 取消渲染循环
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // 停止推流
    if (this.rtmpPusher) {
      await this.rtmpPusher.stop();
    }

    // 停止聊天服务
    if (this.chatServer) {
      await this.chatServer.stop();
    }

    // 统计
    const finalStats = this.getStats();
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║  📊 直播结束统计                    ║');
    console.log(`║  时长: ${Math.floor(finalStats.uptime)}秒`.padEnd(32) + '║');
    console.log(`║  帧数: ${finalStats.totalFrames}`.padEnd(32) + '║');
    console.log(`║  消息: ${finalStats.totalMessages}`.padEnd(32) + '║');
    console.log(`║  错误: ${finalStats.errors}`.padEnd(32) + '║');
    console.log('╚══════════════════════════════════════╝\n');

    this.status = LiveStatus.IDLE;
    this.emit('status-change', { status: this.status });
    this.emit('live-stopped', finalStats);

    return finalStats;
  }

  /**
   * 暂停直播
   */
  pauseLive() {
    if (this.status !== LiveStatus.LIVE) return;
    this.status = LiveStatus.PAUSED;
    this.emit('status-change', { status: this.status });
    console.log('[LiveStreamEngine] ⏸️ 直播已暂停');
  }

  /**
   * 恢复直播
   */
  resumeLive() {
    if (this.status !== LiveStatus.PAUSED) return;
    this.status = LiveStatus.LIVE;
    this.emit('status-change', { status: this.status });
    console.log('[LiveStreamEngine] ▶️ 直播已恢复');
    
    // 重新启动渲染循环
    this.abortController = new AbortController();
    this.startRenderLoop(this.abortController.signal);
    this.startScriptLoop(this.abortController.signal);
  }

  /**
   * 获取完整状态
   */
  getStats() {
    const chatStats = this.chatServer ? this.chatServer.getStats() : {};
    return {
      status: this.status,
      avatarName: this.avatarConfig.name,
      platform: this.platform,
      rtmpUrl: this.rtmpUrl ? '***' : 'local',
      resolution: `${this.width}x${this.height}`,
      fps: this.fps,
      ...this.stats,
      chat: chatStats,
      scriptQueue: this.scriptQueue.length,
      currentScript: this.currentScript ? this.currentScript.text.substring(0, 50) : null,
      uptime: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
    };
  }
}

// 单例模式
let engineInstance = null;

function getLiveStreamEngine(options = {}) {
  if (!engineInstance) {
    engineInstance = new LiveStreamEngine(options);
  }
  return engineInstance;
}

function resetLiveStreamEngine() {
  if (engineInstance && engineInstance.status === LiveStatus.LIVE) {
    throw new Error('请先停止直播再重置引擎');
  }
  engineInstance = null;
}

export {
  LiveStreamEngine,
  getLiveStreamEngine,
  resetLiveStreamEngine,
  LiveStatus,
};
