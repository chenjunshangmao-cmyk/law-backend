import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AIChatWidget from './AIChatWidget';
import {
  LayoutDashboard, TrendingUp, Package, Store, Calculator,
  Crown, Settings, Menu, X, LogOut, User, Globe, Sparkles,
  ChevronDown, ChevronRight, MessageCircle, Youtube, PenLine,
  Clapperboard, Radio, Server, Facebook, Headset,
  ShoppingCart, BarChart3, Zap, ChevronUp, BookOpen, Gift,
  Shield
} from 'lucide-react';

// 侧边栏分组
const NAV_GROUPS = [
  {
    label: '⚡ 常用',
    items: [
      { path: '/dashboard',   icon: LayoutDashboard, label: '工作台', color: 'text-blue-500', badge: '' },
      { path: '/trending',    icon: TrendingUp,      label: 'AI选品', color: 'text-red-500', badge: '' },
      { path: '/publish',     icon: Zap,             label: '社媒发布', color: 'text-fuchsia-500', badge: '11' },
      { path: '/ozon-publish', icon: Globe,           label: 'OZON发布', color: 'text-blue-600', badge: '' },
      { path: '/customer-service', icon: Headset,   label: 'AI客服', color: 'text-violet-600', badge: '🔥' },
      { path: '/saas-builder', icon: Globe,          label: '极速建站', color: 'text-indigo-500', badge: 'new' },
    ]
  },
  {
    label: '📦 商品',
    collapsed: false,
    items: [
      { path: '/products',    icon: Package,         label: '产品库', color: 'text-emerald-500', badge: '' },
      { path: '/digital-shop', icon: ShoppingCart,   label: '数字商品', color: 'text-pink-500', badge: '' },
      { path: '/calculator',  icon: Calculator,      label: '利润计算', color: 'text-green-500', badge: '' },
      { path: '/ads',         icon: Zap,             label: '广告采集', color: 'text-amber-500', badge: '' },
    ]
  },
  {
    label: '🌐 社媒',
    collapsed: true,
    items: [
      { path: '/whatsapp',         icon: MessageCircle, label: 'WhatsApp', color: 'text-green-500', badge: '' },
      { path: '/facebook',         icon: Facebook,       label: 'Facebook', color: 'text-blue-600', badge: '' },
      { path: '/youtube',          icon: Youtube,        label: 'YouTube', color: 'text-red-600', badge: '' },
      { path: '/articles',         icon: BarChart3,     label: '外贸干货', color: 'text-violet-500', badge: '' },
      { path: '/accounts',         icon: Store,         label: '店铺账号', color: 'text-indigo-500', badge: '' },
    ]
  },
  {
    label: '🎨 AI 创作',
    collapsed: true,
    items: [
      { path: '/ai-content',     icon: Sparkles,     label: 'AI智能图文', color: 'text-fuchsia-500', badge: '' },
      { path: '/writer',         icon: PenLine,      label: 'AI文案', color: 'text-sky-500', badge: '' },
      { path: '/novel-factory',  icon: BookOpen,     label: '小说工场', color: 'text-purple-600', badge: 'new' },
      { path: '/avatar',         icon: User,          label: 'AI数字人', color: 'text-violet-500', badge: '' },
      { path: '/live-stream',    icon: Radio,         label: 'AI直播', color: 'text-red-500', badge: '' },
      { path: '/video-factory',  icon: Clapperboard,  label: '短视频工场', color: 'text-rose-500', badge: '' },
      { path: '/ai-tools',       icon: Sparkles,     label: 'AI工具箱', color: 'text-cyan-500', badge: '' },
    ]
  },
  {
    label: '⚙️ 系统',
    collapsed: true,
    items: [
      { path: '/membership',  icon: Crown,    label: '会员中心', color: 'text-yellow-500', badge: '' },
      { path: '/invite',      icon: Gift,      label: '邀请好友', color: 'text-pink-500', badge: '' },
      { path: '/ai-gateway',  icon: Server,   label: 'AI网关', color: 'text-violet-500', badge: '', adminOnly: true },
      { path: '/admin-membership', icon: Shield, label: '会员开关', color: 'text-indigo-500', badge: '', adminOnly: true },
      { path: '/ad-analytics', icon: BarChart3, label: '广告分析', color: 'text-emerald-500', badge: '' },
      { path: '/settings',    icon: Settings, label: '设置', color: 'text-gray-500', badge: '' },
    ]
  },
];

export default function ModernLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // 管理员检测
  const isAdmin = user?.email === 'lyshlc@163.com' || user?.email?.includes('lyshlc');

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'basic': return '基础版';
      case 'premium': return '高级版';
      case 'enterprise': return '企业版';
      default: return '免费版';
    }
  };

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f6fa' }}>
      {/* 移动端遮罩 */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
        />
      )}

      {/* 侧边栏 */}
      <aside style={{
        width: sidebarOpen ? 240 : 60,
        minHeight: '100vh',
        background: '#1a1a2e',
        color: '#fff',
        transition: 'width 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 50,
        overflowX: 'hidden',
      }}>
        {/* Logo + 收起按钮 */}
        <div style={{
          padding: '16px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          minHeight: 64,
        }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800,
              }}>C</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Claw</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>跨境智造</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer', padding: 4, fontSize: 18,
            }}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* 导航 */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {NAV_GROUPS.map(group => {
            // 整体分组隐藏（如果adminOnly=true且非管理员）
            if (group.adminOnly && !isAdmin) return null;
            const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
            if (visibleItems.length === 0) return null;
            const isCollapsed = collapsedGroups[group.label];

            return (
              <div key={group.label} style={{ marginBottom: 4 }}>
                {/* 分组标题 */}
                {sidebarOpen && (
                  <div
                    onClick={() => group.items.length > 1 && toggleGroup(group.label)}
                    style={{
                      padding: '6px 16px', fontSize: 10, fontWeight: 600,
                      color: 'rgba(255,255,255,0.35)',
                      textTransform: 'uppercase', letterSpacing: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: group.items.length > 1 ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                  >
                    <span>{group.label}</span>
                    {group.collapsed && (isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />)}
                  </div>
                )}

                {visibleItems.map(item => {
                  const isItemCollapsed = group.collapsed && isCollapsed;
                  if (sidebarOpen && isItemCollapsed) return null;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: sidebarOpen ? '10px 16px' : '10px 0',
                        justifyContent: sidebarOpen ? 'flex-start' : 'center',
                        textDecoration: 'none',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                        background: isActive ? 'rgba(99,102,241,0.2)' : 'transparent',
                        borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                        transition: 'all 0.15s',
                        fontSize: 14,
                        whiteSpace: 'nowrap',
                        position: 'relative',
                        margin: '1px 0',
                      })}
                      onMouseEnter={e => {
                        if (!e.currentTarget.className.includes('active'))
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      }}
                      onMouseLeave={e => {
                        if (!e.currentTarget.className.includes('active'))
                          e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <item.icon size={sidebarOpen ? 18 : 20} className={item.color} />
                      {sidebarOpen && (
                        <>
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {item.badge && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '1px 6px',
                              borderRadius: 8, background: '#ef4444', color: '#fff',
                            }}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* 用户信息 */}
        {sidebarOpen && (
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: 12, marginTop: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
              }}>
                {user?.name?.[0] || 'U'}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || user?.email?.split('@')[0] || '用户'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  {user?.email || ''}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 8,
                background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.2)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <LogOut size={14} /> 退出登录
            </button>
          </div>
        )}
      </aside>

      {/* 主内容 */}
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? 240 : 60,
        transition: 'margin-left 0.25s ease',
        padding: 0,
        minHeight: '100vh',
        overflowY: 'auto',
      }}>
        {/* 移动端顶部栏 */}
        <div style={{
          display: 'none',
          position: 'sticky', top: 0, zIndex: 30,
          background: '#fff', padding: '12px 16px',
          borderBottom: '1px solid #e0e0e0',
        }}>
          <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Menu size={24} color="#333" />
          </button>
        </div>

        <Outlet />
        <AIChatWidget />
      </main>
    </div>
  );
}
