/**
 * 批量生成6篇外贸干货文章（每个分类一篇）
 * v2.0 — 使用 AI 网关（多Provider自动切换）
 * 
 * Provider优先级：DeepSeek → GLM-4-Flash(免费) → 混元Lite(免费) → 豆包 → Gemini(免费)
 * 单个Provider挂了自动fallback，零中断
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

// 分类与主题对应
const CATEGORY_TOPICS = [
  {
    category: 'cross-border',
    name: '跨境干货',
    topic: '2026年跨境电商新手选品避坑指南：从0到月销10万的真实路径',
    keywords: ['选品', '避坑', '新手入门', '1688', '供应链'],
  },
  {
    category: 'tiktok-shop',
    name: 'TikTok电商',
    topic: 'TikTok Shop东南亚市场爆单打法：3个月从0做到日销500单',
    keywords: ['TikTok Shop', '东南亚', '爆单', '短视频带货', '达人合作'],
  },
  {
    category: 'livestream',
    name: '直播带货',
    topic: '跨境直播带货实战手册：英语不好也能在TikTok做直播月入10万',
    keywords: ['直播带货', 'TikTok Live', '英语直播', '转化率', '话术模板'],
  },
  {
    category: 'marketing',
    name: '营销推广',
    topic: 'Google Ads投放跨境电商的ROI翻倍密码：用500块日预算跑出3倍回报',
    keywords: ['Google Ads', 'ROI', '广告投放', '受众定位', '落地页优化'],
  },
  {
    category: 'ai-tools',
    name: 'AI赋能',
    topic: '2026年AI工具重塑跨境电商：从选品到客服全链路自动化实战',
    keywords: ['AI工具', '自动化', 'DeepSeek', 'ChatGPT', '效率提升'],
  },
  {
    category: 'case-study',
    name: '实战案例',
    topic: '云南瑞丽翡翠商家出海实录：靠TikTok直播一年做到3000万GMV',
    keywords: ['翡翠出海', '瑞丽', 'TikTok直播', '案例拆解', 'GMV增长'],
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
  return result.content; // gateway 返回 { content, promptTokens, completionTokens, model }
}

async function generateOneArticle({ topic, name, keywords, category }) {
  console.log(`\n🤖 正在生成【${name}】文章: "${topic}"`);

  const keywordsText = keywords.length > 0 ? `关键词覆盖: ${keywords.join('、')}` : '';

  const prompt = `你是资深跨境电商运营专家，拥有10年外贸实战经验，在TikTok电商、Google广告、直播带货等领域有丰富的一线作战经历。

请写一篇高质量外贸干货文章，要求：

【基本信息】
- 主题: ${topic}
- 分类: ${name}
- ${keywordsText}
- 篇幅: 1800-2500字

【风格要求】
- 像真人专家写经验分享，不要AI套话
- 禁止使用："在当今时代""总而言之""值得注意的是""众所周知""随着...的发展"
- 口语化但不随意，专业但不学究
- 要有真实感，带具体数字、具体场景

【内容结构】（Markdown格式）:
# [有吸引力的标题，包含关键词]

> 一句话摘要（15-25字，抓眼球、说痛点）

## 开头（300-400字）
- 从真实场景或痛点切入
- 说说为什么这个话题重要
- 抛出核心观点

## 核心要点（分3-5个小标题，每个300-400字）
- 每个要点有具体操作方法
- 配真实案例或数据
- 有踩过的坑和经验总结

## 实战拆解（400-500字）
- 一个完整的案例故事
- 有具体数字（投入、产出、时间线）
- 总结可复用的方法论

## 行动建议（200-300字）
- 给出马上能用的操作步骤
- 推荐工具或资源
- 常见误区提醒

【最后一行】请严格输出一行 JSON（不要换行）:
{"title":"最终文章标题","summary":"80字以内的文章摘要，包含核心卖点","tags":["标签1","标签2","标签3","标签4"]}`;

  const content = await callAI(
    [
      { role: 'system', content: '你是一个跨境电商运营专家，写文章干货满满、口语自然、有真实案例和数据支撑、没有任何AI套话。' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.85, maxTokens: 4096 }
  );

  // 提取元数据
  let meta = { title: topic, summary: '', tags: keywords };
  const metaMatch = content.match(/\{[^}]*"title"[^}]*\}/);
  if (metaMatch) {
    try {
      meta = JSON.parse(metaMatch[0]);
      if (!meta.tags || meta.tags.length === 0) meta.tags = keywords;
      if (!meta.summary) meta.summary = content.substring(0, 200).replace(/[#*>]/g, '').trim();
    } catch (e) {
      console.warn('   ⚠️ 元数据解析失败，使用默认值');
    }
  }

  // 清理内容（去掉最后的JSON行）
  const cleanContent = content.replace(/\n?\{[^}]*"title"[^}]*\}\s*$/, '').trim();

  const slug = slugify(meta.title) + '-' + Date.now().toString(36);
  const summary = meta.summary || cleanContent.substring(0, 200).replace(/[#*>]/g, '').trim();

  console.log(`   📝 标题: ${meta.title}`);
  console.log(`   📏 字数: ${cleanContent.length} 字`);

  // 插入数据库
  const result = await pool.query(
    `INSERT INTO articles (title, slug, summary, content, category, tags, author, status, seo_title, seo_desc, seo_keywords)
     VALUES ($1,$2,$3,$4,$5,$6,'Claw AI','published',$7,$8,$9) RETURNING id, title, slug`,
    [meta.title, slug, summary, cleanContent, category, meta.tags, meta.title, summary, meta.tags]
  );

  console.log(`   ✅ 已入库 ID=${result.rows[0].id} slug=${result.rows[0].slug}`);
  return result.rows[0];
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Claw 外贸干货文章批量生成工具 v2.0');
  console.log('  引擎: AI 网关（多Provider自动切换）');
  console.log('  目标: 6篇文章 × 6个分类');
  console.log('═══════════════════════════════════════\n');

  // 显示网关状态
  const gwStatus = gateway.getStatus();
  const activeProviders = gwStatus.providers.filter(p => p.enabled);
  console.log(`🔌 AI 网关已就绪：${activeProviders.length} 个Provider可用`);
  activeProviders.forEach(p => {
    const freeTag = p.freeModel?.cost === 0 ? ' [免费]' : '';
    console.log(`   ${p.name} → ${p.models[0]}${freeTag}`);
  });

  // 测试数据库连接
  try {
    const client = await pool.connect();
    const testResult = await client.query('SELECT NOW() as now, current_database() as db');
    console.log(`\n✅ 数据库连接成功: ${testResult.rows[0].db} (${testResult.rows[0].now})\n`);
    client.release();
  } catch (e) {
    console.error(`\n❌ 数据库连接失败: ${e.message}`);
    process.exit(1);
  }

  const results = [];
  for (let i = 0; i < CATEGORY_TOPICS.length; i++) {
    const item = CATEGORY_TOPICS[i];
    console.log(`\n[${i + 1}/6] ═══════════════════════════`);
    try {
      const result = await generateOneArticle(item);
      results.push({ ...result, category: item.category, success: true });
    } catch (e) {
      console.error(`   ❌ 失败: ${e.message}`);
      results.push({ category: item.category, success: false, error: e.message });
    }
    if (i < CATEGORY_TOPICS.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('  生成结果汇总');
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
  console.log(`\n📊 成功: ${successCount}/6`);

  // 显示网关用量摘要
  const finalStatus = gateway.getStatus();
  console.log(`\n📈 AI网关今日用量: ${finalStatus.todayUsage.calls}次调用, ~${finalStatus.todayUsage.tokens}tokens`);

  await pool.end();
  console.log('\n🎉 批量生成完成！');
}

main().catch(e => {
  console.error('致命错误:', e);
  pool.end();
  process.exit(1);
});
