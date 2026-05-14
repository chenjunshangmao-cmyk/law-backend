import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface Stats {
  products: number;
  accounts: number;
  tasks: number;
  ozonAccounts: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ products: 0, accounts: 0, tasks: 0, ozonAccounts: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [products, accounts, tasks] = await Promise.allSettled([
      api.products.list({ limit: 1 }),
      api.accounts.list(),
      api.tasks.list(),
    ]);
    const allAccounts = accounts.status === 'fulfilled' ? (accounts.value?.data || []) : [];
    setStats({
      products: products.status === 'fulfilled' ? (products.value?.total ?? products.value?.data?.length ?? 0) : 0,
      accounts: allAccounts.length,
      tasks: tasks.status === 'fulfilled' ? (tasks.value?.data?.length ?? 0) : 0,
      ozonAccounts: allAccounts.filter((a: any) => a.platform === 'ozon').length,
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  // 核心工具卡片（大号，带描述）
  const CORE_TOOLS = [
    { path: '/trending',    icon: '🔥', title: 'AI选品', desc: 'AI搜索全网爆款单品，20维评分评估爆款概率，链接测款', color: '#ff6b35', tag: '新' },
    { path: '/products',    icon: '📦', title: '产品库', desc: '管理你的所有产品，支持多平台产品同步', color: '#10b981', tag: '' },
    { path: '/ozon-publish', icon: '🌐', title: 'OZON上架', desc: '批量发布产品到俄罗斯 OZON 平台', color: '#005BFF', tag: '' },
    { path: '/calculator',  icon: '💰', title: '利润计算', desc: '快速核算各平台利润，智能定价推荐', color: '#f59e0b', tag: '' },
  ];

  // 常用快捷入口（小号）
  const QUICK_LINKS = [
    { path: '/accounts',    icon: '🏪', title: '店铺账号', color: '#6366f1' },
    { path: '/articles',    icon: '📖', title: '外贸干货', color: '#8b5cf6' },
    { path: '/ads',         icon: '📢', title: '广告采集', color: '#ef4444' },
    { path: '/digital-shop', icon: '🛒', title: '数字商品', color: '#ec4899' },
    { path: '/ai-content',  icon: '✨', title: 'AI图文', color: '#d946ef' },
    { path: '/writer',      icon: '✍️', title: 'AI文案', color: '#0ea5e9' },
  ];

  // 按业务场景推荐
  const SCENARIOS = [
    {
      role: '新手卖家',
      icon: '🌱',
      desc: '刚入跨境电商，不知道卖什么',
      actions: [
        { label: '🔥 去AI选品找货', path: '/trending' },
        { label: '📖 阅读外贸干货', path: '/articles' },
      ]
    },
    {
      role: '运营卖家',
      icon: '🚀',
      desc: '已有产品，需要上架和推广',
      actions: [
        { label: '🌐 OZON上架', path: '/ozon-publish' },
        { label: '✍️ AI写文案', path: '/writer' },
        { label: '💰 算利润', path: '/calculator' },
      ]
    },
    {
      role: '内容玩家',
      icon: '🎬',
      desc: '做短视频/直播/TikTok',
      actions: [
        { label: '🎬 短视频工场', path: '/video-factory' },
        { label: '🤖 AI数字人', path: '/avatar' },
        { label: '🔴 AI直播', path: '/live-stream' },
      ]
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* 欢迎条 */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            {getGreeting()}，{user?.name || user?.email?.split('@')[0]} 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
            产品 {stats.products} 件 · 店铺 {stats.accounts} 个 · OZON {stats.ozonAccounts} 个
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/trending')}
            style={{
              background: 'linear-gradient(135deg, #ff6b35, #f59e0b)',
              color: '#fff', padding: '10px 20px', borderRadius: 8,
              fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
            }}
          >
            🔥 AI选品
          </button>
          <button
            onClick={loadStats}
            style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              padding: '10px 16px', borderRadius: 8, fontSize: 13,
              border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
            }}
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {/* 业务场景引导 */}
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
        💡 你是哪类卖家？
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 28 }}>
        {SCENARIOS.map(scenario => (
          <div key={scenario.role} style={{
            background: '#fff', borderRadius: 12, padding: 20,
            border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{scenario.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e', marginBottom: 2 }}>
              {scenario.role}
            </div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>{scenario.desc}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {scenario.actions.map(action => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  style={{
                    padding: '6px 14px', borderRadius: 6,
                    background: '#f0f4ff', color: '#6366f1',
                    border: '1px solid #e0e7ff', fontSize: 13,
                    cursor: 'pointer', fontWeight: 500,
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 核心工具 */}
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
        ⭐ 核心工具
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 28 }}>
        {CORE_TOOLS.map(tool => (
          <div
            key={tool.path}
            onClick={() => navigate(tool.path)}
            style={{
              background: '#fff', borderRadius: 12, padding: 20, cursor: 'pointer',
              border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              position: 'relative', transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = tool.color;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
              e.currentTarget.style.borderColor = '#f0f0f0';
            }}
          >
            {tool.tag && (
              <span style={{
                position: 'absolute', top: 10, right: 10,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 700, padding: '2px 6px',
                borderRadius: 6,
              }}>
                {tool.tag}
              </span>
            )}
            <div style={{ fontSize: 28, marginBottom: 8 }}>{tool.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a2e', marginBottom: 4 }}>
              {tool.title}
            </div>
            <div style={{ fontSize: 13, color: '#888', lineHeight: 1.4 }}>{tool.desc}</div>
          </div>
        ))}
      </div>

      {/* 快捷入口 */}
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
        ⚡ 常用入口
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 28 }}>
        {QUICK_LINKS.map(link => (
          <div
            key={link.path}
            onClick={() => navigate(link.path)}
            style={{
              background: '#fff', borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
              border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = link.color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = ''; }}
          >
            <span style={{ fontSize: 22 }}>{link.icon}</span>
            <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>{link.title}</span>
          </div>
        ))}
      </div>

      {/* 数据概览 */}
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 12 }}>
        📊 数据概览
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { icon: '📦', label: '产品数', value: stats.products, color: '#6366f1', path: '/products' },
          { icon: '🏪', label: '店铺账号', value: stats.accounts, color: '#10b981', path: '/accounts' },
          { icon: '🌐', label: 'OZON账号', value: stats.ozonAccounts, color: '#005BFF', path: '/accounts' },
          { icon: '📋', label: '进行任务', value: stats.tasks, color: '#ec4899', path: '/products' },
        ].map(card => (
          <div
            key={card.label}
            onClick={() => navigate(card.path)}
            style={{
              background: '#fff', borderRadius: 12, padding: 16, cursor: 'pointer',
              border: '1px solid #f0f0f0', textAlign: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>{card.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color, marginBottom: 2 }}>
              {card.value}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
