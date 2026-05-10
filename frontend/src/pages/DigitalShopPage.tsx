/**
 * DigitalShopPage - 数字商品铺（精选 HuMkt 货源代售）
 * 用户下单后从 HuMkt 手动采购发货
 */
import React, { useState } from 'react';
import { ShoppingCart, ExternalLink, Copy, Check, MessageCircle, Sparkles } from 'lucide-react';

// 精选数字商品（从 HuMkt 搬运，加价 ¥10-20）
const DIGITAL_PRODUCTS = [
  {
    id: 'telegram',
    name: 'Telegram 飞机号',
    icon: '✈️',
    emoji: '✈️',
    price: 25,
    originalPrice: '市场价 ¥35',
    description: 'Telegram 全新账号，可用于跨境业务沟通、客户群组管理、频道运营',
    features: ['全新注册未使用', '支持换绑手机号', '即时交付', '稳定不掉号'],
    category: '社交通讯',
    color: 'from-sky-400 to-blue-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    tagColor: 'bg-sky-100 text-sky-700',
    hot: true,
  },
  {
    id: 'gmail',
    name: 'Gmail 邮箱账号',
    icon: '📧',
    emoji: '📧',
    price: 15,
    originalPrice: '市场价 ¥25',
    description: '全新 Gmail 邮箱，可用于 Google Ads 开户、YouTube 频道注册、Google 全家桶',
    features: ['全新注册无痕', '支持修改密码', '手机验证可用', 'Google 全家桶通用'],
    category: 'Google 系列',
    color: 'from-red-400 to-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    tagColor: 'bg-red-100 text-red-700',
    hot: false,
  },
  {
    id: 'facebook-ads',
    name: 'Facebook 广告号',
    icon: '📘',
    emoji: '📘',
    price: 60,
    originalPrice: '市场价 ¥80',
    description: 'Facebook 广告账户，可直接投放广告，适用于跨境电商推广、直播引流',
    features: ['广告功能已开通', 'BM 权限正常', '支付方式可绑定', '适合跨境投放'],
    category: '广告账户',
    color: 'from-blue-500 to-indigo-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    tagColor: 'bg-blue-100 text-blue-700',
    hot: true,
  },
  {
    id: 'tiktok',
    name: 'TikTok 新号',
    icon: '🎵',
    emoji: '🎵',
    price: 45,
    originalPrice: '市场价 ¥60',
    description: 'TikTok 全新账号，可用于短视频营销、直播带货、品牌曝光',
    features: ['全新注册', '地区可选', '头像昵称可改', '适合矩阵运营'],
    category: '短视频平台',
    color: 'from-gray-700 to-black',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    tagColor: 'bg-gray-100 text-gray-700',
    hot: false,
  },
];

// 代理IP - 按国家/地区分
const PROXY_COUNTRIES = [
  { id: 'proxy-tw', flag: '🇹🇼', name: '台湾', price: 30, ip: '静态住宅IP', speed: '低延迟', tag: '热门' },
  { id: 'proxy-hk', flag: '🇭🇰', name: '香港', price: 30, ip: '静态住宅IP', speed: '低延迟', tag: '热门' },
  { id: 'proxy-jp', flag: '🇯🇵', name: '日本', price: 35, ip: '静态住宅IP', speed: '低延迟', tag: '推荐' },
  { id: 'proxy-sg', flag: '🇸🇬', name: '新加坡', price: 35, ip: '静态机房IP', speed: '低延迟', tag: '' },
  { id: 'proxy-my', flag: '🇲🇾', name: '马来西亚', price: 30, ip: '静态住宅IP', speed: '稳定', tag: '' },
  { id: 'proxy-vn', flag: '🇻🇳', name: '越南', price: 30, ip: '静态住宅IP', speed: '稳定', tag: '' },
  { id: 'proxy-us', flag: '🇺🇸', name: '美国', price: 35, ip: '静态机房IP', speed: '高速', tag: '推荐' },
  { id: 'proxy-gb', flag: '🇬🇧', name: '英国', price: 35, ip: '静态机房IP', speed: '高速', tag: '' },
  { id: 'proxy-kr', flag: '🇰🇷', name: '韩国', price: 35, ip: '静态机房IP', speed: '低延迟', tag: '' },
  { id: 'proxy-th', flag: '🇹🇭', name: '泰国', price: 30, ip: '静态住宅IP', speed: '稳定', tag: '' },
];

// 已购 Apple ID + 小火箭（已有服务）
const EXISTING_SERVICE = {
  name: 'Apple ID + 小火箭',
  icon: '🍎',
  description: '已上架服务，海外 Apple ID + Shadowrocket 小火箭',
};

export default function DigitalShopPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const whatsappNumber = '8615119885271'; // 客服 WhatsApp

  const handleBuy = (product: typeof DIGITAL_PRODUCTS[0]) => {
    const message = encodeURIComponent(`你好，我想购买：${product.emoji} ${product.name}，¥${product.price}`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const handleProxyBuy = (country: typeof PROXY_COUNTRIES[0]) => {
    const message = encodeURIComponent(`你好，我想购买：${country.flag} ${country.name} 代理IP，¥${country.price}`);
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const handleCopyWechat = async () => {
    try {
      await navigator.clipboard.writeText('15119885271');
      setCopiedId('wechat');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
      setCopiedId('wechat');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20
          }}>
            🛍️
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>数字商品铺</h2>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>精选跨境必备账号 & 工具，下单后即时交付</p>
          </div>
        </div>
      </div>

      {/* 已有服务提示 */}
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        borderRadius: 12, padding: '12px 20px', marginBottom: 20,
        border: '1px solid #fcd34d',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <span style={{ fontSize: 20 }}>{EXISTING_SERVICE.icon}</span>
        <span style={{ fontSize: 14, color: '#92400e' }}>
          已有 <strong>{EXISTING_SERVICE.name}</strong> 在售，以下为新增数字商品
        </span>
      </div>

      {/* 产品卡片网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 20
      }}>
        {DIGITAL_PRODUCTS.map((product) => (
          <div
            key={product.id}
            style={{
              background: '#fff',
              borderRadius: 16,
              border: `1px solid #e5e7eb`,
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* 热卖标签 */}
            {product.hot && (
              <div style={{
                position: 'absolute', top: 12, right: 12, zIndex: 2,
                background: 'linear-gradient(135deg, #f97316, #ef4444)',
                color: '#fff', fontSize: 11, fontWeight: 700,
                padding: '3px 10px', borderRadius: 20,
                display: 'flex', alignItems: 'center', gap: 4
              }}>
                🔥 热卖
              </div>
            )}

            {/* 顶部色块 */}
            <div style={{
              height: 80,
              background: `linear-gradient(135deg, ${product.color.split(' ').join(', ')})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40,
            }}>
            </div>

            {/* 内容区 */}
            <div style={{ padding: 20 }}>
              {/* 标题行 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 24 }}>{product.emoji}</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#1f2937' }}>
                  {product.name}
                </h3>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 6,
                  background: '#f3f4f6', color: '#6b7280', fontWeight: 500
                }}>
                  {product.category}
                </span>
              </div>

              {/* 描述 */}
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 12 }}>
                {product.description}
              </p>

              {/* 特性列表 */}
              <div style={{
                background: '#f9fafb', borderRadius: 10, padding: '10px 14px',
                marginBottom: 16
              }}>
                {product.features.map((f, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 13, color: '#374151', padding: '3px 0'
                  }}>
                    <span style={{ color: '#10b981', fontSize: 12 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>

              {/* 价格区 */}
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16,
                padding: '12px 14px', background: '#fefce8', borderRadius: 10,
                border: '1px solid #fde68a'
              }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#d97706' }}>
                  ¥{product.price}
                </span>
                <span style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'line-through' }}>
                  {product.originalPrice}
                </span>
                <span style={{
                  fontSize: 11, background: '#fef3c7', color: '#92400e',
                  padding: '2px 6px', borderRadius: 4, fontWeight: 600
                }}>
                  省 ¥{parseInt(product.originalPrice.replace(/[^0-9]/g, '')) - product.price}
                </span>
              </div>

              {/* 购买按钮 */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleBuy(product)}
                  style={{
                    flex: 1, padding: '10px 0', fontSize: 14, fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', border: 'none', borderRadius: 10,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 6
                  }}
                >
                  <MessageCircle size={16} />
                  WhatsApp 下单
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🌐 代理IP 专区 */}
      <div style={{ marginTop: 40, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }}>🌐</span>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1f2937' }}>
            HTTP / Socks5 代理IP
          </h3>
          <span style={{
            fontSize: 11, padding: '3px 10px', borderRadius: 20,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff', fontWeight: 600
          }}>
            按国家选择
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          支持 HTTP 和 Socks5 双协议，可用于 TikTok/Google Ads 多账号管理、跨境访问、PK 运营
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 14
      }}>
        {PROXY_COUNTRIES.map((country) => (
          <div
            key={country.id}
            style={{
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #e5e7eb',
              padding: '16px 18px',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              position: 'relative',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            {/* 标签 */}
            {country.tag && (
              <div style={{
                position: 'absolute', top: 10, right: 10,
                fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 10,
                background: country.tag === '热门' ? '#fef2f2' : '#eff6ff',
                color: country.tag === '热门' ? '#dc2626' : '#2563eb',
              }}>
                {country.tag}
              </div>
            )}

            {/* 国旗 + 名称 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 28 }}>{country.flag}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1f2937' }}>{country.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{country.ip}</div>
              </div>
            </div>

            {/* 速度 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: '#6b7280', marginBottom: 14,
              padding: '6px 10px', background: '#f9fafb', borderRadius: 8
            }}>
              <span>⚡ {country.speed}</span>
              <span style={{ color: '#d1d5db' }}>|</span>
              <span>HTTP / Socks5</span>
            </div>

            {/* 价格 + 按钮 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>¥{country.price}</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>/月</span>
              </div>
              <button
                onClick={() => handleProxyBuy(country)}
                style={{
                  padding: '7px 14px', fontSize: 12, fontWeight: 700,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', border: 'none', borderRadius: 8,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                <MessageCircle size={13} />
                购买
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 底部联系区 */}
      <div style={{
        marginTop: 32, padding: '24px 28px',
        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
        borderRadius: 16, border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
            📞 购买方式
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, maxWidth: 400, lineHeight: 1.6 }}>
            点击商品卡片「WhatsApp 下单」直接联系客服，或复制微信号联系。<br/>
            付款后 5-30 分钟内完成交付，支持微信/支付宝/USDT。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleCopyWechat}
            style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600,
              background: '#fff', color: '#374151',
              border: '1px solid #d1d5db', borderRadius: 10,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {copiedId === 'wechat' ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            {copiedId === 'wechat' ? '已复制' : '复制微信号'}
          </button>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600,
              background: '#25D366', color: '#fff',
              border: 'none', borderRadius: 10,
              cursor: 'pointer', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <MessageCircle size={16} />
            WhatsApp 客服
          </a>
        </div>
      </div>

      {/* 页脚说明 */}
      <div style={{
        marginTop: 16, textAlign: 'center', fontSize: 12, color: '#9ca3af'
      }}>
        商品由 Claw 代售，均来源于正规渠道，如有问题联系客服处理
      </div>
    </div>
  );
}
