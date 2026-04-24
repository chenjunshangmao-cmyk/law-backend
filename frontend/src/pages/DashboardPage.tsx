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

interface OzonAccount {
  id: string;
  platform: string;
  name: string;
  username: string | null;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ products: 0, accounts: 0, tasks: 0, ozonAccounts: 0 });
  const [ozonAccounts, setOzonAccounts] = useState<OzonAccount[]>([]);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [syncResults, setSyncResults] = useState<Record<string, any>>({});

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

    // 保存 OZON 账号列表
    const ozonList = allAccounts.filter((a: any) => a.platform === 'ozon');
    setOzonAccounts(ozonList);
  };

  const handleSync = async (accountId: string) => {
    setSyncing(prev => ({ ...prev, [accountId]: true }));
    try {
      const result = await api.accounts.sync(accountId);
      setSyncResults(prev => ({ ...prev, [accountId]: result?.data || result }));
    } catch (err: any) {
      setSyncResults(prev => ({ ...prev, [accountId]: { error: err?.message || '同步失败' } }));
    } finally {
      setSyncing(prev => ({ ...prev, [accountId]: false }));
    }
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

  const QUICK_ACTIONS = [
    { icon: '🔥', title: '爆款选品', desc: '一键抓取热销商品', path: '/trending', color: '#ff6b35' },
    { icon: '🚀', title: '智能发布', desc: '多平台一键上架', path: '/publish', color: '#6366f1' },
    { icon: '📢', title: '广告采集', desc: '竞品广告素材采集', path: '/ads', color: '#10b981' },
    { icon: '💰', title: '利润计算', desc: '快速核算利润空间', path: '/calculator', color: '#f59e0b' },
  ];

  const STAT_CARDS = [
    { icon: '📦', label: '产品库', value: stats.products, unit: '件', color: '#6366f1', path: '/products' },
    { icon: '🏪', label: '店铺账号', value: stats.accounts, unit: '个', color: '#10b981', path: '/accounts' },
    { icon: '🛒', label: 'OZON账号', value: stats.ozonAccounts, unit: '个', color: '#005BFF', path: '/accounts' },
    { icon: '⭐', label: '会员等级', value: user?.membershipType === 'enterprise' ? '企业版' : user?.membershipType || '免费版', unit: '', color: '#f59e0b', path: '/membership' },
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
            {getGreeting()}，{user?.name || user?.email?.split('@')[0]} 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            OZON 店铺已绑定：{stats.ozonAccounts} 个 | 企业版会员
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
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

      {/* OZON 店铺数据 */}
      {ozonAccounts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>🛒 OZON 店铺数据</h2>
            <button
              onClick={loadStats}
              style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#666' }}
            >🔄 刷新</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {ozonAccounts.map(acc => {
              const isSyncing = syncing[acc.id];
              const syncRes = syncResults[acc.id];
              return (
                <div key={acc.id} style={{
                  background: '#fff', borderRadius: 12, padding: 20,
                  border: '1px solid #e8f0fe', boxShadow: '0 2px 8px rgba(0,91,255,0.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{acc.name || acc.id}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                        {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('zh-CN') + ' 绑定' : ''}
                      </div>
                    </div>
                    <div style={{
                      background: acc.status === 'active' ? '#ecfdf5' : '#fef3c7',
                      color: acc.status === 'active' ? '#059669' : '#d97706',
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600
                    }}>
                      {acc.status === 'active' ? '已连接' : '未同步'}
                    </div>
                  </div>

                  {/* 同步数据 */}
                  {syncRes && !syncRes.error && (
                    <div style={{ marginBottom: 12, padding: '10px 12px', background: '#f8faff', borderRadius: 8 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#888' }}>产品数</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#6366f1' }}>
                            {syncRes.products_count ?? '-'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#888' }}>订单数</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>
                            {syncRes.orders_count ?? '-'}
                          </div>
                        </div>
                      </div>
                      {syncRes.sync_time && (
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>
                          上次同步：{new Date(syncRes.sync_time).toLocaleString('zh-CN')}
                        </div>
                      )}
                    </div>
                  )}

                  {syncRes?.error && (
                    <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
                      ⚠️ {syncRes.error}
                    </div>
                  )}

                  <button
                    onClick={() => handleSync(acc.id)}
                    disabled={isSyncing}
                    style={{
                      width: '100%', padding: '8px 0', borderRadius: 8,
                      background: isSyncing ? '#e0e7ff' : '#6366f1',
                      color: isSyncing ? '#6366f1' : '#fff',
                      border: 'none', fontSize: 14, fontWeight: 600, cursor: isSyncing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {isSyncing ? '⏳ 同步中...' : '📥 同步 OZON 数据'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
