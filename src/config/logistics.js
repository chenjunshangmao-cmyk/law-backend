// ==========================================
// 物流配置 - 6大物流渠道
// ==========================================

export const LOGISTICS_CONFIG = {
  // 安可数 - 主要物流
  ansu: {
    name: '安可数',
    code: 'ansu',
    basePrice: 25, // 起步价
    weightTiers: [
      { min: 0, max: 100, price: 25 },      // 0-100g: 25元
      { min: 100, max: 300, price: 35 },    // 100-300g: 35元
      { min: 300, max: 500, price: 45 },    // 300-500g: 45元
      { min: 500, max: 1000, price: 65 },   // 500-1000g: 65元
      { min: 1000, max: 2000, price: 95 },  // 1000-2000g: 95元
      { min: 2000, max: 5000, price: 150 }, // 2000-5000g: 150元
    ],
    deliveryTime: '7-15天',
    countries: ['US', 'UK', 'DE', 'FR', 'AU', 'CA', 'JP', 'KR', 'SG', 'MY'],
    tracking: true,
  },
  
  // 云途
  yuntu: {
    name: '云途',
    code: 'yuntu',
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

// 计算物流费用
export function calculateShipping(weight, logisticsCode = 'ansu', country = 'US') {
  const config = LOGISTICS_CONFIG[logisticsCode];
  if (!config) return null;
  
  // 找到对应的重量区间
  const tier = config.weightTiers.find(t => weight >= t.min && weight < t.max);
  if (!tier) {
    // 超过最大重量，按最大区间计算 + 续重
    const maxTier = config.weightTiers[config.weightTiers.length - 1];
    const extraWeight = weight - maxTier.max;
    const extraPrice = Math.ceil(extraWeight / 1000) * 30; // 续重30元/KG
    return maxTier.price + extraPrice;
  }
  
  return tier.price;
}

// 获取所有物流选项
export function getLogisticsOptions() {
  return Object.values(LOGISTICS_CONFIG).map(l => ({
    code: l.code,
    name: l.name,
    basePrice: l.basePrice,
    deliveryTime: l.deliveryTime,
  }));
}
