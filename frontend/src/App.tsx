import React, { Suspense, lazy, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ModernLayout from './components/ModernLayout';
import LoginPage from './pages/ModernLogin';
import RegisterPage from './pages/ModernRegister';

// 懒加载页面（减少首屏体积�?
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const TrendingPage       = lazy(() => import('./pages/TrendingPage'));
const SmartPublishPage   = lazy(() => import('./pages/PublishPage'));
const AdCollectionPage   = lazy(() => import('./pages/AdCollectionPage'));
const AdAnalyticsPage    = lazy(() => import('./pages/AdAnalyticsPage'));
const ProductsPage       = lazy(() => import('./pages/ProductsPage'));
const AccountsPage       = lazy(() => import('./pages/AccountsPage'));
const MembershipPage     = lazy(() => import('./pages/MembershipPage'));
const InvitePage         = lazy(() => import('./pages/InvitePage'));
const ServicesPage       = lazy(() => import('./pages/ServicesPage'));
const ShowcasePage       = lazy(() => import('./pages/ShowcasePage'));
const CalculatorPage     = lazy(() => import('./pages/CalculatorPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const TikTokPage          = lazy(() => import('./pages/TikTokPage'));
const YouTubePage          = lazy(() => import('./pages/YouTubePage'));
const XiaohongshuPage       = lazy(() => import('./pages/XiaohongshuPage'));
const AiContentPage         = lazy(() => import('./pages/AiContentPage'));
const TikTokPublishPage     = lazy(() => import('./pages/TikTokPublishPage'));
const OzonPublishPage       = lazy(() => import('./pages/OzonPublishPage'));
const AvatarPage           = lazy(() => import('./pages/AvatarPage'));
const WriterPage           = lazy(() => import('./pages/WriterPage'));
const VideoFactoryPage     = lazy(() => import('./pages/VideoFactoryPage'));
const AIToolsPage          = lazy(() => import('./pages/AIToolsPage'));
const OrdersPage           = lazy(() => import('./pages/OrdersPage'));
const PaymentResultPage    = lazy(() => import('./pages/PaymentResultPage'));
const WhatsAppPage          = lazy(() => import('./pages/WhatsAppPage'));
const FacebookPage          = lazy(() => import('./pages/FacebookPage'));
const CustomerServicePage    = lazy(() => import('./pages/CustomerServicePage'));
const LiveStreamPage        = lazy(() => import('./pages/LiveStreamPage'));
const AIGatewayPage         = lazy(() => import('./pages/AIGatewayPage'));
const AdminTogglesPage       = lazy(() => import('./pages/AdminTogglesPage'));
const ArticlesPage          = lazy(() => import('./pages/ArticlesPage'));
const ArticleDetailPage     = lazy(() => import('./pages/ArticleDetailPage'));
const DigitalShopPage       = lazy(() => import('./pages/DigitalShopPage'));
const NovelFactoryPage      = lazy(() => import('./pages/NovelFactoryPage'));
const SaaSBuilderPage       = lazy(() => import('./pages/SaaSBuilderPage'));

// Google OAuth 回调处理组件（处�?google_token + google_user URL参数�?
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

// 加载中组�?
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
      <span>加载�?..</span>
    </div>
  );
}

// 受保护路�?
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// 已登录跳转首�?
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

      {/* 受保护路�?*/}
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
        <Route path="ad-analytics"   element={<Suspense fallback={<PageLoading />}><AdAnalyticsPage /></Suspense>} />
        <Route path="products"       element={<Suspense fallback={<PageLoading />}><ProductsPage /></Suspense>} />
        <Route path="accounts"       element={<Suspense fallback={<PageLoading />}><AccountsPage /></Suspense>} />
        <Route path="membership"     element={<Suspense fallback={<PageLoading />}><MembershipPage /></Suspense>} />
        <Route path="invite"        element={<Suspense fallback={<PageLoading />}><InvitePage /></Suspense>} />
        <Route path="services"       element={<Suspense fallback={<PageLoading />}><ServicesPage /></Suspense>} />
        <Route path="showcase"      element={<Suspense fallback={<PageLoading />}><ShowcasePage /></Suspense>} />
        <Route path="calculator"     element={<Suspense fallback={<PageLoading />}><ErrorBoundary><CalculatorPage /></ErrorBoundary></Suspense>} />
        <Route path="settings"       element={<Suspense fallback={<PageLoading />}><SettingsPage /></Suspense>} />
        <Route path="tiktok"         element={<Suspense fallback={<PageLoading />}><TikTokPage /></Suspense>} />
        <Route path="tiktok-publish" element={<Suspense fallback={<PageLoading />}><TikTokPublishPage /></Suspense>} />
        <Route path="ozon-publish"   element={<Suspense fallback={<PageLoading />}><OzonPublishPage /></Suspense>} />
        <Route path="youtube"        element={<Suspense fallback={<PageLoading />}><YouTubePage /></Suspense>} />
        <Route path="xiaohongshu"    element={<Suspense fallback={<PageLoading />}><ErrorBoundary><XiaohongshuPage /></ErrorBoundary></Suspense>} />
        <Route path="ai-content"     element={<Suspense fallback={<PageLoading />}><AiContentPage /></Suspense>} />
        <Route path="avatar"         element={<Suspense fallback={<PageLoading />}><AvatarPage /></Suspense>} />
        <Route path="writer"         element={<Suspense fallback={<PageLoading />}><WriterPage /></Suspense>} />
        <Route path="video-factory"  element={<Suspense fallback={<PageLoading />}><VideoFactoryPage /></Suspense>} />
        <Route path="ai-tools"       element={<Suspense fallback={<PageLoading />}><AIToolsPage /></Suspense>} />
        <Route path="orders"        element={<Suspense fallback={<PageLoading />}><OrdersPage /></Suspense>} />
        <Route path="whatsapp"       element={<Suspense fallback={<PageLoading />}><WhatsAppPage /></Suspense>} />
        <Route path="facebook"      element={<Suspense fallback={<PageLoading />}><FacebookPage /></Suspense>} />
        <Route path="customer-service" element={<Suspense fallback={<PageLoading />}><CustomerServicePage /></Suspense>} />
        <Route path="live-stream"    element={<Suspense fallback={<PageLoading />}><LiveStreamPage /></Suspense>} />
        <Route path="ai-gateway"     element={<Suspense fallback={<PageLoading />}><AIGatewayPage /></Suspense>} />
        <Route path="admin-membership" element={<Suspense fallback={<PageLoading />}><AdminTogglesPage /></Suspense>} />
        <Route path="articles"       element={<Suspense fallback={<PageLoading />}><ArticlesPage /></Suspense>} />
        <Route path="articles/:slug" element={<Suspense fallback={<PageLoading />}><ArticleDetailPage /></Suspense>} />
        <Route path="novel-factory"  element={<Suspense fallback={<PageLoading />}><NovelFactoryPage /></Suspense>} />
        <Route path="digital-shop"   element={<Suspense fallback={<PageLoading />}><DigitalShopPage /></Suspense>} />
        <Route path="saas-builder"    element={<Suspense fallback={<PageLoading />}><SaaSBuilderPage /></Suspense>} />
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
