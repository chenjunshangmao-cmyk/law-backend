// ==========================================
// 利润计算器 API 路由
// ==========================================

import express from 'express';
import { calculateShipping, LOGISTICS_CONFIG } from '../config/logistics.js';
import { calculateCommission, PLATFORM_COMMISSION_CONFIG } from '../config/platforms.js';

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
      additionalCosts,     // 其他成本
      taxRate,             // 税率
      targetProfitRate,    // 目标利润率
    } = req.body;

    // 参数验证
    if (!costPrice || !weight || !logisticsProvider || !platforms || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: '缺少必要参数：costPrice, weight, logisticsProvider, platforms'
      });
    }

    // 1. 计算物流费用
    const shippingCost = calculateShipping(weight, logisticsProvider, destination);
    if (shippingCost === null) {
      return res.status(400).json({
        success: false,
        error: '无效的物流商代码'
      });
    }

    // 2. 计算税费
    const taxCost = (costPrice + shippingCost) * (taxRate || 13) / 100;

    // 3. 其他成本
    const otherCosts = additionalCosts || 0;

    // 4. 计算各平台的建议售价和利润
    const platformResults = platforms.map(platform => {
      const platformConfig = PLATFORM_COMMISSION_CONFIG[platform];
      if (!platformConfig) return null;

      // 计算佣金
      const commission = calculateCommission(platform, weight, 0);
      
      // 计算总成本（不含售价相关费用）
      const baseCost = costPrice + shippingCost + taxCost + otherCosts;
      
      // 根据目标利润率计算建议售价
      const targetRate = targetProfitRate || 30; // 默认30%利润率
      const suggestedPrice = calculateSuggestedPrice(
        baseCost,
        commission.rate,
        targetRate / 100,
        platformConfig.fixedFee
      );

      // 计算实际利润
      const commissionAmount = suggestedPrice * commission.rate + platformConfig.fixedFee;
      const totalCost = baseCost + commissionAmount;
      const profit = suggestedPrice - totalCost;
      const profitRate = (profit / suggestedPrice) * 100;

      return {
        platform,
        platformName: platformConfig.name,
        currency: platformConfig.currency,
        exchangeRate: platformConfig.exchangeRate,
        suggestedPrice: Math.round(suggestedPrice * 100) / 100,
        suggestedPriceLocal: Math.round(suggestedPrice * platformConfig.exchangeRate * 100) / 100,
        costs: {
          product: costPrice,
          shipping: shippingCost,
          tax: Math.round(taxCost * 100) / 100,
          other: otherCosts,
          commission: Math.round(commissionAmount * 100) / 100,
          commissionRate: commission.rate,
          fixedFee: platformConfig.fixedFee,
          total: Math.round(totalCost * 100) / 100,
        },
        profit: Math.round(profit * 100) / 100,
        profitLocal: Math.round(profit * platformConfig.exchangeRate * 100) / 100,
        profitRate: Math.round(profitRate * 100) / 100,
      };
    }).filter(Boolean);

    // 汇总信息
    const summary = {
      baseCosts: {
        product: costPrice,
        shipping: shippingCost,
        tax: Math.round(taxCost * 100) / 100,
        other: otherCosts,
        total: Math.round((costPrice + shippingCost + taxCost + otherCosts) * 100) / 100,
      },
      logisticsInfo: {
        provider: LOGISTICS_CONFIG[logisticsProvider]?.name || logisticsProvider,
        weight: weight,
        destination: destination || 'US',
      },
    };

    res.json({
      success: true,
      data: {
        summary,
        platforms: platformResults,
      }
    });

  } catch (error) {
    console.error('利润计算错误:', error);
    res.status(500).json({
      success: false,
      error: '计算失败: ' + error.message
    });
  }
});

// 获取物流选项
router.get('/logistics', (req, res) => {
  const options = Object.values(LOGISTICS_CONFIG).map(l => ({
    code: l.code,
    name: l.name,
    basePrice: l.basePrice,
    deliveryTime: l.deliveryTime,
    countries: l.countries,
  }));

  res.json({
    success: true,
    data: options
  });
});

// 获取平台选项
router.get('/platforms', (req, res) => {
  const options = Object.entries(PLATFORM_COMMISSION_CONFIG).map(([key, config]) => ({
    key,
    name: config.name,
    currency: config.currency,
    commissionTiers: config.commissionTiers,
  }));

  res.json({
    success: true,
    data: options
  });
});

// 计算建议售价的辅助函数
function calculateSuggestedPrice(baseCost, commissionRate, targetProfitRate, fixedFee) {
  // 公式: 售价 = (基础成本 + 固定费用) / (1 - 佣金率 - 目标利润率)
  const denominator = 1 - commissionRate - targetProfitRate;
  
  if (denominator <= 0) {
    // 如果分母太小，返回一个保底价格（成本×2）
    return baseCost * 2;
  }
  
  return (baseCost + fixedFee) / denominator;
}

export default router;
