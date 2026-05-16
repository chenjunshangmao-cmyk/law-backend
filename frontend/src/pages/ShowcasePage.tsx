import React, { useState, useEffect } from 'react';
import { Search, Filter, Heart, ShoppingBag, MessageCircle, ChevronDown, Grid3X3, List } from 'lucide-react';
import api from '../services/api';

interface Product {
  id: string;
  name: string;
  category: string;
  price_wholesale: number;
  price_retail: number;
  images: string[];
  tags: string[];
  moq: number;
  specs: { label: string; value: string }[];
  desc: string;
}

// 从产品管理 API 加载数据
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1', name: '中古珍珠耳环',
    category: '中古',
    price_wholesale: 68, price_retail: 168,
    images: ['https://via.placeholder.com/400x400?text=Pearl+Earrings+1'],
    tags: ['中古', '珍珠', '耳环'],
    moq: 10,
    specs: [{ label: '材质', value: '925银+淡水珍珠' }, { label: '成色', value: '9成新' }],
    desc: '日本中古市场淘回，925银针，天然淡水珍珠，经典百搭款'
  },
  {
    id: '2', name: '轻奢锁骨链',
    category: '轻奢',
    price_wholesale: 128, price_retail: 328,
    images: ['https://via.placeholder.com/400x400?text=Necklace+1'],
    tags: ['轻奢', '项链', '锁骨链'],
    moq: 5,
    specs: [{ label: '材质', value: '18K镀金+锆石' }, { label: '链长', value: '40cm+5cm延长链' }],
    desc: 'ins爆款设计，18K厚镀金，优质锆石切割，送礼佳品'
  },
  {
    id: '3', name: '复古胸针套装',
    category: '中古',
    price_wholesale: 88, price_retail: 228,
    images: ['https://via.placeholder.com/400x400?text=Brooch+Set'],
    tags: ['中古', '胸针', '复古'],
    moq: 10,
    specs: [{ label: '材质', value: '合金+珐琅' }, { label: '尺寸', value: '约5cm' }],
    desc: '欧洲中古店精选，珐琅工艺，三件套礼盒装'
  },
  {
    id: '4', name: '极简金属手镯',
    category: '轻奢',
    price_wholesale: 98, price_retail: 258,
    images: ['https://via.placeholder.com/400x400?text=Bangle+1'],
    tags: ['轻奢', '手镯', '极简'],
    moq: 5,
    specs: [{ label: '材质', value: '钛钢+18K镀金' }, { label: '开口', value: '可调节' }],
    desc: '极简几何设计，钛钢不掉色，四季百搭'
  },
  {
    id: '5', name: '设计师款耳挂',
    category: '设计师款',
    price_wholesale: 158, price_retail: 398,
    images: ['https://via.placeholder.com/400x400?text=Ear+Cuff'],
    tags: ['设计师', '耳挂', '个性'],
    moq: 3,
    specs: [{ label: '材质', value: 'S925银' }, { label: '风格', value: '暗黑系' }],
    desc: '独立设计师联名款，无需耳洞，多戴法设计'
  },
  {
    id: '6', name: '水晶能量手串',
    category: '设计师款',
    price_wholesale: 45, price_retail: 128,
    images: ['https://via.placeholder.com/400x400?text=Crystal+Bracelet'],
    tags: ['设计师', '水晶', '手串'],
    moq: 20,
    specs: [{ label: '材质', value: '天然水晶+弹力绳' }, { label: '直径', value: '8mm' }],
    desc: '天然白水晶/紫水晶可选，送人自用皆宜'
  }
];

const CATEGORIES = ['全部', '中古', '轻奢', '设计师款'];

const WHOLESALE_POLICY = {
  title: '批发政策',
  rules: [
    '单款满10件起批（设计师款满3件）',
    '混批满50件可享9折优惠',
    '满100件享88折 + 包邮',
    '支持一件代发（零售价下单）',
    '微信/支付宝/对公转账均可',
    '退换货政策：质量问题7天包退'
  ]
};

export default function ShowcasePage() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // 从后端加载商品 (产品管理上传的商品自动出现在这里)
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await api.products.list({ page: 1, limit: 200 });
        if (res?.data?.length) {
          const mapped = res.data.map((p: any) => ({
            id: p.id,
            name: p.name || p.title || '商品',
            category: p.category || '其他',
            price_wholesale: p.wholesale_price || Math.round((p.price || 0) * 0.4),
            price_retail: p.price || 0,
            images: p.images || [],
            tags: p.tags || [],
            moq: p.moq || 10,
            specs: p.specs || [],
            desc: p.description || ''
          }));
          setProducts(mapped);
        }
      } catch (e) {
        console.warn('从后端加载失败，使用示例数据:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filtered = activeCategory === '全部' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* 顶部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>💎 饰品供应链</h1>
          <p style={{ color: '#888', margin: '4px 0 0' }}>中古 · 轻奢 · 设计师款 — 批发/一件代发</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setViewMode('grid')} style={{
            padding: '8px', background: viewMode === 'grid' ? '#1a1a2e' : '#f0f0f0',
            color: viewMode === 'grid' ? '#fff' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer'
          }}><Grid3X3 size={18} /></button>
          <button onClick={() => setViewMode('list')} style={{
            padding: '8px', background: viewMode === 'list' ? '#1a1a2e' : '#f0f0f0',
            color: viewMode === 'list' ? '#fff' : '#333', border: 'none', borderRadius: 6, cursor: 'pointer'
          }}><List size={18} /></button>
        </div>
      </div>

      {/* 分类 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{
              padding: '8px 20px', borderRadius: 20, border: activeCategory === cat ? 'none' : '1px solid #ddd',
              background: activeCategory === cat ? '#1a1a2e' : '#fff',
              color: activeCategory === cat ? '#fff' : '#555', cursor: 'pointer', fontWeight: activeCategory === cat ? 600 : 400,
              transition: 'all 0.2s'
            }}
          >{cat}</button>
        ))}
      </div>

      {/* 批发政策条 */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #2d2d4e)', color: '#fff',
        borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
      }}>
        <div>
          <strong style={{ fontSize: 18 }}>📋 批发政策</strong>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            满10件起批 · 混批优惠 · 支持一件代发
          </div>
        </div>
        <button onClick={() => setSelectedProduct(null)} style={{
          padding: '10px 24px', background: '#fff', color: '#1a1a2e', border: 'none',
          borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14
        }}>查看详情 →</button>
      </div>

      {/* 商品列表 */}
      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(product => (
            <ProductListItem key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
          ))}
        </div>
      )}

      {/* 批发政策弹窗 */}
      {selectedProduct === null && activeCategory === '全部' && filtered.length > 0 && (
        <PolicyModal policy={WHOLESALE_POLICY} onClose={() => {}} />
      )}

      {/* 商品详情弹窗 */}
      {selectedProduct && (
        <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: 12, overflow: 'hidden',
      border: '1px solid #f0f0f0', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ width: '100%', height: 240, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
        {product.images[0] ? <img src={product.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '💎'}
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 11, padding: '2px 8px', background: '#f0f0f0', borderRadius: 10, color: '#888' }}>{product.category}</span>
          <span style={{ fontSize: 11, padding: '2px 8px', background: '#fef3e2', borderRadius: 10, color: '#d97706' }}>起订{product.moq}件</span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.3 }}>{product.name}</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>¥{product.price_wholesale}</span>
          <span style={{ fontSize: 13, color: '#999', textDecoration: 'line-through' }}>¥{product.price_retail}</span>
          <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>批发价</span>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          <button onClick={e => { e.stopPropagation(); window.open(`https://wa.me/?text=我想咨询:${product.name}`, '_blank'); }}
            style={{ flex: 1, padding: '8px 0', background: '#25D366', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            💬 微信询价
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductListItem({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', gap: 16, background: '#fff', borderRadius: 10, padding: 12,
      border: '1px solid #f0f0f0', cursor: 'pointer', transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
    >
      <div style={{ width: 100, height: 100, background: '#f5f5f5', borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
        {product.images[0] ? <img src={product.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : '💎'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 11, padding: '1px 6px', background: '#f0f0f0', borderRadius: 8, color: '#888' }}>{product.category}</span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{product.name}</h3>
        <p style={{ fontSize: 13, color: '#888', margin: '4px 0', lineHeight: 1.4 }}>{product.desc.slice(0, 60)}...</p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>批发 ¥{product.price_wholesale}</span>
          <span style={{ fontSize: 13, color: '#999' }}>零售 ¥{product.price_retail}</span>
          <span style={{ fontSize: 12, color: '#d97706' }}>起订{product.moq}件</span>
        </div>
      </div>
    </div>
  );
}

function ProductDetail({ product, onClose }: { product: Product; onClose: () => void }) {
  const [currentImg, setCurrentImg] = useState(0);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, maxWidth: 800, width: '100%', maxHeight: '90vh',
        overflow: 'auto', padding: 32, position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, background: '#f0f0f0', border: 'none',
          width: 32, height: 32, borderRadius: 16, cursor: 'pointer', fontSize: 16
        }}>✕</button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* 图片 */}
          <div>
            <div style={{ width: '100%', height: 320, background: '#f5f5f5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
              {product.images[currentImg] ? <img src={product.images[currentImg]} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} /> : '💎'}
            </div>
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {product.images.map((img, i) => (
                  <div key={i} onClick={() => setCurrentImg(i)} style={{
                    width: 56, height: 56, background: '#f5f5f5', borderRadius: 8, cursor: 'pointer',
                    border: currentImg === i ? '2px solid #1a1a2e' : '2px solid transparent', overflow: 'hidden'
                  }}>
                    <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 信息 */}
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 12, padding: '3px 10px', background: '#f0f0f0', borderRadius: 12, color: '#888' }}>{product.category}</span>
              {product.tags.map(t => (
                <span key={t} style={{ fontSize: 12, padding: '3px 10px', background: '#fef3e2', borderRadius: 12, color: '#d97706' }}>{t}</span>
              ))}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>{product.name}</h2>
            <p style={{ color: '#666', lineHeight: 1.6, fontSize: 14, marginBottom: 16 }}>{product.desc}</p>

            {/* 规格 */}
            <div style={{ marginBottom: 16 }}>
              {product.specs.map((s, i) => (
                <div key={i} style={{ display: 'flex', padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                  <span style={{ color: '#888', width: 80 }}>{s.label}</span>
                  <span style={{ color: '#333' }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* 价格 */}
            <div style={{ background: '#f8f9ff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ color: '#888', fontSize: 13 }}>批发价</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e' }}>¥{product.price_wholesale}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: '#888', fontSize: 13 }}>零售价</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: '#ef4444' }}>¥{product.price_retail}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#d97706' }}>最低起订量: {product.moq}件</div>
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{
                flex: 1, padding: '12px', background: '#25D366', color: '#fff', border: 'none',
                borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14
              }}>
                💬 微信询价（批发）
              </button>
              <button style={{
                flex: 1, padding: '12px', background: '#1a1a2e', color: '#fff', border: 'none',
                borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14
              }}>
                🛒 立即购买（零售）
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyModal({ policy, onClose }: { policy: typeof WHOLESALE_POLICY; onClose: () => void }) {
  const [show, setShow] = useState(true);
  if (!show) return null;
  return (
    <div onClick={() => setShow(false)} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, padding: 32, maxWidth: 500, width: '100%'
      }}>
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>📋 {policy.title}</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {policy.rules.map((r, i) => (
            <li key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 14, color: '#333' }}>
              ✓ {r}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 20, padding: 12, background: '#f8f9ff', borderRadius: 8, fontSize: 13, color: '#666' }}>
          💡 联系微信: <strong>your-wechat-id</strong> 获取最新报价和库存信息
        </div>
        <button onClick={() => setShow(false)} style={{
          marginTop: 16, width: '100%', padding: 12, background: '#1a1a2e', color: '#fff',
          border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600
        }}>知道了</button>
      </div>
    </div>
  );
}
