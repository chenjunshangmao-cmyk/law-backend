/**
 * ProductsPage - 产品管理页（支持采集入库、编辑、发布到OZON）
 */
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Product {
  id: string;
  name?: string;
  title?: string;
  price: number;
  cost?: number;
  images: string[];
  category?: string;
  status?: string;
  source?: string;
  sourceUrl?: string;
  description?: string;
  specs?: string;
  platformData?: Record<string, any>;
  createdAt?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionMsg, setActionMsg] = useState<{ type: string; text: string } | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => { loadProducts(); }, [page, search]);

  function showMsg(type: 'success' | 'error' | 'info', text: string) {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3000);
  }

  async function loadProducts() {
    setLoading(true);
    try {
      const result = await api.products.list({ page, limit, search: search || undefined });
      const data = result?.data || result || {};
      const list = data.products || data.data?.products || [];
      setProducts(Array.isArray(list) ? list : []);
      setTotal(data.total || list.length || 0);
    } catch (err) {
      console.error('加载产品失败:', err);
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
      showMsg('success', '已删除');
    } catch (err: any) {
      showMsg('error', err.message || '删除失败');
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function selectAll() {
    if (selected.length === products.length) setSelected([]);
    else setSelected(products.map(p => p.id));
  }

  // 发布到 OZON
  async function handlePublishOzon(product: Product) {
    const name = product.name || product.title || '';
    if (!name) {
      showMsg('error', '产品名称不能为空');
      return;
    }

    setPublishingId(product.id);
    try {
      // 先更新产品状态
      // 然后调 OZON 发布接口
      // 简化版：跳转到 OZON 发布页并携带产品数据
      const productData = {
        name: product.name || product.title,
        price: String(product.price || product.cost || 0),
        images: product.images || [],
        description: product.description || product.specs || '',
        sourceUrl: product.sourceUrl || ''
      };

      // 用 sessionStorage 传递产品数据到发布页
      sessionStorage.setItem('ozon_publish_product', JSON.stringify(productData));

      // 跳转到 OZON 发布页
      window.location.href = '/ozon-publish';

    } catch (err: any) {
      showMsg('error', err.message || '发布失败');
    } finally {
      setPublishingId(null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* 提示消息 */}
      {actionMsg && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 1000,
          padding: '12px 20px', borderRadius: 10,
          background: actionMsg.type === 'success' ? '#065f46' :
                      actionMsg.type === 'error' ? '#991b1b' : '#1e40af',
          color: '#fff', fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideIn 0.3s ease'
        }}>
          {actionMsg.text}
        </div>
      )}

      {/* 头部 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>📦 产品库</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            采集来的商品都在这里，编辑后可发布到各平台
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => loadProducts()} style={{
            padding: '10px 18px', background: '#fff', border: '1px solid #d1d5db',
            borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500
          }}>🔄 刷新</button>
          <a href="/ozon-publish" style={{
            padding: '10px 20px', background: '#059669', color: '#fff',
            borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14
          }}>➕ 手动添加</a>
        </div>
      </div>

      {/* 搜索 */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
        border: '1px solid #e5e7eb', display: 'flex', gap: 12
      }}>
        <input
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          onKeyDown={e => e.key === 'Enter' && setPage(1)}
          placeholder="搜索产品名称..."
          style={{
            flex: 1, padding: '8px 14px', border: '1px solid #d1d5db',
            borderRadius: 8, fontSize: 14, outline: 'none'
          }}
        />
        <button onClick={() => setPage(1)}
          style={{
            padding: '8px 20px', background: '#2563eb', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600
          }}>搜索</button>
        <button onClick={() => { setSearch(''); setPage(1); }}
          style={{
            padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db',
            borderRadius: 8, cursor: 'pointer'
          }}>重置</button>
      </div>

      {/* 操作栏 */}
      {selected.length > 0 && (
        <div style={{
          background: '#eff6ff', borderRadius: 8, padding: '10px 16px',
          marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12
        }}>
          <span style={{ fontSize: 14, color: '#2563eb', fontWeight: 600 }}>
            已选择 {selected.length} 项
          </span>
          <button onClick={() => selected.forEach(id => handleDelete(id))}
            style={{
              padding: '6px 12px', background: '#dc2626', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13
            }}>批量删除</button>
          <button onClick={() => setSelected([])}
            style={{
              padding: '6px 12px', background: '#fff', border: '1px solid #d1d5db',
              borderRadius: 6, cursor: 'pointer', fontSize: 13
            }}>取消选择</button>
        </div>
      )}

      {/* 产品列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>⏳ 加载中...</div>
      ) : products.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px', color: '#9ca3af',
          background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>产品库还是空的</div>
          <p style={{ fontSize: 14, marginTop: 8, maxWidth: 400, margin: '8px auto 20px', lineHeight: 1.6 }}>
            在 1688 商品页面点击 Claw 扩展的「采集」按钮，商品会自动存入这里。<br/>
            也可以手动添加商品。
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href="/ozon-publish" style={{
              padding: '10px 24px', background: '#059669', color: '#fff',
              borderRadius: 8, textDecoration: 'none', fontWeight: 600
            }}>➕ 手动添加</a>
            <span style={{ padding: '10px 24px', background: '#f3f4f6', color: '#6b7280',
              borderRadius: 8, cursor: 'default', fontSize: 14
            }}>📥 或用扩展采集</span>
          </div>
        </div>
      ) : (
        <>
          {/* 统计 */}
          <div style={{
            display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap'
          }}>
            <div style={{
              background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb',
              padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ fontSize: 20 }}>📦</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{total}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>总计</div>
              </div>
            </div>
            <div style={{
              background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb',
              padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ fontSize: 20 }}>🟢</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {products.filter(p => p.source === '1688').length}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>1688 采集</div>
              </div>
            </div>
            <div style={{
              background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb',
              padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ fontSize: 20 }}>🟦</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {products.filter(p => p.platformData?.ozon).length}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>已发 OZON</div>
              </div>
            </div>
          </div>

          {/* 网格列表 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16
          }}>
            {products.map(p => {
              const name = p.name || p.title || '未命名';
              const isPublishing = publishingId === p.id;
              const hasOzon = p.platformData?.ozon;
              const isFrom1688 = p.source === '1688';

              return (
                <div key={p.id} style={{
                  background: '#fff', borderRadius: 12, overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  transition: 'box-shadow 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  {/* 图片 */}
                  <div style={{
                    position: 'relative', aspectRatio: '1', background: '#f9fafb'
                  }}>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: '100%', color: '#d1d5db', fontSize: 48
                      }}>🖼️</div>
                    )}
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      style={{
                        position: 'absolute', top: 8, left: 8,
                        width: 18, height: 18, cursor: 'pointer'
                      }}
                    />
                    {isFrom1688 && (
                      <span style={{
                        position: 'absolute', top: 8, right: 8,
                        background: '#ff6a00', color: '#fff',
                        padding: '2px 8px', borderRadius: 6,
                        fontSize: 11, fontWeight: 600
                      }}>1688</span>
                    )}
                    {hasOzon && (
                      <span style={{
                        position: 'absolute', bottom: 8, right: 8,
                        background: '#005BFF', color: '#fff',
                        padding: '2px 8px', borderRadius: 6,
                        fontSize: 11, fontWeight: 600
                      }}>OZON</span>
                    )}
                  </div>

                  {/* 信息 */}
                  <div style={{ padding: 12 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 600, marginBottom: 4,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={name}>
                      {name}
                    </div>
                    <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                      ¥{p.price || p.cost || 0}
                    </div>

                    {/* 操作按钮 */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handlePublishOzon(p)}
                        disabled={isPublishing}
                        style={{
                          flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600,
                          background: hasOzon ? '#f0f4ff' : '#005BFF',
                          color: hasOzon ? '#005BFF' : '#fff',
                          border: hasOzon ? '1px solid #bfdbfe' : 'none',
                          borderRadius: 6, cursor: isPublishing ? 'wait' : 'pointer'
                        }}>
                        {isPublishing ? '⏳' : hasOzon ? '🟦 已发布 OZON' : '🟦 发布到 OZON'}
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        style={{
                          padding: '7px 12px', fontSize: 12,
                          background: '#fef2f2', color: '#dc2626',
                          border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer'
                        }}>删除</button>
                    </div>

                    {/* 来源链接 */}
                    {p.sourceUrl && (
                      <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af' }}>
                        <a href={p.sourceUrl} target="_blank" rel="noreferrer"
                          style={{ color: '#2563eb', textDecoration: 'none' }}>
                          🔗 查看来源
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 12, marginTop: 24
        }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            style={{
              padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 8,
              background: page <= 1 ? '#f9fafb' : '#fff',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              color: page <= 1 ? '#d1d5db' : '#374151'
            }}>上一页</button>
          <span style={{ fontSize: 14, color: '#374151' }}>
            第 {page} / {totalPages} 页，共 {total} 条
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            style={{
              padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 8,
              background: page >= totalPages ? '#f9fafb' : '#fff',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              color: page >= totalPages ? '#d1d5db' : '#374151'
            }}>下一页</button>
        </div>
      )}

      {/* 操作说明 */}
      <div style={{
        marginTop: 32, padding: '16px 20px', background: '#f9fafb',
        borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 13, color: '#6b7280'
      }}>
        <strong style={{ color: '#374151' }}>💡 使用说明</strong>
        <ol style={{ margin: '8px 0 0', paddingLeft: 20, lineHeight: 1.8 }}>
          <li>在 1688 商品页面，点击右下角的 <strong>📥 采集</strong> 按钮</li>
          <li>商品将自动存入此产品库（标题、价格、图片）</li>
          <li>点击 <strong>🟦 发布到 OZON</strong> 跳转到发布页，AI 自动生成俄语文案</li>
          <li>确认信息后一键发布到 OZON 店铺</li>
        </ol>
      </div>
    </div>
  );
}
