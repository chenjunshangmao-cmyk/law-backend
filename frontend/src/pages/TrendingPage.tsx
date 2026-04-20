/**
 * TrendingPage - 爆款选品页
 * Bug1 修复：产品图片未关联问题
 */
import React, { useState } from 'react';
import { api } from '../services/api';

interface TrendingProduct {
  title: string;
  price: number;
  originalPrice?: number;
  images: string[];
  url: string;
  platform: string;
  sales?: number;
  rating?: number;
  description?: string;
}

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div style={{
        width: '100%', aspectRatio: '1', background: '#f5f5f5',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#bbb', fontSize: 12, gap: 6, borderRadius: 8,
      }}>
        <span style={{ fontSize: 32 }}>🖼️</span>
        <span>{error ? '图片加载失败' : '暂无图片'}</span>
      </div>
    );
  }
  return (
    <img src={src} alt={alt} onError={() => setError(true)}
      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, display: 'block' }} />
  );
}

function ProductCard({ product }: { product: TrendingProduct }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showInput, setShowInput] = useState(false);

  const displayImage = product.images?.[0] || imageUrl || '';

  async function handleSave() {
    setSaving(true);
    try {
      const finalImages = imageUrl
        ? [...(product.images || []).filter(Boolean), imageUrl]
        : product.images || [];
      await api.products.create({
        title: product.title,
        price: product.price,
        cost: product.originalPrice,
        images: finalImages,
        source: product.platform,
        url: product.url,
        description: product.description,
        status: 'draft',
      });
      setSaved(true);
    } catch (e: any) {
      alert('保存失败：' + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      background: '#fff', borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0',
    }}>
      <div style={{ position: 'relative', padding: '12px 12px 0' }}>
        <ProductImage src={displayImage} alt={product.title} />
        <div style={{
          position: 'absolute', top: 18, left: 18,
          background: '#6366f1', color: '#fff',
          padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
        }}>
          {product.platform.toUpperCase()}
        </div>
        {!product.images?.[0] && (
          <button onClick={() => setShowInput(v => !v)} style={{
            position: 'absolute', top: 18, right: 18,
            background: 'rgba(0,0,0,0.6)', color: '#fff',
            padding: '4px 8px', borderRadius: 4, fontSize: 11, border: 'none', cursor: 'pointer',
          }}>
            🔗 补充图片
          </button>
        )}
      </div>

      {showInput && (
        <div style={{ padding: '8px 12px 0', display: 'flex', gap: 6 }}>
          <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
            placeholder="粘贴图片 URL..."
            style={{ flex: 1, padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12 }} />
          <button onClick={() => setShowInput(false)} style={{
            padding: '6px 10px', background: '#6366f1', color: '#fff',
            borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
          }}>确认</button>
        </div>
      )}

      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginBottom: 8, lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {product.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#e53935' }}>¥{product.price.toFixed(2)}</span>
          {product.originalPrice && (
            <span style={{ fontSize: 12, color: '#bbb', textDecoration: 'line-through' }}>¥{product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        {(product.sales || product.rating) && (
          <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#888', marginBottom: 10 }}>
            {product.sales && <span>🛒 {product.sales.toLocaleString()} 件</span>}
            {product.rating && <span>⭐ {product.rating}</span>}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={product.url} target="_blank" rel="noreferrer" style={{
            flex: 1, textAlign: 'center', padding: '8px 0',
            border: '1px solid #e0e0e0', borderRadius: 7, fontSize: 12, color: '#666',
          }}>查看原链</a>
          <button onClick={handleSave} disabled={saving || saved} style={{
            flex: 2, padding: '8px 0', borderRadius: 7, fontSize: 12, fontWeight: 600,
            background: saved ? '#10b981' : '#6366f1',
            color: '#fff', border: 'none', cursor: saving || saved ? 'default' : 'pointer',
          }}>
            {saving ? '保存中...' : saved ? '✓ 已保存' : '保存到产品库'}
          </button>
        </div>
      </div>
    </div>
  );
}

function detectPlatform(u: string): string {
  if (u.includes('tiktok')) return 'tiktok';
  if (u.includes('1688')) return '1688';
  if (u.includes('taobao')) return 'taobao';
  if (u.includes('amazon')) return 'amazon';
  return 'other';
}

export default function TrendingPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [error, setError] = useState('');

  async function handleFetch() {
    if (!url.trim()) { setError('请输入商品链接'); return; }
    setError('');
    setLoading(true);
    setProducts([]);
    try {
      const result = await api.scraper.fetch(url.trim());
      const data = result?.data || result;
      const list: TrendingProduct[] = [];

      if (data?.title) {
        list.push({
          title: data.title,
          price: parseFloat(data.price) || 0,
          originalPrice: parseFloat(data.originalPrice) || undefined,
          images: Array.isArray(data.images) ? data.images.filter(Boolean) : (data.image ? [data.image] : []),
          url: data.url || url,
          platform: data.platform || detectPlatform(url),
          sales: data.sales,
          rating: data.rating,
          description: data.description,
        });
      } else if (Array.isArray(data)) {
        data.forEach((item: any) => {
          list.push({
            title: item.title || '未知商品',
            price: parseFloat(item.price) || 0,
            originalPrice: parseFloat(item.originalPrice) || undefined,
            images: Array.isArray(item.images) ? item.images.filter(Boolean) : (item.image ? [item.image] : []),
            url: item.url || url,
            platform: item.platform || detectPlatform(url),
            sales: item.sales,
            rating: item.rating,
          });
        });
      }

      if (list.length === 0) {
        setError('未能采集到商品数据，请检查链接或稍后重试');
      } else {
        setProducts(list);
      }
    } catch (e: any) {
      setError(e.message || '采集失败，请检查链接后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', marginBottom: 6 }}>🔥 爆款选品</h1>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>输入商品链接，自动抓取产品信息和图片</p>

      <div style={{
        background: '#fff', borderRadius: 14, padding: 24,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24, border: '1px solid #f0f0f0',
      }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: error ? 12 : 0 }}>
          <input
            value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFetch()}
            placeholder="粘贴商品链接（支持 TikTok、1688、Amazon、OZON...）"
            style={{ flex: 1, padding: '12px 16px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 14, outline: 'none' }}
          />
          <button onClick={handleFetch} disabled={loading} style={{
            padding: '12px 28px', background: loading ? '#a5b4fc' : '#6366f1',
            color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14,
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
          }}>
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }} />
                采集中...
              </>
            ) : '🔍 开始采集'}
          </button>
        </div>
        {error && (
          <div style={{ color: '#ef4444', fontSize: 13, marginTop: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 }}>
            ⚠️ {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {['🎵 TikTok', '🏪 1688', '📦 Amazon', '🛒 OZON', '🏮 淘宝'].map(p => (
            <span key={p} style={{ padding: '3px 10px', background: '#f8f9fa', borderRadius: 6, fontSize: 12, color: '#666', border: '1px solid #eee' }}>
              {p}
            </span>
          ))}
        </div>
      </div>

      {products.length > 0 && (
        <>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>
              采集结果（{products.length} 件）
            </h2>
            {products.filter(p => !p.images?.length).length > 0 && (
              <span style={{ fontSize: 12, color: '#f59e0b', background: '#fffbeb', padding: '3px 8px', borderRadius: 4 }}>
                ⚠️ {products.filter(p => !p.images?.length).length} 件无图片
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {products.map((p, i) => <ProductCard key={i} product={p} />)}
          </div>
        </>
      )}

      {!loading && products.length === 0 && !error && (
        <div style={{
          textAlign: 'center', padding: '60px 20px', color: '#bbb',
          background: '#fff', borderRadius: 14, border: '2px dashed #e8e8e8',
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔥</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>开始选品</div>
          <div style={{ fontSize: 13 }}>粘贴商品链接，AI 自动帮你抓取产品信息和图片</div>
        </div>
      )}
    </div>
  );
}
