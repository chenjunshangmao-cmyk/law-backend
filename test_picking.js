// 测试智能选品系统并生成报表
const http = require('http');

const API = 'http://localhost:8089';

async function post(path, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API);
    const payload = JSON.stringify(data);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    
    const req = http.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { reject(new Error(`Parse failed: ${body.slice(0,200)}`)); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// 维度中文名
const dimNames = {
  demand_trend: '需求趋势', engagement_rate: '互动率', sales_momentum: '销量动能',
  competition_level: '竞争程度', profit_margin: '利润空间', content_power: '内容传播力',
  seasonal_timing: '季节性时机', repeat_purchase: '复购潜力', review_sentiment: '评论情感',
  price_positioning: '价格带定位', target_audience: '人群匹配度', logistics_feasibility: '物流可行性',
  supply_stability: '供应链稳定性', brand_risk: '品牌风险', platform_support: '平台扶持',
  cross_market: '跨市场拓展性', advertising_roi: '广告ROI', differentiation: '差异化空间',
  creator_interest: '创作者关注度', entry_barrier: '入行门槛'
};

async function run() {
  // 1. 登录
  console.log('=== 登录 ===');
  const login = await post('/api/auth/login', { email: 'lyshlc@163.com', password: 'LYshlc0818' });
  const token = login.token;
  console.log(`✅ 登录成功, token: ${token.slice(0,20)}...\n`);

  // 2. 获取维度说明
  console.log('=== 获取维度说明 ===');
  const dims = await post('/api/picking/dimensions', {}, token);
  console.log(`✅ 20维评分模型，维度数量: ${dims.data.length}\n`);

  // 3. 测试各品类
  const tests = [
    { label: '👕 童装（TikTok）', category: '童装', keyword: 'children clothing', platform: 'tiktok', count: 3 },
    { label: '💍 翡翠珠宝（TikTok）', category: '翡翠', keyword: 'jade jewelry', platform: 'tiktok', count: 3 },
    { label: '❄️ 制冷配件（OZON）', category: '制冷配件', keyword: 'refrigeration parts', platform: 'ozon', count: 3 },
    { label: '💡 LED灯泡（OZON）', category: 'LED灯泡', keyword: 'led light bulb', platform: 'ozon', count: 3 },
    { label: '🐱 宠物用品（TikTok）', category: '宠物用品', keyword: 'pet supplies', platform: 'tiktok', count: 3 },
  ];

  const allResults = [];
  
  for (const t of tests) {
    console.log(`\n=== ${t.label} ===`);
    try {
      const res = await post('/api/picking/search', {
        category: t.category, keyword: t.keyword, platform: t.platform, count: t.count
      }, token);
      
      if (!res.success) {
        console.log(`❌ 失败: ${res.error}`);
        continue;
      }
      
      const d = res.data;
      console.log(`品类: ${d.category}, 候选: ${d.totalAnalyzed}个`);
      
      d.products.sort((a,b) => b.burstProbability - a.burstProbability);
      d.products.forEach((p, i) => {
        console.log(`  #${i+1} ${p.productName} — ${p.burstProbability}% | ${p.riskLevel} | ${p.suggestedPrice || '?'} | 利润${p.profitEstimate?.margin || '?'}`);
        console.log(`    优势: ${p.strengths.join(', ')}`);
        if (p.weaknesses.length) console.log(`    劣势: ${p.weaknesses.join(', ')}`);
      });
      
      // 获取第一名详细信息
      if (d.products.length > 0) {
        const best = d.products[0];
        allResults.push({
          category: t.label,
          productName: best.productName,
          score: best.burstProbability,
          risk: best.riskLevel,
          recommendation: best.recommendation,
          platform: best.platform,
          price: best.suggestedPrice,
          profit: best.profitEstimate?.margin || 'N/A',
          strengths: best.strengths.join(', '),
          weaknesses: best.weaknesses.join(', '),
          summary: best.summary,
          // 详细维度评分（前5优势+后5劣势）
          topDims: best.detailedAnalysis.filter(d => d.flag === '优势').slice(0,5).map(d => ({name: d.dimension, score: d.score})),
          lowDims: best.detailedAnalysis.filter(d => d.flag === '劣势').slice(0,5).map(d => ({name: d.dimension, score: d.score})),
        });
      }
    } catch (err) {
      console.log(`❌ 请求失败: ${err.message}`);
    }
  }

  // 4. 生成报表
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           🤖 AI智能选品 — 测试报表                           ║');
  console.log('║           ' + new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'}) + '                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  allResults.forEach((r, i) => {
    console.log(`📊 【测试${i+1}】${r.category}`);
    console.log(`   ├─ 最佳产品: ${r.productName}`);
    console.log(`   ├─ 爆款概率: ${r.score}% (${r.risk})`);
    console.log(`   ├─ 推荐等级: ${r.recommendation}`);
    console.log(`   ├─ 参考售价: ${r.price}`);
    console.log(`   ├─ 利润空间: ${r.profit}`);
    console.log(`   ├─ 优势维度: ${r.strengths || '无'}`);
    console.log(`   └─ 重点关注: ${r.weaknesses || '无'}`);
    console.log(`   💬 分析摘要: ${r.summary.slice(0, 150)}...`);
    console.log('');
  });

  // 横向对比
  console.log('═══════════════════════════════════');
  console.log('🏆 综合排名');
  console.log('═══════════════════════════════════');
  allResults.sort((a,b) => b.score - a.score).forEach((r, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `  ${i+1}.`;
    console.log(` ${medal} ${r.category.split('（')[0].replace(/^.\s+/,'')} → ${r.score}% (${r.risk})`);
  });
  console.log('');
}

run().catch(console.error);
