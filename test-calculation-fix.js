// 修复后的利润计算逻辑测试
const calculatePlatformProfit = (costCNY, config, targetMargin) => {
  const shippingFee = config.shippingFee;
  const totalCostCNY = costCNY + shippingFee;
  
  const markupFactor = 2.5;
  
  let actualMarkupFactor = markupFactor;
  if (targetMargin !== null) {
    const feeRate = config.platformFee + config.paymentFee + config.customsFee;
    actualMarkupFactor = 1 / (1 - targetMargin - feeRate);
  }
  
  const priceCNY = totalCostCNY * actualMarkupFactor;
  const priceLocal = priceCNY / config.exchangeRate;
  
  const platformFeeAmount = priceCNY * config.platformFee;
  const paymentFeeAmount = priceCNY * config.paymentFee;
  const customsFeeAmount = priceCNY * config.customsFee;
  const totalFees = platformFeeAmount + paymentFeeAmount + customsFeeAmount;
  
  const revenueCNY = priceCNY;
  const actualProfitCNY = revenueCNY - totalCostCNY - totalFees;
  const actualProfitLocal = actualProfitCNY / config.exchangeRate;
  
  const actualMargin = (actualProfitCNY / revenueCNY) * 100;
  const grossProfitCNY = revenueCNY - totalCostCNY;
  const grossMargin = (grossProfitCNY / revenueCNY) * 100;
  
  const netProfitCNY = actualProfitCNY;
  const netMargin = actualMargin;
  
  const finalPriceCNY = Math.floor(priceCNY) + 0.90;
  const finalPriceLocal = Math.floor(priceLocal) + 0.90;
  
  return {
    priceCNY: Math.round(finalPriceCNY * 100) / 100,
    priceLocal: Math.round(finalPriceLocal * 100) / 100,
    actualMargin: Math.round(actualMargin * 100) / 100 + '%',
    markupFactor: Math.round(actualMarkupFactor * 100) / 100,
    formula: '(拿货价 + 运费) ÷ 汇率 × 加价系数',
    costBreakdown: {
      productCost: costCNY,
      shippingFee,
      totalCost: totalCostCNY
    }
  };
};

// TikTok平台配置
const tiktokConfig = {
  name: 'TikTok Shop',
  exchangeRate: 5.2,
  platformFee: 0.08,
  paymentFee: 0.02,
  shippingFee: 15,
  customsFee: 0.05
};

// 测试示例1：拿货价15元，运费15元
console.log('=== 测试案例1：TikTok平台，拿货价15元 ===');
console.log('公式: (15 + 15) ÷ 5.2 × 2.5');
console.log('理论计算结果: (30 ÷ 5.2 × 2.5) = 约$14.42');

const result1 = calculatePlatformProfit(15, tiktokConfig, null);
console.log('API计算结果:', result1);
console.log('售价(人民币):', result1.priceCNY, '元');
console.log('售价(美元):', result1.priceLocal, '美元');
console.log('加价系数:', result1.markupFactor);
console.log('利润率:', result1.actualMargin);
console.log('成本明细:', result1.costBreakdown);

console.log('\n=== 测试案例2：不同拿货价对比 ===');
const testCases = [
  { cost: 10, name: '10元童装' },
  { cost: 15, name: '15元童装' },
  { cost: 20, name: '20元童装' },
  { cost: 25, name: '25元童装' },
  { cost: 30, name: '30元童装' }
];

testCases.forEach(test => {
  const result = calculatePlatformProfit(test.cost, tiktokConfig, null);
  console.log(`${test.name}:`);
  console.log(`  拿货价: ${test.cost}元`);
  console.log(`  售价(人民币): ${result.priceCNY}元`);
  console.log(`  售价(美元): ${result.priceLocal}美元`);
  console.log(`  利润率: ${result.actualMargin}`);
  console.log(`  成本合计: ${result.costBreakdown.totalCost}元`);
});

console.log('\n=== 测试案例3：目标利润率50% ===');
const result2 = calculatePlatformProfit(15, tiktokConfig, 0.5); // 50%利润率
console.log('结果:', result2);

console.log('\n=== 快速定价测试 ===');
const calculateQuickPrice = (cost, targetProfit, config) => {
  const feeRate = config.platformFee + config.paymentFee + config.customsFee;
  const totalCostCNY = cost + config.shippingFee;
  
  const finalPriceCNY = (targetProfit + totalCostCNY) / (1 - feeRate);
  const roundedPriceCNY = Math.floor(finalPriceCNY) + 0.90;
  
  const platformFeeAmount = roundedPriceCNY * config.platformFee;
  const paymentFeeAmount = roundedPriceCNY * config.paymentFee;
  const customsFeeAmount = roundedPriceCNY * config.customsFee;
  const totalFees = platformFeeAmount + paymentFeeAmount + customsFeeAmount;
  
  const actualProfit = roundedPriceCNY - totalCostCNY - totalFees;
  const actualMargin = (actualProfit / roundedPriceCNY) * 100;
  
  return {
    cost,
    targetProfit,
    priceCNY: Math.round(roundedPriceCNY * 100) / 100,
    priceLocal: Math.round(roundedPriceCNY / config.exchangeRate * 100) / 100,
    actualProfit: Math.round(actualProfit * 100) / 100,
    actualMargin: Math.round(actualMargin * 100) / 100 + '%',
    profitDifference: Math.round((actualProfit - targetProfit) * 100) / 100
  };
};

console.log('快速定价: 成本15元，目标利润20元');
const quickResult = calculateQuickPrice(15, 20, tiktokConfig);
console.log(quickResult);