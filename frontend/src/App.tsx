import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ModernLayout from './components/ModernLayout';
import LoginPage from './pages/ModernLogin';
import RegisterPage from './pages/ModernRegister';

// 懒加载页面（减少首屏体积）
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const TrendingPage       = lazy(() => import('./pages/TrendingPage'));
const SmartPublishPage   = lazy(() => import('./pages/PublishPage'));
const AdCollectionPage   = lazy(() => import('./pages/AdCollectionPage'));
const ProductsPage       = lazy(() => import('./pages/ProductsPage'));
const AccountsPage       = lazy(() => import('./pages/AccountsPage'));
const MembershipPage     = lazy(() => import('./pages/MembershipPage'));
const ServicesPage       = lazy(() => import('./pages/ServicesPage'));
const CalculatorPage     = lazy(() => import('./pages/CalculatorPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const TikTokPage          = lazy(() => import('./pages/TikTokPage'));
const YouTubePage          = lazy(() => import('./pages/YouTubePage'));
const AvatarPage           = lazy(() => import('./pages/AvatarPage'));
const OrdersPage           = lazy(() => import('./pages/OrdersPage'));
const PaymentResultPage    = lazy(() => import('./pages/PaymentResultPage'));

// Google OAuth 回调处理组件（处理 google_token + google_user URL参数）
function GoogleCallbackHandler({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('google_token');
    const userStr = searchParams.get('google_user');
    const authError = searchParams.get('auth_error');

    if (authError) {
      console.error('[Auth] Google OAuth 错误:', authError);
      navigate('/login?error=' + authError);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        loginWithToken(token, user);
        navigate('/', { replace: true });
      } catch (err) {
        console.error('[Auth] Google OAuth 回调解析失败:', err);
        navigate('/login?error=callback_failed');
      }
    }
  }, []);

  return <>{children}</>;
}

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
      <Route path="/register" element={
        <PublicRoute><RegisterPage /></PublicRoute>
      } />
      <Route path="/payment-result" element={
        <Suspense fallback={<PageLoading />}><PaymentResultPage /></Suspense>
      } />

      {/* 受保护路由 */}
      <Route path="/" element={
        <ProtectedRoute>
          <ModernLayout />
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
        <Route path="services"       element={<Suspense fallback={<PageLoading />}><ServicesPage /></Suspense>} />
        <Route path="calculator"     element={<Suspense fallback={<PageLoading />}><CalculatorPage /></Suspense>} />
        <Route path="settings"       element={<Suspense fallback={<PageLoading />}><SettingsPage /></Suspense>} />
        <Route path="tiktok"         element={<Suspense fallback={<PageLoading />}><TikTokPage /></Suspense>} />
        <Route path="youtube"        element={<Suspense fallback={<PageLoading />}><YouTubePage /></Suspense>} />
        <Route path="avatar"         element={<Suspense fallback={<PageLoading />}><AvatarPage /></Suspense>} />
        <Route path="orders"        element={<Suspense fallback={<PageLoading />}><OrdersPage /></Suspense>} />
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
        <GoogleCallbackHandler>
          <AppRoutes />
        </GoogleCallbackHandler>
      </BrowserRouter>
    </AuthProvider>
  );
}
