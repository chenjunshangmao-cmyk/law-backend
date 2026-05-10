/**
 * RTMPPusher.js — RTMP推流引擎 v2.0
 * 
 * 功能：将渲染帧+音频推送到RTMP服务器
 * 
 * 工作模式：
 * 1. PIPE_MODE: 渲染帧→stdin pipe→FFmpeg→RTMP (低延迟)
 * 2. SOCAT_MODE: 渲染帧→stdin pipe→FFmpeg→socat隧道→SOCKS5代理→RTMP (海外推流)
 * 
 * 代理支持：
 * - SOCKS5: 自动使用 socat 创建 TCP 隧道（双重代理方案）
 * - HTTP: 通过 RTMP_PROXY 环境变量
 * - TUN模式: 系统级代理（无需代码配置，FFmpeg自动走系统路由）
 * 
 * 支持的推流目标:
 * - YouTube Live (rtmp://a.rtmp.youtube.com/live2/STREAM_KEY)
 * - TikTok Live (rtmp://push-rtmp.tiktok.com/live/STREAM_KEY)  
 * - Facebook Live (rtmp://live-api-s.facebook.com:443/rtmp/STREAM_KEY)
 * - 自定义RTMP服务器 (rtmp://your-server/live/STREAM_KEY)
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import net from 'net';

const OUTPUT_DIR = path.join(process.cwd(), 'generated-stream');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * 查找可用端口
 */
function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

/**
 * 检查 socat 是否可用
 */
function isSocatAvailable() {
  try {
    execSync('socat -V', { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * 构建代理URL（供环境变量使用）
 */
function buildProxyUrl(proxy) {
  if (!proxy || !proxy.host) return '';
  const { type = 'socks5', host, port, username, password } = proxy;
  const auth = username ? `${encodeURIComponent(username)}:${encodeURIComponent(password || '')}@` : '';
  return `${type}://${auth}${host}:${port}`;
}

/**
 * 解析 RTMP URL，提取 host 和 port
 * rtmp://a.rtmp.youtube.com/live2/streamkey → { host: 'a.rtmp.youtube.com', port: 1935, app: 'live2', streamKey: 'streamkey' }
 */
function parseRtmpUrl(rtmpUrl) {
  try {
    const u = new URL(rtmpUrl);
    const pathParts = u.pathname.split('/').filter(Boolean);
    return {
      host: u.hostname,
      port: parseInt(u.port) || 1935,
      app: pathParts[0] || 'live',
      streamKey: pathParts.slice(1).join('/') || '',
    };
  } catch {
    return null;
  }
}

/**
 * RTMP推流器类
 */
class RTMPPusher extends EventEmitter {
  constructor(options = {}) {
    super();
    this.rtmpUrl = options.rtmpUrl || '';
    this.width = options.width || 1080;
    this.height = options.height || 1920;
    this.fps = options.fps || 25;
    this.videoBitrate = options.videoBitrate || '2500k';
    this.audioBitrate = options.audioBitrate || '128k';
    this.videoCodec = options.videoCodec || 'libx264';
    this.preset = options.preset || 'veryfast';
    this.profile = options.profile || 'baseline';
    this.tune = options.tune || 'zerolatency';
    this.gopSize = options.gopSize || 50;         // keyframe间隔
    this.bframes = options.bframes || 0;          // B帧数（直播用0降低延迟）
    this.bufsize = options.bufsize || '4000k';
    
    // 代理配置（海外推流代理）
    this.proxy = options.proxy || null;  // { type:'socks5', host, port, username, password }
    
    // 内部状态
    this.ffmpegProcess = null;
    this.socatProcess = null;  // SOCKS5 隧道进程
    this.tunnelPort = null;     // 本地隧道端口
    this.isStreaming = false;
    this.statsInterval = null;
    this.startTime = null;
    this.totalFrames = 0;
  }

  /**
   * 启动 SOCKS5 → RTMP 隧道（socat）
   * 
   * 原理：socat 监听本地端口，将 TCP 流量通过 SOCKS5 代理转发到 RTMP 服务器
   * 这就是用户说的「双重代理」—— SOCKS5代理 + socat TCP隧道
   * 
   * socat TCP-LISTEN:localPort,fork,reuseaddr SOCKS5:proxyHost:rtmpHost:rtmpPort,socksport=proxyPort
   */
  async _startSocatTunnel(rtmpInfo) {
    if (!this.proxy || this.proxy.type !== 'socks5') return null;
    
    const tunnelPort = await findFreePort();
    const { host: proxyHost, port: proxyPort, username, password } = this.proxy;
    
    // 构建 socat 参数
    const socks5Addr = username
      ? `SOCKS5:${proxyHost}:${rtmpInfo.host}:${rtmpInfo.port},socksport=${proxyPort},socksuser=${username},sockspass=${password}`
      : `SOCKS5:${proxyHost}:${rtmpInfo.host}:${rtmpInfo.port},socksport=${proxyPort}`;

    const args = [
      `TCP-LISTEN:${tunnelPort},fork,reuseaddr`,
      socks5Addr,
    ];

    console.log(`[RTMPPusher] 🔄 启动SOCKS5隧道: 127.0.0.1:${tunnelPort} → ${rtmpInfo.host}:${rtmpInfo.port} (via ${proxyHost}:${proxyPort})`);

    const socat = spawn('socat', args, {
      stdio: 'pipe',
    });

    socat.on('error', (err) => {
      console.error('[RTMPPusher] socat错误:', err.message);
    });

    socat.stderr.on('data', (data) => {
      // socat 日志（静默，除非调试模式）
    });

    // 等待 socat 就绪
    await new Promise(r => setTimeout(r, 500));

    this.socatProcess = socat;
    this.tunnelPort = tunnelPort;
    
    return tunnelPort;
  }

  /**
   * 启动推流（PNG管道模式）
   * 
   * 工作流: stdin接收SVG/PNG帧 → FFmpeg编码h264 → [socat隧道 → SOCKS5代理] → RTMP推送
   */
  async start(audioPath = null) {
    if (!this.rtmpUrl) {
      throw new Error('未配置RTMP推流地址');
    }
    
    if (this.isStreaming) {
      console.warn('[RTMPPusher] 推流已在运行中');
      return this;
    }

    // 解析RTMP地址
    const rtmpInfo = parseRtmpUrl(this.rtmpUrl);
    let actualRtmpUrl = this.rtmpUrl;
    let needsSocat = false;

    // ═══ SOCKS5 代理处理 ═══
    if (this.proxy && this.proxy.host && this.proxy.type === 'socks5') {
      if (isSocatAvailable() && rtmpInfo) {
        // ✅ socat可用：创建本地TCP隧道 → SOCKS5 → RTMP服务器
        try {
          const tunnelPort = await this._startSocatTunnel(rtmpInfo);
          if (tunnelPort) {
            // 重写RTMP地址：用本地隧道代替远程地址
            const newPath = `/${rtmpInfo.app}/${rtmpInfo.streamKey}`;
            actualRtmpUrl = `rtmp://127.0.0.1:${tunnelPort}${newPath}`;
            needsSocat = true;
            console.log(`[RTMPPusher] 🔄 RTMP重写: ${this.rtmpUrl.replace(/\/[^/]+$/, '/***')} → 127.0.0.1:${tunnelPort}`);
          }
        } catch (e) {
          console.warn('[RTMPPusher] socat隧道创建失败:', e.message);
        }
      } else {
        // ⚠️ socat不可用：提示用户使用TUN模式
        console.warn('[RTMPPusher] ⚠️ 检测到SOCKS5代理但socat未安装！');
        console.warn('[RTMPPusher] ⚠️ FFmpeg RTMP不走SOCKS5，请使用以下方案之一：');
        console.warn('[RTMPPusher]     1. 开启TUN模式代理（推荐）：Clash TUN / V2Ray TUN');
        console.warn('[RTMPPusher]     2. 安装 socat 后重试');
        console.warn('[RTMPPusher]     3. 使用Proxifier/SocksCap64代理FFmpeg');
      }
    }

    console.log(`[RTMPPusher] 开始推流 → ${actualRtmpUrl.replace(/\/[^/]+$/, '/***')}`);
    console.log(`[RTMPPusher] 参数: ${this.width}x${this.height} ${this.fps}fps ${this.videoBitrate}`);
    if (this.proxy && this.proxy.host) {
      const mode = needsSocat ? 'socat隧道' : (this.proxy.type === 'socks5' ? 'TUN模式(系统级)' : 'HTTP代理');
      console.log(`[RTMPPusher] 🔒 代理: ${this.proxy.type}://${this.proxy.host}:${this.proxy.port} (${this.proxy.region || 'unknown'}) [${mode}]`);
    }

    // 构建代理环境变量（非socat模式的兜底方案）
    // 注意：RTMP 不使用 HTTP_PROXY，librtmp 只认 RTMP_PROXY（且仅HTTP代理类型）
    const env = { ...process.env };
    if (this.proxy && this.proxy.host && !needsSocat) {
      const proxyUrl = buildProxyUrl(this.proxy);
      // librtmp 支持的代理环境变量
      if (this.proxy.type === 'http' || this.proxy.type === 'https') {
        env.RTMP_PROXY = proxyUrl;  // librtmp HTTP CONNECT代理
      }
      // 兜底：TUN模式下系统已处理路由，只设ALL_PROXY仅供参考
      env.ALL_PROXY = proxyUrl;
      env.all_proxy = proxyUrl;
    }

    // FFmpeg参数构建
    const args = [
      // 视频输入（从stdin读取PNG帧）
      '-f', 'image2pipe',
      '-framerate', String(this.fps),
      '-i', '-',           // stdin
    ];

    // 音频输入（如果有）
    if (audioPath && fs.existsSync(audioPath)) {
      args.push('-i', audioPath);
    }

    // 视频编码参数
    args.push(
      '-c:v', this.videoCodec,
      '-preset', this.preset,
      '-profile:v', this.profile,
      '-tune', this.tune,
      '-b:v', this.videoBitrate,
      '-maxrate', this.videoBitrate,
      '-bufsize', this.bufsize,
      '-g', String(this.gopSize),
      '-bf', String(this.bframes),
      '-pix_fmt', 'yuv420p',
      '-s', `${this.width}x${this.height}`,
      '-r', String(this.fps),
      '-keyint_min', String(Math.floor(this.fps * 2)),
      '-sc_threshold', '0',
      '-refs', '1',
    );

    // 音频编码参数
    if (audioPath && fs.existsSync(audioPath)) {
      args.push(
        '-c:a', 'aac',
        '-b:a', this.audioBitrate,
        '-ar', '44100',
        '-ac', '2',
        '-shortest',
      );
    }

    // RTMP输出（使用实际推流地址：socat隧道模式下是localhost）
    args.push(
      '-f', 'flv',
      '-flvflags', 'no_duration_filesize',
      actualRtmpUrl
    );

    // 启动FFmpeg进程
    this.ffmpegProcess = spawn('ffmpeg', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
    });

    this.isStreaming = true;
    this.startTime = Date.now();
    this.totalFrames = 0;

    // 监听stderr获取状态
    this.ffmpegProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      // 解析帧率信息
      const fpsMatch = msg.match(/fps=(\d+\.?\d*)/);
      const bitrateMatch = msg.match(/bitrate=(\d+\.?\d*)kbits\/s/);
      
      if (fpsMatch) {
        this.emit('stats', {
          fps: parseFloat(fpsMatch[1]),
          bitrate: bitrateMatch ? parseFloat(bitrateMatch[1]) : 0,
          uptime: (Date.now() - this.startTime) / 1000,
          frames: this.totalFrames,
        });
      }
    });

    // 监听进程退出
    this.ffmpegProcess.on('close', (code) => {
      console.log(`[RTMPPusher] 推流进程结束 (code: ${code})`);
      this.isStreaming = false;
      this.emit('stopped', { code });
    });

    this.ffmpegProcess.on('error', (err) => {
      console.error('[RTMPPusher] FFmpeg错误:', err.message);
      this.isStreaming = false;
      this.emit('error', err);
    });

    // 启动统计定时器
    this.statsInterval = setInterval(() => {
      if (this.isStreaming) {
        this.emit('heartbeat', {
          uptime: (Date.now() - this.startTime) / 1000,
          frames: this.totalFrames,
        });
      }
    }, 5000);

    return this;
  }

  /**
   * 推送单帧（PNG Buffer）
   */
  pushFrame(frameBuffer) {
    if (!this.isStreaming || !this.ffmpegProcess) {
      return false;
    }
    
    try {
      this.ffmpegProcess.stdin.write(frameBuffer);
      this.totalFrames++;
      return true;
    } catch (e) {
      console.error('[RTMPPusher] 写入帧失败:', e.message);
      return false;
    }
  }

  /**
   * 推送SVG帧（自动转为PNG Buffer）
   */
  pushSVGFrame(svgString) {
    // 将SVG字符串转为Buffer写入stdin
    // FFmpeg image2pipe支持SVG输入（需要编译时包含librsvg）
    const buffer = Buffer.from(svgString, 'utf8');
    return this.pushFrame(buffer);
  }

  /**
   * 停止推流
   */
  async stop() {
    if (!this.isStreaming) return;

    console.log('[RTMPPusher] 停止推流...');
    
    // 清除定时器
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    // 关闭stdin触发FFmpeg优雅退出
    if (this.ffmpegProcess && this.ffmpegProcess.stdin) {
      try {
        this.ffmpegProcess.stdin.end();
      } catch (e) {
        // ignore
      }
    }

    // 等待进程退出（最多5秒）
    return new Promise((resolve) => {
      const cleanup = (forced) => {
        // 清理 socat 隧道
        if (this.socatProcess) {
          try { this.socatProcess.kill('SIGTERM'); } catch (e) {}
          this.socatProcess = null;
          console.log('[RTMPPusher] 🔄 SOCKS5隧道已关闭');
        }
        this.tunnelPort = null;
        this.isStreaming = false;
        this.emit('stopped', { forced });
        resolve({ forced });
      };

      const timeout = setTimeout(() => {
        if (this.ffmpegProcess) {
          this.ffmpegProcess.kill('SIGTERM');
        }
        cleanup(true);
      }, 5000);

      if (this.ffmpegProcess) {
        this.ffmpegProcess.on('close', () => {
          clearTimeout(timeout);
          cleanup(false);
        });
      } else {
        clearTimeout(timeout);
        cleanup(false);
      }
    });
  }

  /**
   * 获取推流状态
   */
  getStatus() {
    return {
      isStreaming: this.isStreaming,
      rtmpUrl: this.rtmpUrl ? this.rtmpUrl.replace(/\/[^/]+$/, '/***') : '',
      resolution: `${this.width}x${this.height}`,
      fps: this.fps,
      uptime: this.startTime ? (Date.now() - this.startTime) / 1000 : 0,
      totalFrames: this.totalFrames,
      bitrate: this.videoBitrate,
      proxy: this.proxy ? {
        host: this.proxy.host,
        port: this.proxy.port,
        type: this.proxy.type,
        region: this.proxy.region,
      } : null,
    };
  }
}

/**
 * 快捷函数：从视频文件推流到RTMP
 * 用于录播推流场景
 */
async function pushVideoFile(videoPath, rtmpUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const args = [
      'ffmpeg', '-re',           // 实时读取（按帧率）
      '-i', videoPath,
      '-c:v', 'copy',           // 复制视频流（不重新编码）
      '-c:a', 'aac',
      '-b:a', options.audioBitrate || '128k',
      '-f', 'flv',
      rtmpUrl
    ];

    const proc = spawn('ffmpeg', args, { stdio: 'pipe' });
    
    const startTime = Date.now();
    
    proc.stderr.on('data', (data) => {
      const msg = data.toString();
      const timeMatch = msg.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (timeMatch && options.onProgress) {
        options.onProgress({ time: timeMatch[1], elapsed: (Date.now() - startTime) / 1000 });
      }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, duration: (Date.now() - startTime) / 1000 });
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * 构建各平台的RTMP推流地址
 */
function buildRTMPUrl(platform, streamKey, options = {}) {
  const urls = {
    youtube: `rtmp://a.rtmp.youtube.com/live2/${streamKey}`,
    tiktok: `rtmp://push-rtmp.tiktoklive.com/live/${streamKey}`,
    facebook: `rtmp://live-api-s.facebook.com:443/rtmp/${streamKey}`,
    twitch: `rtmp://live.twitch.tv/app/${streamKey}`,
    bilibili: `rtmp://live-push.bilivideo.com/live-bvc/${streamKey}`,
    douyin: `rtmp://push-rtmp.douyin.com/live/${streamKey}`,
    kuaishou: `rtmp://live-push.kuaishou.com/live/${streamKey}`,
    custom: options.customUrl ? `${options.customUrl}/${streamKey}` : '',
  };

  return urls[platform] || options.customUrl || '';
}

export { RTMPPusher, pushVideoFile, buildRTMPUrl };
