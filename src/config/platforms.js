// ==========================================
// 平台佣金配置 - 5档佣金率
// ==========================================

export const PLATFORM_COMMISSION_CONFIG = {
  // TikTok Shop
  tiktok: {
    name: 'TikTok Shop',
    commissionTiers: [
      { min: 0, max: 100, rate: 0.02 },      // 0-100g: 2%
      { min: 100, max: 300, rate: 0.05 },    // 100-300g: 5%
      { min: 300, max: 500, rate: 0.08 },    // 300-500g: 8%
      { min: 500, max: 1000, rate: 0.12 },   // 500-1000g: 12%
      { min: 1000, max: 2000, rate: 0.18 },  // 1000-2000g: 18%
      { min: 2000, max: 999999, rate: 0.23 }, // 2000g+: 23%
    ],
    fixedFee: 0, // 固定费用
    currency: 'USD',
    exchangeRate: 7.2,
  },
  
  // OZON
  ozon: {
    name: 'OZON',
    commissionTiers: [
      { min: 0, max: 100, rate: 0.03 },
      { min: 100, max: 300, rate: 0.06 },
      { min: 300, max: 500, rate: 0.09 },
      { min: 500, max: 1000, rate: 0.13 },
      { min: 1000, max: 2000, rate: 0.19 },
      { min: 2000, max: 999999, rate: 0.23 },
    ],
    fixedFee: 0,
    currency: 'RUB',
    exchangeRate: 0.08, // 1 RUB = 0.08 CNY
  },
  
  // Amazon
  amazon: {
    name: 'Amazon',
    commissionTiers: [
      { min: 0, max: 100, rate: 0.15 },      // Amazon佣金较高
      { min: 100, max: 300, rate: 0.15 },
      { min: 300, max: 500, rate: 0.15 },
      { min: 500, max: 1000, rate: 0.15 },
      { min: 1000, max: 2000, rate: 0.15 },
      { min: 2000, max: 999999, rate: 0.15 },
    ],
    fixedFee: 0.99, // 每笔固定费用
    currency: 'USD',
    exchangeRate: 7.2,
  },
  
  // Shopee
  shopee: {
    name: 'Shopee',
    commissionTiers: [
      { min: 0, max: 100, rate: 0.02 },
      { min: 100, max: 300, rate: 0.05 },
      { min: 300, max: 500, rate: 0.08 },
      { min: 500, max: 1000, rate: 0.11 },
      { min: 1000, max: 2000, rate: 0.16 },
      { min: 2000, max: 999999, rate: 0.21 },
    ],
    fixedFee: 0,
    currency: 'USD',
    exchangeRate: 7.2,
  },
  
  // Temu
  temu: {
    name: 'Temu',
    commissionTiers: [
      { min: 0, max: 100, rate: 0.05 },
      { min: 100, max: 300, rate: 0.08 },
      { min: 300, max: 500, rate: 0.11 },
      { min: 500, max: 1000, rate: 0.15 },
      { min: 1000, max: 2000, rate: 0.20 },
      { min: 2000, max: 999999, rate: 0.23 },
    ],
    fixedFee: 0,
    currency: 'USD',
    exchangeRate: 7.2,
  },
  
  // 淘宝
  taobao: {
    name: '淘宝',
    commissionTiers: [
      { min: 0, max: 100, rate: 0.01 },
      { min: 100, max: 300, rate: 0.03 },
      { min: 300, max: 500, rate: 0.05 },
      { min: 500, max: 1000, rate: 0.08 },
      { min: 1000, max: 2000, rate: 0.12 },
      { min: 2000, max: 999999, rate: 0.15 },
    ],
    fixedFee: 0,
    currency: 'CNY',
    exchangeRate: 1,
  },
  
  // 拼多多
  pdd: {
    name: '拼多多',
    commissionTiers: [
      { min: 0, max: 100, rate: 0.006 },     // 0.6%
      { min: 100, max: 300, rate: 0.02 },
      { min: 300, max: 500, rate: 0.04 },
      { min: 500, max: 1000, rate: 0.07 },
      { min: 1000, max: 2000, rate: 0.10 },
      { min: 2000, max: 999999, rate: 0.13 },
    ],
    fixedFee: 0,
    currency: 'CNY',
    exchangeRate: 1,
  },
  
  // 抖音
  douyin: {
    name: '抖音',
    commissionTiers: [
      { min: 0, max: 100, rate: 0.01 },
      { min: 100, max: 300, rate: 0.03 },
      { min: 300, max: 500, rate: 0.05 },
      { min: 500, max: 1000, rate: 0.08 },
      { min: 1000, max: 2000, rate: 0.12 },
      { min: 2000, max: 999999, rate: 0.15 },
    ],
    fixedFee: 0,
    currency: 'CNY',
    exchangeRate: 1,
  },
};

// 计算平台佣金
export function calculateCommission(platform, weight, sellingPrice) {
  const config = PLATFORM_COMMISSION_CONFIG[platform];
  if (!config) return { rate: 0.1, amount: sellingPrice * 0.1 };
  
  // 找到对应的重量区间
  const tier = config.commissionTiers.find(t => weight >= t.min && weight < t.max);
  const rate = tier ? tier.rate : 0.1;
  
  // 计算佣金金额（按售价）
  const commissionAmount = sellingPrice * rate + config.fixedFee;
  
  return {
    rate,
    amount: commissionAmount,
    fixedFee: config.fixedFee,
    currency: config.currency,
  };
}

// 获取平台列表
export function getPlatformList() {
  return Object.entries(PLATFORM_COMMISSION_CONFIG).map(([key, config]) => ({
    key,
    name: config.name,
    currency: config.currency,
    exchangeRate: config.exchangeRate,
  }));
}
