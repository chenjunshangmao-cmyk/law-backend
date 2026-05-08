/**
 * RTMPPusher.js — RTMP推流引擎 v1.0
 * 
 * 功能：将渲染帧+音频推送到RTMP服务器
 * 
 * 工作模式：
 * 1. FILE_MODE: 渲染帧→PNG文件→FFmpeg pipe→RTMP (稳定但有延迟)
 * 2. PIPE_MODE: 渲染帧→stdin pipe→FFmpeg→RTMP (低延迟)
 * 3. LOCAL_MODE: 渲染帧→本地RTMP服务器→OBS接收 (推荐用于实际直播)
 * 
 * 支持的推流目标:
 * - YouTube Live (rtmp://a.rtmp.youtube.com/live2/STREAM_KEY)
 * - TikTok Live (rtmp://push-rtmp.tiktok.com/live/STREAM_KEY)  
 * - Facebook Live (rtmp://live-api-s.facebook.com:443/rtmp/STREAM_KEY)
 * - 自定义RTMP服务器 (rtmp://your-server/live/STREAM_KEY)
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';

const OUTPUT_DIR = path.join(process.cwd(), 'generated-stream');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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
    
    // 内部状态
    this.ffmpegProcess = null;
    this.isStreaming = false;
    this.statsInterval = null;
    this.startTime = null;
    this.totalFrames = 0;
  }

  /**
   * 启动推流（PNG管道模式）
   * 
   * 工作流: stdin接收PNG帧 → FFmpeg编码h264 → RTMP推送
   * 
   * @param {string} audioPath - 背景音频文件路径（可选）
   */
  start(audioPath = null) {
    if (!this.rtmpUrl) {
      throw new Error('未配置RTMP推流地址');
    }
    
    if (this.isStreaming) {
      console.warn('[RTMPPusher] 推流已在运行中');
      return this;
    }

    console.log(`[RTMPPusher] 开始推流 → ${this.rtmpUrl.replace(/\/[^/]+$/, '/***')}`);
    console.log(`[RTMPPusher] 参数: ${this.width}x${this.height} ${this.fps}fps ${this.videoBitrate}`);

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

    // RTMP输出
    args.push(
      '-f', 'flv',
      '-flvflags', 'no_duration_filesize',
      this.rtmpUrl
    );

    // 启动FFmpeg进程
    this.ffmpegProcess = spawn('ffmpeg', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
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
      const timeout = setTimeout(() => {
        if (this.ffmpegProcess) {
          this.ffmpegProcess.kill('SIGTERM');
        }
        this.isStreaming = false;
        this.emit('stopped', { forced: true });
        resolve({ forced: true });
      }, 5000);

      if (this.ffmpegProcess) {
        this.ffmpegProcess.on('close', () => {
          clearTimeout(timeout);
          this.isStreaming = false;
          resolve({ forced: false });
        });
      } else {
        clearTimeout(timeout);
        this.isStreaming = false;
        resolve({ alreadyStopped: true });
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
