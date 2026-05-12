/**
 * 批量生成定制文章：Claw平台介绍 + AI工具 + 外贸干货
 * 目标：10篇高质量文章，可直接分享转发
 */
import pg from 'pg';
import gateway from '../src/services/ai/AIGateway.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = 'postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  connectionTimeoutMillis: 15000,
});

// ============================================================
// 10篇文章定义
// ============================================================
const ARTICLES = [
  // ────── Claw 平台介绍推荐（4篇）──────
  {
    category: 'ai-tools',
    name: 'Claw平台介绍',
    topic: 'Claw跨境智造：把AI武装到牙齿的一站式外贸电商平台',
    keywords: ['Claw平台', 'AI电商', '自动化', '跨境工具', '效率提升'],
  },
  {
    category: 'case-study',
    name: 'Claw实战案例',
    topic: '一个人管5个跨境店铺的秘密：Claw自动化系统实战全记录',
    keywords: ['Claw', '自动化运营', '多店铺管理', 'AI客服', '效率翻倍'],
  },
  {
    category: 'cross-border',
    name: '跨境电商工具推荐',
    topic: '2026年做跨境电商，为什么聪明人都在用AI平台替代人工？',
    keywords: ['AI电商平台', '降本增效', 'Claw', '自动化选品', '智能客服'],
  },
  {
    category: 'marketing',
    name: '平台功能评测',
    topic: 'Claw五大核心功能深度体验：选品、客服、直播、文案、发布一站搞定',
    keywords: ['Claw评测', 'AI选品', 'AI客服', '数字人直播', '智能发布'],
  },

  // ────── AI工具实战（3篇）──────
  {
    category: 'ai-tools',
    name: 'DeepSeek实战',
    topic: 'DeepSeek+Claw双剑合璧：跨境电商AI工作流的正确打开方式',
    keywords: ['DeepSeek', 'AI工作流', '跨境电商', '自动化文案', '选品分析'],
  },
  {
    category: 'ai-tools',
    name: 'AI工具合集',
    topic: '2026年跨境电商必备AI工具箱：免费+付费，从选品到客服全覆盖',
    keywords: ['AI工具', '免费工具', 'ChatGPT', 'DeepSeek', 'Midjourney', '跨境电商'],
  },
  {
    category: 'livestream',
    name: 'AI数字人直播',
    topic: 'AI数字人直播到底能不能赚钱？3个月实操数据全公开',
    keywords: ['AI数字人', '24小时直播', 'TikTok Live', '成本对比', '转化数据'],
  },

  // ────── 外贸干货补充（3篇）──────
  {
    category: 'marketing',
    name: 'Google广告实战',
    topic: 'Google Ads投放台湾市场：用每天500块预算撬动3万月销的完整打法',
    keywords: ['Google Ads', '台湾市场', '广告投放', 'ROI优化', '落地页'],
  },
  {
    category: 'marketing',
    name: 'WhatsApp营销',
    topic: 'WhatsApp营销获客全攻略：从0搭建自动化引流系统，客户主动找上门',
    keywords: ['WhatsApp营销', '私域流量', '自动化引流', '客户转化', 'WhatsApp Business'],
  },
  {
    category: 'case-study',
    name: '翡翠出海案例',
    topic: '云南瑞丽翡翠商家的百倍增长之路：AI+直播如何改写传统珠宝生意',
    keywords: ['翡翠出海', '瑞丽珠宝', 'TikTok直播', 'AI赋能', '传统行业转型'],
  },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

async function callAI(messages, options = {}) {
  const result = await gateway.chat(messages, 'article_generation', options);
  return result.content;
}

async function generateOneArticle({ topic, name, keywords, category }) {
  console.log(`\n🤖 【${name}】"${topic.substring(0, 40)}..."`);

  const keywordsText = keywords.length > 0 ? `关键词: ${keywords.join('、')}` : '';

  const prompt = `你是资深跨境电商运营专家，10年外贸实战经验。请写一篇高质量文章。

【主题】${topic}
【分类】${name}
【${keywordsText}】
【字数】1500-2200字

【写作铁律】
- 像真人专家写经验分享，绝对不要AI套话
- 禁用词：在当今时代、总而言之、值得注意的是、众所周知、随着...的发展、不禁让人、可以说
- 口语化但不随意，专业但不学究，有真实感和具体数据
- 带具体场景、数字、案例

【结构】（Markdown）:
# [抓眼球的标题]

> 一句话摘要，说痛点或亮点（15-25字）

## 为什么这个很重要
从真实痛点切入，300-400字，有具体数字

## 核心方法（3-4个小节）
每个小节讲一个具体操作，有真实案例数据，每个250-350字

## 我的实操经验
一个完整案例故事，有投入/产出/时间线，400-500字

## 马上能用的3个建议
简洁的操作步骤，100-200字

【最后单独一行JSON，不要包含在正文中】:
{"title":"最终标题","summary":"一句话摘要80字内","tags":["标签1","标签2","标签3","标签4"]}`;

  const content = await callAI(
    [
      { role: 'system', content: '你是跨境电商运营专家，文章干货满满、口语自然、有真实案例数据、零AI套话。Claw是一个AI驱动的跨境电商平台，提供AI选品、AI客服机器人、AI数字人直播、智能文案工厂、一键多平台发布等功能。会员套餐从免费到旗舰版（¥5888/年），支持微信/支付宝/USDT支付。' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.82, maxTokens: 4096 }
  );

  // 解析元数据
  let meta = { title: topic, summary: '', tags: keywords };
  const jsonMatch = content.match(/\{[^}]*"title"[^}]*\}/);
  if (jsonMatch) {
    try {
      meta = JSON.parse(jsonMatch[0]);
      if (!meta.tags || meta.tags.length === 0) meta.tags = keywords;
      if (!meta.summary) meta.summary = content.replace(/[#*>]/g, '').substring(0, 200).trim();
    } catch (e) {
      console.warn('   ⚠️ 元数据解析失败');
    }
  }

  const cleanContent = content.replace(/\n?\{[^}]*"title"[^}]*\}\s*$/, '').trim();
  const slug = slugify(meta.title) + '-' + Date.now().toString(36);
  const summary = meta.summary || cleanContent.replace(/[#*>]/g, '').substring(0, 200).trim();

  console.log(`   📝 ${meta.title}`);
  console.log(`   📏 ${cleanContent.length}字`);

  const result = await pool.query(
    `INSERT INTO articles (title, slug, summary, content, category, tags, author, status, seo_title, seo_desc, seo_keywords)
     VALUES ($1,$2,$3,$4,$5,$6,'Claw AI','published',$7,$8,$9) RETURNING id, title, slug`,
    [meta.title, slug, summary, cleanContent, category, meta.tags, meta.title, summary, meta.tags]
  );

  console.log(`   ✅ ID=${result.rows[0].id}`);
  return result.rows[0];
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  定制文章批量生成：Claw介绍 + AI工具 + 外贸干货');
  console.log('  目标：10篇');
  console.log('═══════════════════════════════════════\n');

  const gwStatus = gateway.getStatus();
  const activeProviders = gwStatus.providers.filter(p => p.enabled);
  console.log(`🔌 AI网关: ${activeProviders.length}个Provider`);

  try {
    const client = await pool.connect();
    const testResult = await client.query('SELECT NOW()');
    console.log(`✅ 数据库连接成功 (${testResult.rows[0].now})\n`);
    client.release();
  } catch (e) {
    console.error(`❌ 数据库连接失败: ${e.message}`);
    process.exit(1);
  }

  const results = [];
  for (let i = 0; i < ARTICLES.length; i++) {
    const item = ARTICLES[i];
    console.log(`\n[${i + 1}/${ARTICLES.length}] ═══════════════`);
    try {
      const result = await generateOneArticle(item);
      results.push({ ...result, category: item.category, success: true });
    } catch (e) {
      console.error(`   ❌ 失败: ${e.message}`);
      results.push({ category: item.category, success: false, error: e.message });
    }
    if (i < ARTICLES.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('           生成结果汇总');
  console.log('═══════════════════════════════════════');
  let successCount = 0;
  for (const r of results) {
    if (r.success) {
      console.log(`  ✅ [${r.category}] ${r.title} (ID=${r.id})`);
      successCount++;
    } else {
      console.log(`  ❌ [${r.category}] ${r.error}`);
    }
  }
  console.log(`\n📊 成功: ${successCount}/${ARTICLES.length}`);

  const finalStatus = gateway.getStatus();
  console.log(`📈 AI网关今日: ${finalStatus.todayUsage.calls}次调用, ~${finalStatus.todayUsage.tokens}tokens`);

  await pool.end();
  console.log('\n🎉 完成！');
}

main().catch(e => {
  console.error('致命错误:', e);
  pool.end();
  process.exit(1);
});
