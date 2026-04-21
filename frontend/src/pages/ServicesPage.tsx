import React, { useState } from 'react';
import { Globe, Building2, Video, Facebook, Target, Zap, Check, ExternalLink, QrCode, RefreshCw } from 'lucide-react';
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
    features: ['平台资质审核', '账户安全验证', '支付方式绑定', '投放额度申请', '账户维护指导'],
    duration: '一次性服务，账户永久使用'
  }
];

export default function ServicesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [polling, setPolling] = useState(false);
  const [pollTimer, setPollTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  // 清理轮询
  React.useEffect(() => {
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [pollTimer]);

  const handleServiceSelect = async (serviceId: string) => {
    setLoading(true);
    setError('');
    setSelectedService(serviceId);
    setOrder(null);
    
    try {
      const service = SERVICES.find(s => s.id === serviceId);
      if (!service) throw new Error('服务不存在');
      
      const res = await api.payment.createOrder({
        serviceId: serviceId,
        serviceName: service.name,
        amount: service.price
      });
      
      if (!res.success) {
        throw new Error(res.error || '创建订单失败');
      }
      
      setOrder(res.data);
      
      // 开始轮询订单状态
      if (res.data?.orderNo) {
        startPolling(res.data.orderNo);
      }
    } catch (e: any) {
      setError(e.message || '服务订购失败，请稍后重试');
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
          alert(`✅ ${SERVICES.find(s => s.id === selectedService)?.name} 订购成功！`);
        }
      } catch {
        // 轮询失败不影响显示
      }
    }, 3000);
    setPollTimer(timer);
    
    // 5分钟后停止轮询
    setTimeout(() => {
      clearInterval(timer);
      setPolling(false);
    }, 5 * 60 * 1000);
  };

  const cancelPayment = () => {
    if (pollTimer) clearInterval(pollTimer);
    setOrder(null);
    setPolling(false);
    setSelectedService('');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
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

      {/* 服务网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          const isSelected = selectedService === service.id;
          const isProcessing = isSelected && (loading || polling);
          
          return (
            <div
              key={service.id}
              className={`border rounded-2xl p-6 transition-all duration-300 ${
                isSelected 
                  ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${service.color}-100`}>
                    <Icon className={`w-6 h-6 text-${service.color}-600`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-500">{service.duration}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">¥{service.price}</div>
                  <div className="text-sm text-gray-500">{service.priceUnit}</div>
                </div>
              </div>

              <p className="text-gray-600 mb-4 text-sm">{service.description}</p>

              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">包含服务：</h4>
                <ul className="space-y-1">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleServiceSelect(service.id)}
                disabled={loading || polling}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isProcessing
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {polling ? '等待支付确认...' : '创建订单中...'}
                  </div>
                ) : (
                  '立即订购'
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* 支付弹窗 */}
      {order && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-2">
              {SERVICES.find(s => s.id === selectedService)?.name} - 
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

      {/* 服务说明 */}
      <div className="mt-12 p-6 bg-gray-50 rounded-2xl">
        <h3 className="font-bold text-lg text-gray-900 mb-4">服务流程说明</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg">
            <div className="text-blue-600 font-bold text-lg mb-2">1. 选择服务</div>
            <p className="text-gray-600 text-sm">根据业务需求选择合适的服务套餐</p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <div className="text-blue-600 font-bold text-lg mb-2">2. 在线支付</div>
            <p className="text-gray-600 text-sm">通过安全支付网关完成订单支付</p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <div className="text-blue-600 font-bold text-lg mb-2">3. 开始服务</div>
            <p className="text-gray-600 text-sm">支付成功后，专业团队立即开始服务</p>
          </div>
        </div>
      </div>
    </div>
  );
}