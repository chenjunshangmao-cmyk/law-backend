// ==========================================
// 利润计算器 API 路由 v2 — 区分国内/国外平台
// ==========================================

import express from 'express';
import { calculateShipping, LOGISTICS_CONFIG, getLogisticsOptions } from '../config/logistics.js';
import { PLATFORM_COMMISSION_CONFIG, calculateCommission } from '../config/platforms.js';

const router = express.Router();

// 计算利润
router.post('/calculate', async (req, res) => {
  try {
    const {
      costPrice,           // 商品成本（人民币）
      weight,              // 重量（克）
      logisticsProvider,   // 物流商代码
      destination,         // 目的地
      platforms,           // 销售平台数组
      additionalCosts,     // 其他成本（打包、贴标等）
      taxRate,             // 税率（含关税+增值税，仅国际）
      targetProfitRate,    // 目标利润率 %
    } = req.body;

    if (!costPrice || !weight || !logisticsProvider || !platforms || platforms.length === 0) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }

    const productCost = Number(costPrice);
    const weightG = Number(weight);
    const otherCosts = Number(additionalCosts || 0);
    const profitTarget = (targetProfitRate || 50) / 100;

    // 区分国内/国外平台
    const domesticPlatforms = platforms.filter(p => PLATFORM_COMMISSION_CONFIG[p]?.domestic);
    const internationalPlatforms = platforms.filter(p => !PLATFORM_COMMISSION_CONFIG[p]?.domestic);

    // 物流费
    const logisticsCfg = LOGISTICS_CONFIG[logisticsProvider];
    const shippingCost = calculateShipping(weightG, logisticsProvider, destination);

    const results = [];

    // ─── 计算国内平台 ───
    for (const platform of domesticPlatforms) {
      const cfg = PLATFORM_COMMISSION_CONFIG[platform];
      if (!cfg) continue;

      // 国内平台：只用国内物流，无国际运费，无关税
      const domesticShipping = logisticsCfg?.domestic ? shippingCost : 2.5; // 兜底菜鸟价
      const baseCost = productCost + domesticShipping + otherCosts;
      
      // 国内增值税 13% 或用户自定义
      const vatRate = (Number(taxRate) || 13) / 100;
      const vatCost = productCost * vatRate;  // 只对商品成本收增值税
      
      // 佣金
      const comm = calculateCommission(platform, weightG, 0);
      const suggestedPrice = calcPrice(baseCost + vatCost, comm.rate, cfg.fixedFee || 0, profitTarget);
      const commAmount = suggestedPrice * comm.rate + (cfg.fixedFee || 0);
      const totalCost = baseCost + vatCost + commAmount;
      const profit = suggestedPrice - totalCost;
      const profitRate = profit / suggestedPrice * 100;

      results.push({
        platform, platformName: cfg.name, domestic: true,
        currency: cfg.currency, exchangeRate: cfg.exchangeRate,
        suggestedPrice: round2(suggestedPrice),
        suggestedPriceLocal: round2(suggestedPrice * cfg.exchangeRate),
        costs: {
          product: productCost, shipping: round2(domesticShipping),
          tax: round2(vatCost), other: otherCosts,
          commission: round2(commAmount), commissionRate: comm.rate,
          fixedFee: cfg.fixedFee || 0,
          total: round2(totalCost),
        },
        profit: round2(profit),
        profitLocal: round2(profit * cfg.exchangeRate),
        profitRate: round2(profitRate),
      });
    }

    // ─── 计算国外平台 ───
    for (const platform of internationalPlatforms) {
      const cfg = PLATFORM_COMMISSION_CONFIG[platform];
      if (!cfg) continue;

      // 国际运费
      const intlShipping = logisticsCfg?.domestic ? 25 : (shippingCost || 25);
      // 关税≈ (成本+运费)×税率
      const customsRate = (Number(taxRate) || 13) / 100;
      const customsCost = (productCost + intlShipping) * customsRate;
      
      const baseCost = productCost + intlShipping + customsCost + otherCosts;
      const comm = calculateCommission(platform, weightG, 0);
      const suggestedPrice = calcPrice(baseCost, comm.rate, cfg.fixedFee || 0, profitTarget);
      const commAmount = suggestedPrice * comm.rate + (cfg.fixedFee || 0);
      const totalCost = baseCost + commAmount;
      const profit = suggestedPrice - totalCost;
      const profitRate = profit / suggestedPrice * 100;

      results.push({
        platform, platformName: cfg.name, domestic: false,
        currency: cfg.currency, exchangeRate: cfg.exchangeRate,
        suggestedPrice: round2(suggestedPrice),
        suggestedPriceLocal: round2(suggestedPrice * cfg.exchangeRate),
        costs: {
          product: productCost, shipping: round2(intlShipping),
          tax: round2(customsCost), other: otherCosts,
          commission: round2(commAmount), commissionRate: comm.rate,
          fixedFee: cfg.fixedFee || 0,
          total: round2(totalCost),
        },
        profit: round2(profit),
        profitLocal: round2(profit * cfg.exchangeRate),
        profitRate: round2(profitRate),
      });
    }

    const summary = {
      baseCosts: {
        product: productCost,
        shipping: logisticsCfg?.domestic ? (shippingCost || 0) : (shippingCost || 25),
        tax: results[0]?.costs.tax || 0,
        other: otherCosts,
        total: round2(productCost + (logisticsCfg?.domestic ? (shippingCost || 0) : (shippingCost || 25)) + (results[0]?.costs.tax || 0) + otherCosts),
      },
      logisticsInfo: {
        provider: logisticsCfg?.name || logisticsProvider,
        domestic: !!logisticsCfg?.domestic,
        weight: weightG,
      },
      domesticCount: domesticPlatforms.length,
      internationalCount: internationalPlatforms.length,
    };

    res.json({ success: true, data: { summary, results } });
  } catch (error) {
    console.error('利润计算错误:', error);
    res.status(500).json({ success: false, error: '计算失败: ' + error.message });
  }
});

// 获取物流选项 — 按国内/国外过滤
router.get('/logistics', (req, res) => {
  const { domestic } = req.query;
  const filterDomestic = domestic === 'true' ? true : domestic === 'false' ? false : undefined;
  const options = Object.values(LOGISTICS_CONFIG)
    .filter(l => filterDomestic === undefined || l.domestic === filterDomestic)
    .map(l => ({
      code: l.code, name: l.name, basePrice: l.basePrice,
      deliveryTime: l.deliveryTime, domestic: !!l.domestic,
    }));
  res.json({ success: true, data: { logistics: options } });
});

// 获取平台选项
router.get('/platforms', (req, res) => {
  const options = Object.entries(PLATFORM_COMMISSION_CONFIG).map(([key, cfg]) => ({
    key, name: cfg.name, domestic: !!cfg.domestic,
    currency: cfg.currency, exchangeRate: cfg.exchangeRate,
  }));
  res.json({ success: true, data: { platforms: options } });
});

// 售价逆推公式: 售价 = (基础成本 + 固定费) / (1 - 佣金率 - 目标利润率)
function calcPrice(baseCost, commissionRate, fixedFee, targetProfitRate) {
  const denom = 1 - commissionRate - targetProfitRate;
  if (denom <= 0.01) return baseCost * 2; // 保底
  return (baseCost + fixedFee) / denom;
}

function round2(n) { return Math.round(n * 100) / 100; }

export default router;
