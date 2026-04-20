/**
 * AdCollectionPage - 广告采集页
 * Bug3 修复：竞品广告和爆款数据采集
 */
import React, { useState } from 'react';
import { api } from '../services/api';

interface CompetitorAd {
  id: string;
  platform: string;
  title: string;
  description: string;
  thumbnail?: string;
  url: string;
  collectedAt: string;
  engagement?: number;
}

export default function AdCollectionPage() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [collecting, setCollecting] = useState(false);
  const [ads, setAds] = useState<CompetitorAd[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tab, setTab] = useState<'search' | 'results'>('search');

  const CATEGORIES = ['全部', '服装', '鞋类', '箱包', '配饰', '家居', '美妆', '母婴', '玩具'];

  async function handleSearch() {
    if (!keyword.trim()) {
      setMessage({ type: 'error', text: '请输入关键词' });
      return;
    }
    setCollecting(true);
    setMessage(null);
    try {
      const result = await api.scraper.searchCompetitor(keyword, category === '全部' ? '' : category);
      if (result?.success && result?.data) {
        setAds(result.data);
        setTab('results');
        setMessage({ type: 'success', text: `找到 ${result.data.length} 条竞品数据` });
      } else if (result?.data) {
        setAds(Array.isArray(result.data) ? result.data : [result.data]);
        setTab('results');
      } else {
        setMessage({ type: 'error', text: '暂无数据，请稍后重试' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '采集失败' });
    } finally {
      setCollecting(false);
    }
  }

  async function handleFetchFromUrl(url: string) {
    setCollecting(true);
    try {
      const result = await api.scraper.fetch(url);
      if (result?.data) {
        setAds(prev => [result.data, ...prev]);
        setTab('results');
        setMessage({ type: 'success', text: '采集成功！' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '采集失败，可能是内置浏览器被阻止' });
    } finally {
      setCollecting(false);
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>📊 竞品广告采集</h2>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 20,
          background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: message.type === 'success' ? '#059669' : '#dc2626',
          border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
        }}>{message.text}</div>
      )}

      {/* 搜索区 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🔍 关键词搜索</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="输入产品关键词，如: kids dress, summer fashion..."
            style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' }}
          />
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={handleSearch} disabled={collecting} style={{
            padding: '10px 24px', background: collecting ? '#9ca3af' : '#2563eb',
            color: '#fff', border: 'none', borderRadius: 8, cursor: collecting ? 'not-allowed' : 'pointer', fontWeight: 600
          }}>
            {collecting ? '⏳ 采集中...' : '🔍 开始采集'}
          </button>
        </div>
      </div>

      {/* URL 采集 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🔗 URL 采集</h3>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
          ⚠️ 广告采集需要在已登录账号的内置浏览器中进行。如果广告采集失败，请手动复制竞品页面URL粘贴到这里。
        </p>
        <URLCollector onFetch={handleFetchFromUrl} collecting={collecting} />
      </div>

      {/* 结果展示 */}
      {tab === 'results' && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>📋 采集结果 ({ads.length} 条)</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setTab('search')} style={{ padding: '6px 14px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                ← 继续搜索
              </button>
            </div>
          </div>

          {ads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <div>暂无数据，请先进行搜索或URL采集</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ads.map(ad => (
                <AdCard key={ad.id || ad.url} ad={ad} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 使用说明 */}
      {tab === 'search' && (
        <div style={{ background: '#f9fafb', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>💡 使用说明</h3>
          <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.8 }}>
            <p>• <strong>关键词搜索</strong>：输入竞品相关关键词，系统自动搜索并采集爆款数据</p>
            <p>• <strong>URL采集</strong>：复制竞品/广告页面URL粘贴，自动提取产品信息</p>
            <p>• <strong>内置浏览器</strong>：广告采集功能需要在账号登录后的内置浏览器中打开页面</p>
            <p>• <strong>导出数据</strong>：采集完成后可一键将数据用于智能发布</p>
            <p style={{ color: '#f59e0b', marginTop: 8 }}>
              ⚠️ 注意：如果出现"广告采集失败"提示，是因为内置浏览器弹窗被阻止，请在设置中允许弹窗后重试
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function URLCollector({ onFetch, collecting }: { onFetch: (url: string) => void; collecting: boolean }) {
  const [url, setUrl] = useState('');
  function handleSubmit() {
    if (!url.trim()) return;
    onFetch(url.trim());
  }
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="粘贴竞品页面URL，如: https://www.tiktok.com/@shop/video/xxx"
        style={{ flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' }}
      />
      <button onClick={handleSubmit} disabled={collecting} style={{
        padding: '10px 20px', background: collecting ? '#9ca3af' : '#059669',
        color: '#fff', border: 'none', borderRadius: 8, cursor: collecting ? 'not-allowed' : 'pointer', fontWeight: 600
      }}>
        采集
      </button>
    </div>
  );
}

function AdCard({ ad }: { ad: CompetitorAd }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: 16, border: '1px solid #e5e7eb', borderRadius: 10 }}>
      {ad.thumbnail && (
        <img src={ad.thumbnail} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
            {ad.platform?.toUpperCase()}
          </span>
          {ad.engagement && <span style={{ fontSize: 12, color: '#6b7280' }}>🔥 {ad.engagement} 互动</span>}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ad.title}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ad.description}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={() => {
            // 用作发布素材
            console.log('Add to publish:', ad);
          }} style={{ padding: '5px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            ➕ 用于发布
          </button>
          {ad.url && (
            <a href={ad.url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', background: '#f9fafb', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>
              🔗 查看原文
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
