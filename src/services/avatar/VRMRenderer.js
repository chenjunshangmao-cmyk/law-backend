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
 * 加载图片为base64 data URI
 */
function loadImageBase64(imagePath) {
  if (!imagePath) return null;
  try {
    const fullPath = path.isAbsolute(imagePath) ? imagePath : path.join(process.cwd(), imagePath);
    if (fs.existsSync(fullPath)) {
      const buffer = fs.readFileSync(fullPath);
      const ext = path.extname(fullPath).slice(1).toLowerCase();
      const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
      return `data:${mime};base64,${buffer.toString('base64')}`;
    }
  } catch (e) {
    console.warn('[VRMRenderer] 加载照片失败:', e.message);
  }
  return null;
}

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
    this.avatarX = options.avatarX || this.width / 2;
    this.avatarY = options.avatarY || this.height * 0.45;
    this.avatarScale = options.avatarScale || 0.7;
    
    // 嘴部区域
    this.mouthX = options.mouthX || 0;
    this.mouthY = options.mouthY || 0.12;
    this.mouthWidth = options.mouthWidth || 0.15;
    this.mouthHeight = options.mouthHeight || 0.05;
    
    // 外观参数（从AvatarProfiles传入）
    this.appearance = options.appearance || {
      skinTone: '#f5e6d3',
      hairColor: '#2d1b3d',
      hairStyle: 'long',
      outfitColor: '#6c3fa0',
      outfitAccent: '#a78bfa',
      lipColor: '#e74c3c',
      eyeColor: '#2d1b4e',
      blushColor: '#ff7675',
      bodyType: 'slim',
      accessories: 'earrings',
    };
    
    // 主播名称（显示在画面上）
    this.avatarName = options.avatarName || 'AI主播';
    
    // 照片模式
    this.avatarImagePath = options.avatarImagePath || this.avatarImagePath || null;
    this.photoBase64 = this.avatarImagePath ? loadImageBase64(this.avatarImagePath) : null;
    this.mouthPos = options.mouthPosition || { x: 0.49, y: 0.57, w: 0.06, h: 0.025 };
    this.usePhoto = !!this.photoBase64;

    if (this.usePhoto) {
      console.log(`[VRMRenderer] 📸 照片模式: ${this.avatarName} (${this.avatarImagePath})`);
    }
    
    // 场景叠加层配置
    this.sceneConfig = options.sceneConfig || null;
    
    // 当前帧号
    this.frameNumber = 0;
  }

  /**
   * 设置场景叠加层配置
   */
  setSceneConfig(config) {
    this.sceneConfig = config;
    if (config) {
      console.log(`[VRMRenderer] 🎬 场景配置已更新: ${config.orientation}, ${config.overlays?.length || 0}个叠加元素`);
    }
  }

  /**
   * 生成叠加元素的 SVG 片段
   */
  _renderOverlays(elapsed = 0) {
    if (!this.sceneConfig || !this.sceneConfig.overlays || !this.sceneConfig.overlays.length) {
      return '';
    }

    const w = this.width;
    const h = this.height;
    let svg = '';

    // 只渲染启用的、按 zIndex 排序的叠加元素
    const enabled = this.sceneConfig.overlays
      .filter(o => o.enabled)
      .sort((a, b) => (a.zIndex || 10) - (b.zIndex || 10));

    for (const overlay of enabled) {
      const { position, size, style, content, animation, type } = overlay;
      const px = (position.x / 100) * w;
      const py = (position.y / 100) * h;
      const sw = size.width;
      const sh = size.height;
      const pad = style.padding || 10;
      const radius = style.borderRadius || 0;
      const borderW = style.borderWidth || 0;
      const borderColor = style.borderColor || 'transparent';

      // 动画属性
      let animAttrs = '';
      if (animation === 'blink') {
        animAttrs = ` opacity="0.7"><animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.5s" repeatCount="indefinite"`;
      } else if (animation === 'pulse') {
        animAttrs = `><animateTransform attributeName="transform" type="scale" values="1,1;1.02,1.02;1,1" dur="2s" repeatCount="indefinite" additive="sum"`;
      }

      switch (type) {
        case 'qrcode':
          // 二维码：白色背景卡片 + 占位QR图案 + 文字
          svg += `
  <!-- 叠加: ${overlay.label} (二维码) -->
  <g transform="translate(${px}, ${py})"${animAttrs || ''}>
    <rect x="0" y="0" width="${sw}" height="${sh}" rx="${radius}" 
          fill="${style.backgroundColor || '#ffffff'}" 
          stroke="${borderColor}" stroke-width="${borderW}"/>
    <!-- QR码占位（实际会用 content.qrValue 生成） -->
    <g transform="translate(${pad}, ${pad})">
      <rect x="0" y="0" width="${sw - pad * 2}" height="${sw - pad * 2}" rx="6"
            fill="#ffffff" stroke="#333" stroke-width="1"/>
      ${this._generateQRPattern(sw - pad * 2, sw - pad * 2)}
    </g>
    <text x="${sw / 2}" y="${sw + (sh - sw) / 2 + 8}" 
          text-anchor="middle" fill="${style.color || '#333'}" 
          font-size="${style.fontSize || 13}" font-family="${style.fontFamily || 'Arial, sans-serif'}">
      ${this._escapeXml(content.text || '扫码加微信')}
    </text>
  </g>`;
          break;

        case 'text-banner':
          // 广告词横幅
          svg += `
  <!-- 叠加: ${overlay.label} (广告词) -->
  <g transform="translate(${px}, ${py})"${animAttrs || ''}>
    <rect x="0" y="0" width="${sw}" height="${sh}" rx="${radius}" 
          fill="${style.backgroundColor || 'rgba(0,0,0,0.6)'}" 
          stroke="${borderColor}" stroke-width="${borderW}"/>
    ${this._wrapTextSvg(content.text || '', sw / 2, sh / 2, sw - pad * 2, style.fontSize || 20, style.color || '#ffffff', style.fontWeight || 'bold', style.fontFamily || 'Microsoft YaHei, sans-serif', style.textAlign || 'center', pad)}
  </g>`;
          break;

        case 'led-marquee':
          // LED跑马灯
          const ledText = this._escapeXml(content.text || '');
          const ledFontSize = style.fontSize || 15;
          svg += `
  <!-- 叠加: ${overlay.label} (LED跑马灯) -->
  <g transform="translate(${px}, ${py})">
    <rect x="0" y="0" width="${sw}" height="${sh}" rx="${radius}" 
          fill="${style.backgroundColor || '#0a1a0a'}" 
          stroke="${style.color || '#00ff00'}" stroke-width="${borderW || 1}"/>
    <clipPath id="led-clip-${overlay.id}">
      <rect x="${pad}" y="${pad / 2}" width="${sw - pad * 2}" height="${sh - pad}"/>
    </clipPath>
    <text x="${sw}" y="${sh / 2 + ledFontSize / 3}" text-anchor="start" 
          fill="${style.color || '#00ff00'}" font-size="${ledFontSize}" 
          font-family="${style.fontFamily || 'Courier New, monospace'}" 
          clip-path="url(#led-clip-${overlay.id})">
      ${ledText}    ${ledText}
      <animate attributeName="x" from="${sw}" to="${-sw * 2}" dur="10s" repeatCount="indefinite"/>
    </text>
  </g>`;
          break;

        case 'product-card':
          // 产品卡片
          const prodName = this._escapeXml(content.productName || '产品名称');
          const prodPrice = this._escapeXml(content.productPrice || '');
          const prodDesc = this._escapeXml(content.text || '');
          const cardFontSize = style.fontSize || 15;
          svg += `
  <!-- 叠加: ${overlay.label} (产品卡片) -->
  <g transform="translate(${px}, ${py})"${animAttrs || ''}>
    <rect x="0" y="0" width="${sw}" height="${sh}" rx="${radius}" 
          fill="${style.backgroundColor || 'rgba(20,20,40,0.9)'}" 
          stroke="${borderColor}" stroke-width="${borderW}"/>
    <text x="${sw / 2}" y="${pad + cardFontSize}" text-anchor="middle" 
          fill="${style.color || '#e0e0e0'}" font-size="${cardFontSize}" 
          font-weight="bold" font-family="${style.fontFamily || 'Arial, sans-serif'}">
      ${prodName}
    </text>
    <text x="${sw / 2}" y="${sh * 0.55}" text-anchor="middle" 
          fill="#ffd700" font-size="${cardFontSize + 4}" font-weight="bold" 
          font-family="Arial, sans-serif">
      ${prodPrice}
    </text>
    <text x="${sw / 2}" y="${sh - pad - 4}" text-anchor="middle" 
          fill="#888" font-size="${Math.max(10, cardFontSize - 3)}" 
          font-family="Arial, sans-serif">
      ${prodDesc}
    </text>
  </g>`;
          break;

        case 'image':
          // 图片叠加
          if (content.imageUrl) {
            svg += `
  <!-- 叠加: ${overlay.label} (图片) -->
  <g transform="translate(${px}, ${py})">
    <rect x="0" y="0" width="${sw}" height="${sh}" rx="${radius}" fill="${style.backgroundColor || '#1a1a2e'}"/>
    <image href="${this._escapeXml(content.imageUrl)}" x="${pad}" y="${pad}" 
           width="${sw - pad * 2}" height="${sh - pad * 2}" 
           preserveAspectRatio="xMidYMid slice"/>
  </g>`;
          }
          break;
      }
    }

    return svg;
  }

  /**
   * 生成简易QR码图案
   */
  _generateQRPattern(w, h) {
    const size = Math.min(w, h);
    const moduleSize = size / 15;
    let pattern = '';
    // 生成固定模式的QR码3个定位图案 + 随机数据区
    const positions = [
      [0, 0], [size - moduleSize * 3, 0], [0, size - moduleSize * 3]
    ];
    for (const [ox, oy] of positions) {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const fill = (i === 1 && j === 1) || (i === 0 || i === 2) && (j === 0 || j === 2) ? '#000' : '#fff';
          pattern += `<rect x="${ox + j * moduleSize}" y="${oy + i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${fill}"/>`;
        }
      }
    }
    // 随机散点模拟数据区
    const rng = (x, y) => ((x * 31 + y * 17) % 7) < 3;
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        if (i < 3 && j < 3) continue;
        if (i < 3 && j > 11) continue;
        if (i > 11 && j < 3) continue;
        if (rng(i, j)) {
          pattern += `<rect x="${j * moduleSize}" y="${i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#000" opacity="0.7"/>`;
        }
      }
    }
    return pattern;
  }

  /**
   * 简单文字换行（SVG tspan）
   */
  _wrapTextSvg(text, cx, cy, maxWidth, fontSize, color, fontWeight, fontFamily, textAlign, pad) {
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    const startY = cy - totalHeight / 2 + fontSize;
    
    return lines.map((line, i) => {
      const anchor = textAlign || 'center';
      const x = anchor === 'center' ? cx : (anchor === 'right' ? maxWidth : pad);
      return `<text x="${x}" y="${startY + i * lineHeight}" text-anchor="${anchor}" 
            fill="${color}" font-size="${fontSize}" font-weight="${fontWeight || 'normal'}" 
            font-family="${fontFamily || 'Arial, sans-serif'}">
      ${this._escapeXml(line)}
    </text>`;
    }).join('\n');
  }

  /**
   * XML 转义
   */
  _escapeXml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 生成单个渲染帧（返回SVG/Canvas数据，由前端或FFmpeg处理）
   * 返回 { svg: string, frame: number, time: number }
   */
  renderFrame(blendshapes, time) {
    this.frameNumber++;
    
    // 照片模式：用真人照片+动态口型叠加
    if (this.usePhoto && this.photoBase64) {
      return this.renderFramePhoto(blendshapes, time);
    }
    
    // SVG卡通模式（降级）
    return this.renderFrameSVG(blendshapes, time);
  }

  /**
   * 照片模式渲染：真人照片底图 + 动态口型SVG叠加
   */
  renderFramePhoto(blendshapes, time) {
    const w = this.width;
    const h = this.height;
    const name = this.avatarName;
    
    // 口型开合度
    const mouthOpen = (blendshapes.A || 0) * 0.9 + (blendshapes.I || 0) * 0.1;
    
    // 照片缩放：占画面宽度85%，居中
    const photoW = w * 0.85;
    const photoH = h * 0.75;
    const photoX = (w - photoW) / 2;
    const photoY = (h - photoH) / 2 - h * 0.03;
    
    // 嘴部在照片上的位置（相对于照片）
    const mp = this.mouthPos;
    const mouthAbsX = photoX + mp.x * photoW;
    const mouthAbsY = photoY + mp.y * photoH;
    const mouthW = mp.w * photoW * (0.8 + (blendshapes.I || 0) * 0.5);
    const mouthH = mp.h * photoH * (0.2 + mouthOpen * 3.0);
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="mouthBlur">
      <feGaussianBlur stdDeviation="1.5"/>
    </filter>
  </defs>
  
  <rect width="${w}" height="${h}" fill="#0a0a1a"/>
  
  <!-- 真人照片 -->
  <image href="${this.photoBase64}" x="${photoX}" y="${photoY}" 
         width="${photoW}" height="${photoH}" preserveAspectRatio="xMidYMid slice"/>
  
  <!-- 口型叠加（真人肤色遮罩 + 内口暗色） -->
  <g transform="translate(${mouthAbsX}, ${mouthAbsY})" filter="url(#mouthBlur)">
    <!-- 嘴张开区域 - 肤色内壁 -->
    <ellipse cx="0" cy="${mouthH * 0.2}" rx="${mouthW * 1.1}" ry="${mouthH}" 
             fill="#c4726a" opacity="${0.5 + mouthOpen * 0.4}"/>
    <!-- 口腔暗部 -->
    <ellipse cx="0" cy="${mouthH * 0.3}" rx="${mouthW * 0.7}" ry="${mouthH * 0.6}" 
             fill="#2a0a0a" opacity="${0.3 + mouthOpen * 0.6}"/>
  </g>
  
  <!-- 底部信息栏 -->
  <rect x="0" y="${h - 80}" width="${w}" height="80" fill="rgba(0,0,0,0.7)"/>
  <text x="30" y="${h - 50}" fill="#a29bfe" font-size="18" font-family="Arial, sans-serif">
    🔴 LIVE
  </text>
  <text x="${w / 2}" y="${h - 48}" text-anchor="middle" fill="#e0e0e0" font-size="18" font-family="Arial, sans-serif">
    ${name} · 云南瑞丽翡翠源头直播
  </text>
  <text x="${w - 30}" y="${h - 50}" text-anchor="end" fill="#888" font-size="14" font-family="Arial, sans-serif">
    ${formatTimeStr(time)}
  </text>
  ${this._renderOverlays(time)}
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
   * SVG卡通模式渲染（降级）
   */
  renderFrameSVG(blendshapes, time) {
    this.frameNumber++;
    
    const a = this.appearance;
    const w = this.width;
    const h = this.height;
    const avatarCX = this.avatarX;
    const avatarCY = this.avatarY;
    const scale = this.avatarScale;
    const name = this.avatarName;
    
    // 嘴型开合度
    const mouthOpen = (blendshapes.A || 0) * 0.8 + (blendshapes.I || 0) * 0.2;
    const mouthWidth = (blendshapes.I || 0) * 0.5 + 0.5;
    const mouthW = this.mouthWidth * w * mouthWidth;
    const mouthH = this.mouthHeight * h * (0.3 + mouthOpen * 2);
    
    // 根据性别微调体型
    const bodyRx = a.bodyType === 'broad' ? 145 : 120;
    const bodyRy = a.bodyType === 'broad' ? 175 : 160;
    
    // 头发形状（长发vs短发）
    const hairPath = a.hairStyle === 'long'
      ? `M-75,-20 Q-75,-105 -40,-100 Q0,-110 40,-100 Q75,-105 75,-20 Q75,10 60,40 Q40,20 20,35 Q0,15 -20,35 Q-40,20 -60,40 Q-75,10 -75,-20 Z`
      : `M-75,-20 Q-80,-75 -45,-70 Q-5,-80 40,-70 Q80,-75 75,-20 Q70,5 60,15 Q35,5 20,12 Q0,2 -20,12 Q-35,5 -60,15 Q-70,5 -75,-20 Z`;
    
    // 配饰
    const accessoriesSvg = [];
    if (a.accessories === 'earrings') {
      accessoriesSvg.push(
        `<circle cx="-50" cy="18" r="4" fill="#ffd700" opacity="0.8"/>`,
        `<circle cx="50" cy="18" r="4" fill="#ffd700" opacity="0.8"/>`
      );
    } else if (a.accessories === 'necklace') {
      accessoriesSvg.push(
        `<path d="M-15,50 Q0,70 15,50" fill="none" stroke="#ffd700" stroke-width="2" opacity="0.6"/>`
      );
    } else if (a.accessories === 'glasses') {
      accessoriesSvg.push(
        `<circle cx="-25" cy="-38" r="13" fill="none" stroke="#374151" stroke-width="2.5"/>`,
        `<circle cx="25" cy="-38" r="13" fill="none" stroke="#374151" stroke-width="2.5"/>`,
        `<line x1="-12" y1="-38" x2="12" y2="-38" stroke="#374151" stroke-width="2"/>`
      );
    } else if (a.accessories === 'watch') {
      // watch rendered later
    }

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
  
  <rect width="${w}" height="${h}" fill="url(#bgGrad)"/>
  
  <!-- 粒子 -->
  <circle cx="${w*0.2}" cy="${h*0.3}" r="2" fill="${a.outfitAccent}" opacity="0.3">
    <animate attributeName="cy" values="${h*0.3};${h*0.25};${h*0.3}" dur="3s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="${w*0.7}" cy="${h*0.6}" r="1.5" fill="${a.outfitAccent}" opacity="0.4">
    <animate attributeName="cy" values="${h*0.6};${h*0.55};${h*0.6}" dur="4s" repeatCount="indefinite"/>
  </circle>
  <circle cx="${w*0.5}" cy="${h*0.8}" r="1" fill="#fd79a8" opacity="0.3">
    <animate attributeName="cy" values="${h*0.8};${h*0.78};${h*0.8}" dur="2.5s" repeatCount="indefinite"/>
  </circle>
  
  <!-- 数字人主体 -->
  <g filter="url(#shadow)" transform="translate(${avatarCX}, ${avatarCY}) scale(${scale})">
    <!-- 身体 -->
    <ellipse cx="0" cy="140" rx="${bodyRx}" ry="${bodyRy}" fill="${a.outfitColor}" stroke="${a.outfitAccent}" stroke-width="2" opacity="0.9"/>
    
    <!-- 肩膀 -->
    <path d="M-${bodyRx},120 Q-190,80 -210,40 L-190,30 Q-170,60 -120,90 Z" fill="${a.outfitColor}"/>
    <path d="M${bodyRx},120 Q190,80 210,40 L190,30 Q170,60 120,90 Z" fill="${a.outfitColor}"/>
    
    <!-- 头 -->
    <ellipse cx="0" cy="-20" rx="75" ry="85" fill="${a.skinTone}" stroke="#c4a882" stroke-width="2"/>
    
    <!-- 头发 -->
    <path d="${hairPath}" fill="${a.hairColor}"/>
    
    <!-- 眉毛 -->
    <path d="M-35,-50 Q-25,-58 -15,-50" fill="none" stroke="${a.hairColor}" stroke-width="3" stroke-linecap="round"/>
    <path d="M15,-50 Q25,-58 35,-50" fill="none" stroke="${a.hairColor}" stroke-width="3" stroke-linecap="round"/>
    
    <!-- 眼睛 -->
    <ellipse cx="-25" cy="-38" rx="10" ry="7" fill="white" stroke="#333" stroke-width="1.5"/>
    <ellipse cx="25" cy="-38" rx="10" ry="7" fill="white" stroke="#333" stroke-width="1.5"/>
    <circle cx="-25" cy="-38" r="4" fill="${a.eyeColor}"/>
    <circle cx="25" cy="-38" r="4" fill="${a.eyeColor}"/>
    <circle cx="-23" cy="-40" r="1.5" fill="white"/>
    <circle cx="27" cy="-40" r="1.5" fill="white"/>
    
    <!-- 鼻子 -->
    <path d="M0,-25 Q-3,-18 0,-15 Q3,-18 0,-25" fill="none" stroke="#c4a882" stroke-width="1.5"/>
    
    <!-- 嘴（动态口型） -->
    <g transform="translate(0, 0)">
      <ellipse cx="0" cy="0" rx="${mouthW}" ry="${mouthH}" fill="${a.lipColor}" opacity="0.85"/>
      <path d="M${-mouthW},0 Q0,${mouthH*0.6} ${mouthW},0" fill="#c0392b" opacity="0.5"/>
    </g>
    
    <!-- 脸颊红晕 -->
    ${a.blushColor !== 'transparent' ? `
    <ellipse cx="-40" cy="-10" rx="12" ry="6" fill="${a.blushColor}" opacity="0.15"/>
    <ellipse cx="40" cy="-10" rx="12" ry="6" fill="${a.blushColor}" opacity="0.15"/>
    ` : ''}
    
    ${a.gender === 'male' ? `
    <!-- 男性：面部轮廓线 -->
    <path d="M-70,-10 Q-70,20 -50,35 Q-30,45 0,48 Q30,45 50,35 Q70,20 70,-10" fill="none" stroke="#c4a882" stroke-width="1" opacity="0.4"/>
    ` : ''}
    
    <!-- 配饰 -->
    ${accessoriesSvg.join('\n    ')}
    
    <!-- 衣领 -->
    <path d="M-35,65 L0,95 L35,65" fill="none" stroke="${a.outfitAccent}" stroke-width="3"/>
  </g>
  
  <!-- 底部信息栏 -->
  <rect x="0" y="${h-80}" width="${w}" height="80" fill="rgba(0,0,0,0.6)"/>
  <text x="${w/2}" y="${h-48}" text-anchor="middle" fill="${a.outfitAccent}" font-size="20" font-family="Arial, sans-serif">
    🔴 LIVE · ${name} · 云南瑞丽翡翠
  </text>
  
  <!-- 右上角Logo -->
  <circle cx="${w-60}" cy="60" r="30" fill="${a.outfitColor}" opacity="0.8"/>
  <text x="${w-60}" y="66" text-anchor="middle" fill="white" font-size="16" font-weight="bold">GEM</text>
  ${this._renderOverlays(time)}
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

function formatTimeStr(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export {
  Avatar2DRenderer,
  renderVideo,
  renderLiveStream,
  loadImageBase64,
  RenderMode,
};
