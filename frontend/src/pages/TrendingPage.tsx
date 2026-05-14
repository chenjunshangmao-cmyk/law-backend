/**
 * TrendingPage - AI智能选品（升级版）
 * 20维评分模型 + AI搜索 + 链接采集
 */
import React, { useState, useCallback } from 'react';
import { api } from '../services/api';
import {
  Search, Sparkles, Link2,
  ChevronDown, ChevronUp,
  BarChart3, RefreshCw
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
  priceEstimate?: { wholesale: number; retailCN: number; retailOverseas: number };
  profitEstimate?: { perUnit: number; margin: string };
  suggestedPrice?: string;
  marketInsight?: string;
}

interface PickingResult {
  category: string;
  platform: string;
  keyword: string;
  totalAnalyzed: number;
  marketSummary: string;
  products: PickingProduct[];
  searchedAt: string;
}

// ============= 子组件 =============

/** 爆款概率圆环 */
function ScoreRing({ score }: { score: number }) {
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#6366f1' : score >= 55 ? '#f59e0b' : '#ef4444';
  const bg = score >= 85 ? '#d1fae5' : score >= 70 ? '#e0e7ff' : score >= 55 ? '#fef3c7' : '#fee2e2';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: `conic-gradient(${color} ${score * 3.6}deg, ${bg} 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', flexShrink: 0,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color,
        }}>
          {score}%
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>爆款概率</div>
        <div style={{ fontSize: 12, color: '#888' }}>
          {score >= 85 ? '🔥 强烈推荐' : score >= 70 ? '⭐ 推荐' : score >= 55 ? '📊 可尝试' : '⚠️ 谨慎'}
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
    <div style={{ marginBottom: 8 }}>
      <div onClick={() => setExpanded(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{dim.dimension}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>{dim.score}分</span>
          </div>
          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${dim.score}%`, background: barColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#999' }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '6px 10px', background: '#f9fafb', borderRadius: 6, marginTop: 2 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{dim.description}</div>
          <div style={{ fontSize: 11, color: dim.score >= 70 ? '#10b981' : dim.score <= 30 ? '#ef4444' : '#6366f1' }}>
            💡 {dim.suggestion}
          </div>
        </div>
      )}
    </div>
  );
}

/** 选品结果卡片 */
function ProductResultCard({ product, index }: { product: PickingProduct; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const mainColor = product.burstProbability >= 85 ? '#10b981' : product.burstProbability >= 70 ? '#6366f1' : '#f59e0b';

  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: `1.5px solid ${mainColor}20`,
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* 头部 */}
      <div style={{
        padding: '16px 18px',
        background: product.burstProbability >= 85
          ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)'
          : product.burstProbability >= 70
          ? 'linear-gradient(135deg, #eef2ff, #e0e7ff)'
          : 'linear-gradient(135deg, #fffbeb, #fef3c7)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              background: mainColor, color: '#fff', width: 24, height: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6, fontSize: 12, fontWeight: 800,
            }}>{index + 1}</span>
            <span style={{ background: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: '#666' }}>
              {product.platform}
            </span>
            {product.burstProbability >= 85 && <span style={{ fontSize: 16 }}>🔥</span>}
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', margin: 0, lineHeight: 1.4 }}>
            {product.productName}
          </h3>
        </div>
        <ScoreRing score={product.burstProbability} />
      </div>

      {/* 概要 */}
      <div style={{ padding: '12px 18px', display: 'flex', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid #f0f0f0' }}>
        {product.suggestedPrice && (
          <div>
            <div style={{ fontSize: 11, color: '#999' }}>参考售价</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e53935' }}>{product.suggestedPrice}</div>
          </div>
        )}
        {product.profitEstimate && (
          <div>
            <div style={{ fontSize: 11, color: '#999' }}>利润空间</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{product.profitEstimate.margin}</div>
          </div>
        )}
        {product.riskLevel && (
          <div>
            <div style={{ fontSize: 11, color: '#999' }}>风险等级</div>
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: product.riskLevel === '低风险' ? '#10b981' : product.riskLevel === '中等风险' ? '#f59e0b' : '#ef4444'
            }}>
              {product.riskLevel === '低风险' ? '✅ ' : product.riskLevel === '中等风险' ? '⚠️ ' : '🔴 '}
              {product.riskLevel}
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize: 11, color: '#999' }}>品类</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{product.category}</div>
        </div>
      </div>

      {/* 优势/劣势 */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: product.weaknesses.length ? 8 : 0 }}>
          {product.strengths.slice(0, 4).map(s => (
            <span key={s} style={{ fontSize: 11, background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: 10 }}>
              ✅ {s}
            </span>
          ))}
        </div>
        {product.weaknesses.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {product.weaknesses.slice(0, 3).map(s => (
              <span key={s} style={{ fontSize: 11, background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: 10 }}>
                ⚠️ {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 展开详情 */}
      <div style={{ padding: '10px 18px' }}>
        <button onClick={() => setExpanded(v => !v)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: '#6366f1', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 4, padding: 0,
        }}>
          <BarChart3 size={14} />
          {expanded ? '收起详情' : '查看20维评分详情'}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {expanded && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12, lineHeight: 1.6, background: '#f9fafb', padding: 10, borderRadius: 8 }}>
              {product.summary}
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>📊 各维度评分</div>
              {product.detailedAnalysis.map((dim, i) => <DimensionBar key={i} dim={dim} />)}
            </div>
            <div style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, marginTop: 8 }}>
              💡 {product.recommendation}
            </div>
            {product.marketInsight && (
              <div style={{ fontSize: 12, color: '#888', marginTop: 8, fontStyle: 'italic' }}>
                市场洞察：{product.marketInsight}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** 维度说明卡片 */
function DimensionsIntro() {
  const dimensions = [
    { name: '需求趋势', weight: '10%', desc: '搜索量、话题讨论增长趋势' },
    { name: '互动率', weight: '8%', desc: '点赞/评论/分享比例' },
    { name: '销量动能', weight: '8%', desc: '销量增长速度和持续性' },
    { name: '竞争程度', weight: '8%', desc: '同类商品数量、广告竞争' },
    { name: '利润空间', weight: '7%', desc: '国内批发价与海外售价价差' },
    { name: '内容传播力', weight: '7%', desc: '适合短视频/直播展示程度' },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: 20, marginBottom: 24 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
        20维 AI 爆款评分模型
      </h3>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>
        从需求、竞争、利润、内容、物流等20个维度综合评估，AI自动分析爆款潜力。
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
        {dimensions.map(d => (
          <div key={d.name} style={{ background: '#f9fafb', padding: '10px 12px', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{d.name}</span>
              <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>权重 {d.weight}</span>
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
  const [tab, setTab] = useState<'ai-picking' | 'link-scraper'>('ai-picking');

  // AI选品搜索
  const [category, setCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<PickingResult | null>(null);
  const [searchError, setSearchError] = useState('');

  // 链接采集
  const [url, setUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapedProducts, setScrapedProducts] = useState<any[]>([]);
  const [scrapeError, setScrapeError] = useState('');

  const platforms = [
    { value: 'tiktok', label: '🎵 TikTok' },
    { value: 'ozon', label: '🇷🇺 OZON' },
    { value: 'shopee', label: '🇸🇬 Shopee' },
    { value: 'amazon', label: '📦 Amazon' },
  ];

  /** AI选品搜索 */
  const handleSearch = useCallback(async () => {
    if (!category.trim() && !keyword.trim()) {
      setSearchError('请输入品类名称或搜索关键词');
      return;
    }
    setSearchError('');
    setSearching(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/picking/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: category.trim(),
          keyword: keyword.trim(),
          platform,
          count: 8
        })
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setSearchError(data.error || '搜索失败');
      }
    } catch (e: any) {
      setSearchError(e.message || '搜索失败，请检查后端服务');
    } finally {
      setSearching(false);
    }
  }, [category, keyword, platform]);

  /** 链接采集 */
  const handleScrape = useCallback(async () => {
    if (!url.trim()) { setScrapeError('请输入商品链接'); return; }
    setScrapeError('');
    setScraping(true);
    setScrapedProducts([]);
    try {
      const res = await api.scraper.fetch(url.trim());
      const data = res?.data || res;
      const list: any[] = [];

      if (data?.title) {
        list.push({
          title: data.title, price: parseFloat(data.price) || 0,
          originalPrice: parseFloat(data.originalPrice) || undefined,
          images: Array.isArray(data.images) ? data.images.filter(Boolean) : (data.image ? [data.image] : []),
          url: data.url || url, platform: data.platform || detectPlatform(url),
          sales: data.sales, rating: data.rating, description: data.description,
        });
      } else if (Array.isArray(data)) {
        data.forEach((item: any) => {
          list.push({
            title: item.title || '未知商品', price: parseFloat(item.price) || 0,
            originalPrice: parseFloat(item.originalPrice) || undefined,
            images: Array.isArray(item.images) ? item.images.filter(Boolean) : (item.image ? [item.image] : []),
            url: item.url || url, platform: item.platform || detectPlatform(url),
            sales: item.sales, rating: item.rating,
          });
        });
      }

      if (list.length === 0) {
        setScrapeError('未能采集到商品数据，请检查链接或稍后重试');
      } else {
        setScrapedProducts(list);
      }
    } catch (e: any) {
      setScrapeError(e.message || '采集失败，请检查链接后重试');
    } finally {
      setScraping(false);
    }
  }, [url]);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* 标题 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>
          🔥 AI 智能选品
        </h1>
        <p style={{ color: '#888', fontSize: 14 }}>
          20维AI评分模型 + 全网数据源，智能筛选跨境爆款
        </p>
      </div>

      {/* 选项卡 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f0f0f0', borderRadius: 10, padding: 3, width: 'fit-content' }}>
        <button onClick={() => setTab('ai-picking')} style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer',
          background: tab === 'ai-picking' ? '#fff' : 'transparent',
          color: tab === 'ai-picking' ? '#6366f1' : '#666',
          boxShadow: tab === 'ai-picking' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Sparkles size={14} /> AI爆款搜索
        </button>
        <button onClick={() => setTab('link-scraper')} style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer',
          background: tab === 'link-scraper' ? '#fff' : 'transparent',
          color: tab === 'link-scraper' ? '#6366f1' : '#666',
          boxShadow: tab === 'link-scraper' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Link2 size={14} /> 链接采集
        </button>
      </div>

      {/* ===== AI选品搜索 ===== */}
      {tab === 'ai-picking' && (
        <>
          <div style={{
            background: '#fff', borderRadius: 14, padding: 24,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24,
            border: '1px solid #f0f0f0',
          }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <input value={category} onChange={e => setCategory(e.target.value)}
                placeholder="输入品类名称（如：童装、宠物用品、家居）"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 2, minWidth: 200, padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
              <input value={keyword} onChange={e => setKeyword(e.target.value)}
                placeholder="搜索关键词（可选）"
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1, minWidth: 150, padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
              <select value={platform} onChange={e => setPlatform(e.target.value)}
                style={{ padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none', cursor: 'pointer' }}>
                {platforms.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <button onClick={handleSearch} disabled={searching} style={{
                padding: '10px 24px', background: searching ? '#a5b4fc' : '#6366f1',
                color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14,
                border: 'none', cursor: searching ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
              }}>
                {searching ? <><RefreshCw size={16} /> 分析中...</> : <><Search size={16} /> AI 搜索评估</>}
              </button>
            </div>
            {searchError && (
              <div style={{ color: '#ef4444', fontSize: 13, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 }}>
                ⚠️ {searchError}
              </div>
            )}
          </div>

          {/* 结果 */}
          {result && (
            <>
              <div style={{
                background: '#fff', borderRadius: 12, padding: '14px 18px',
                marginBottom: 20, border: '1px solid #e0e7ff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
              }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#1a1a2e' }}>
                    「{result.category}」专攻 {result.platform.toUpperCase()}
                  </span>
                  <span style={{ color: '#888', fontSize: 13, marginLeft: 10 }}>
                    {result.totalAnalyzed} 个候选品
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#6366f1' }}>{result.marketSummary}</div>
              </div>
              {result.products.map((product, i) => <ProductResultCard key={i} product={product} index={i} />)}
            </>
          )}

          {!searching && !result && !searchError && <DimensionsIntro />}
        </>
      )}

      {/* ===== 链接采集 ===== */}
      {tab === 'link-scraper' && (
        <div style={{
          background: '#fff', borderRadius: 14, padding: 24,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24,
          border: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: scrapeError ? 12 : 0 }}>
            <input value={url} onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleScrape()}
              placeholder="粘贴商品链接（支持 TikTok、1688、Amazon、OZON...）"
              style={{ flex: 1, padding: '12px 16px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
            <button onClick={handleScrape} disabled={scraping} style={{
              padding: '12px 28px', background: scraping ? '#a5b4fc' : '#6366f1',
              color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14,
              border: 'none', cursor: scraping ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            }}>
              {scraping ? <><RefreshCw size={16} /> 采集中...</> : '🔍 开始采集'}
            </button>
          </div>
          {scrapeError && (
            <div style={{ color: '#ef4444', fontSize: 13, marginTop: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 }}>
              ⚠️ {scrapeError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {['🎵 TikTok', '🏪 1688', '📦 Amazon', '🛒 OZON', '🏮 淘宝'].map(p => (
              <span key={p} style={{ padding: '3px 10px', background: '#f8f9fa', borderRadius: 6, fontSize: 12, color: '#666', border: '1px solid #eee' }}>
                {p}
              </span>
            ))}
          </div>

          {scrapedProducts.length > 0 && (
            <>
              <div style={{ marginTop: 24, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>
                  采集结果（{scrapedProducts.length} 件）
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {scrapedProducts.map((p, i) => <ScrapedCard key={i} product={p} />)}
              </div>
            </>
          )}

          {!scraping && scrapedProducts.length === 0 && !scrapeError && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#bbb', border: '2px dashed #e8e8e8', borderRadius: 12, marginTop: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: '#666' }}>商品链接采集</div>
              <div style={{ fontSize: 13 }}>粘贴商品链接，自动抓取产品信息和图片</div>
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

// ============= 链接采集卡片 =============

function detectPlatform(u: string): string {
  if (u.includes('tiktok')) return 'tiktok';
  if (u.includes('1688')) return '1688';
  if (u.includes('taobao')) return 'taobao';
  if (u.includes('amazon')) return 'amazon';
  return 'other';
}

function ScrapedCard({ product }: { product: any }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showInput, setShowInput] = useState(false);

  const displayImage = product.images?.[0] || imageUrl || '';

  async function handleSave() {
    setSaving(true);
    try {
      const finalImages = imageUrl ? [...(product.images || []).filter(Boolean), imageUrl] : product.images || [];
      await api.products.create({
        title: product.title, price: product.price, cost: product.originalPrice,
        images: finalImages, source: product.platform, url: product.url,
        description: product.description, status: 'draft',
      });
      setSaved(true);
    } catch (e: any) {
      alert('保存失败：' + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
      <div style={{ position: 'relative', padding: '12px 12px 0' }}>
        {displayImage ? (
          <img src={displayImage} alt={product.title}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, display: 'block' }} />
        ) : (
          <div style={{ width: '100%', aspectRatio: '1', background: '#f5f5f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 12, gap: 6, borderRadius: 8 }}>
            <span style={{ fontSize: 32 }}>🖼️</span>
            <span>暂无图片</span>
          </div>
        )}
        <div style={{ position: 'absolute', top: 18, left: 18, background: '#6366f1', color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
          {product.platform?.toUpperCase() || 'OTHER'}
        </div>
        {!product.images?.[0] && (
          <button onClick={() => setShowInput(v => !v)} style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 11, border: 'none', cursor: 'pointer' }}>
            🔗 补充图片
          </button>
        )}
      </div>

      {showInput && (
        <div style={{ padding: '8px 12px 0', display: 'flex', gap: 6 }}>
          <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
            placeholder="粘贴图片 URL..." style={{ flex: 1, padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12 }} />
          <button onClick={() => setShowInput(false)} style={{ padding: '6px 10px', background: '#6366f1', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12 }}>确认</button>
        </div>
      )}

      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginBottom: 8, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {product.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#e53935' }}>¥{product.price?.toFixed(2)}</span>
          {product.originalPrice && <span style={{ fontSize: 12, color: '#bbb', textDecoration: 'line-through' }}>¥{product.originalPrice.toFixed(2)}</span>}
        </div>
        {(product.sales || product.rating) && (
          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#888', marginBottom: 10 }}>
            {product.sales && <span>🛒 {product.sales.toLocaleString()} 件</span>}
            {product.rating && <span>⭐ {product.rating}</span>}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={product.url} target="_blank" rel="noreferrer" style={{ flex: 1, textAlign: 'center', padding: '8px 0', border: '1px solid #e0e0e0', borderRadius: 7, fontSize: 12, color: '#666' }}>
            查看原链
          </a>
          <button onClick={handleSave} disabled={saving || saved} style={{
            flex: 2, padding: '8px 0', borderRadius: 7, fontSize: 12, fontWeight: 600,
            background: saved ? '#10b981' : '#6366f1', color: '#fff',
            border: 'none', cursor: saving || saved ? 'default' : 'pointer',
          }}>
            {saving ? '保存中...' : saved ? '✓ 已保存' : '保存到产品库'}
          </button>
        </div>
      </div>
    </div>
  );
}