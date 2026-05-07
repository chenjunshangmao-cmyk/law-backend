// 利润计算路由
import express from 'express';
import { calculateShipping, LOGISTICS_CONFIG } from '../config/logistics.js';
import { calculateCommission, PLATFORM_COMMISSION_CONFIG } from '../config/platforms.js';

const router = express.Router();

// POST /api/calculate/profit - 计算多平台利润（新版：支持物流和佣金配置）
router.post('/profit', (req, res) => {
  try {
    const {
      costPrice,
      weight,
      logisticsProvider,
      destination,
      platforms,
      additionalCosts,
      taxRate,
      targetProfitRate
    } = req.body;

    // 验证必填字段
    if (!costPrice || costPrice <= 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的成本价格'
      });
    }

    if (!weight || weight <= 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的商品重量'
      });
    }

    if (!logisticsProvider) {
      return res.status(400).json({
        success: false,
        error: '请选择物流渠道'
      });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请至少选择一个平台'
      });
    }

    // 1. 计算物流费用
    const shippingCost = calculateShipping(parseFloat(weight), logisticsProvider, destination);
    if (shippingCost === null) {
      return res.status(400).json({
        success: false,
        error: '无效的物流渠道'
      });
    }

    // 2. 计算税费
    const taxCost = (parseFloat(costPrice) + shippingCost) * (taxRate || 13) / 100;

    // 3. 其他成本
    const otherCosts = parseFloat(additionalCosts) || 0;

    // 4. 基础成本
    const baseCost = parseFloat(costPrice) + shippingCost + taxCost + otherCosts;

    // 5. 计算各平台的建议售价和利润
    const platformResults = platforms.map(platform => {
      const platformConfig = PLATFORM_COMMISSION_CONFIG[platform];
      if (!platformConfig) return null;

      // 计算佣金
      const commission = calculateCommission(platform, parseFloat(weight), 0);

      // 根据目标利润率计算建议售价
      const targetRate = targetProfitRate ? parseFloat(targetProfitRate) / 100 : 0.30;
      const suggestedPrice = calculateSuggestedPrice(
        baseCost,
        commission.rate,
        targetRate,
        platformConfig.fixedFee
      );

      // 计算实际利润
      const commissionAmount = suggestedPrice * commission.rate + platformConfig.fixedFee;
      const totalCost = baseCost + commissionAmount;
      const profit = suggestedPrice - totalCost;
      const profitRate = (profit / suggestedPrice) * 100;

      // 转换为当地货币
      const priceLocal = suggestedPrice * platformConfig.exchangeRate;
      const profitLocal = profit * platformConfig.exchangeRate;

      return {
        platform,
        platformName: platformConfig.name,
        currency: platformConfig.currency,
        exchangeRate: platformConfig.exchangeRate,
        suggestedPrice: Math.round(suggestedPrice * 100) / 100,
        suggestedPriceLocal: Math.round(priceLocal * 100) / 100,
        costs: {
          product: parseFloat(costPrice),
          shipping: shippingCost,
          tax: Math.round(taxCost * 100) / 100,
          other: otherCosts,
          commission: Math.round(commissionAmount * 100) / 100,
          commissionRate: commission.rate,
          fixedFee: platformConfig.fixedFee,
          total: Math.round(totalCost * 100) / 100,
        },
        profit: Math.round(profit * 100) / 100,
        profitLocal: Math.round(profitLocal * 100) / 100,
        profitRate: Math.round(profitRate * 100) / 100,
      };
    }).filter(Boolean);

    // 汇总信息
    const summary = {
      baseCosts: {
        product: parseFloat(costPrice),
        shipping: shippingCost,
        tax: Math.round(taxCost * 100) / 100,
        other: otherCosts,
        total: Math.round(baseCost * 100) / 100,
      },
      logisticsInfo: {
        provider: LOGISTICS_CONFIG[logisticsProvider]?.name || logisticsProvider,
        weight: parseFloat(weight),
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
      error: '利润计算失败: ' + error.message
    });
  }
});

// POST /api/calculate/quick - 快速定价（公开接口）
router.post('/quick', (req, res) => {
  try {
    const { cost, platform, targetProfit } = req.body;

    if (!cost || cost <= 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的成本价格'
      });
    }

    if (!platform || !PLATFORM_CONFIG[platform]) {
      return res.status(400).json({
        success: false,
        error: '请选择有效的平台'
      });
    }

    if (!targetProfit || targetProfit <= 0) {
      return res.status(400).json({
        success: false,
        error: '请提供目标利润金额'
      });
    }

    const config = PLATFORM_CONFIG[platform];
    const costCNY = parseFloat(cost);
    const targetProfitCNY = parseFloat(targetProfit);

    // 使用正确的定价公式反推定价
    // 公式：售价 = (成本 + 运费) × 加价系数
    // 目标利润 = 售价 - (成本 + 运费) - 平台费用
    // 平台费用 = 售价 × (平台费率 + 支付费率 + 关税费率)
    // 设售价 = P，费用率 = F = platformFee + paymentFee + customsFee
    // 利润 = P - (成本+运费) - P×F = P×(1-F) - (成本+运费)
    // 所以：P = (利润 + 成本 + 运费) ÷ (1 - F)
    
    const feeRate = config.platformFee + config.paymentFee + config.customsFee;
    const totalCostCNY = costCNY + config.shippingFee;
    
    // 计算售价
    const finalPriceCNY = (targetProfitCNY + totalCostCNY) / (1 - feeRate);
    
    // 取整到X.90
    const roundedPriceCNY = Math.floor(finalPriceCNY) + 0.90;
    const finalPriceLocal = roundedPriceCNY / config.exchangeRate;

    // 计算实际各项费用
    const platformFeeAmount = roundedPriceCNY * config.platformFee;
    const paymentFeeAmount = roundedPriceCNY * config.paymentFee;
    const customsFeeAmount = roundedPriceCNY * config.customsFee;
    const totalFees = platformFeeAmount + paymentFeeAmount + customsFeeAmount;

    // 计算实际利润率
    const actualProfit = roundedPriceCNY - totalCostCNY - totalFees;
    const actualMargin = (actualProfit / roundedPriceCNY) * 100;

    res.json({
      success: true,
      data: {
        platform: config.name,
        input: {
          costCNY,
          targetProfitCNY
        },
        result: {
          // 定价结果
          priceCNY: Math.round(roundedPriceCNY * 100) / 100,
          priceLocal: Math.round(finalPriceLocal * 100) / 100,
          currency: platform === 'ozon' ? '₽' : '$',
          
          // 费用明细
          fees: {
            platformFee: Math.round(platformFeeAmount * 100) / 100,
            paymentFee: Math.round(paymentFeeAmount * 100) / 100,
            customsFee: Math.round(customsFeeAmount * 100) / 100,
            totalFees: Math.round(totalFees * 100) / 100
          },
          
          // 利润结果
          profit: {
            actualProfitCNY: Math.round(actualProfit * 100) / 100,
            actualMargin: Math.round(actualMargin * 100) / 100 + '%',
            targetProfit: targetProfitCNY,
            profitDifference: Math.round((actualProfit - targetProfitCNY) * 100) / 100
          },
          
          // 公式信息
          formula: {
            text: '售价 = (目标利润 + 成本 + 运费) ÷ (1 - 平台费率 - 支付费率 - 关税费率)',
            feeRate: `${(feeRate * 100).toFixed(1)}%`
          }
        }
      }
    });
  } catch (error) {
    console.error('快速定价错误:', error);
    res.status(500).json({
      success: false,
      error: '定价计算失败'
    });
  }
});

// 获取支持的平台列表（新版：包含佣金档位）
router.get('/platforms', (req, res) => {
  const platforms = Object.entries(PLATFORM_COMMISSION_CONFIG).map(([key, config]) => ({
    key,                          // ★ 前端 togglePlatform 用 key 判断选中
    id: key,
    name: config.name,
    domestic: !!config.domestic,  // ★ 国内/跨境区分
    currency: config.currency,
    exchangeRate: config.exchangeRate,
    commissionTiers: config.commissionTiers,
    fixedFee: config.fixedFee,
  }));

  res.json({
    success: true,
    data: { platforms }
  });
});

// 获取物流渠道列表
router.get('/logistics', (req, res) => {
  const logistics = Object.values(LOGISTICS_CONFIG).map(l => ({
    code: l.code,
    name: l.name,
    basePrice: l.basePrice,
    deliveryTime: l.deliveryTime,
    countries: l.countries,
  }));

  res.json({
    success: true,
    data: { logistics }
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
