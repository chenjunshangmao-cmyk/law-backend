// ==========================================
// 平台佣金配置 — 区分国内/国外平台
// domestic=true → CNY结算，无国际物流，无汇率
// domestic=false → 外币结算，需要国际物流+汇率
// ==========================================

export const PLATFORM_COMMISSION_CONFIG = {
  // ─── 国外平台 ───
  // TikTok Shop
  tiktok: {
    name: 'TikTok Shop',
    domestic: false,
    region: 'us',
    commissionTiers: [
      { min: 0, max: 100, rate: 0.02 },
      { min: 100, max: 300, rate: 0.05 },
      { min: 300, max: 500, rate: 0.08 },
      { min: 500, max: 1000, rate: 0.12 },
      { min: 1000, max: 2000, rate: 0.18 },
      { min: 2000, max: 999999, rate: 0.23 },
    ],
    fixedFee: 0,
    currency: 'USD',
    exchangeRate: 7.2,
  },

  // OZON
  ozon: {
    name: 'OZON',
    domestic: false,
    region: 'ru',
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
    exchangeRate: 0.078,
  },

  // Amazon
  amazon: {
    name: 'Amazon',
    domestic: false,
    region: 'us',
    commissionTiers: [
      { min: 0, max: 500, rate: 0.15 },
      { min: 500, max: 999999, rate: 0.15 },
    ],
    fixedFee: 0.99,
    currency: 'USD',
    exchangeRate: 7.2,
  },

  // Shopee
  shopee: {
    name: 'Shopee',
    domestic: false,
    region: 'sea',
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
    domestic: false,
    region: 'us',
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

  // ─── 国内平台 ───
  // 淘宝
  taobao: {
    name: '淘宝',
    domestic: true,
    region: 'cn',
    commissionRate: 0.05,      // 统一佣金率 5%
    fixedFee: 0,
    currency: 'CNY',
    exchangeRate: 1,
  },

  // 拼多多
  pdd: {
    name: '拼多多',
    domestic: true,
    region: 'cn',
    commissionRate: 0.006,     // 0.6%
    fixedFee: 0,
    currency: 'CNY',
    exchangeRate: 1,
  },

  // 抖音
  douyin: {
    name: '抖音',
    domestic: true,
    region: 'cn',
    commissionRate: 0.05,      // 5%
    fixedFee: 0,
    currency: 'CNY',
    exchangeRate: 1,
  },
};

// 计算平台佣金
export function calculateCommission(platform, weight, sellingPrice) {
  const config = PLATFORM_COMMISSION_CONFIG[platform];
  if (!config) return { rate: 0.1, amount: sellingPrice * 0.1 };

  // 国内平台：固定佣金率
  if (config.domestic) {
    const rate = config.commissionRate || 0.05;
    return { rate, amount: sellingPrice * rate + (config.fixedFee || 0), fixedFee: config.fixedFee || 0, currency: config.currency };
  }

  // 国外平台：按重量阶梯
  const tiers = config.commissionTiers || [{ min: 0, max: 999999, rate: 0.15 }];
  const tier = tiers.find(t => weight >= t.min && weight < t.max);
  const rate = tier ? tier.rate : 0.15;
  const amount = sellingPrice * rate + (config.fixedFee || 0);

  return { rate, amount, fixedFee: config.fixedFee || 0, currency: config.currency };
}

export default PLATFORM_COMMISSION_CONFIG;
