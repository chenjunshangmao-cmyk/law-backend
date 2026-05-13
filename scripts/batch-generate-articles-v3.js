/**
 * 批量生成文章 v3.0 — 使用后端API而非直连PG
 * 适配数据库JSON模式
 */
import gateway from '../backend/src/services/ai/AIGateway.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = 'https://claw-backend-2026.onrender.com';
const AUTH_EMAIL = 'admin@claw.com';
const AUTH_PASS = 'admin123';

const CATEGORY_TOPICS = [
  { category: 'cross-border', name: '跨境干货', topic: '2026年跨境电商新手选品避坑指南：从0到月销10万的真实路径', keywords: ['选品', '避坑', '新手入门', '1688', '供应链'] },
  { category: 'tiktok-shop', name: 'TikTok电商', topic: 'TikTok Shop东南亚市场爆单打法：3个月从0做到日销500单', keywords: ['TikTok Shop', '东南亚', '爆单', '短视频带货', '达人合作'] },
  { category: 'livestream', name: '直播带货', topic: '跨境直播带货实战手册：英语不好也能在TikTok做直播月入10万', keywords: ['直播带货', 'TikTok Live', '英语直播', '转化率', '话术模板'] },
  { category: 'marketing', name: '营销推广', topic: 'Google Ads投放跨境电商的ROI翻倍密码：用500块日预算跑出3倍回报', keywords: ['Google Ads', 'ROI', '广告投放', '受众定位', '落地页优化'] },
  { category: 'ai-tools', name: 'AI赋能', topic: '2026年AI工具重塑跨境电商：从选品到客服全链路自动化实战', keywords: ['AI工具', '自动化', 'DeepSeek', 'ChatGPT', '效率提升'] },
  { category: 'case-study', name: '实战案例', topic: '云南瑞丽翡翠商家出海实录：靠TikTok直播一年做到3000万GMV', keywords: ['翡翠出海', '瑞丽', 'TikTok直播', '案例拆解', 'GMV增长'] },
  // 额外2篇 第二轮
  { category: 'cross-border', name: '跨境干货', topic: '跨境物流避坑全攻略：从国内发货到海外仓的6个关键决策点', keywords: ['跨境物流', '海外仓', 'FBA', '头程', '退货'] },
  { category: 'tiktok-shop', name: 'TikTok电商', topic: 'TikTok美区小店开店全流程：不用邀请码也能快速入驻的方法', keywords: ['TikTok美区', '开店', '入驻', '资质', '收款'] },
  { category: 'livestream', name: '直播带货', topic: '直播间话术模板大全：开场+留人+逼单+转粉全套SOP', keywords: ['直播话术', '留人技巧', '逼单', 'SOP', '转化'] },
  { category: 'marketing', name: '营销推广', topic: 'Facebook广告从入门到盈利：跨境卖家必知的5个扩量策略', keywords: ['Facebook广告', '扩量', '受众', '像素', '再营销'] },
  { category: 'ai-tools', name: 'AI赋能', topic: '用Midjourney+Canva做跨境产品图：月省5万设计费的实操路径', keywords: ['Midjourney', 'Canva', '产品图', 'AI设计', '降本'] },
  { category: 'case-study', name: '实战案例', topic: '1688一件代发做独立站：90后夫妻店年入200万的运营拆解', keywords: ['1688', '一件代发', '独立站', '夫妻店', '运营拆解'] },
  // 第三轮
  { category: 'cross-border', name: '跨境干货', topic: '跨境支付收款全方案对比：Payoneer、连连、PingPong哪个最省钱', keywords: ['跨境支付', 'Payoneer', '连连', 'PingPong', '费率'] },
  { category: 'tiktok-shop', name: 'TikTok电商', topic: 'TikTok短视频带货脚本模板：15秒转化率翻3倍的拍摄公式', keywords: ['短视频', '带货脚本', '拍摄', '转化率', '模板'] },
  { category: 'livestream', name: '直播带货', topic: '跨境直播设备清单：3000块搞定专业直播间搭建全攻略', keywords: ['直播设备', '灯光', '麦克风', '搭建', '成本'] },
  { category: 'marketing', name: '营销推广', topic: 'Instagram社媒矩阵运营：0广告费月引流5000精准客户的实操方法', keywords: ['Instagram', '社媒矩阵', '引流', '精准客户', '内容运营'] },
  { category: 'ai-tools', name: 'AI赋能', topic: 'ChatGPT写跨境产品文案：从标题到五点描述的AI爆款公式', keywords: ['ChatGPT', '文案', '产品描述', '爆款', 'listing优化'] },
  { category: 'case-study', name: '实战案例', topic: '深圳大卖亚马逊转型TikTok：半年清完300万库存的冷启动复盘', keywords: ['亚马逊转型', 'TikTok', '库存清理', '冷启动', '跨境大卖'] },
];

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 100);
}

async function callAI(messages, options = {}) {
  const result = await gateway.chat(messages, 'article_generation', options);
  return result.content;
}

let adminToken = null;

async function getAdminToken() {
  if (adminToken) return adminToken;
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASS })
  });
  const data = await res.json();
  adminToken = data.data.token;
  console.log('🔑 管理员登录成功');
  return adminToken;
}

async function generateOneArticle({ topic, name, keywords, category }) {
  console.log(`\n🤖 正在生成【${name}】: "${topic}"`);
  const keywordsText = keywords.length > 0 ? `关键词覆盖: ${keywords.join('、')}` : '';

  const prompt = `你是资深跨境电商运营专家，拥有10年外贸实战经验。

请写一篇高质量外贸干货文章：
- 主题: ${topic}
- 分类: ${name}
- ${keywordsText}
- 篇幅: 1800-2500字
- 风格: 口语化但专业，像真人专家写经验分享，不要AI套话
- 禁止: "在当今时代""总而言之""值得注意的是""众所周知""随着...的发展"
- 要有真实感，带具体数字、具体场景

内容结构（Markdown）:
# [有吸引力的标题]
> 一句话摘要

## 开头（背景+痛点）

## 核心要点（3-5个小标题，每段有具体操作和案例）

## 实战拆解（完整案例故事+具体数字）

## 行动建议（可操作步骤+工具推荐+误区提醒）

最后一行输出 JSON:
{"title":"最终标题","summary":"80字内摘要","tags":["标签1","标签2","标签3","标签4"]}`;

  const content = await callAI(
    [{ role: 'system', content: '你是跨境电商运营专家，写文章干货满满、口语自然、有真实案例和数据支撑、没有任何AI套话。' }, { role: 'user', content: prompt }],
    { temperature: 0.85, maxTokens: 4096 }
  );

  // 提取元数据
  let meta = { title: topic, summary: '', tags: keywords };
  const metaMatch = content.match(/\{[^}]*"title"[^}]*\}/);
  if (metaMatch) {
    try { meta = JSON.parse(metaMatch[0]); } catch {}
  }
  if (!meta.tags || meta.tags.length === 0) meta.tags = keywords;
  const cleanContent = content.replace(/\n?\{[^}]*"title"[^}]*\}\s*$/, '').trim();
  const summary = meta.summary || cleanContent.substring(0, 200).replace(/[#*>]/g, '').trim();

  console.log(`   📝 标题: ${meta.title}  📏 ${cleanContent.length}字`);

  // 通过API插入文章
  const token = await getAdminToken();
  const res = await fetch(`${API_BASE}/api/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      title: meta.title, content: cleanContent, summary, category,
      tags: meta.tags, cover_image: null, status: 'published',
      seo_title: meta.title, seo_desc: summary, seo_keywords: meta.tags
    })
  });
  const data = await res.json();
  if (data.success) {
    console.log(`   ✅ API入库成功 ID=${data.data.id}`);
  } else {
    console.log(`   ⚠️ API返回: ${JSON.stringify(data)}`);
  }
  return data.success ? data.data : null;
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Claw 外贸干货文章批量生成 v3.0');
  console.log(`  目标: ${CATEGORY_TOPICS.length}篇（通过API写入）`);
  console.log('═══════════════════════════════════════\n');

  const gwStatus = gateway.getStatus();
  const active = gwStatus.providers.filter(p => p.enabled);
  console.log(`🔌 AI网关: ${active.length}个Provider`);
  active.forEach(p => console.log(`   ${p.name} → ${p.models[0]}`));

  const results = [];
  for (let i = 0; i < CATEGORY_TOPICS.length; i++) {
    const item = CATEGORY_TOPICS[i];
    console.log(`\n[${i + 1}/${CATEGORY_TOPICS.length}] ═══════════════`);
    try {
      const result = await generateOneArticle(item);
      results.push({ ...(result || {}), category: item.category, success: !!result });
    } catch (e) {
      console.error(`   ❌ 失败: ${e.message}`);
      results.push({ category: item.category, success: false, error: e.message });
    }
    if (i < CATEGORY_TOPICS.length - 1) await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n═══════════════════════════════════════');
  console.log('  汇总');
  console.log('═══════════════════════════════════════');
  const ok = results.filter(r => r.success).length;
  for (const r of results) {
    console.log(`  ${r.success ? '✅' : '❌'} [${r.category}] ${r.title || r.error}`);
  }
  console.log(`\n📊 成功: ${ok}/${CATEGORY_TOPICS.length}`);
  console.log('\n🎉 完成！');
}

main().catch(e => { console.error('致命:', e); process.exit(1); });
