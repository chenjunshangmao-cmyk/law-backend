import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Zap,
  Globe,
  Package,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ModernLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 显示 Google OAuth 失败的错误提示
  useEffect(() => {
    const authError = searchParams.get('error') || searchParams.get('auth_error');
    if (authError) {
      const errorMessages = {
        google_denied: 'Google 授权被取消，请重试',
        no_code: '授权信息缺失，请重试',
        google_callback_failed: '登录失败，请重试',
        callback_failed: '登录处理失败，请重试',
      };
      setError(errorMessages[authError] || '登录失败，请重试');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.auth.login(email, password);
      
      if (response.success) {
        await login(response.data.token, response.data.user);
        navigate('/dashboard');
      } else {
        setError(response.error || '登录失败');
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Globe,
      title: '多平台管理',
      description: '支持 TikTok、OZON、YouTube 等主流平台'
    },
    {
      icon: Package,
      title: '智能上架',
      description: 'AI自动生成产品标题、描述和标签'
    },
    {
      icon: TrendingUp,
      title: '数据分析',
      description: '实时销售数据与竞品分析'
    },
    {
      icon: Zap,
      title: 'AI助手',
      description: '24小时智能客服与运营建议'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="flex flex-col lg:flex-row bg-white rounded-3xl overflow-hidden shadow-2xl">
          {/* 左侧登录表单 */}
          <div className="lg:w-1/2 p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Zap size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Claw 跨境智造</h1>
                  <p className="text-sm text-gray-500">AI驱动的外贸电商平台</p>
                </div>
              </div>

              {/* 欢迎语 */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来 👋</h2>
                <p className="text-gray-600">请登录您的账户继续使用</p>
              </div>

              {/* 登录表单 */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 邮箱输入 */}
                <div>
                  <label className="form-label">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Mail size={16} className="text-gray-400" />
                      邮箱地址
                    </div>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入您的邮箱"
                    className="form-input"
                    required
                  />
                </div>

                {/* 密码输入 */}
                <div>
                  <label className="form-label">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Lock size={16} className="text-gray-400" />
                      密码
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="form-input pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* 记住我 & 忘记密码 */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">记住我</span>
                  </label>
                  <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    忘记密码？
                  </button>
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* 登录按钮 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 text-lg font-medium"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="loading-spinner w-5 h-5"></div>
                      登录中...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <LogIn size={20} />
                      登录账户
                    </div>
                  )}
                </button>

                {/* 谷歌授权登录 */}
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `${import.meta.env.VITE_API_URL || 'https://claw-backend-2026.onrender.com'}/api/auth/google`;
                  }}
                  className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  使用 Google 账号登录
                </button>

                {/* 测试账户提示 */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 测试账户：admin@claw.com / admin123
                  </p>
                </div>
              </form>

              {/* 注册提示 */}
              <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                <p className="text-gray-600">
                  还没有账户？{' '}
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    立即注册 →
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* 右侧功能介绍 */}
          <div className="lg:w-1/2 bg-gradient-to-br from-blue-600 to-cyan-500 p-8 lg:p-12 text-white">
            <div className="max-w-md mx-auto h-full flex flex-col">
              {/* 标题 */}
              <div className="mb-12">
                <h2 className="text-3xl font-bold mb-4">开启智能外贸新时代</h2>
                <p className="text-blue-100 opacity-90">
                  Claw 为您提供一站式跨境电商解决方案，让全球贸易更简单
                </p>
              </div>

              {/* 功能列表 */}
              <div className="space-y-6 mb-12">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                        <Icon size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                        <p className="text-blue-100 opacity-80">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 统计数据 */}
              <div className="mt-auto">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold">5000+</div>
                    <div className="text-sm text-blue-100 opacity-80">活跃商家</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">¥2.8亿</div>
                    <div className="text-sm text-blue-100 opacity-80">平台交易额</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">98%</div>
                    <div className="text-sm text-blue-100 opacity-80">客户满意度</div>
                  </div>
                </div>

                {/* 客户评价 */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm italic">
                        "使用 Claw 后，我们的跨境电商业务效率提升了 300%，AI助手真的太智能了！"
                      </p>
                      <p className="text-xs text-blue-100 opacity-80 mt-2">— 深圳某珠宝贸易公司</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2026 Claw 跨境智造平台. 保留所有权利. 
            <span className="mx-2">•</span>
            <a href="#" className="text-gray-600 hover:text-gray-900">隐私政策</a>
            <span className="mx-2">•</span>
            <a href="#" className="text-gray-600 hover:text-gray-900">服务条款</a>
          </p>
        </div>
      </div>
    </div>
  );
}