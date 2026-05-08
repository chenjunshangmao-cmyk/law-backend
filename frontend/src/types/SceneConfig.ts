/**
 * SceneConfig.ts — 直播场景布局配置类型定义
 * 
 * 横屏 (1920x1080)：数字人居中，左右两侧可添加叠加元素
 * 竖屏 (1080x1920)：数字人占主体，底部可加字幕/产品卡
 */

// 画布方向
export type Orientation = 'portrait' | 'landscape';

// 叠加元素类型
export type OverlayType = 'qrcode' | 'text-banner' | 'led-marquee' | 'image' | 'product-card';

// 动画类型
export type OverlayAnimation = 'none' | 'marquee' | 'blink' | 'pulse' | 'slide-in';

// 单个叠加元素
export interface OverlayElement {
  id: string;
  type: OverlayType;
  label: string;           // 显示名称
  enabled: boolean;        // 是否启用
  position: {
    x: number;  // 百分比 0-100（相对画布宽度）
    y: number;  // 百分比 0-100（相对画布高度）
  };
  size: {
    width: number;   // 像素
    height: number;  // 像素
  };
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    padding?: number;
  };
  content: {
    text?: string;          // 文字内容（text-banner / led-marquee）
    imageUrl?: string;      // 图片URL（qrcode / image）
    qrValue?: string;       // 二维码内容
    productName?: string;   // 产品名称（product-card）
    productPrice?: string;  // 产品价格
    productImage?: string;  // 产品图片
  };
  animation: OverlayAnimation;
  zIndex: number;
}

// 完整的场景配置
export interface SceneConfig {
  orientation: Orientation;
  width: number;    // 画布宽（如 1080/1920）
  height: number;   // 画布高（如 1920/1080）
  background: {
    type: 'color' | 'image' | 'gradient';
    value: string;
  };
  // 数字人区域（百分比定位，方便横竖屏适配）
  avatar: {
    x: number;       // 百分比
    y: number;
    width: number;   // 百分比
    height: number;
  };
  // 叠加元素列表
  overlays: OverlayElement[];
  // 底部信息栏
  bottomBar: {
    enabled: boolean;
    text: string;        // 底部滚动文字
    height: number;      // 像素
    backgroundColor: string;
    textColor: string;
    showLiveDot: boolean;  // 显示 LIVE 红点
    showTimer: boolean;    // 显示时长
  };
}

// 默认竖屏配置（TikTok/抖音 9:16）
export const DEFAULT_PORTRAIT_SCENE: SceneConfig = {
  orientation: 'portrait',
  width: 1080,
  height: 1920,
  background: { type: 'gradient', value: '#0a0a1a,#1a1a2e' },
  avatar: { x: 50, y: 42, width: 85, height: 72 },
  overlays: [],
  bottomBar: {
    enabled: true,
    text: '云南瑞丽翡翠源头直播',
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.7)',
    textColor: '#e0e0e0',
    showLiveDot: true,
    showTimer: true,
  },
};

// 默认横屏配置（YouTube/Facebook/B站 16:9）
export const DEFAULT_LANDSCAPE_SCENE: SceneConfig = {
  orientation: 'landscape',
  width: 1920,
  height: 1080,
  background: { type: 'gradient', value: '#0a0a1a,#1a1a2e' },
  avatar: { x: 35, y: 50, width: 45, height: 85 },
  overlays: [
    // 左侧：微信二维码
    {
      id: 'qrcode-left',
      type: 'qrcode',
      label: '微信二维码',
      enabled: true,
      position: { x: 3, y: 65 },
      size: { width: 160, height: 200 },
      style: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 10,
      },
      content: {
        text: '扫码加微信',
        qrValue: 'https://u.wechat.com/example',
      },
      animation: 'none',
      zIndex: 10,
    },
    // 右侧：广告词
    {
      id: 'ad-text-right',
      type: 'text-banner',
      label: '右侧广告词',
      enabled: true,
      position: { x: 72, y: 15 },
      size: { width: 380, height: 120 },
      style: {
        fontSize: 22,
        fontFamily: 'Microsoft YaHei, sans-serif',
        color: '#ffd700',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderColor: '#ffd700',
        borderWidth: 2,
        borderRadius: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 15,
      },
      content: {
        text: '缅甸A货翡翠\n假一赔十 · 源头直供',
      },
      animation: 'pulse',
      zIndex: 10,
    },
    // 右侧：LED跑马灯
    {
      id: 'led-news',
      type: 'led-marquee',
      label: 'LED滚动条',
      enabled: true,
      position: { x: 72, y: 32 },
      size: { width: 380, height: 36 },
      style: {
        fontSize: 16,
        fontFamily: 'Courier New, monospace',
        color: '#00ff00',
        backgroundColor: '#0a1a0a',
        borderColor: '#00ff00',
        borderWidth: 1,
        borderRadius: 6,
        textAlign: 'left',
        padding: 6,
      },
      content: {
        text: '🔥 新粉关注立减50元 | 💎 全场A货翡翠假一赔十 | 📦 顺丰包邮7天无理由 | 🎁 满1999送鉴定证书',
      },
      animation: 'marquee',
      zIndex: 10,
    },
    // 右侧：产品卡片
    {
      id: 'product-card-right',
      type: 'product-card',
      label: '产品展示卡',
      enabled: false,
      position: { x: 72, y: 50 },
      size: { width: 380, height: 260 },
      style: {
        backgroundColor: 'rgba(20,20,40,0.9)',
        borderColor: '#6c5ce7',
        borderWidth: 2,
        borderRadius: 12,
        fontSize: 16,
        color: '#e0e0e0',
        textAlign: 'center',
        padding: 12,
      },
      content: {
        productName: '冰种飘花翡翠手镯',
        productPrice: '¥8,800',
        text: '缅甸A货 · 种水通透 · 附鉴定证书',
      },
      animation: 'slide-in',
      zIndex: 10,
    },
  ],
  bottomBar: {
    enabled: true,
    text: '云南瑞丽翡翠源头直播 · 缅甸A货 · 假一赔十',
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.7)',
    textColor: '#e0e0e0',
    showLiveDot: true,
    showTimer: true,
  },
};

// 平台对应的默认方向
export const PLATFORM_ORIENTATION: Record<string, Orientation> = {
  youtube: 'landscape',
  facebook: 'landscape',
  twitch: 'landscape',
  bilibili: 'landscape',
  tiktok: 'portrait',
  douyin: 'portrait',
  kuaishou: 'portrait',
  custom: 'portrait',
};

// 生成唯一ID
export function generateOverlayId(): string {
  return `overlay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// 新建叠加元素模板
export function createOverlay(type: OverlayType): OverlayElement {
  const base: OverlayElement = {
    id: generateOverlayId(),
    type,
    label: '',
    enabled: true,
    position: { x: 50, y: 50 },
    size: { width: 200, height: 100 },
    style: {
      fontSize: 16,
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 8,
      padding: 10,
      textAlign: 'center',
    },
    content: {},
    animation: 'none',
    zIndex: 10,
  };

  switch (type) {
    case 'qrcode':
      base.label = '微信二维码';
      base.size = { width: 160, height: 200 };
      base.style.backgroundColor = '#ffffff';
      base.style.color = '#333333';
      base.style.fontSize = 13;
      base.content = { text: '扫码加微信', qrValue: '' };
      break;
    case 'text-banner':
      base.label = '广告词';
      base.size = { width: 350, height: 100 };
      base.style.fontSize = 20;
      base.style.fontWeight = 'bold';
      base.style.borderColor = '#ffd700';
      base.style.borderWidth = 2;
      base.content = { text: '输入广告词...' };
      break;
    case 'led-marquee':
      base.label = 'LED跑马灯';
      base.size = { width: 350, height: 36 };
      base.style.fontSize = 15;
      base.style.fontFamily = 'Courier New, monospace';
      base.style.color = '#00ff00';
      base.style.backgroundColor = '#0a1a0a';
      base.style.borderColor = '#00ff00';
      base.style.borderWidth = 1;
      base.content = { text: '滚动文字...' };
      base.animation = 'marquee';
      break;
    case 'image':
      base.label = '图片';
      base.size = { width: 200, height: 150 };
      base.content = { imageUrl: '' };
      break;
    case 'product-card':
      base.label = '产品卡片';
      base.size = { width: 350, height: 240 };
      base.style.backgroundColor = 'rgba(20,20,40,0.9)';
      base.style.borderColor = '#6c5ce7';
      base.style.borderWidth = 2;
      base.style.borderRadius = 12;
      base.style.fontSize = 15;
      base.content = {
        productName: '产品名称',
        productPrice: '¥0',
        text: '产品描述...',
      };
      break;
  }

  return base;
}
