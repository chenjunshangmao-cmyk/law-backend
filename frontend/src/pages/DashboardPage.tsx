import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface Stats {
  products: number;
  accounts: number;
  tasks: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ products: 0, accounts: 0, tasks: 0 });

  useEffect(() => {
    // 并发获取统计数据，失败不报错
    Promise.allSettled([
      api.products.list({ limit: 1 }),
      api.accounts.list(),
      api.tasks.list(),
    ]).then(([products, accounts, tasks]) => {
      setStats({
        products: products.status === 'fulfilled' ? (products.value?.total ?? products.value?.data?.length ?? 0) : 0,
        accounts: accounts.status === 'fulfilled' ? (accounts.value?.data?.length ?? 0) : 0,
        tasks:    tasks.status === 'fulfilled'    ? (tasks.value?.data?.length ?? 0) : 0,
      });
    });
  }, []);

  const QUICK_ACTIONS = [
    { icon: '🔥', title: '爆款选品', desc: '一键抓取热销商品', path: '/trending', color: '#ff6b35' },
    { icon: '🚀', title: '智能发布', desc: '多平台一键上架', path: '/publish', color: '#6366f1' },
    { icon: '📢', title: '广告采集', desc: '竞品广告素材采集', path: '/ads', color: '#10b981' },
    { icon: '💰', title: '利润计算', desc: '快速核算利润空间', path: '/calculator', color: '#f59e0b' },
  ];

  const STAT_CARDS = [
    { icon: '📦', label: '产品库', value: stats.products, unit: '件', color: '#6366f1', path: '/products' },
    { icon: '🏪', label: '店铺账号', value: stats.accounts, unit: '个', color: '#10b981', path: '/accounts' },
    { icon: '⭐', label: '会员等级', value: user?.membershipType === 'free' ? '免费版' : user?.membershipType || '免费版', unit: '', color: '#f59e0b', path: '/membership' },
    { icon: '📋', label: '进行任务', value: stats.tasks, unit: '条', color: '#ec4899', path: '/products' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* 欢迎横幅 */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            早上好，{user?.name || user?.email?.split('@')[0]} 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            今天也要高效选品，赚取更多利润！
          </p>
        </div>
        <button
          onClick={() => navigate('/trending')}
          style={{
            background: 'rgba(255,255,255,0.2)', color: '#fff',
            padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14,
            border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
        >
          开始选品 →
        </button>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {STAT_CARDS.map(card => (
          <div key={card.label}
            onClick={() => navigate(card.path)}
            style={{
              background: '#fff', borderRadius: 12, padding: '20px 24px',
              cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #f0f0f0',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = '', e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: card.color, marginBottom: 4 }}>
              {card.value}{card.unit}
            </div>
            <div style={{ color: '#888', fontSize: 13 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* 快速操作 */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>快速操作</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {QUICK_ACTIONS.map(action => (
          <div key={action.path}
            onClick={() => navigate(action.path)}
            style={{
              background: '#fff', borderRadius: 12, padding: '24px',
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              border: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'center', gap: 16,
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.borderColor = action.color)}
            onMouseLeave={e => (e.currentTarget.style.transform = '', e.currentTarget.style.borderColor = '#f0f0f0')}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12, fontSize: 24,
              background: `${action.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {action.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 15 }}>{action.title}</div>
              <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{action.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
