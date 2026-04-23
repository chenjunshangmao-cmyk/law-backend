import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Globe,
  Package,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  Bot,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [backendVersion, setBackendVersion] = useState<string>('--');

  // 获取后端版本
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/version`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBackendVersion(data.version);
        }
      })
      .catch(() => setBackendVersion('error'));
  }, []);

  const features = [
    { icon: <Zap className="w-6 h-6" />, title: '一键选品', desc: 'AI 智能分析 1688 爆款商品，自动筛选高利润品类' },
    { icon: <ShoppingCart className="w-6 h-6" />, title: '自动上架', desc: '妙手ERP同步铺货，批量发布到 TikTok Shop / YouTube' },
    { icon: <TrendingUp className="w-6 h-6" />, title: '智能定价', desc: '多维度成本计算，快递/空运/陆运利润最大化' },
    { icon: <BarChart3 className="w-6 h-6" />, title: '数据分析', desc: '实时监控销售数据，订单/利润报表一目了然' },
    { icon: <Globe className="w-6 h-6" />, title: '社媒发布', desc: '多平台图文/视频一键发布，支持定时全自动' },
    { icon: <Bot className="w-6 h-6" />, title: 'AI 数字人直播', desc: '24小时自动循环直播，AI主播自动回复观众' },
  ];

  const plans = [
    {
      name: '免费版',
      price: '¥0',
      period: '永久免费',
      features: ['每日5次选品查询', '基础定价计算', '手动发布', '1个社媒账号'],
      highlight: false,
    },
    {
      name: '基础版',
      price: '¥199',
      period: '/月',
      features: ['无限选品查询', 'AI智能选品', '自动批量发布', '5个社媒账号', '发布历史记录'],
      highlight: false,
    },
    {
      name: '高级版',
      price: '¥499',
      period: '/月',
      features: ['全部基础版功能', '无限社媒账号', 'AI数字人直播', '妙手ERP集成', '优先技术支持'],
      highlight: true,
    },
    {
      name: '企业版',
      price: '¥1599',
      period: '/月',
      features: ['全部高级版功能', '专属技术支持', '定制开发', '私有化部署', 'API调用权限'],
      highlight: false,
    },
    {
      name: 'VIP版',
      price: '¥5888',
      period: '/月',
      features: ['企业版全部功能', '一对一专属顾问', '优先资源保障', '独立服务器部署'],
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航 */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Claw</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium ml-1">外贸神器</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              登录
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-1"
            >
              免费试用
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero 区域 */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            已帮助 500+ 外贸人提升效率
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            开启智能<br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              跨境电商
            </span> 新时代
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            一站式跨境电商解决方案：从选品、定价、上架到直播，全流程自动化。<br />
            <strong>从手动 20 分钟/件 → 自动化 1 分钟/件</strong>
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:shadow-blue-300 flex items-center gap-2"
            >
              免费开始
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-2xl text-lg border border-gray-200 transition-colors"
            >
              已有账号登录
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-4">注册即享 7 天会员试用，无需绑卡</p>
        </div>
      </section>

      {/* 功能介绍 */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">为什么选择 Claw？</h2>
            <p className="text-gray-500 text-lg">全流程自动化，让外贸更简单</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-blue-100 transition-all">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 定价 */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">简单透明的定价</h2>
            <p className="text-gray-500 text-lg">按需选择，灵活升级</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 transition-all ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-2xl shadow-blue-200 scale-105'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                {plan.highlight && (
                  <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                    推荐
                  </div>
                )}
                <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? 'text-blue-100' : 'text-gray-400'}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-blue-100' : 'text-gray-500'}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-white' : 'text-green-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.name === '免费版' ? '免费使用' : '立即开通'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-cyan-500 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
          <p className="text-blue-100 mb-8 text-lg">3分钟注册，马上体验自动化外贸的效率提升</p>
          <button
            onClick={() => navigate('/register')}
            className="px-10 py-4 bg-white text-blue-600 font-bold rounded-2xl text-lg hover:bg-blue-50 transition-colors shadow-xl"
          >
            立即免费注册 →
          </button>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-6 text-center text-sm">
        <p>© 2026 Claw · 智能外贸一站式平台 · 让全球贸易更简单</p>
        <p className="mt-2 text-xs text-gray-500">前端 v1.1.0423 · 后端 v{backendVersion}</p>
      </footer>
    </div>
  );
}
