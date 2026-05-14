/**
 * TrendingPage - AI智能选品（升级版）
 * 功能1: AI全网搜爆款单品 + 20维评分
 * 功能2: 链接测款（手动输链接自动评估）
 * 功能3: 手动输入产品信息评估
 */
import React, { useState, useCallback } from 'react';
import { api } from '../services/api';
import {
  Search, Sparkles, Link2,
  ChevronDown, ChevronUp,
  BarChart3, RefreshCw, ExternalLink
} from 'lucide-react';

// ============= 类型定义 =============
interface DimensionScore {
  dimension: string;
  description: string;
  score: number;
  weight: number;
  weighted: number;
  rating: string;
  flag: string;
  suggestion: string;
}

interface PickingProduct {
  productName: string;
  platform: string;
  category: string;
  burstProbability: number;
  riskLevel: string;
  recommendation: string;
  dimensionCount: number;
  detailedAnalysis: DimensionScore[];
  strengths: string[];
  weaknesses: string[];
  summary: string;
  evaluatedAt: string;
  description?: string;
  image?: string;
  price?: { costCNY: number; overseasPrice: number; priceLabel: string };
  profit?: { perUnit: number; margin: string; marginLabel: string };
  // 链接测款专属
  sourceUrl?: string;
  linkAnalysis?: {
    platformDetected: string;
    platformName: string;
    priceAnalysis: string;
    actionAdvice: string;
    sourcingAdvice: string;
  };
  salesData?: any;
  sellerInfo?: any;
  priceInfo?: any;
}

interface PickingSearchResult {
  keyword: string;
  platform: string;
  totalAnalyzed: number;
  summary: string;
  products: PickingProduct[];
  searchedAt: string;
}

// ============= 子组件 =============

/** 爆款概率圆环 */
function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#6366f1' : score >= 55 ? '#f59e0b' : '#ef4444';
  const bg = score >= 85 ? '#d1fae5' : score >= 70 ? '#e0e7ff' : score >= 55 ? '#fef3c7' : '#fee2e2';
  const innerSize = size - 10;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `conic-gradient(${color} ${score * 3.6}deg, ${bg} 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', flexShrink: 0,
      }}>
        <div style={{
          width: innerSize, height: innerSize, borderRadius: '50%', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size > 48 ? 16 : 13, fontWeight: 800, color,
        }}>
          {score}%
        </div>
      </div>
    </div>
  );
}

/** 维度评分条 */
function DimensionBar({ dim }: { dim: DimensionScore }) {
  const [expanded, setExpanded] = useState(false);
  const barColor = dim.score >= 70 ? '#10b981' : dim.score >= 50 ? '#6366f1' : dim.score >= 30 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ marginBottom: 6 }}>
      <div onClick={() => setExpanded(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '3px 0' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{dim.dimension}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{dim.score}分</span>
          </div>
          <div style={{ height: 5, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${dim.score}%`, background: barColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#999' }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '5px 8px', background: '#f9fafb', borderRadius: 6, marginTop: 1 }}>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 3 }}>{dim.description}</div>
          <div style={{ fontSize: 11, color: dim.score >= 70 ? '#10b981' : dim.score <= 30 ? '#ef4444' : '#6366f1' }}>
            💡 {dim.suggestion}
          </div>
        </div>
      )}
    </div>
  );
}

/** 爆款单品结果卡片 */
function ProductResultCard({ product, index }: { product: PickingProduct; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const mainColor = product.burstProbability >= 85 ? '#10b981' : product.burstProbability >= 70 ? '#6366f1' : '#f59e0b';

  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: `1.5px solid ${mainColor}20`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden',
      marginBottom: 12,
    }}>
      {/* 头部：排名 + 名称 + 评分圆环 */}
      <div style={{
        padding: '14px 16px',
        background: product.burstProbability >= 85 ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)'
          : product.burstProbability >= 70 ? 'linear-gradient(135deg, #eef2ff, #e0e7ff)'
          : 'linear-gradient(135deg, #fffbeb, #fef3c7)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            background: mainColor, color: '#fff', width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 7, fontSize: 13, fontWeight: 800, flexShrink: 0,
          }}>{index + 1}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 20 }}>{product.image || '📦'}</span>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.productName}
              </h3>
              {product.burstProbability >= 85 && <span style={{ fontSize: 14 }}>🔥</span>}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#666', background: 'rgba(255,255,255,0.7)', padding: '1px 6px', borderRadius: 3 }}>
                {product.platform.toUpperCase()}
              </span>
              {product.price?.priceLabel && (
                <span style={{ fontSize: 11, color: '#e53935', fontWeight: 700 }}>
                  售价 {product.price.priceLabel}
                </span>
              )}
              {product.profit?.marginLabel && (
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>
                  利润 {product.profit.marginLabel}
                </span>
              )}
            </div>
          </div>
        </div>
        <ScoreRing score={product.burstProbability} />
      </div>

      {/* 描述 + 优劣势 */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6' }}>
        {product.description && (
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8, lineHeight: 1.5 }}>{product.description}</div>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: product.weaknesses.length ? 6 : 0 }}>
          {product.strengths.slice(0, 4).map(s => (
            <span key={s} style={{ fontSize: 10, background: '#d1fae5', color: '#065f46', padding: '2px 7px', borderRadius: 8 }}>
              ✅ {s}
            </span>
          ))}
        </div>
        {product.weaknesses.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {product.weaknesses.slice(0, 3).map(s => (
              <span key={s} style={{ fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '2px 7px', borderRadius: 8 }}>
                ⚠️ {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 链接测款专属分析 */}
      {product.linkAnalysis && (
        <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, marginBottom: 4 }}>
            🔗 链接分析
          </div>
          <div style={{ fontSize: 11, color: '#666', lineHeight: 1.6 }}>
            <div>{product.linkAnalysis.priceAnalysis}</div>
            <div>💡 {product.linkAnalysis.sourcingAdvice}</div>
          </div>
        </div>
      )}

      {/* 展开详情 */}
      <div style={{ padding: '8px 16px' }}>
        <button onClick={() => setExpanded(v => !v)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, color: '#6366f1', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4, padding: 0,
        }}>
          <BarChart3 size={13} />
          {expanded ? '收起20维详情' : '查看20维评分详情'}
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {expanded && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 10, lineHeight: 1.6, background: '#f9fafb', padding: 8, borderRadius: 6 }}>
              {product.summary}
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>📊 各维度评分</div>
              {product.detailedAnalysis.map((dim, i) => <DimensionBar key={i} dim={dim} />)}
            </div>
            <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, marginTop: 6 }}>
              💡 {product.recommendation}
            </div>
            {product.linkAnalysis?.actionAdvice && (
              <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
                📋 {product.linkAnalysis.actionAdvice}
              </div>
            )}
            {product.sourceUrl && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
                来源: <a href={product.sourceUrl} target="_blank" rel="noreferrer" style={{ color: '#6366f1' }}>{product.sourceUrl.slice(0, 50)}...</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** 首页引导卡片 */
function IntroSection() {
  const dimensions = [
    { name: '需求趋势', weight: '10%', desc: '搜索量、话题讨论增长趋势' },
    { name: '互动率', weight: '8%', desc: '点赞/评论/分享比例' },
    { name: '销量动能', weight: '8%', desc: '销量增长速度和持续性' },
    { name: '竞争程度', weight: '8%', desc: '同类商品数量、广告竞争' },
    { name: '利润空间', weight: '7%', desc: '国内批发价与海外售价价差' },
    { name: '内容传播力', weight: '7%', desc: '适合短视频/直播展示程度' },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 10 }}>
        20维 AI 爆款评分模型
      </h3>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
        输入品类名称或商品链接，AI自动从需求、竞争、利润、内容等20个维度评估爆款潜力。
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
        {dimensions.map(d => (
          <div key={d.name} style={{ background: '#f9fafb', padding: '8px 10px', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{d.name}</span>
              <span style={{ fontSize: 10, color: '#6366f1', fontWeight: 600 }}>权重 {d.weight}</span>
            </div>
            <div style={{ fontSize: 11, color: '#888' }}>{d.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= 主页面 =============
export default function TrendingPage() {
  const [tab, setTab] = useState<'search' | 'eval-url' | 'eval-manual'>('search');

  // Tab1: AI搜索
  const [category, setCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<PickingSearchResult | null>(null);
  const [searchError, setSearchError] = useState('');

  // Tab2: 链接测款
  const [evalUrl, setEvalUrl] = useState('');
  const [evalUrlPlatform, setEvalUrlPlatform] = useState('');
  const [evaluatingUrl, setEvaluatingUrl] = useState(false);
  const [urlResult, setUrlResult] = useState<PickingProduct | null>(null);
  const [urlError, setUrlError] = useState('');

  // Tab3: 手动评估
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualCost, setManualCost] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualResult, setManualResult] = useState<PickingProduct | null>(null);
  const [evaluatingManual, setEvaluatingManual] = useState(false);
  const [manualError, setManualError] = useState('');

  const platforms = [
    { value: 'tiktok', label: '🎵 TikTok' },
    { value: 'ozon', label: '🇷🇺 OZON' },
    { value: 'shopee', label: '🇸🇬 Shopee' },
    { value: 'amazon', label: '📦 Amazon' },
  ];

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  /** Tab1: AI搜索爆款单品 */
  const handleSearch = useCallback(async () => {
    if (!category.trim() && !keyword.trim()) { setSearchError('请输入品类名称或关键词'); return; }
    setSearchError(''); setSearching(true); setResult(null);
    try {
      const res = await fetch('/api/picking/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ category: category.trim(), keyword: keyword.trim(), platform, count: 6 })
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setSearchError(data.error || '搜索失败');
    } catch (e: any) { setSearchError(e.message || '搜索失败'); }
    finally { setSearching(false); }
  }, [category, keyword, platform]);

  /** Tab2: 链接测款 */
  const handleEvalUrl = useCallback(async () => {
    if (!evalUrl.trim()) { setUrlError('请输入商品链接'); return; }
    setUrlError(''); setEvaluatingUrl(true); setUrlResult(null);
    try {
      const res = await fetch('/api/picking/evaluate-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ url: evalUrl.trim(), platform: evalUrlPlatform })
      });
      const data = await res.json();
      if (data.success) setUrlResult(data.data);
      else setUrlError(data.error || '评估失败');
    } catch (e: any) { setUrlError(e.message || '评估失败'); }
    finally { setEvaluatingUrl(false); }
  }, [evalUrl, evalUrlPlatform]);

  /** Tab3: 手动评估 */
  const handleEvalManual = useCallback(async () => {
    if (!manualName.trim()) { setManualError('请输入商品名称'); return; }
    setManualError(''); setEvaluatingManual(true); setManualResult(null);
    try {
      const res = await fetch('/api/picking/evaluate', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({
          productName: manualName.trim(), category: manualCategory.trim(),
          price: manualPrice ? parseFloat(manualPrice) : undefined,
          cost: manualCost ? parseFloat(manualCost) : undefined,
          description: manualDesc.trim()
        })
      });
      const data = await res.json();
      if (data.success) setManualResult(data.data);
      else setManualError(data.error || '评估失败');
    } catch (e: any) { setManualError(e.message || '评估失败'); }
    finally { setEvaluatingManual(false); }
  }, [manualName, manualCategory, manualPrice, manualCost, manualDesc]);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* 标题 */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>
          🔥 AI 智能选品
        </h1>
        <p style={{ color: '#888', fontSize: 14 }}>
          搜爆款单品 / 链接测款 / 手动评估 — 20维AI评分精准判断爆款潜力
        </p>
      </div>

      {/* 选项卡 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#f0f0f0', borderRadius: 10, padding: 3, width: 'fit-content', flexWrap: 'wrap' }}>
        <button onClick={() => setTab('search')} style={{
          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer',
          background: tab === 'search' ? '#fff' : 'transparent',
          color: tab === 'search' ? '#6366f1' : '#666',
          boxShadow: tab === 'search' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Search size={14} /> AI搜爆款单品
        </button>
        <button onClick={() => setTab('eval-url')} style={{
          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer',
          background: tab === 'eval-url' ? '#fff' : 'transparent',
          color: tab === 'eval-url' ? '#6366f1' : '#666',
          boxShadow: tab === 'eval-url' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Link2 size={14} /> 链接测款
        </button>
        <button onClick={() => setTab('eval-manual')} style={{
          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer',
          background: tab === 'eval-manual' ? '#fff' : 'transparent',
          color: tab === 'eval-manual' ? '#6366f1' : '#666',
          boxShadow: tab === 'eval-manual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Sparkles size={14} /> 手动评估
        </button>
      </div>

      {/* ==================== Tab1: AI搜爆款单品 ==================== */}
      {tab === 'search' && (
        <>
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20, border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <input value={category} onChange={e => setCategory(e.target.value)}
                placeholder="输入品类（如：童装、宠物用品、家居）"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 2, minWidth: 200, padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
              <input value={keyword} onChange={e => setKeyword(e.target.value)}
                placeholder="关键词（可选）"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1, minWidth: 140, padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
              <select value={platform} onChange={e => setPlatform(e.target.value)}
                style={{ padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none', cursor: 'pointer' }}>
                {platforms.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <button onClick={handleSearch} disabled={searching} style={{
                padding: '10px 22px', background: searching ? '#a5b4fc' : '#6366f1',
                color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14,
                border: 'none', cursor: searching ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              }}>
                {searching ? <><RefreshCw size={16} /> AI搜索中...</> : <><Search size={16} /> 搜爆款单品</>}
              </button>
            </div>
            {searchError && <div style={{ color: '#ef4444', fontSize: 13, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 }}>⚠️ {searchError}</div>}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#888', background: '#f8f9fa', padding: '2px 8px', borderRadius: 4 }}>💡 搜具体产品：输入"童装"，返回连衣裙、T恤、书包等具体单品</span>
            </div>
          </div>

          {result && (
            <>
              <div style={{ background: '#eef2ff', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 14 }}>
                    🔍 搜索 " {result.keyword} " — {result.platform.toUpperCase()}
                  </span>
                  <span style={{ color: '#888', fontSize: 12, marginLeft: 8 }}>
                    {result.totalAnalyzed} 个爆款单品
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#6366f1' }}>{result.summary}</div>
              </div>
              {result.products.map((product, i) => <ProductResultCard key={i} product={product} index={i} />)}
            </>
          )}

          {!searching && !result && !searchError && <IntroSection />}
        </>
      )}

      {/* ==================== Tab2: 链接测款 ==================== */}
      {tab === 'eval-url' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>🔗 链接测款</h3>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>输入任意商品链接，AI自动分析该产品爆款潜力、利润空间和可操作性</p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <input value={evalUrl} onChange={e => setEvalUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEvalUrl()}
              placeholder="粘贴商品链接（TikTok / 1688 / Amazon / OZON...）"
              style={{ flex: 1, minWidth: 250, padding: '11px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
            <select value={evalUrlPlatform} onChange={e => setEvalUrlPlatform(e.target.value)}
              style={{ padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, background: '#fff', outline: 'none', cursor: 'pointer' }}>
              <option value="">自动检测</option>
              {platforms.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button onClick={handleEvalUrl} disabled={evaluatingUrl} style={{
              padding: '11px 24px', background: evaluatingUrl ? '#a5b4fc' : '#6366f1',
              color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14,
              border: 'none', cursor: evaluatingUrl ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}>
              {evaluatingUrl ? <><RefreshCw size={16} /> 分析中...</> : '🔍 AI测款'}
            </button>
          </div>
          {urlError && <div style={{ color: '#ef4444', fontSize: 13, padding: '8px 12px', background: '#fef2f2', borderRadius: 6, marginBottom: 12 }}>⚠️ {urlError}</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['🎵 TikTok', '🏪 1688', '📦 Amazon', '🛒 OZON', '🏮 淘宝'].map(p => (
              <span key={p} style={{ padding: '2px 8px', background: '#f8f9fa', borderRadius: 4, fontSize: 11, color: '#666', border: '1px solid #eee' }}>{p}</span>
            ))}
          </div>

          {urlResult && (
            <div style={{ marginTop: 20 }}>
              <div style={{ background: '#ecfdf5', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>📋</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#065f46' }}>{urlResult.productName}</div>
                  <div style={{ fontSize: 12, color: '#047857' }}>链接测款完成 — 爆款概率 {urlResult.burstProbability}%</div>
                </div>
              </div>
              <ProductResultCard product={urlResult} index={0} />
            </div>
          )}

          {!evaluatingUrl && !urlResult && !urlError && (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#bbb', border: '2px dashed #e8e8e8', borderRadius: 12, marginTop: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🔗</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#666' }}>链接测款</div>
              <div style={{ fontSize: 12 }}>输入商品链接，AI自动分析爆款潜力和可行性</div>
            </div>
          )}
        </div>
      )}

      {/* ==================== Tab3: 手动评估 ==================== */}
      {tab === 'eval-manual' && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>📝 手动评估</h3>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>输入产品基本信息，AI自动进行20维评分评估爆款潜力</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <input value={manualName} onChange={e => setManualName(e.target.value)}
              placeholder="商品名称 *" style={{ padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
            <input value={manualCategory} onChange={e => setManualCategory(e.target.value)}
              placeholder="品类（如：童装、宠物用品）" style={{ padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
            <input value={manualPrice} onChange={e => setManualPrice(e.target.value)}
              placeholder="售价（选填）" type="number" style={{ padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
            <input value={manualCost} onChange={e => setManualCost(e.target.value)}
              placeholder="进货成本（选填）" type="number" style={{ padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
          </div>
          <textarea value={manualDesc} onChange={e => setManualDesc(e.target.value)}
            placeholder="产品描述（选填，写得越详细评分越准）"
            rows={3} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }} />
          
          <button onClick={handleEvalManual} disabled={evaluatingManual || !manualName.trim()} style={{
            padding: '11px 28px', background: evaluatingManual || !manualName.trim() ? '#a5b4fc' : '#6366f1',
            color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14,
            border: 'none', cursor: evaluatingManual || !manualName.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {evaluatingManual ? <><RefreshCw size={16} /> 评估中...</> : '🚀 开始评估'}
          </button>
          {manualError && <div style={{ color: '#ef4444', fontSize: 13, padding: '8px 12px', background: '#fef2f2', borderRadius: 6, marginTop: 8 }}>⚠️ {manualError}</div>}

          {manualResult && (
            <div style={{ marginTop: 20 }}>
              <div style={{ background: '#eef2ff', borderRadius: 8, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>📝</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#3730a3' }}>{manualResult.productName}</div>
                  <div style={{ fontSize: 12, color: '#6366f1' }}>手工评估完成 — 爆款概率 {manualResult.burstProbability}%</div>
                </div>
              </div>
              <ProductResultCard product={manualResult} index={0} />
            </div>
          )}

          {!evaluatingManual && !manualResult && !manualError && (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: '#bbb', border: '2px dashed #e8e8e8', borderRadius: 12, marginTop: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#666' }}>手动评估</div>
              <div style={{ fontSize: 12 }}>填写产品信息，AI 综合20个维度评估爆款可能性</div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}