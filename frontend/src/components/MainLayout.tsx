import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AIChatWidget from './AIChatWidget';

const NAV_ITEMS = [
  { path: '/dashboard',   icon: '📊', label: '工作台' },
  { path: '/trending',    icon: '🔥', label: '爆款选品' },
  { path: '/publish',     icon: '🚀', label: '智能发布' },
  { path: '/ads',         icon: '📢', label: '广告采集' },
  { path: '/products',    icon: '📦', label: '产品管理' },
  { path: '/accounts',    icon: '🏪', label: '店铺账号' },
  { path: '/services',    icon: '💼', label: '业务服务' },
  { path: '/calculator',  icon: '💰', label: '利润计算' },
  { path: '/membership',  icon: '⭐', label: '会员中心' },
  { path: '/settings',    icon: '⚙️', label: '设置' },
  { path: '/tiktok',     icon: '🎵', label: 'TikTok' },
  { path: '/youtube',    icon: '📹', label: 'YouTube' },
  { path: '/avatar',    icon: '🤖', label: 'AI数字人' },
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f0f2f5' }}>
      {/* 侧边栏 */}
      <aside style={{
        width: sidebarOpen ? 220 : 64,
        transition: 'width 0.25s ease',
        background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
        boxShadow: '2px 0 12px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
        }} onClick={() => setSidebarOpen(v => !v)}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>🦞</span>
          {sidebarOpen && (
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>CLAW</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>外贸智能工具</div>
            </div>
          )}
        </div>

        {/* 导航 */}
        <nav style={{ flex: 1, padding: '12px 0', overflow: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 18px',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              })}
            >
              <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: 'center' }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* 用户信息 */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14,
            flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          {sidebarOpen && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || user?.email}
              </div>
              <button
                onClick={handleLogout}
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
              >
                退出登录
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 主内容区 */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
      {/* AI客服悬浮窗 */}
      <AIChatWidget />
    </div>
  );
}
