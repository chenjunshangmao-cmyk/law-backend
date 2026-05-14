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

async function run() {
  // 1. 登录
  console.log('=== 登录 ===');
  const login = await post('/api/auth/login', { email: 'lyshlc@163.com', password: 'LYshlc0818' });
  const token = login.token;
  console.log('Token OK\n');

  // 2. 获取维度说明
  console.log('=== 获取维度说明 ===');
  const dims = await post('/api/picking/dimensions', {}, token);
  if (dims && dims.success && dims.data) {
    console.log('维度数量: ' + dims.data.length);
  } else {
    console.log('维度查询结果: ' + JSON.stringify(dims).slice(0,100));
  }

  // 3. 测试各品类
  const tests = [
    { label: '童装', category: '童装', keyword: 'children clothing', platform: 'tiktok', count: 3 },
    { label: '翡翠珠宝', category: '翡翠', keyword: 'jade jewelry', platform: 'tiktok', count: 3 },
    { label: '制冷配件', category: '制冷配件', keyword: 'refrigeration parts', platform: 'ozon', count: 3 },
    { label: 'LED灯泡', category: 'LED灯泡', keyword: 'led light bulb', platform: 'ozon', count: 3 },
    { label: '宠物用品', category: '宠物用品', keyword: 'pet supplies', platform: 'tiktok', count: 3 },
  ];

  const allResults = [];
  
  for (const t of tests) {
    console.log('\n--- ' + t.label + ' ---');
    try {
      const res = await post('/api/picking/search', {
        category: t.category, keyword: t.keyword, platform: t.platform, count: t.count
      }, token);
      
      if (!res.success) {
        console.log('FAIL: ' + res.error);
        continue;
      }
      
      const d = res.data;
      console.log('候选: ' + d.totalAnalyzed + '个');
      
      d.products.sort((a,b) => b.burstProbability - a.burstProbability);
      d.products.forEach((p, i) => {
        console.log('  #' + (i+1) + ' ' + p.productName + ' | ' + p.burstProbability + '% | ' + p.riskLevel + ' | ' + (p.suggestedPrice || '?') + ' | 利润' + (p.profitEstimate?.margin || '?'));
        console.log('    优势: ' + p.strengths.join(', '));
        if (p.weaknesses.length) console.log('    劣势: ' + p.weaknesses.join(', '));
      });
      
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
        });
      }
    } catch (err) {
      console.log('请求失败: ' + err.message);
    }
  }

  // 4. 生成报表
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           AI智能选品 — 测试报表                               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  allResults.forEach((r, i) => {
    console.log('[测试' + (i+1) + '] ' + r.category);
    console.log('  最佳产品: ' + r.productName);
    console.log('  爆款概率: ' + r.score + '% (' + r.risk + ')');
    console.log('  推荐等级: ' + r.recommendation);
    console.log('  参考售价: ' + r.price);
    console.log('  利润空间: ' + r.profit);
    console.log('  优势维度: ' + (r.strengths || '无'));
    console.log('  重点关注: ' + (r.weaknesses || '无'));
    console.log('');
  });

  // 排名
  console.log('═══════════════════════════════════');
  console.log('综合排名:');
  console.log('═══════════════════════════════════');
  allResults.sort((a,b) => b.score - a.score).forEach((r, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '   ';
    console.log(' ' + medal + ' ' + r.category + ' -> ' + r.score + '% (' + r.risk + ')');
  });
  console.log('');
}

run().catch(console.error);
