import React, { useState, useEffect } from 'react';
import { Check, Globe, Building2, Video, Facebook, Target, Zap, QrCode, RefreshCw, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// 业务服务配置（与后端保持一致）
const SERVICES = [
  {
    id: 'domestic-op',
    name: '国内代运营',
    description: '专业团队为您运营国内电商平台（淘宝、拼多多、抖音等），包含选品、上架、推广、客服全流程',
    price: 5000,
    priceUnit: '/月',
    icon: Building2,
    color: 'blue',
    popular: false,
    features: ['平台账号管理', '每日选品上架', '营销活动策划', '客户服务支持', '数据报表分析'],
    duration: '按月服务，可随时暂停'
  },
  {
    id: 'overseas-op',
    name: '海外代运营',
    description: '专注跨境电商（TikTok Shop、OZON、亚马逊等），海外市场开拓与运营',
    price: 5000,
    priceUnit: '/月',
    icon: Globe,
    color: 'green',
    popular: true,
    features: ['多语言内容制作', '海外平台账号管理', '跨境物流协调', '国际支付处理', '海外营销推广'],
    duration: '按月服务，支持多国市场'
  },
  {
    id: 'website-build',
    name: '独立站搭建',
    description: '定制化外贸独立站，品牌官网建设，支持多语言、多货币、多支付方式',
    price: 3800,
    priceUnit: '/站',
    icon: Zap,
    color: 'purple',
    popular: false,
    features: ['响应式设计', 'SEO优化', '支付网关集成', '多语言支持', '后台管理系统'],
    duration: '一次性项目，含一年维护'
  },
  {
    id: 'youtube-live',
    name: 'YouTube 直播号',
    description: 'YouTube直播账号搭建与运营，海外直播带货，内容创作与粉丝增长',
    price: 1000,
    priceUnit: '/个',
    icon: Video,
    color: 'red',
    popular: false,
    features: ['账号注册认证', '直播设备配置', '内容策划制作', '粉丝互动运营', '数据分析优化'],
    duration: '账号交付+30天指导'
  },
  {
    id: 'facebook-live',
    name: 'Facebook 直播推广号',
    description: 'Facebook直播账号与广告账户，海外社交媒体营销，精准受众定位',
    price: 2800,
    priceUnit: '/个',
    icon: Facebook,
    color: 'indigo',
    popular: false,
    features: ['账号注册与验证', '广告账户开通', '直播内容策划', '受众精准定位', 'ROI数据分析'],
    duration: '账号交付+广告投放指导'
  },
  {
    id: 'ads-account',
    name: '广告户开户',
    description: '各大平台广告账户开户服务，解决开户难题，提供稳定广告投放渠道',
    price: 500,
    priceUnit: '/户',
    icon: Target,
    color: 'amber',
    popular: false,
    features: ['平台资质审核', '账户安全验证', '支付方式绑定', '投放额度申请', '账户维护指导'],
    duration: '一次性服务，账户永久使用'
  }
];

interface SqOrder {
  sn: string;
  clientSn: string;
  payUrl: string;
  totalAmount: string;
}

export default function ServicesPage() {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState('');

  // 银行卡支付（普通弹窗）
  const [order, setOrder] = useState<any>(null);
  const [polling, setPolling] = useState(false);
  const [pollTimer, setPollTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  // 收钱吧支付（微信/支付宝）
  const [sqOrder, setSqOrder] = useState<SqOrder | null>(null);
  const [sqPolling, setSqPolling] = useState(false);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [pollTimer]);

  // 银行卡支付
  const handlePay = async (serviceId: string) => {
    setLoading(true);
    setError('');
    setSelectedService(serviceId);
    setOrder(null);
    setSqOrder(null);

    try {
      const service = SERVICES.find(s => s.id === serviceId);
      if (!service) throw new Error('服务不存在');

      // 不传 amount，后端从 SERVICES 常量读取正确金额（×100转分）
      const res = await api.payment.createOrder({
        serviceId,
        serviceName: service.name
      });

      if (!res.success) throw new Error(res.error || '创建订单失败');
      setOrder(res.data);

      if (res.data?.orderNo) {
        startPolling(res.data.orderNo);
      }
    } catch (e: any) {
      setError(e.message || '服务订购失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 收钱吧支付（微信/支付宝直连）
  const handleShouqianbaPay = async (serviceId: string, price: number) => {
    setLoading(true);
    setError('');
    setSelectedService(serviceId);
    setSqOrder(null);
    setOrder(null);

    try {
      // 先激活终端
      await api.shouqianba.activate();

      // 创建收钱吧订单
      const service = SERVICES.find(s => s.id === serviceId);
      const res = await api.shouqianba.createOrder(serviceId, price, `Claw 业务服务 - ${service?.name || serviceId}`);
      if (!res.success) throw new Error(res.error || '创建收钱吧订单失败');

      setSqOrder(res.data);

      // 轮询查询支付状态
      setSqPolling(true);
      const poll = setInterval(async () => {
        try {
          const status = await api.shouqianba.query(res.data.sn);
          if (status.data?.orderStatus === 'PAID' || status.data?.status === 'SUCCESS') {
            clearInterval(poll);
            setSqPolling(false);
            setSqOrder(null);
            const service = SERVICES.find(s => s.id === serviceId);
            alert(`✅ ${service?.name} 订购成功！`);
            refreshUser();
          }
        } catch { /* ignore */ }
      }, 3000);

      // 5分钟超时
      setTimeout(() => {
        clearInterval(poll);
        setSqPolling(false);
      }, 5 * 60 * 1000);
    } catch (e: any) {
      setError(e.message || '收钱吧支付暂时不可用，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (orderNo: string) => {
    setPolling(true);
    const timer = setInterval(async () => {
      try {
        const res = await api.payment.status(orderNo);
        if (res.data?.status === 'paid') {
          clearInterval(timer);
          setPolling(false);
          setOrder(null);
          const service = SERVICES.find(s => s.id === selectedService);
          alert(`✅ ${service?.name} 订购成功！`);
          refreshUser();
        }
      } catch { /* ignore */ }
    }, 3000);
    setPollTimer(timer);

    setTimeout(() => {
      clearInterval(timer);
      setPolling(false);
    }, 5 * 60 * 1000);
  };

  const cancelPayment = () => {
    if (pollTimer) clearInterval(pollTimer);
    setOrder(null);
    setSqOrder(null);
    setPolling(false);
    setSqPolling(false);
    setSelectedService('');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">专业业务服务</h1>
        <p className="text-gray-500 mt-1">选择适合您业务的专业服务，我们提供全方位的电商运营支持</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <p className="font-medium">订购失败</p>
          <p className="text-sm mt-1">{error}</p>
          <button onClick={() => setError('')} className="text-sm underline mt-2">关闭</button>
        </div>
      )}

      {/* 收钱吧支付弹窗（微信/支付宝）—— 与 MembershipPage 完全一致风格 */}
      {sqOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {SERVICES.find(s => s.id === selectedService)?.name}
                {' '}— ¥{Number(sqOrder.totalAmount) / 100}
              </h2>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">收钱吧</span>
            </div>


            {sqOrder.payUrl && (
              <div className="text-center mb-4">
                <img
                  src={'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(sqOrder.payUrl)}
                  alt="支付二维码"
                  className="mx-auto rounded-lg border border-gray-200"
                  style={{ width: 200, height: 200 }}
                />
              </div>
            )}



            <button
              onClick={cancelPayment}
              className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 银行卡支付弹窗 */}
      {order && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-2">
              {SERVICES.find(s => s.id === selectedService)?.name} —
              ¥{SERVICES.find(s => s.id === selectedService)?.price}
              {SERVICES.find(s => s.id === selectedService)?.priceUnit}
            </h2>

            {order.testMode ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-800 text-sm font-medium">⚠️ 测试模式</p>
                <p className="text-yellow-700 text-xs mt-1">支付网关未配置，当前为测试订单</p>
              </div>
            ) : null}

            {order.payUrl && !order.testMode ? (
              <div className="text-center">
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">扫描二维码完成支付</p>
                </div>
                <a
                  href={order.payUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 mb-3"
                >
                  <ExternalLink className="w-4 h-4" />
                  点击支付
                </a>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">订单号：{order.orderNo}</p>
                {order.message && <p className="text-xs mt-2 text-gray-400">{order.message}</p>}
              </div>
            )}

            {polling && (
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mb-4">
                <RefreshCw className="w-4 h-4 animate-spin" />
                正在等待支付确认...
              </div>
            )}

            <button
              onClick={cancelPayment}
              className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 服务卡片网格 —— 与 MembershipPage 风格一致 */}
      <div className="grid gap-6 md:grid-cols-3">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          const isProcessing = selectedService === service.id && loading;

          return (
            <div
              key={service.id}
              className={`relative rounded-2xl border p-6 transition-all ${
                service.popular
                  ? 'border-green-400 shadow-lg shadow-green-100'
                  : 'border-gray-200'
              }`}
            >
              {/* 推荐标签 */}
              {service.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    热门
                  </span>
                </div>
              )}

              {/* 图标 + 名称 */}
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-6 h-6 text-${service.color}-500`} />
                <h2 className="text-lg font-bold text-gray-900">{service.name}</h2>
              </div>

              {/* 价格 */}
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">¥{service.price}</span>
                <span className="text-gray-500 text-sm">{service.priceUnit}</span>
              </div>

              {/* 服务内容 */}
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className={`w-4 h-4 text-${service.color}-500 flex-shrink-0 mt-0.5`} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* 微信/支付宝支付（收钱吧直连） */}
              <button
                onClick={() => handleShouqianbaPay(service.id, service.price)}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl font-medium transition-colors text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? '处理中...' : '💚 微信/支付宝'}
              </button>
            </div>
          );
        })}
      </div>

      {/* 底部说明 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-600">
        <p>如有支付问题，请联系客服：<span className="font-medium text-blue-600">15119885271</span></p>
        <p className="mt-1 text-xs text-gray-400">支持微信/支付宝/银行卡支付</p>
      </div>
    </div>
  );
}
