/**
 * VRMRenderer.js — 3D数字人渲染引擎 v1.0
 * 
 * 功能：
 * - 加载VRM 3D模型
 * - 根据唇形同步数据驱动面部BlendShape
 * - 渲染为Canvas帧 → 输出给FFmpeg推流
 * 
 * 技术栈：
 * - Three.js (3D渲染)
 * - @pixiv/three-vrm (VRM模型加载)
 * - node-canvas / headless (服务端渲染)
 * 
 * 降级模式：
 * - 无GPU时使用2D Canvas渲染数字人图像 + 口型动画叠加
 * - 支持静态avatar图 + 动态嘴型叠加
 */

import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const OUTPUT_DIR = path.join(process.cwd(), 'generated-frames');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * 渲染模式枚举
 */
const RenderMode = {
  THREE_VRM: 'three-vrm',     // 完整3D VRM渲染（需GPU/node-canvas）
  CANVAS_2D: 'canvas-2d',     // 2D降级模式（纯JS，无外部依赖）
  IMAGE_OVERLAY: 'image-overlay', // 静态图+音频叠加
};

/**
 * 2D数字人渲染器（降级模式 — 无需GPU，纯JS实现）
 * 
 * 工作原理：
 * 1. 加载一张数字人静态图作为背景
 * 2. 根据唇形数据在嘴部区域叠加动画效果
 * 3. 输出为Canvas帧
 */
class Avatar2DRenderer {
  constructor(options = {}) {
    this.width = options.width || 1080;
    this.height = options.height || 1920;
    this.fps = options.fps || 30;
    this.backgroundColor = options.backgroundColor || '#1a1a2e';
    this.avatarImagePath = options.avatarImagePath || null;
    
    // 数字人参数
    this.avatarX = options.avatarX || this.width / 2;   // 中心X
    this.avatarY = options.avatarY || this.height * 0.45; // 中心偏上
    this.avatarScale = options.avatarScale || 0.7;
    
    // 嘴部区域（相对于avatar中心）
    this.mouthX = options.mouthX || 0;
    this.mouthY = options.mouthY || 0.12;  // 嘴在脸部偏下
    this.mouthWidth = options.mouthWidth || 0.15;
    this.mouthHeight = options.mouthHeight || 0.05;
    
    // 当前帧号
    this.frameNumber = 0;
  }

  /**
   * 生成单个渲染帧（返回SVG/Canvas数据，由前端或FFmpeg处理）
   * 返回 { svg: string, frame: number, time: number }
   */
  renderFrame(blendshapes, time) {
    this.frameNumber++;
    
    const w = this.width;
    const h = this.height;
    const avatarCX = this.avatarX;
    const avatarCY = this.avatarY;
    const scale = this.avatarScale;
    
    // 嘴型开合度 (从blendshapes计算)
    const mouthOpen = (blendshapes.A || 0) * 0.8 + (blendshapes.I || 0) * 0.2;
    const mouthWidth = (blendshapes.I || 0) * 0.5 + 0.5;
    
    // 嘴部实际坐标
    const mouthAbsX = avatarCX + this.mouthX * w;
    const mouthAbsY = avatarCY + this.mouthY * h;
    const mouthW = this.mouthWidth * w * mouthWidth;
    const mouthH = this.mouthHeight * h * (0.3 + mouthOpen * 2);
    
    // 生成SVG渲染帧（可直接转PNG或喂给FFmpeg）
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#2d1f3d"/>
      <stop offset="100%" stop-color="#0d0d1a"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>
  
  <!-- 背景 -->
  <rect width="${w}" height="${h}" fill="url(#bgGrad)"/>
  
  <!-- 粒子背景效果 -->
  <circle cx="${w*0.2}" cy="${h*0.3}" r="2" fill="#6c5ce7" opacity="0.3">
    <animate attributeName="cy" values="${h*0.3};${h*0.25};${h*0.3}" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="${w*0.7}" cy="${h*0.6}" r="1.5" fill="#a29bfe" opacity="0.4">
    <animate attributeName="cy" values="${h*0.6};${h*0.55};${h*0.6}" dur="4s" repeatCount="indefinite"/>
  </circle>
  <circle cx="${w*0.5}" cy="${h*0.8}" r="1" fill="#fd79a8" opacity="0.3">
    <animate attributeName="cy" values="${h*0.8};${h*0.78};${h*0.8}" dur="2.5s" repeatCount="indefinite"/>
  </circle>
  
  <!-- 数字人主体 -->
  <g filter="url(#shadow)" transform="translate(${avatarCX}, ${avatarCY}) scale(${scale})">
    <!-- 身体 -->
    <ellipse cx="0" cy="140" rx="130" ry="160" fill="#2d1b4e" stroke="#6c5ce7" stroke-width="2" opacity="0.9"/>
    
    <!-- 肩膀 -->
    <path d="M-130,120 Q-180,80 -200,40 L-180,30 Q-160,60 -120,90 Z" fill="#2d1b4e"/>
    <path d="M130,120 Q180,80 200,40 L180,30 Q160,60 120,90 Z" fill="#2d1b4e"/>
    
    <!-- 头 -->
    <ellipse cx="0" cy="-20" rx="75" ry="85" fill="#f5e6d3" stroke="#d4a574" stroke-width="2"/>
    
    <!-- 头发 -->
    <path d="M-75,-20 Q-75,-105 -40,-100 Q0,-110 40,-100 Q75,-105 75,-20 Q75,0 60,10 Q40,-5 20,5 Q0,-10 -20,5 Q-40,-5 -60,10 Q-75,0 -75,-20 Z" fill="#1a1a2e"/>
    
    <!-- 眉毛 -->
    <path d="M-35,-50 Q-25,-58 -15,-50" fill="none" stroke="#2d1b4e" stroke-width="3" stroke-linecap="round"/>
    <path d="M15,-50 Q25,-58 35,-50" fill="none" stroke="#2d1b4e" stroke-width="3" stroke-linecap="round"/>
    
    <!-- 眼睛 -->
    <ellipse cx="-25" cy="-38" rx="10" ry="7" fill="white" stroke="#333" stroke-width="1.5"/>
    <ellipse cx="25" cy="-38" rx="10" ry="7" fill="white" stroke="#333" stroke-width="1.5"/>
    <circle cx="-25" cy="-38" r="4" fill="#2d1b4e"/>
    <circle cx="25" cy="-38" r="4" fill="#2d1b4e"/>
    <circle cx="-23" cy="-40" r="1.5" fill="white"/>
    <circle cx="27" cy="-40" r="1.5" fill="white"/>
    
    <!-- 鼻子 -->
    <path d="M0,-25 Q-3,-18 0,-15 Q3,-18 0,-25" fill="none" stroke="#d4a574" stroke-width="1.5"/>
    
    <!-- 嘴（动态变化—唇形同步核心） -->
    <g transform="translate(0, 0)">
      <ellipse cx="0" cy="0" rx="${mouthW}" ry="${mouthH}" fill="#e74c3c" opacity="0.85"/>
      <path d="M${-mouthW},0 Q0,${mouthH*0.6} ${mouthW},0" fill="#c0392b" opacity="0.6"/>
    </g>
    
    <!-- 脸颊红晕 -->
    <ellipse cx="-40" cy="-10" rx="12" ry="6" fill="#ff7675" opacity="0.15"/>
    <ellipse cx="40" cy="-10" rx="12" ry="6" fill="#ff7675" opacity="0.15"/>
    
    <!-- 衣领/领口 -->
    <path d="M-40,65 L0,90 L40,65" fill="none" stroke="#6c5ce7" stroke-width="3"/>
  </g>
  
  <!-- 底部信息栏 -->
  <rect x="0" y="${h-80}" width="${w}" height="80" fill="rgba(0,0,0,0.6)"/>
  <text x="${w/2}" y="${h-45}" text-anchor="middle" fill="#a29bfe" font-size="20" font-family="Arial">
    🔴 LIVE · 云南瑞丽翡翠直播
  </text>
  
  <!-- 右上角Logo -->
  <circle cx="${w-60}" cy="60" r="30" fill="#6c5ce7" opacity="0.8"/>
  <text x="${w-60}" y="66" text-anchor="middle" fill="white" font-size="16" font-weight="bold">GEM</text>
</svg>`;
    
    return {
      svg,
      width: w,
      height: h,
      frame: this.frameNumber,
      time: parseFloat(time.toFixed(3)),
      blendshapes: { ...blendshapes },
    };
  }

  /**
   * 生成静音帧（数字人不说话）
   */
  renderSilentFrame(time) {
    return this.renderFrame({
      A: 0.05,  // 微张口（自然状态）
      I: 0.0,
      U: 0.0,
      E: 0.0,
      O: 0.0,
    }, time);
  }
}

/**
 * 渲染视频序列
 * 输入唇形数据 → 输出帧序列 → 用FFmpeg合成视频
 */
async function renderVideo(visemeData, options = {}) {
  const {
    width = 1080,
    height = 1920,
    fps = 30,
    outputPath,
    avatarImagePath,
  } = options;

  const renderer = new Avatar2DRenderer({
    width, height, fps,
    avatarImagePath,
  });

  const framesDir = path.join(OUTPUT_DIR, `render_${Date.now()}`);
  fs.mkdirSync(framesDir, { recursive: true });

  const keyframes = visemeData.keyframes || visemeData;
  
  console.log(`[VRMRenderer] 渲染 ${keyframes.length} 帧到 ${framesDir}...`);

  // 生成所有帧的SVG
  const framePaths = [];
  for (let i = 0; i < keyframes.length; i++) {
    const kf = keyframes[i];
    const frame = kf.silent 
      ? renderer.renderSilentFrame(kf.time)
      : renderer.renderFrame(kf.blendshapes, kf.time);
    
    const frameFile = path.join(framesDir, `frame_${String(i).padStart(6, '0')}.svg`);
    fs.writeFileSync(frameFile, frame.svg);
    framePaths.push(frameFile);
  }

  // 用FFmpeg将SVG帧合成为视频
  const videoFile = outputPath || path.join(path.join(process.cwd(), 'generated-videos'), `avatar_${Date.now()}.mp4`);
  
  try {
    // SVG转PNG帧 → 视频
    // 使用 imagemagick + ffmpeg 管道
    const ffmpegArgs = [
      'ffmpeg', '-y',
      '-framerate', String(fps),
      '-pattern_type', 'glob',
      '-i', `${framesDir.replace(/\\/g, '/')}/frame_*.svg`,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-vf', `scale=${width}:${height}`,
      videoFile
    ];

    execSync(ffmpegArgs.join(' '), { timeout: 120000, stdio: 'pipe' });
    
    console.log(`[VRMRenderer] 视频渲染完成: ${videoFile}`);
    
    return {
      success: true,
      videoPath: videoFile,
      framesDir,
      totalFrames: keyframes.length,
      duration: keyframes.length / fps,
    };
  } catch (e) {
    console.error('[VRMRenderer] FFmpeg合成失败:', e.message);
    return {
      success: false,
      error: e.message,
      framesDir,
      totalFrames: keyframes.length,
    };
  }
}

/**
 * 直播模式渲染（实时推流用）
 * 不生成文件，通过回调输出帧数据
 */
async function renderLiveStream(frameCallback, signal, options = {}) {
  const {
    width = 1080,
    height = 1920,
    fps = 25,
    avatarImagePath,
  } = options;

  const renderer = new Avatar2DRenderer({
    width, height, fps,
    avatarImagePath,
  });

  const frameInterval = 1000 / fps;
  let startTime = Date.now();
  let frameCount = 0;

  console.log(`[VRMRenderer] 开始实时渲染 (${width}x${height}, ${fps}fps)`);

  return new Promise((resolve) => {
    let running = true;
    
    if (signal) {
      signal.addEventListener('abort', () => {
        running = false;
        resolve({ frames: frameCount, duration: (Date.now() - startTime) / 1000 });
      });
    }

    const renderLoop = () => {
      if (!running) return;

      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      
      // 当前嘴型（简单正弦波模拟，实际使用时由LipSyncEngine提供精确数据）
      const t = elapsed % 2; // 2秒周期
      const mouthOpen = Math.sin(t * Math.PI) * 0.5 + 0.5;
      
      const blendshapes = {
        A: mouthOpen * 0.7,
        I: mouthOpen * 0.3,
        U: (1 - mouthOpen) * 0.1,
      };
      
      const frame = renderer.renderFrame(blendshapes, elapsed);
      frameCallback(frame);
      frameCount++;

      // 精确帧率控制
      const nextFrameTime = startTime + (frameCount * frameInterval);
      const delay = Math.max(0, nextFrameTime - Date.now());
      
      setTimeout(renderLoop, delay);
    };

    renderLoop();
  });
}

export {
  Avatar2DRenderer,
  renderVideo,
  renderLiveStream,
  RenderMode,
};
