/**
 * 广告数据分析 API
 * - 存储TK/Google广告数据
 * - 提供数据统计和AI分析接口
 * - 仅管理员可访问
 */
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

// 管理员检查中间件
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: '仅管理员可操作' });
  }
  next();
}
import { getGateway } from '../services/ai/AIGateway.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const DATA_FILE = path.join(__dirname, '../../data/ad_analytics.json');
const gateway = getGateway();

// 确保数据文件存在
function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ campaigns: [], adSets: [], ads: [] }, null, 2));
}

function readData() {
  ensureFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function saveData(data) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ========================================
// 1. 添加广告活动
// POST /api/ad-analytics/campaign
// ========================================
router.post('/campaign', authenticateToken, requireAdmin, (req, res) => {
  const data = readData();
  const campaign = {
    id: 'camp_' + Date.now().toString(36),
    platform: req.body.platform || 'tiktok',   // tiktok | google
    name: req.body.name || '未命名活动',
    status: req.body.status || 'active',
    budget: req.body.budget || 0,
    budgetType: req.body.budgetType || 'daily', // daily | total
    startDate: req.body.startDate || new Date().toISOString(),
    endDate: req.body.endDate || null,
    objective: req.body.objective || '',
    currency: req.body.currency || 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.campaigns.push(campaign);
  saveData(data);
  res.json({ success: true, data: campaign });
});

// ========================================
// 2. 添加广告组/数据记录
// POST /api/ad-analytics/adset
// ========================================
router.post('/adset', authenticateToken, requireAdmin, (req, res) => {
  const data = readData();
  const adset = {
    id: 'aset_' + Date.now().toString(36),
    campaignId: req.body.campaignId || '',
    name: req.body.name || '未命名广告组',
    status: req.body.status || 'active',
    // 投放数据
    impressions: req.body.impressions || 0,
    clicks: req.body.clicks || 0,
    ctr: 0,
    cpc: 0,
    spend: req.body.spend || 0,
    conversions: req.body.conversions || 0,
    conversionRate: 0,
    cpa: 0,
    // 人群数据
    audience: req.body.audience || null, // { age, gender, interests, locations }
    // 时间
    date: req.body.date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };
  // 计算指标
  adset.ctr = adset.impressions > 0 ? Math.round(adset.clicks / adset.impressions * 10000) / 100 : 0;
  adset.cpc = adset.clicks > 0 ? Math.round(adset.spend / adset.clicks * 100) / 100 : 0;
  adset.conversionRate = adset.clicks > 0 ? Math.round(adset.conversions / adset.clicks * 10000) / 100 : 0;
  adset.cpa = adset.conversions > 0 ? Math.round(adset.spend / adset.conversions * 100) / 100 : 0;

  data.adSets.push(adset);
  saveData(data);
  res.json({ success: true, data: adset });
});

// ========================================
// 3. 批量导入数据（从CSV/JSON）
// POST /api/ad-analytics/import
// ========================================
router.post('/import', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { records, platform } = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ success: false, error: 'records must be array' });

    const data = readData();
    let count = 0;
    records.forEach(record => {
      if (record.type === 'campaign') {
        data.campaigns.push({ id: 'camp_' + Date.now().toString(36) + '_' + count, ...record, createdAt: new Date().toISOString() });
        count++;
      } else {
        data.adSets.push({ id: 'aset_' + Date.now().toString(36) + '_' + count, ...record, createdAt: new Date().toISOString() });
        count++;
      }
    });
    saveData(data);
    res.json({ success: true, data: { imported: count } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ========================================
// 4. 获取所有数据
// GET /api/ad-analytics/data
// ========================================
router.get('/data', authenticateToken, requireAdmin, (req, res) => {
  const data = readData();
  
  // 支持按平台/日期筛选
  const { platform, startDate, endDate, campaignId } = req.query;
  let filtered = { ...data };

  if (platform) {
    filtered.campaigns = filtered.campaigns.filter(c => c.platform === platform);
    filtered.adSets = filtered.adSets.filter(a => {
      const camp = filtered.campaigns.find(c => c.id === a.campaignId);
      return camp ? camp.platform === platform : true;
    });
  }
  
  // 汇总统计
  const stats = {
    totalCampaigns: filtered.campaigns.length,
    activeCampaigns: filtered.campaigns.filter(c => c.status === 'active').length,
    totalImpressions: filtered.adSets.reduce((s, a) => s + (a.impressions || 0), 0),
    totalClicks: filtered.adSets.reduce((s, a) => s + (a.clicks || 0), 0),
    totalSpend: filtered.adSets.reduce((s, a) => s + (a.spend || 0), 0),
    totalConversions: filtered.adSets.reduce((s, a) => s + (a.conversions || 0), 0),
    avgCtr: 0,
    avgCpc: 0,
    avgCpa: 0,
  };
  stats.avgCtr = stats.totalImpressions > 0 ? Math.round(stats.totalClicks / stats.totalImpressions * 10000) / 100 : 0;
  stats.avgCpc = stats.totalClicks > 0 ? Math.round(stats.totalSpend / stats.totalClicks * 100) / 100 : 0;
  stats.avgCpa = stats.totalConversions > 0 ? Math.round(stats.totalSpend / stats.totalConversions * 100) / 100 : 0;

  res.json({
    success: true,
    data: {
      campaigns: filtered.campaigns,
      adSets: filtered.adSets,
      stats,
    }
  });
});

// ========================================
// 5. AI分析广告数据
// POST /api/ad-analytics/ai-analyze
// ========================================
router.post('/ai-analyze', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const data = readData();
    const { platform, startDate, endDate, question } = req.body;

    // 汇总数据
    const totalSpend = data.adSets.reduce((s, a) => s + (a.spend || 0), 0);
    const totalImpressions = data.adSets.reduce((s, a) => s + (a.impressions || 0), 0);
    const totalClicks = data.adSets.reduce((s, a) => s + (a.clicks || 0), 0);
    const totalConversions = data.adSets.reduce((s, a) => s + (a.conversions || 0), 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0;
    const avgCpc = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : 0;

    const campaignSummary = data.campaigns.map(c =>
      `【${c.platform}】${c.name} | 预算:${c.budget}${c.currency} | 状态:${c.status}`
    ).join('\n');

    const recentAds = data.adSets.slice(-20).map(a =>
      `日期:${a.date} | 展示:${a.impressions} | 点击:${a.clicks} | CTR:${a.ctr}% | 花费:$${a.spend} | 转化:${a.conversions}`
    ).join('\n');

    const prompt = `你是广告数据分析师。以下是广告投放数据：

## 活动概览
${campaignSummary || '暂无活动数据'}

## 整体表现
- 总花费: $${totalSpend}
- 展示量: ${totalImpressions.toLocaleString()}
- 点击量: ${totalClicks.toLocaleString()}
- 转化数: ${totalConversions}
- 平均CTR: ${avgCtr}%
- 平均CPC: $${avgCpc}

## 近期广告组数据
${recentAds || '暂无广告组数据'}

${question ? `\n用户提问：${question}` : '\n请分析：1) 整体表现如何 2) 哪些广告效果最好 3) 优化建议'}`;

    const result = await gateway.chat([{ role: 'user', content: prompt }], 'ad-analytics');
    const analysis = result.content;

    // 同时返回结构化数据
    res.json({
      success: true,
      data: {
        analysis,
        stats: { totalSpend, totalImpressions, totalClicks, totalConversions, avgCtr, avgCpc },
        timestamp: new Date().toISOString(),
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ========================================
// 6. Google Ads 授权 URL 获取（预留）
// GET /api/ad-analytics/google/auth-url
// ========================================
router.get('/google/auth-url', authenticateToken, requireAdmin, (req, res) => {
  // Google Ads API 授权（后续完善）
  res.json({
    success: true,
    data: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth?...',
      note: 'Google Ads API授权需要先在Google Cloud Console配置OAuth客户端'
    }
  });
});

export default router;
