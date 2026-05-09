import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AIChatWidget from './AIChatWidget';
import {
  LayoutDashboard, 
  TrendingUp, 
  Rocket, 
  Megaphone,
  Package,
  Store,
  Briefcase,
  Calculator,
  Crown,
  Settings,
  Bot,
  Menu,
  X,
  LogOut,
  User,
  Globe,
  Zap,
  DollarSign,
  Receipt,
  BookOpen,
  Sparkles,
  ChevronRight,
  MessageCircle,
  Youtube,
  PenLine,
  Clapperboard,
  Radio,
  Server,
  Facebook
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard',   icon: LayoutDashboard, label: '工作台', color: 'text-blue-500' },
  { path: '/trending',    icon: TrendingUp,      label: '爆款选品', color: 'text-red-500' },
  // { path: '/publish',     icon: Rocket,          label: '智能发布', color: 'text-purple-500' },  // 暂时隐藏，功能已拆分到小红书/OZON独立页
  { path: '/ads',         icon: Megaphone,       label: '广告采集', color: 'text-amber-500' },
  { path: '/products',    icon: Package,         label: '产品管理', color: 'text-emerald-500' },
  { path: '/accounts',    icon: Store,           label: '店铺账号', color: 'text-indigo-500' },
  { path: '/calculator',  icon: Calculator,      label: '利润计算', color: 'text-green-500' },
  { path: '/membership',  icon: Crown,           label: '会员中心', color: 'text-yellow-500' },
  { path: '/orders',     icon: Receipt,         label: '订单', color: 'text-orange-500' },
  { path: '/xiaohongshu', icon: BookOpen,        label: '小红书', color: 'text-red-500' },
  { path: '/ozon-publish', icon: Globe,          label: 'OZON发布', color: 'text-blue-600' },
  { path: '/ai-content',  icon: Sparkles,        label: 'AI智能图文', color: 'text-fuchsia-500' },
  { path: '/avatar',      icon: Bot,             label: 'AI数字人', color: 'text-violet-500' },
  { path: '/live-stream', icon: Radio,           label: 'AI直播', color: 'text-red-500' },
  { path: '/writer',     icon: PenLine,         label: 'AI文案', color: 'text-sky-500' },
  { path: '/video-factory', icon: Clapperboard, label: '短视频', color: 'text-rose-500' },
  { path: '/ai-tools',   icon: Sparkles,        label: 'AI工具箱', color: 'text-cyan-500' },
  { path: '/whatsapp',    icon: MessageCircle,    label: 'WhatsApp中继', color: 'text-green-500' },
  { path: '/facebook',   icon: Facebook,          label: 'Facebook', color: 'text-blue-600' },
  { path: '/youtube',    icon: Youtube,          label: 'YouTube', color: 'text-red-600' },
  { path: '/ai-gateway', icon: Server,           label: 'AI网关', color: 'text-violet-500', adminOnly: true },
  { path: '/settings',    icon: Settings,        label: '设置', color: 'text-gray-500' },
];

export default function ModernLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 管理员检测
  const isAdmin = user?.email === 'lyshlc@163.com' || user?.email?.includes('lyshlc');
  const filteredNavItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // 用户套餐颜色映射
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端顶部栏 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">Claw</span>
          </div>
        </div>
        
        {user && (
          <div className="flex items-center gap-3">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(user.membershipType || 'free')}`}>
              {getPlanName(user.membershipType || 'free')}
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <LogOut size={18} className="text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* 侧边栏 - 桌面端 */}
      <aside className={`
        hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-20'}
        bg-white border-r border-gray-200
      `}>
        {/* Logo区域 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap size={22} className="text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-gray-900 text-lg truncate">Claw 跨境智造</h1>
                <p className="text-xs text-gray-500 truncate">AI驱动的外贸电商平台</p>
              </div>
            )}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
            >
              <ChevronRight className={`transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} size={18} />
            </button>
          </div>
        </div>

        {/* 用户信息 */}
        {user && sidebarOpen && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user.name || user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPlanColor(user.membershipType || 'free')}`}>
                    {getPlanName(user.membershipType || 'free')}
                  </span>
                  {user.membershipExpiresAt && (
                    <span className="text-xs text-gray-500">
                      到期: {new Date(user.membershipExpiresAt).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 导航菜单 */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                    ${sidebarOpen ? 'justify-start' : 'justify-center'}
                  `}
                >
                  <Icon size={20} className={`flex-shrink-0 ${item.color}`} />
                  {sidebarOpen && (
                    <span className="font-medium text-sm truncate">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* 业务特色提示 */}
          {sidebarOpen && (
            <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">跨境特色</span>
              </div>
              <p className="text-xs text-blue-700">
                支持 TikTok Shop、OZON、YouTube 等多平台
              </p>
            </div>
          )}
        </nav>

        {/* 版本信息 */}
        {sidebarOpen && (
          <div className="px-4 py-2">
            <p className="text-[10px] text-gray-400 text-center select-all">
              v{__CLAW_VERSION__}
            </p>
          </div>
        )}

        {/* 底部操作 */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors"
            >
              <LogOut size={18} className="text-gray-500" />
              <span className="font-medium text-sm">退出登录</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2.5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors"
            >
              <LogOut size={18} className="text-gray-500" />
            </button>
          )}
        </div>
      </aside>

      {/* 移动端侧边栏 */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* 遮罩层 */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* 侧边栏内容 */}
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                    <Zap size={22} className="text-white" />
                  </div>
                  <div>
                    <h1 className="font-bold text-gray-900">Claw</h1>
                    <p className="text-xs text-gray-500">跨境智造平台</p>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 用户信息 */}
            {user && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.name || user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPlanColor(user.membershipType || 'free')}`}>
                        {getPlanName(user.membershipType || 'free')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 导航菜单 */}
            <nav className="p-4">
              <div className="space-y-1">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  if (item.path === '/publish') {
                    return (
                      <div key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={() => setPlatformsExpanded(!platformsExpanded)}
                          className={({ isActive }) => `
                            flex items-center gap-3 px-3 py-2.5 rounded-xl
                            ${isActive || platformsExpanded
                              ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                              : 'text-gray-700 hover:bg-gray-100'
                            }
                          `}
                        >
                          <Icon size={20} className={item.color} />
                          <span className="font-medium text-sm flex-1">{item.label}</span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${platformsExpanded ? 'rotate-90' : ''}`} />
                        </NavLink>
                        {platformsExpanded && (
                          <div className="ml-6 mt-1 space-y-1 border-l-2 border-purple-100 pl-3">
                            {PLATFORM_PAGES.map((p) => {
                              const PIcon = p.icon;
                              return (
                                <NavLink
                                  key={p.path}
                                  to={p.path}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className={({ isActive }) => `
                                    flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm
                                    ${isActive 
                                      ? 'bg-purple-50 text-purple-700 font-medium' 
                                      : 'text-gray-600 hover:bg-gray-50'
                                    }
                                  `}
                                >
                                  <PIcon size={16} className={p.color} />
                                  <span>{p.label}</span>
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2.5 rounded-xl
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon size={20} className={item.color} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* 主内容区域 */}
      <main className={`
        pt-16 lg:pt-0
        ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
        transition-all duration-300
        min-h-screen
      `}>
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      {/* 全局样式 */}
      <style>{`
        /* 自定义滚动条 */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        
        /* 平滑过渡 */
        * {
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        
        /* 聚焦样式 */
        :focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
      {/* AI 客服悬浮窗 */}
      <AIChatWidget />
    </div>
  );
}