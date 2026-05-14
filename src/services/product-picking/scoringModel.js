/**
 * 全网爆款选品系统 - 20维评分模型
 * 
 * 每个维度 0-100 分，加权综合得出爆款概率（0-100%）
 * 支持自定义权重（旗舰会员可调权重）
 */

// ========== 20个评估维度定义 ==========
const DIMENSIONS = [
  {
    id: 'demand_trend',
    name: '需求趋势',
    description: '搜索量、话题讨论量的近期增长趋势',
    weight: 10,
    dataSources: ['Google Trends', 'TikTok话题热度', '社交媒体讨论量']
  },
  {
    id: 'engagement_rate',
    name: '互动率',
    description: '点赞/评论/分享/收藏与播放量的比例',
    weight: 8,
    dataSources: ['TikTok视频互动数据', '社媒帖文互动率']
  },
  {
    id: 'sales_momentum',
    name: '销量动能',
    description: '近期销量增长速度和持续性',
    weight: 8,
    dataSources: ['电商平台销量趋势', '1688采购指数']
  },
  {
    id: 'competition_level',
    name: '竞争程度',
    description: '同类商品卖家数量、广告竞争强度（越低分越高）',
    weight: 8,
    dataSources: ['平台同类商品数量', '广告竞价水平']
  },
  {
    id: 'profit_margin',
    name: '利润空间',
    description: '国内批发价与海外售价的价差比例',
    weight: 7,
    dataSources: ['1688批发价', 'TikTok/Shopee/OZON售价']
  },
  {
    id: 'content_power',
    name: '内容传播力',
    description: '该品类适合制作短视频/直播展示的程度',
    weight: 7,
    dataSources: ['同类视频平均播放量', '直播带货转化数据']
  },
  {
    id: 'seasonal_timing',
    name: '季节性时机',
    description: '当前是否处于该品类的需求旺季/爆发前夕',
    weight: 6,
    dataSources: ['Google Trends季节性曲线', '电商平台节庆活动']
  },
  {
    id: 'repeat_purchase',
    name: '复购潜力',
    description: '是否为消耗品、配件、快消品等易复购品类',
    weight: 5,
    dataSources: ['品类属性分析', '用户评论复购提及率']
  },
  {
    id: 'review_sentiment',
    name: '评论情感',
    description: '用户评论的正面/负面情感比例及关键词',
    weight: 5,
    dataSources: ['平台评论情感分析', '退货率数据']
  },
  {
    id: 'price_positioning',
    name: '价格带定位',
    description: '定价是否处于目标市场最易成交的价格区间',
    weight: 5,
    dataSources: ['平台价格带成交分布', '竞品价格分析']
  },
  {
    id: 'target_audience',
    name: '人群匹配度',
    description: '是否匹配高消费力/高转化率的目标人群',
    weight: 5,
    dataSources: ['人群画像分析', '广告投放受众数据']
  },
  {
    id: 'logistics_feasibility',
    name: '物流可行性',
    description: '发货难度、物流成本、退换货风险',
    weight: 5,
    dataSources: ['物流报价', '退换货率数据']
  },
  {
    id: 'supply_stability',
    name: '供应链稳定性',
    description: '货源是否充足、供应商是否可靠',
    weight: 4,
    dataSources: ['1688供应商评分', '库存情况']
  },
  {
    id: 'brand_risk',
    name: '品牌/版权风险',
    description: '是否存在品牌侵权、专利/设计风险（越低分越好）',
    weight: 4,
    dataSources: ['品牌信息核查', '知识产权数据库']
  },
  {
    id: 'platform_support',
    name: '平台扶持力度',
    description: '平台是否对该品类有流量扶持、补贴政策',
    weight: 4,
    dataSources: ['平台政策公告', '行业资讯']
  },
  {
    id: 'cross_market',
    name: '跨市场拓展性',
    description: '该品在多个国家/市场的适用性',
    weight: 3,
    dataSources: ['多平台数据对比', '不同市场消费者调研']
  },
  {
    id: 'advertising_roi',
    name: '广告投放ROI预估',
    description: '预估的广告投入产出比',
    weight: 3,
    dataSources: ['同类品广告数据', 'CPC/CPA分析']
  },
  {
    id: 'differentiation',
    name: '差异化空间',
    description: '能否通过包装/设计/功能做出差异化',
    weight: 2,
    dataSources: ['竞品功能分析', '创新空间评估']
  },
  {
    id: 'creator_interest',
    name: '创作者/网红关注度',
    description: '是否被KOL/KOC自发推广',
    weight: 1,
    dataSources: ['社媒内容监测', '网红合作数据']
  },
  {
    id: 'entry_barrier',
    name: '入行门槛',
    description: '资金、资质、技术门槛（越低分越高，越容易入行）',
    weight: 1,
    dataSources: ['行业准入分析', '资金需求评估']
  }
];

/**
 * 计算爆款概率
 * @param {Object} scores - 各维度评分 { dimensionId: score(0-100) }
 * @param {Object} userPlan - 用户套餐（旗舰可调权重）
 * @returns {Object} 评估结果
 */
function calculateProductScore(scores, userPlan = 'free') {
  // 获取权重（旗舰会员可自定义，这里先统一）
  const weights = {};
  DIMENSIONS.forEach(d => { weights[d.id] = d.weight; });

  let totalScore = 0;
  let totalWeight = 0;
  const details = [];

  DIMENSIONS.forEach(dim => {
    const score = scores[dim.id] || 0;
    const weight = weights[dim.id] || dim.weight;
    const weighted = score * (weight / 100);
    totalScore += weighted;
    totalWeight += weight / 100;

    details.push({
      dimension: dim.name,
      description: dim.description,
      score: Math.round(score),
      weight: weight,
      weighted: Math.round(weighted * 10) / 10,
      // 评级
      rating: score >= 80 ? '优秀' : score >= 60 ? '良好' : score >= 40 ? '一般' : score >= 20 ? '较差' : '差',
      // 优势/劣势标记
      flag: score >= 70 ? '优势' : score <= 30 ? '劣势' : '中性',
      suggestion: getSuggestion(dim.id, score)
    });
  });

  const finalScore = Math.round(Math.min(100, Math.max(0, totalScore / totalWeight)));

  return {
    productName: scores._productName || '',
    platform: scores._platform || '通用',
    category: scores._category || '',
    burstProbability: finalScore,
    riskLevel: finalScore >= 70 ? '低风险' : finalScore >= 50 ? '中等风险' : '高风险',
    recommendation: getRecommendation(finalScore),
    dimensionCount: DIMENSIONS.length,
    detailedAnalysis: details,
    // 优势维度（前5）
    strengths: details.filter(d => d.flag === '优势').slice(0, 5).map(d => d.dimension),
    // 劣势维度（前5）
    weaknesses: details.filter(d => d.flag === '劣势').slice(0, 5).map(d => d.dimension),
    summary: generateSummary(scores._productName || '该产品', finalScore, details),
    evaluatedAt: new Date().toISOString()
  };
}

function getSuggestion(dimId, score) {
  const suggestions = {
    demand_trend: { low: '建议通过社交媒体话题营销拉动搜索热度', medium: '保持当前热度趋势，加大投放', high: '趋势良好，可加快上架节奏' },
    engagement_rate: { low: '优化产品展示方式，增加视频/直播内容', medium: '互动率中等，可尝试UGC内容策略', high: '内容转化潜力大，建议加大内容投入' },
    sales_momentum: { low: '市场教育阶段，需耐心培育', medium: '销量在上升，建议把握窗口期', high: '快速放量期，建议抢占先机' },
    competition_level: { low: '竞争激烈，需寻找细分差异点', medium: '竞争适中，可差异化切入', high: '竞争对手少，先发优势明显' },
    profit_margin: { low: '利润空间不足，建议优化供应链或提价', medium: '利润尚可，适合稳定运营', high: '利润空间充足，可投入更多营销预算' },
    content_power: { low: '内容吸引力弱，考虑跨界组合展示', medium: '内容表现中等，可参考同类爆款内容', high: '天然适合内容营销，优势明显' },
    seasonal_timing: { low: '当前非旺季，建议先做测品', medium: '处于需求爬坡期，适合布局', high: '完美时机，建议立即行动' },
    repeat_purchase: { low: '复购率低，建议搭配耗材或配件', medium: '有一定复购基础，可做会员运营', high: '高复购品类，长期价值大' },
    review_sentiment: { low: '用户负面反馈多，需改进产品', medium: '评价中等，可优化点明确', high: '用户满意度高，口碑效应可期' },
    price_positioning: { low: '定价偏高/偏低，建议调整', medium: '价格带适中，竞争力一般', high: '定价精准，转化率有保证' },
    target_audience: { low: '目标人群不够聚焦，建议重新定位', medium: '人群匹配度可以，可精准投放', high: '精准匹配高转化人群' },
    logistics_feasibility: { low: '物流成本高/风险大，需优化物流方案', medium: '物流可行，注意控制成本', high: '物流链条成熟，无需担心' },
    supply_stability: { low: '供应链不稳定，需寻找备选供应商', medium: '供应基本稳定，建议备货充足', high: '供应链可靠，可放心上量' },
    brand_risk: { low: '⚠️ 品牌/版权风险高，建议规避', medium: '有一定风险，建议核查', high: '无品牌风险，可放心运营' },
    platform_support: { low: '平台无特别扶持，靠自身能力', medium: '平台有一定支持，可申请', high: '平台大力扶持，乘势而上' },
    cross_market: { low: '跨市场潜力有限，建议深耕单一市场', medium: '可拓展1-2个相邻市场', high: '全球化潜力大，适合多市场布局' },
    advertising_roi: { low: '广告投产比预估偏低，控制预算', medium: 'ROI中等，可渐进式投放', high: '广告回报预期好，可加大投放' },
    differentiation: { low: '同质化严重，需找到独特卖点', medium: '有一定差异化空间', high: '差异化明显，竞争壁垒高' },
    creator_interest: { low: '暂时没有KOL关注，需主动合作', medium: '有零星KOL关注，可放大', high: '已被KOL关注，自然流量可期' },
    entry_barrier: { low: '门槛高，资源投入大', medium: '门槛适中，适合有一定经验', high: '门槛低，适合快速切入' }
  };

  const s = suggestions[dimId];
  if (!s) return '';
  if (score >= 70) return s.high;
  if (score >= 40) return s.medium;
  return s.low;
}

function getRecommendation(score) {
  if (score >= 85) return '强烈推荐 — 爆款潜力极高，建议立即启动';
  if (score >= 70) return '推荐 — 爆款潜力较高，建议重点投入';
  if (score >= 55) return '可以考虑 — 有一定潜力，建议小批量测品';
  if (score >= 40) return '谨慎评估 — 风险较高，需综合考量';
  return '不建议 — 多维度评分偏低，建议寻找其他机会';
}

function generateSummary(name, score, details) {
  const advantages = details.filter(d => d.flag === '优势').map(d => d.dimension);
  const disadvantages = details.filter(d => d.flag === '劣势').map(d => d.dimension);
  const neutralCount = details.filter(d => d.flag === '中性').length;

  let summary = `${name}的AI爆款评估综合得分为 ${score}%。`;
  if (advantages.length > 0) {
    summary += ` 优势维度（${advantages.length}项）：${advantages.join('、')}。`;
  }
  if (disadvantages.length > 0) {
    summary += ` 需关注维度（${disadvantages.length}项）：${disadvantages.join('、')}。`;
  }
  summary += ` 其余${neutralCount}项维度表现中等，需结合实际运营情况综合判断。`;
  summary += ` 建议：${getRecommendation(score)}。`;

  return summary;
}

export { DIMENSIONS, calculateProductScore };
