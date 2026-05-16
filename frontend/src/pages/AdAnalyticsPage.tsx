/**
 * AdAnalyticsPage - 广告数据分析
 * 仅管理员可见，支持TK/Google广告数据查看和AI分析
 */
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

interface AdSet {
  id: string;
  campaignId: string;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  conversions: number;
  conversionRate: number;
  cpa: number;
  date: string;
  audience?: any;
}

interface Campaign {
  id: string;
  platform: string;
  name: string;
  status: string;
  budget: number;
  budgetType: string;
  currency: string;
}

interface Stats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
  avgCpa: number;
}

export default function AdAnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('all');
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await api.authFetch(`/api/ad-analytics/data?platform=${platform}`);
      if (res.success) {
        setCampaigns(res.data.campaigns);
        setAdSets(res.data.adSets);
        setStats(res.data.stats);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleAiAnalyze() {
    setAnalyzing(true);
    try {
      const res = await api.authFetch('/api/ad-analytics/ai-analyze', {
        method: 'POST', body: JSON.stringify({ platform: platform === 'all' ? '' : platform })
      });
      if (res.success) setAnalysis(res.data.analysis);
    } catch (e) { console.error(e); }
    finally { setAnalyzing(false); }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>📊 广告数据中心</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>TK / Google Ads 投放数据分析 · 仅管理员可见</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={platform} onChange={e => setPlatform(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: '#fff' }}>
            <option value="all">全部平台</option>
            <option value="tiktok">🎵 TikTok</option>
            <option value="google">📋 Google Ads</option>
          </select>
          <button onClick={loadData} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd',
            background: '#f9fafb', cursor: 'pointer', fontSize: 13
          }}>🔄 刷新</button>
        </div>
      </div>

      {/* 概览卡片 */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard label="总花费" value={`$${stats.totalSpend.toFixed(2)}`} color="#ef4444" />
          <StatCard label="展示量" value={stats.totalImpressions.toLocaleString()} color="#6366f1" />
          <StatCard label="点击量" value={stats.totalClicks.toLocaleString()} color="#3b82f6" />
          <StatCard label="点击率" value={`${stats.avgCtr}%`} color="#10b981" />
          <StatCard label="平均CPC" value={`$${stats.avgCpc.toFixed(2)}`} color="#f59e0b" />
          <StatCard label="转化数" value={stats.totalConversions.toLocaleString()} color="#8b5cf6" />
          <StatCard label="活跃活动" value={`${stats.activeCampaigns}/${stats.totalCampaigns}`} color="#06b6d4" />
        </div>
      )}

      {/* AI分析区 */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 20, border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>🤖 AI 广告分析</h3>
          <button onClick={handleAiAnalyze} disabled={analyzing || !stats?.totalSpend}
            style={{ padding: '8px 18px', background: analyzing ? '#a5b4fc' : '#6366f1', color: '#fff', borderRadius: 8, border: 'none', cursor: analyzing || !stats?.totalSpend ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
            {analyzing ? '⏳ 分析中...' : '🔍 AI分析广告表现'}
          </button>
        </div>
        {analysis ? (
          <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap', background: '#f9fafb', padding: 16, borderRadius: 8 }}>
            {analysis}
          </div>
        ) : (
          <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 20 }}>
            {stats?.totalSpend ? '点击"AI分析"按钮查看广告投放建议' : '暂无广告数据，请先添加投放记录'}
          </div>
        )}
      </div>

      {/* 广告活动列表 */}
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 12, margin: 0 }}>
          📋 广告活动 ({campaigns.length})
          <span style={{ fontSize: 12, color: '#888', fontWeight: 400, marginLeft: 8 }}>
            点击+号添加新活动
          </span>
        </h3>
        
        {campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: '#bbb', border: '2px dashed #e8e8e8', borderRadius: 12 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
            <div style={{ fontSize: 13 }}>暂无广告数据</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>需要先采集TK/Google广告数据</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {campaigns.map(c => (
              <div key={c.id} style={{
                padding: '12px 16px', borderRadius: 10, border: '1px solid #f0f0f0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{c.platform === 'tiktok' ? '🎵' : '📋'}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: c.status === 'active' ? '#d1fae5' : '#f3f4f6', color: c.status === 'active' ? '#065f46' : '#6b7280' }}>
                      {c.status === 'active' ? '投放中' : '已暂停'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                    预算: ${c.budget}/{c.budgetType === 'daily' ? '天' : '总计'} · {c.currency}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>${c.budget}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{c.budgetType === 'daily' ? '每日预算' : '总预算'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '16px 18px',
      border: `1px solid ${color}20`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      borderLeft: `3px solid ${color}`
    }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
