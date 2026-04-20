// 用户类型
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  membershipType?: 'free' | 'basic' | 'premium' | 'enterprise';
  membershipExpiresAt?: string;
  memberId?: string;
  createdAt?: string;
}

// 产品类型
export interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  cost?: number;
  profit?: number;
  images: string[];
  platform?: string;
  status?: 'draft' | 'published' | 'unpublished';
  source?: string;
  url?: string;
  specs?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

// 账号类型
export interface Account {
  id: string;
  platform: string;
  name: string;
  username?: string;
  status: 'active' | 'inactive' | 'expired' | 'error';
  createdAt?: string;
  updatedAt?: string;
}

// 支付订单类型
export interface PaymentOrder {
  orderNo: string;
  amount: number;
  planName: string;
  payUrl?: string;
  qrCode?: string;
  expiredAt?: string;
  status?: string;
  testMode?: boolean;
  message?: string;
}

// 套餐类型
export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string[];
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 配额类型
export interface Quota {
  textLimit: number;
  textGenerations: number;
  imageLimit: number;
  imageGenerations: number;
  productsLimit: number;
}

// 平台类型
export type Platform = 'tiktok' | 'youtube' | 'ozon' | 'amazon' | '1688' | 'lazada' | 'shopee' | 'taobao' | 'pdd';

// 平台配置
export const PLATFORM_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  tiktok: { name: 'TikTok', color: '#000000', icon: '🎵' },
  youtube: { name: 'YouTube', color: '#FF0000', icon: '▶️' },
  ozon: { name: 'OZON', color: '#005BFF', icon: '🛒' },
  amazon: { name: 'Amazon', color: '#FF9900', icon: '📦' },
  '1688': { name: '1688', color: '#FF4400', icon: '🏪' },
  lazada: { name: 'Lazada', color: '#0F146D', icon: '🛍️' },
  shopee: { name: 'Shopee', color: '#EE4D2D', icon: '🛒' },
  taobao: { name: '淘宝', color: '#FF4400', icon: '🏮' },
  pdd: { name: '拼多多', color: '#E02020', icon: '🎯' },
};
