import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';

// 懒加载页面（减少首屏体积）
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const TrendingPage       = lazy(() => import('./pages/TrendingPage'));
const SmartPublishPage   = lazy(() => import('./pages/SmartPublishPage'));
const AdCollectionPage   = lazy(() => import('./pages/AdCollectionPage'));
const ProductsPage       = lazy(() => import('./pages/ProductsPage'));
const AccountsPage       = lazy(() => import('./pages/AccountsPage'));
const MembershipPage     = lazy(() => import('./pages/MembershipPage'));
const CalculatorPage     = lazy(() => import('./pages/CalculatorPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const TikTokPage          = lazy(() => import('./pages/TikTokPage'));
const YouTubePage          = lazy(() => import('./pages/YouTubePage'));
const AvatarPage           = lazy(() => import('./pages/AvatarPage'));

// 加载中组件
function PageLoading() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: '12px', color: '#666'
    }}>
      <div style={{
        width: 24, height: 24, border: '3px solid #e0e0e0',
        borderTopColor: '#6366f1', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span>加载中...</span>
    </div>
  );
}

// 受保护路由
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// 已登录跳转首页
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={
        <PublicRoute><LoginPage /></PublicRoute>
      } />

      {/* 受保护路由 */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"      element={<Suspense fallback={<PageLoading />}><DashboardPage /></Suspense>} />
        <Route path="trending"       element={<Suspense fallback={<PageLoading />}><TrendingPage /></Suspense>} />
        <Route path="publish"        element={<Suspense fallback={<PageLoading />}><SmartPublishPage /></Suspense>} />
        <Route path="ads"            element={<Suspense fallback={<PageLoading />}><AdCollectionPage /></Suspense>} />
        <Route path="products"       element={<Suspense fallback={<PageLoading />}><ProductsPage /></Suspense>} />
        <Route path="accounts"       element={<Suspense fallback={<PageLoading />}><AccountsPage /></Suspense>} />
        <Route path="membership"     element={<Suspense fallback={<PageLoading />}><MembershipPage /></Suspense>} />
        <Route path="calculator"     element={<Suspense fallback={<PageLoading />}><CalculatorPage /></Suspense>} />
        <Route path="settings"       element={<Suspense fallback={<PageLoading />}><SettingsPage /></Suspense>} />
        <Route path="tiktok"         element={<Suspense fallback={<PageLoading />}><TikTokPage /></Suspense>} />
        <Route path="youtube"        element={<Suspense fallback={<PageLoading />}><YouTubePage /></Suspense>} />
        <Route path="avatar"         element={<Suspense fallback={<PageLoading />}><AvatarPage /></Suspense>} />
      </Route>

      {/* 兜底 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
