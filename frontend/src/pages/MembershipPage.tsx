import React, { useState, useEffect } from 'react';
import { Check, Crown, Zap, Building2, ExternalLink, QrCode, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { PaymentOrder } from '../types';

const PLANS = [
  {
    id: 'basic',
    name: '基础版',
    price: 199,
    priceUnit: '/月',
    icon: Zap,
    color: 'blue',
    features: ['5个店铺绑定', 'AI文案：50次/月', 'AI图片：20次/月', 'AI视频：1次/天', '仅限国内平台'],
  },
  {
    id: 'premium',
    name: '专业版',
    price: 499,
    priceUnit: '/月',
    icon: Crown,
    color: 'purple',
    popular: true,
    features: ['10个店铺绑定', 'AI文案：无限次', 'AI图片：100次/月', 'AI视频：2次/天', '代理服务：1个国家'],
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: 1599,
    priceUnit: '/月',
    icon: Building2,
    color: 'amber',
    features: ['店铺绑定：无限', 'AI文案：无限次', 'AI图片：500次/月', 'AI视频：10次/天', '代理服务：6个国家'],
  },
  {
    id: 'flagship',
    name: '旗舰版',
    price: 5888,
    priceUnit: '/月',
    icon: Crown,
    color: 'red',
    features: ['店铺绑定：无限', 'AI文案：无限次', 'AI图片：无限次', 'AI视频：无限次', '代理服务：12个国家', '专属客服：7×24小时'],
  },
];

export default function MembershipPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [polling, setPolling] = useState(false);
  const [pollTimer, setPollTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [pollTimer]);

  const handlePay = async (planId: string) => {
    setLoading(true);  // Bug4 修复：设置 loading
    setError('');
    setSelectedPlan(planId);
    setOrder(null);

    try {
      const res = await api.payment.createOrder({ plan: planId });

      if (!res.success) {
        throw new Error(res.error || '创建订单失败');
      }

      setOrder(res.data);

      // 如果有支付链接，开始轮询订单状态
      if (res.data?.orderNo) {
        startPolling(res.data.orderNo);
      }
    } catch (e: any) {
      setError(e.message || '支付服务暂时不可用，请稍后重试');
    } finally {
      setLoading(false);  // Bug4 修复：无论成功失败都重置 loading
    }
  };

  // 收钱吧支付（微信/支付宝）
  const [sqOrder, setSqOrder] = useState<{ sn: string; clientSn: string; payUrl: string; totalAmount: string } | null>(null);
  const [sqPolling, setSqPolling] = useState(false);

  const handleShouqianbaPay = async (planId: string, price: number) => {
    setLoading(true);
    setError('');
    setSelectedPlan(planId);
    setSqOrder(null);

    try {
      // 使用 payment.createOrder 创建订单（会写入数据库，回调自动升级会员）
      const res = await api.payment.createOrder({ plan: planId });
      if (!res.success) throw new Error(res.error || '创建订单失败');

      const orderData = res.data;
      // 适配：payment.createOrder 返回 { orderNo, payUrl, ... }
      setSqOrder({
        sn: orderData.orderNo,
        clientSn: orderData.orderNo,
        payUrl: orderData.payUrl,
        totalAmount: String(price)
      });

      // 轮询查询支付状态（用 payment.status）
      setSqPolling(true);
      const poll = setInterval(async () => {
        try {
          const statusRes = await api.payment.status(orderData.orderNo);
          if (statusRes.data?.status === 'paid') {
            clearInterval(poll);
            setSqPolling(false);
            setSqOrder(null);
            alert('✅ 支付成功！会员已激活');
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
      setError(e.message || '支付服务暂时不可用，请稍后重试');
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
          alert('✅ 支付成功！会员已激活');
          refreshUser();
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
    setSelectedPlan('');
  };

  const currentPlan = user?.membershipType || 'free';
  const isExpired = user?.membershipExpiresAt ? new Date(user.membershipExpiresAt) < new Date() : false;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">会员套餐</h1>
        <p className="text-gray-500 mt-1">升级套餐，解锁更多 AI 功能</p>
      </div>

      {/* 当前会员状态 */}
      {currentPlan !== 'free' && (
        <div className={`mb-6 p-4 rounded-xl border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2">
            <Crown className={`w-5 h-5 ${isExpired ? 'text-red-500' : 'text-green-600'}`} />
            <span className={`font-medium ${isExpired ? 'text-red-700' : 'text-green-700'}`}>
              当前套餐：{PLANS.find(p => p.id === currentPlan)?.name || currentPlan}
              {isExpired ? '（已过期）' : ''}
            </span>
            {user?.membershipExpiresAt && (
              <span className="text-sm text-gray-500 ml-2">
                有效期至：{new Date(user.membershipExpiresAt).toLocaleDateString('zh-CN')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <p className="font-medium">支付失败</p>
          <p className="text-sm mt-1">{error}</p>
          <button onClick={() => setError('')} className="text-sm underline mt-2">关闭</button>
        </div>
      )}

      {/* 收钱吧支付弹窗（微信/支付宝） */}
      {sqOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {PLANS.find(p => p.id === selectedPlan)?.name} - ¥{Number(sqOrder.totalAmount)}
              </h2>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">收钱吧</span>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-800">
              请用 <b>微信</b> 或 <b>支付宝</b> 扫码支付
            </div>

            {sqOrder.payUrl && (
              <div className="text-center mb-4">
                <img
                  src={'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(sqOrder.payUrl)}
                  alt="支付二维码"
                  className="mx-auto rounded-lg border border-gray-200"
                  style={{ width: 200, height: 200 }}
                />
                <p className="text-xs text-gray-500 mt-2">请用微信或支付宝扫码支付</p>
              </div>
            )}

            {sqPolling && (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 mb-4">
                <RefreshCw className="w-4 h-4 animate-spin" />
                等待支付确认（支付后页面自动更新）...
              </div>
            )}

            <button
              onClick={() => { setSqOrder(null); setSqPolling(false); setSelectedPlan(''); }}
              className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 支付弹窗 */}
      {order && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-2">
              {PLANS.find(p => p.id === selectedPlan)?.name} - 
              ¥{PLANS.find(p => p.id === selectedPlan)?.price}/月
            </h2>
            
            {order.testMode ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-yellow-800 text-sm font-medium">⚠️ 测试模式</p>
                <p className="text-yellow-700 text-xs mt-1">支付网关未配置，当前为测试订单</p>
              </div>
            ) : null}
            
            {order.payUrl && !order.testMode ? (
              <div className="text-center">
                <div className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-col items-center">
                  <img
                    src={order.qrCode || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(order.payUrl)}
                    alt="支付二维码"
                    className="w-48 h-48 mx-auto mb-2"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <p className="text-sm text-gray-600">扫码支付（支持微信/支付宝）</p>
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

      {/* 套餐卡片 */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map(plan => {
          const Icon = plan.icon;
          const isCurrentPlan = currentPlan === plan.id && !isExpired;
          
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 ${
                plan.popular
                  ? 'border-purple-400 shadow-lg shadow-purple-100'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    推荐
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-4">
                <Icon className={`w-6 h-6 text-${plan.color}-500`} />
                <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
              </div>
              
              <div className="mb-6">
                <span className="text-3xl font-bold text-gray-900">¥{plan.price}</span>
                <span className="text-gray-500 text-sm">{plan.priceUnit}</span>
              </div>
              
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className={`w-4 h-4 text-${plan.color}-500 flex-shrink-0 mt-0.5`} />
                    {feature}
                  </li>
                ))}
              </ul>
              
              
              {!isCurrentPlan && (
                <button
                  onClick={() => handleShouqianbaPay(plan.id, plan.price)}
                  disabled={loading && selectedPlan !== plan.id}
                  className="w-full py-2.5 rounded-xl font-medium transition-colors text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {loading && selectedPlan === plan.id ? '处理中...' : '💚 微信/支付宝'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 联系方式 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-600">
        <p>如有支付问题，请联系客服：<span className="font-medium text-blue-600">15119885271</span></p>
        <p className="mt-1 text-xs text-gray-400">支持微信/支付宝支付</p>
      </div>
    </div>
  );
}
