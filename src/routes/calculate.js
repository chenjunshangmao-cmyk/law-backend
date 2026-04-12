// 利润计算路由
import express from 'express';

const router = express.Router();

// 平台汇率和费率配置
const PLATFORM_CONFIG = {
  tiktok: {
    name: 'TikTok Shop',
    exchangeRate: 5.2,      // 人民币兑美元
    platformFee: 0.08,      // 8%平台费
    paymentFee: 0.02,       // 2%支付费
    shippingFee: 15,        // 固定运费(元)
    customsFee: 0.05        // 5%海关税
  },
  shopee: {
    name: 'Shopee',
    exchangeRate: 5.2,
    platformFee: 0.06,      // 6%平台费
    paymentFee: 0.02,       // 2%支付费
    shippingFee: 10,        // 固定运费(元)
    customsFee: 0            // 无
  },
  ozon: {
    name: 'OZON',
    exchangeRate: 8.5,       // 人民币兑卢布
    platformFee: 0.10,      // 10%平台费
    paymentFee: 0.03,       // 3%支付费
    shippingFee: 20,        // 固定运费(元)
    customsFee: 0.15        // 15%海关税
  },
  amazon: {
    name: 'Amazon',
    exchangeRate: 7.2,       // 人民币兑美元
    platformFee: 0.15,      // 15%Referral Fee
    paymentFee: 0.01,       // 1%结算费
    shippingFee: 25,        // 固定运费(元)
    customsFee: 0            // 无
  }
};

// POST /api/calculate/profit - 计算多平台利润（公开接口，无需认证）
router.post('/profit', (req, res) => {
  try {
    const { cost, platforms, targetMargin } = req.body;

    // 验证必填字段
    if (!cost || cost <= 0) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的成本价格'
      });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请至少选择一个平台'
      });
    }

    const costCNY = parseFloat(cost);
    const margin = targetMargin ? parseFloat(targetMargin) / 100 : null;
    const results = {};

    // 计算每个平台的利润
    for (const platform of platforms) {
      const config = PLATFORM_CONFIG[platform];
      if (!config) {
        results[platform] = {
          error: '不支持的平台'
        };
        continue;
      }

      // 计算定价
      const calculation = calculatePlatformProfit(costCNY, config, margin);
      results[platform] = {
        platform: config.name,
        config: {
          platformFee: `${config.platformFee * 100}%`,
          paymentFee: `${config.paymentFee * 100}%`,
          shippingFee: `${config.shippingFee} CNY`,
          customsFee: config.customsFee > 0 ? `${config.customsFee * 100}%` : '无'
        },
        ...calculation
      };
    }

    res.json({
      success: true,
      data: {
        costCNY,
        targetMargin: targetMargin ? `${targetMargin}%` : null,
        platforms: results
      }
    });
  } catch (error) {
    console.error('利润计算错误:', error);
    res.status(500).json({
      success: false,
      error: '利润计算失败'
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

    // 反推定价：(成本 + 利润) / (1 - 费率比例)
    const feeRate = config.platformFee + config.paymentFee + config.customsFee;
    const priceBeforeShipping = (costCNY + targetProfitCNY) / (1 - feeRate);
    const finalPriceCNY = priceBeforeShipping + config.shippingFee;
    const finalPriceLocal = finalPriceCNY / config.exchangeRate;

    // 计算实际利润率
    const totalCost = costCNY + config.shippingFee;
    const actualProfit = (finalPriceCNY - totalCost) * (1 - feeRate);
    const actualMargin = (actualProfit / finalPriceCNY) * 100;

    res.json({
      success: true,
      data: {
        platform: config.name,
        input: {
          costCNY,
          targetProfitCNY
        },
        result: {
          priceCNY: Math.round(finalPriceCNY * 100) / 100,
          priceLocal: Math.round(finalPriceLocal * 100) / 100,
          currency: platform === 'ozon' ? '₽' : '$',
          actualMargin: Math.round(actualMargin * 100) / 100 + '%',
          actualProfitCNY: Math.round(actualProfit * 100) / 100
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

// 获取支持的平台列表
router.get('/platforms', (req, res) => {
  const platforms = Object.entries(PLATFORM_CONFIG).map(([key, config]) => ({
    id: key,
    name: config.name,
    exchangeRate: config.exchangeRate,
    platformFee: `${config.platformFee * 100}%`,
    features: {
      shippingFee: `${config.shippingFee} CNY`,
      customsFee: config.customsFee > 0 ? `${config.customsFee * 100}%` : '无'
    }
  }));

  res.json({
    success: true,
    data: { platforms }
  });
});

// 计算平台利润
function calculatePlatformProfit(costCNY, config, targetMargin) {
  // 基础定价公式：(拿货价+运费) ÷ 汇率系数 × 加价系数
  const shippingFee = config.shippingFee;
  const totalCostCNY = costCNY + shippingFee;
  
  // 如果指定了目标利润率，使用目标利润率
  if (targetMargin !== null) {
    const feeRate = config.platformFee + config.paymentFee + config.customsFee;
    const priceBeforeFees = totalCostCNY / (1 - targetMargin - feeRate);
    const priceCNY = priceBeforeFees;
    const priceLocal = priceCNY / config.exchangeRate;
    
    // 计算各项费用
    const platformFeeAmount = priceCNY * config.platformFee;
    const paymentFeeAmount = priceCNY * config.paymentFee;
    const customsFeeAmount = priceCNY * config.customsFee;
    const totalFees = platformFeeAmount + paymentFeeAmount + customsFeeAmount;
    
    // 实际利润
    const profitCNY = priceCNY - totalCostCNY - totalFees;
    const profitLocal = profitCNY / config.exchangeRate;
    const actualMargin = (profitCNY / priceCNY) * 100;
    
    return {
      priceCNY: Math.round(priceCNY * 100) / 100,
      priceLocal: Math.round(priceLocal * 100) / 100,
      currency: config.name === 'OZON' ? '₽' : '$',
      costBreakdown: {
        productCost: costCNY,
        shippingFee,
        totalCost: totalCostCNY
      },
      fees: {
        platformFee: Math.round(platformFeeAmount * 100) / 100,
        paymentFee: Math.round(paymentFeeAmount * 100) / 100,
        customsFee: Math.round(customsFeeAmount * 100) / 100,
        totalFees: Math.round(totalFees * 100) / 100
      },
      profit: {
        cny: Math.round(profitCNY * 100) / 100,
        local: Math.round(profitLocal * 100) / 100
      },
      margin: Math.round(actualMargin * 100) / 100 + '%',
      targetMargin: targetMargin ? `${targetMargin * 100}%` : null
    };
  }
  
  // 默认定价：使用标准公式
  // 定价 = (成本 + 运费) / 汇率 / (1 - 费率) * 加价系数
  const feeRate = config.platformFee + config.paymentFee + config.customsFee;
  const rateFactor = 1 / config.exchangeRate;
  
  // 默认2.5倍加价
  const markupFactor = 2.5;
  const priceBeforeFees = totalCostCNY * rateFactor * markupFactor;
  const priceCNY = priceBeforeFees / (1 - feeRate);
  const priceLocal = priceCNY / config.exchangeRate;
  
  // 计算各项费用
  const platformFeeAmount = priceCNY * config.platformFee;
  const paymentFeeAmount = priceCNY * config.paymentFee;
  const customsFeeAmount = priceCNY * config.customsFee;
  const totalFees = platformFeeAmount + paymentFeeAmount + customsFeeAmount;
  
  // 实际利润
  const profitCNY = priceCNY - totalCostCNY - totalFees;
  const profitLocal = profitCNY / config.exchangeRate;
  const actualMargin = (profitCNY / priceCNY) * 100;
  
  return {
    priceCNY: Math.round(priceCNY * 100) / 100,
    priceLocal: Math.round(priceLocal * 100) / 100,
    currency: config.name === 'OZON' ? '₽' : '$',
    costBreakdown: {
      productCost: costCNY,
      shippingFee,
      totalCost: totalCostCNY
    },
    fees: {
      platformFee: Math.round(platformFeeAmount * 100) / 100,
      paymentFee: Math.round(paymentFeeAmount * 100) / 100,
      customsFee: Math.round(customsFeeAmount * 100) / 100,
      totalFees: Math.round(totalFees * 100) / 100
    },
    profit: {
      cny: Math.round(profitCNY * 100) / 100,
      local: Math.round(profitLocal * 100) / 100
    },
    margin: Math.round(actualMargin * 100) / 100 + '%',
    markup: '2.5x (默认)'
  };
}

export default router;
