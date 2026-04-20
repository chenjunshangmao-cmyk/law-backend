/**
 * ProductsPage - 产品管理页
 */
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Product {
  id: string;
  title: string;
  price: number;
  cost?: number;
  images: string[];
  category?: string;
  status?: string;
  createdAt?: string;
  source?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  useEffect(() => { loadProducts(); }, [page, search]);

  async function loadProducts() {
    setLoading(true);
    try {
      const result = await api.products.list({ page, limit, search: search || undefined });
      const list = result?.data || result || [];
      setProducts(Array.isArray(list) ? list : []);
      setTotal(result?.total || list.length || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个产品吗？')) return;
    try {
      await api.products.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function selectAll() {
    if (selected.length === products.length) setSelected([]);
    else setSelected(products.map(p => p.id));
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>📦 产品管理</h2>
        <a href="/publish" style={{ padding: '10px 20px', background: '#059669', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
          ➕ 添加产品
        </a>
      </div>

      {/* 搜索 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb', display: 'flex', gap: 12 }}>
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          onKeyDown={e => e.key === 'Enter' && setPage(1)}
          placeholder="搜索产品名称..."
          style={{ flex: 1, padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none' }}
        />
        <button onClick={() => setPage(1)} style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>搜索</button>
        <button onClick={() => { setSearch(''); setPage(1); }} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' }}>重置</button>
      </div>

      {/* 操作栏 */}
      {selected.length > 0 && (
        <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#2563eb', fontWeight: 600 }}>已选择 {selected.length} 项</span>
          <button onClick={() => selected.forEach(id => handleDelete(id))} style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>批量删除</button>
          <button onClick={() => setSelected([])} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>取消选择</button>
        </div>
      )}

      {/* 产品列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>⏳ 加载中...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 15 }}>暂无产品</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>前往「智能发布」添加第一个产品</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {products.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <div style={{ position: 'relative', aspectRatio: '1', background: '#f9fafb' }}>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#d1d5db', fontSize: 40 }}>🖼️</div>
                )}
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={() => toggleSelect(p.id)}
                  style={{ position: 'absolute', top: 8, left: 8, width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#059669', marginBottom: 8 }}>${p.price?.toFixed(2)}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleDelete(p.id)} style={{ flex: 1, padding: '6px 0', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>删除</button>
                  <button onClick={() => { /* 编辑 */ }} style={{ flex: 1, padding: '6px 0', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>编辑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? '#d1d5db' : '#374151' }}>上一页</button>
          <span style={{ padding: '8px 16px', fontSize: 14, color: '#374151' }}>第 {page} / {totalPages} 页，共 {total} 条</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', color: page >= totalPages ? '#d1d5db' : '#374151' }}>下一页</button>
        </div>
      )}
    </div>
  );
}
