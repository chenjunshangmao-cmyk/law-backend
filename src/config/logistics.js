// ==========================================
// 物流配置 — 国内物流 + 国际物流
// domestic=true → 国内运费，按件/按重
// domestic=false → 国际物流，按重量区间
// 价格以物流公司实际报价为准，需定期更新
// ==========================================

export const LOGISTICS_CONFIG = {
  // ─── 国内物流 ───
  // 菜鸟/申通（电商常用）
  cainiao: {
    name: '菜鸟快递',
    code: 'cainiao',
    domestic: true,
    basePrice: 2.5,           // 首重1kg内 ¥2.5
    perKg: 1.0,               // 续重 ¥1/kg
    deliveryTime: '2-4天',
    tracking: true,
    region: 'cn',
  },

  // 圆通
  yuantong: {
    name: '圆通',
    code: 'yuantong',
    domestic: true,
    basePrice: 3.0,
    perKg: 1.0,
    deliveryTime: '2-5天',
    tracking: true,
    region: 'cn',
  },

  // 顺丰
  shunfeng: {
    name: '顺丰',
    code: 'shunfeng',
    domestic: true,
    basePrice: 12.0,          // 顺丰贵
    perKg: 2.0,
    deliveryTime: '1-2天',
    tracking: true,
    region: 'cn',
  },

  // 中通
  zhongtong: {
    name: '中通',
    code: 'zhongtong',
    domestic: true,
    basePrice: 2.5,
    perKg: 0.8,
    deliveryTime: '2-4天',
    tracking: true,
    region: 'cn',
  },

  // ─── 国际物流 ───
  // 安可数
  ansu: {
    name: '安可数',
    code: 'ansu',
    domestic: false,
    basePrice: 25,
    weightTiers: [
      { min: 0, max: 100, price: 25 },
      { min: 100, max: 300, price: 35 },
      { min: 300, max: 500, price: 45 },
      { min: 500, max: 1000, price: 65 },
      { min: 1000, max: 2000, price: 95 },
      { min: 2000, max: 5000, price: 150 },
    ],
    deliveryTime: '7-15天',
    countries: ['US', 'UK', 'DE', 'FR', 'AU', 'CA', 'JP', 'KR', 'SG', 'MY'],
    tracking: true,
  },

  // 云途
  yuntu: {
    name: '云途',
    code: 'yuntu',
    domestic: false,
    basePrice: 22,
    weightTiers: [
      { min: 0, max: 100, price: 22 },
      { min: 100, max: 300, price: 32 },
      { min: 300, max: 500, price: 42 },
      { min: 500, max: 1000, price: 60 },
      { min: 1000, max: 2000, price: 88 },
      { min: 2000, max: 5000, price: 140 },
    ],
    deliveryTime: '8-18天',
    countries: ['US', 'UK', 'DE', 'FR', 'AU', 'CA', 'JP', 'KR'],
    tracking: true,
  },

  // 燕文
  yanwen: {
    name: '燕文',
    code: 'yanwen',
    domestic: false,
    basePrice: 20,
    weightTiers: [
      { min: 0, max: 100, price: 20 },
      { min: 100, max: 300, price: 28 },
      { min: 300, max: 500, price: 38 },
      { min: 500, max: 1000, price: 55 },
      { min: 1000, max: 2000, price: 80 },
      { min: 2000, max: 5000, price: 120 },
    ],
    deliveryTime: '10-20天',
    countries: ['US', 'UK', 'DE', 'FR', 'AU', 'CA', 'JP', 'KR', 'BR', 'MX'],
    tracking: true,
  },

  // 递四方
  disifang: {
    name: '递四方',
    code: 'disifang',
    domestic: false,
    basePrice: 23,
    weightTiers: [
      { min: 0, max: 100, price: 23 },
      { min: 100, max: 300, price: 33 },
      { min: 300, max: 500, price: 43 },
      { min: 500, max: 1000, price: 62 },
      { min: 1000, max: 2000, price: 90 },
      { min: 2000, max: 5000, price: 145 },
    ],
    deliveryTime: '7-15天',
    countries: ['US', 'UK', 'DE', 'FR', 'AU', 'CA', 'JP', 'KR', 'SG'],
    tracking: true,
  },

  // 国欧
  guoou: {
    name: '国欧',
    code: 'guoou',
    domestic: false,
    basePrice: 26,
    weightTiers: [
      { min: 0, max: 100, price: 26 },
      { min: 100, max: 300, price: 36 },
      { min: 300, max: 500, price: 48 },
      { min: 500, max: 1000, price: 68 },
      { min: 1000, max: 2000, price: 98 },
      { min: 2000, max: 5000, price: 155 },
    ],
    deliveryTime: '8-16天',
    countries: ['US', 'UK', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE'],
    tracking: true,
  },

  // UNI
  uni: {
    name: 'UNI',
    code: 'uni',
    domestic: false,
    basePrice: 24,
    weightTiers: [
      { min: 0, max: 100, price: 24 },
      { min: 100, max: 300, price: 34 },
      { min: 300, max: 500, price: 44 },
      { min: 500, max: 1000, price: 64 },
      { min: 1000, max: 2000, price: 92 },
      { min: 2000, max: 5000, price: 148 },
    ],
    deliveryTime: '7-14天',
    countries: ['US', 'UK', 'DE', 'FR', 'AU', 'CA', 'JP'],
    tracking: true,
  },
};

/** 计算物流费用 */
export function calculateShipping(weight, logisticsCode, destination) {
  const config = LOGISTICS_CONFIG[logisticsCode];
  if (!config) return null;

  // 国内物流：首重+续重
  if (config.domestic) {
    const kg = Math.max(0.1, weight / 1000); // 最小0.1kg
    if (kg <= 1) return config.basePrice;
    return config.basePrice + Math.ceil(kg - 1) * (config.perKg || 1);
  }

  // 国际物流：重量区间阶梯
  const tier = config.weightTiers.find(t => weight >= t.min && weight < t.max);
  if (!tier) {
    const maxTier = config.weightTiers[config.weightTiers.length - 1];
    const extraKg = Math.ceil((weight - maxTier.max) / 1000);
    return maxTier.price + extraKg * 30;
  }
  return tier.price;
}

// 按平台类型获取物流选项
export function getLogisticsOptions(domestic = false) {
  return Object.values(LOGISTICS_CONFIG)
    .filter(l => l.domestic === domestic)
    .map(l => ({
      code: l.code, name: l.name, basePrice: l.basePrice,
      deliveryTime: l.deliveryTime, domestic: l.domestic,
    }));
}
