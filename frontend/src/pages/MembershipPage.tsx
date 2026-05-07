import React, { useState, useEffect } from 'react';
import { Check, Crown, Zap, Building2, QrCode, RefreshCw, Bot, Shield, ChevronDown, ChevronUp, Users, XCircle, Coins, Copy, ExternalLink, Globe, Monitor, Youtube, Share2, TrendingUp } from 'lucide-react';
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
    features: ['短视频工厂：30条/月', 'AI文案工厂：50篇/月', 'WhatsApp中继：50条', 'AI抠图：50张/月', '去水印：20张/月', '利润计算器：5次/天'],
  },
  {
    id: 'premium',
    name: '专业版',
    price: 499,
    priceUnit: '/月',
    icon: Crown,
    color: 'purple',
    popular: true,
    features: ['短视频工厂：100条/月', 'AI文案：200篇+直播脚本', 'AI数字人：1频道(录制)', 'WhatsApp中继：200条', 'AI抠图+去水印：无限', '平台发布：TikTok+OZON'],
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: 1599,
    priceUnit: '/月',
    icon: Building2,
    color: 'amber',
    features: ['短视频工厂：300条+连续剧', 'AI文案：500篇+小说连载', 'AI数字人：3频道(实时)', 'WhatsApp中继：500条', '全平台发布', '利润计算器：无限'],
  },
  {
    id: 'flagship',
    name: '旗舰版',
    price: 5888,
    priceUnit: '/月',
    icon: Crown,
    color: 'red',
    features: ['三大系统全部无限制', 'AI数字人：5频道+定制3套', 'AI文案：无限+长篇小说', 'WhatsApp中继：无限制', '全平台+自动排期', '7x24专属客服+定制开发'],
  },
];

const SERVICES = [
  {
    id: 'domestic-op',
    name: '国内代运营',
    price: 5000,
    icon: TrendingUp,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    desc: '国内电商平台全托管运营，选品/上架/客服一体化',
    features: ['1688/淘宝/拼多多/抖音', '选品+上架+定价', '客服托管', '数据周报'],
  },
  {
    id: 'overseas-op',
    name: '海外代运营',
    price: 5000,
    icon: Globe,
    color: '#6366f1',
    bgColor: '#eef2ff',
    desc: '海外跨境电商全托管，TikTok Shop/Amazon/Shopee 全覆盖',
    features: ['TikTok Shop/Amazon/Shopee', '多语言AI文案', '物流对接', '海外仓协调'],
  },
  {
    id: 'website-build',
    name: '独立站搭建',
    price: 3800,
    icon: Monitor,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    desc: '外贸独立站一站式搭建，含域名/服务器/SEO优化',
    features: ['响应式网站设计', '域名+服务器配置', '支付网关对接', '基础SEO优化'],
  },
  {
    id: 'youtube-live',
    name: 'YouTube 直播号',
    price: 1000,
    icon: Youtube,
    color: '#ef4444',
    bgColor: '#fef2f2',
    desc: 'YouTube 直播账号开通+OBS推流配置+AI数字人直播',
    features: ['账号注册+验证', 'OBS推流配置', 'AI数字人直播脚本', '24小时自动直播'],
  },
  {
    id: 'facebook-live',
    name: 'Facebook 直播推广号',
    price: 2800,
    icon: Share2,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    desc: 'Facebook 直播账号+广告投放+多平台同步推流',
    features: ['FB账号+主页搭建', '直播推流配置', '广告投放优化', '多平台同步'],
  },
  {
    id: 'ads-account',
    name: '广告户开户',
    price: 500,
    icon: TrendingUp,
    color: '#22c55e',
    bgColor: '#f0fdf4',
    desc: '主流广告平台企业户开户，含审核材料准备',
    features: ['Google Ads开户', 'Facebook Ads开户', 'TikTok Ads开户', '审核材料辅导'],
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

  // 管理员面板
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminAction, setAdminAction] = useState<{ userId: string; loading: boolean } | null>(null);
  const [adminMsg, setAdminMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [pollTimer]);

  const handlePay = async (planId: string) => {
    setLoading(true);
    setError('');
    setSelectedPlan(planId);
    setOrder(null);

    try {
      const res = await api.payment.createOrder({ plan: planId });
      if (!res.success) throw new Error(res.error || '创建订单失败');
      
      const orderData = res.data;
      setOrder(orderData);

      // 启动轮询查支付状态
      if (orderData.orderNo && !orderData.testMode) {
        const timer = setInterval(async () => {
          try {
            const statusRes = await api.payment.status(orderData.orderNo);
            if (statusRes?.data?.status === 'paid') {
              setOrder((prev: any) => prev ? { ...prev, status: 'paid', paidAt: statusRes.data.paidAt } : prev);
              setPolling(true); // 标记支付成功
              if (pollTimer) clearInterval(pollTimer);
              setPollTimer(null);
              clearInterval(timer);
              refreshUser?.();
            }
          } catch (_) { /* 继续轮询 */ }
        }, 3000); // 3秒查一次
        setPollTimer(timer);
      }
    } catch (e: any) {
      setError(e.message || '支付服务暂时不可用，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 收钱吧支付（微信/支付宝）
  const [sqOrder, setSqOrder] = useState<{ sn: string; clientSn: string; payUrl: string; totalAmount: string } | null>(null);
  const [sqPolling, setSqPolling] = useState(false);
  const [sqRedirectCountdown, setSqRedirectCountdown] = useState(0);

  // USDT 加密支付
  const [cryptoOrder, setCryptoOrder] = useState<{
    orderNo: string; amountUSDT: number; amountCNY?: number; rate?: number;
    walletAddress: string; chains: any[];
    tip: string; createdAt: string;
  } | null>(null);
  const [cryptoPolling, setCryptoPolling] = useState(false);
  const [cryptoPaid, setCryptoPaid] = useState(false);
  const [copyAddressTip, setCopyAddressTip] = useState('');

  const handleShouqianbaPay = async (orderId: string, price: number, displayName: string) => {
    setLoading(true);
    setError('');
    setSelectedPlan(orderId);
    setSqOrder(null);

    try {
      const res = await api.shouqianba.createOrder(
        orderId,
        price,
        `Claw-${displayName}`,
        user?.id
      );
      if (!res.success) throw new Error(res.error || '创建订单失败');

      const orderData = res.data;
      setSqOrder({
        sn: orderData.sn,
        clientSn: orderData.clientSn,
        payUrl: orderData.payUrl,
        totalAmount: String(orderData.totalAmount)
      });

      // 启动自动跳转倒计时（20秒后跳订单页，够客户拿手机扫码）
      setSqRedirectCountdown(20);
      const countdownTimer = setInterval(() => {
        setSqRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            // 跳转到订单页
            window.location.href = '/orders?new=' + encodeURIComponent(orderData.clientSn);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // ★★★ 关键修复：启动轮询查支付状态 ★★★
      const timer = setInterval(async () => {
        try {
          const statusRes = await api.shouqianba.query(orderData.clientSn);
          if (statusRes?.data?.orderStatus === 'PAID' || statusRes?.data?.status === 'SUCCESS') {
            setSqPolling(true); // 标记支付成功，弹窗显示已付款
            clearInterval(timer);
            setPollTimer(null);
            refreshUser?.();
          }
        } catch (_) { /* 继续轮询 */ }
      }, 3000); // 每3秒查一次
      setPollTimer(timer);
    } catch (e: any) {
      setError(e.message || '支付服务暂时不可用，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // USDT 加密支付
  const handleCryptoPay = async (orderId: string) => {
    setLoading(true);
    setError('');
    setSelectedPlan(orderId);
    setCryptoOrder(null);
    setCryptoPaid(false);

    try {
      const isPlan = PLANS.some(p => p.id === orderId);
      const payload = isPlan ? { plan: orderId } : { serviceId: orderId };
      const res = await api.crypto.createOrder(payload);
      if (!res.success) throw new Error(res.error || '创建USDT订单失败');
      setCryptoOrder(res.data);

      // 启动轮询
      setCryptoPolling(true);
      const timer = setInterval(async () => {
        try {
          const statusRes = await api.crypto.status(res.data.orderNo);
          if (statusRes?.data?.status === 'paid') {
            setCryptoPaid(true);
            setCryptoPolling(false);
            clearInterval(timer);
            refreshUser?.();
          }
        } catch (_) { /* 继续轮询 */ }
      }, 8000); // 每 8 秒查一次
      setPollTimer(timer);
    } catch (e: any) {
      setError(e.message || '加密支付服务暂不可用');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (orderNo: string) => {
    // 不自动检测支付状态，直接显示订单号，用户自行联系客服激活
    const plan = PLANS.find(p => p.id === selectedPlan);
    setOrder({
      orderNo,
      amount: plan?.price || 0,
      planName: plan?.name || selectedPlan,
      testMode: false,
      payUrl: '',
      qrCode: '',
      message: '付款后联系客服激活会员'
    });
  };

  const cancelPayment = () => {
    if (pollTimer) clearInterval(pollTimer);
    setOrder(null);
    setPolling(false);
    setSelectedPlan('');
  };

  // 加载用户列表
  const loadAdminUsers = async () => {
    setAdminLoading(true);
    try {
      const res = await api.membership.admin.listUsers();
      setAdminUsers(res.data || []);
    } catch {
      setAdminMsg({ type: 'error', text: '加载用户列表失败' });
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (adminOpen && adminUsers.length === 0) loadAdminUsers();
  }, [adminOpen]);

  // 管理员手动激活
  const handleAdminActivate = async (userId: string, plan: string) => {
    setAdminAction({ userId, loading: true });
    try {
      await api.membership.admin.activate(userId, plan);
      setAdminMsg({ type: 'success', text: `用户已升级为 ${PLANS.find(p => p.id === plan)?.name}` });
      loadAdminUsers();
    } catch {
      setAdminMsg({ type: 'error', text: '激活失败' });
    } finally {
      setAdminAction(null);
    }
  };

  // 管理员关闭会员
  const handleAdminDeactivate = async (userId: string) => {
    setAdminAction({ userId, loading: true });
    try {
      await api.membership.admin.deactivate(userId);
      setAdminMsg({ type: 'success', text: '会员已关闭，降级为免费会员' });
      loadAdminUsers();
    } catch {
      setAdminMsg({ type: 'error', text: '关闭失败' });
    } finally {
      setAdminAction(null);
    }
  };

  const currentPlan = user?.membershipType || 'free';
  const isExpired = user?.membershipExpiresAt ? new Date(user.membershipExpiresAt) < new Date() : false;

  // 获取订单显示名称（套餐或业务）
  const getOrderName = (id: string) => {
    const plan = PLANS.find(p => p.id === id);
    if (plan) return plan.name;
    const service = SERVICES.find(s => s.id === id);
    return service ? service.name : id;
  };
  const getOrderPrice = (id: string) => {
    const plan = PLANS.find(p => p.id === id);
    if (plan) return plan.price;
    const service = SERVICES.find(s => s.id === id);
    return service ? service.price : 0;
  };

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

      {/* AI 激活流程说明 */}
      <div className="mb-8 p-5 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-blue-900 text-base">AI 客服 · 自动激活会员</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-sm text-blue-800 leading-relaxed">选择套餐<br /><b>扫码支付</b></p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-sm text-blue-800 leading-relaxed">完成付款后<br /><b>联系客服</b></p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-sm text-blue-800 leading-relaxed"><b>AI 客服</b> 确认到账<br />自动激活会员</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-blue-600 flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
          <span>支付成功后，AI 客服将自动为您开通对应套餐权益，有效期 30 天</span>
        </div>
      </div>

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
                {getOrderName(selectedPlan)} - ¥{(Number(sqOrder.totalAmount) / 100).toFixed(0)}
              </h2>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">收钱吧</span>
            </div>

            {sqPolling ? (
              /* 支付成功 */
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-lg font-bold text-green-700 mb-1">✅ 支付成功！</p>
                <p className="text-xs text-gray-400">订单号：{sqOrder.clientSn}</p>
                <p className="text-xs text-gray-400 mt-1">会员将在几秒内自动生效</p>
              </div>
            ) : sqOrder.payUrl ? (
              <div className="text-center mb-4">
                <img
                  src={'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(sqOrder.payUrl)}
                  alt="支付二维码"
                  className="mx-auto rounded-lg border border-gray-200"
                  style={{ width: 200, height: 200 }}
                />
                <p className="text-xs text-gray-400 mt-1">订单号：{sqOrder.clientSn}</p>
                {sqRedirectCountdown > 0 ? (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      📱 请用手机扫码支付 · {sqRedirectCountdown}秒后自动跳转订单页
                    </p>
                  </div>
                ) : null}
                <div className="flex gap-2 mt-3">
                  <a
                    href={'/orders?new=' + encodeURIComponent(sqOrder.clientSn)}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium text-center hover:bg-indigo-700"
                  >
                    📋 查看订单
                  </a>
                </div>
              </div>
            ) : null}


            <button
              onClick={() => { 
                if (pollTimer) clearInterval(pollTimer);
                setSqOrder(null); setSqPolling(false); setSelectedPlan(''); 
              }}
              className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              {sqPolling ? '关闭' : '取消'}
            </button>
          </div>
        </div>
      )}

      {/* USDT 加密支付弹窗 */}
      {cryptoOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                USDT 付款
              </h2>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-mono">
                {getOrderName(selectedPlan)} · ${cryptoOrder.amountUSDT}
              </span>
            </div>

            {cryptoPaid ? (
              /* 支付成功 */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-green-700 mb-1">支付成功！</h3>
                <p className="text-sm text-gray-500">会员已自动激活，有效期 30 天</p>
                <button
                  onClick={() => { setCryptoOrder(null); setCryptoPolling(false); setCryptoPaid(false); setSelectedPlan(''); }}
                  className="mt-6 w-full py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
                >
                  完成
                </button>
              </div>
            ) : (
              <>
                {/* 金额提示 */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-center">
                  <p className="text-3xl font-bold text-amber-700">${cryptoOrder.amountUSDT}</p>
                  <p className="text-sm text-amber-600 mt-1">USDT</p>
                  {cryptoOrder.amountCNY && (
                    <p className="text-xs text-amber-500 mt-1">
                      ≈ ¥{cryptoOrder.amountCNY} 人民币
                      {cryptoOrder.rate && <span>（汇率 1 USD ≈ {cryptoOrder.rate} CNY）</span>}
                    </p>
                  )}
                </div>

                {/* 地址 + QR */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium">向以下地址转入恰好 ${cryptoOrder.amountUSDT} USDT：</p>
                  
                  {/* 二维码 */}
                  <div className="flex justify-center mb-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(cryptoOrder.walletAddress)}`}
                      alt="USDT钱包地址二维码"
                      className="rounded-lg border border-gray-200"
                      style={{ width: 180, height: 180 }}
                    />
                  </div>

                  {/* 地址 */}
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                    <code className="text-xs text-gray-700 break-all flex-1 font-mono">
                      {cryptoOrder.walletAddress}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(cryptoOrder.walletAddress);
                        setCopyAddressTip('已复制!');
                        setTimeout(() => setCopyAddressTip(''), 2000);
                      }}
                      className="flex-shrink-0 p-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-100"
                      title="复制地址"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  {copyAddressTip && (
                    <p className="text-xs text-green-600 mt-1 text-center">{copyAddressTip}</p>
                  )}
                </div>

                {/* 支持的链 */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2 font-medium">支持链：</p>
                  <div className="flex flex-wrap gap-2">
                    {cryptoOrder.chains?.map((c: any) => (
                      <span key={c.id} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 提示 */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-700">{cryptoOrder.tip}</p>
                  <p className="text-xs text-blue-500 mt-1">
                    订单号：<code className="bg-blue-100 px-1 rounded">{cryptoOrder.orderNo}</code>
                  </p>
                </div>

                {/* 轮询状态 */}
                {cryptoPolling && (
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-4">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    等待区块链确认中...
                  </div>
                )}

                <button
                  onClick={() => { 
                    if (pollTimer) clearInterval(pollTimer); 
                    setCryptoOrder(null); 
                    setCryptoPolling(false); 
                    setSelectedPlan(''); 
                  }}
                  className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                >
                  取消
                </button>
              </>
            )}
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
            ) : (order as any).status === 'paid' || polling ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-lg font-bold text-green-700 mb-1">支付成功！</p>
                <p className="text-xs text-gray-400">订单号：{order.orderNo}</p>
                <p className="text-xs text-gray-400 mt-1">联系客服开通会员</p>
              </div>
            ) : order.payUrl ? (
              <div className="text-center">
                <div className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-col items-center">
                  <img
                    src={order.qrCode || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(order.payUrl)}
                    alt="支付二维码"
                    className="w-48 h-48 mx-auto mb-2"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    等待支付中...
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">订单号：{order.orderNo}</p>
                {order.message && <p className="text-xs mt-2 text-gray-400">{order.message}</p>}
              </div>
            )}

            <button
              onClick={cancelPayment}
              className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 mt-3"
            >
              {polling ? '关闭' : '取消'}
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
                <div className="space-y-2">
                  <button
                    onClick={() => handleShouqianbaPay(plan.id, plan.price, plan.name)}
                    disabled={loading && selectedPlan !== plan.id}
                    className="w-full py-2.5 rounded-xl font-medium transition-colors text-sm bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading && selectedPlan === plan.id ? '处理中...' : '💚 微信/支付宝'}
                  </button>
                  <button
                    onClick={() => handleCryptoPay(plan.id)}
                    disabled={loading && selectedPlan !== plan.id}
                    className="w-full py-2 rounded-xl font-medium transition-colors text-sm bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Coins className="w-4 h-4" />
                    {loading && selectedPlan === plan.id ? '处理中...' : 'USDT'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================
          业务服务区
          ======================================== */}
      <div className="mt-12 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-xl font-bold text-gray-900">业务服务</h2>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">一次性付费</span>
        </div>
        <p className="text-gray-500 text-sm mb-6">专业代运营与技术服务，一次付费，长期交付</p>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(service => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="rounded-2xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all flex flex-col"
              >
                {/* 图标 + 名称 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: service.bgColor }}>
                    <Icon className="w-5 h-5" style={{ color: service.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{service.name}</h3>
                    <p className="text-xs text-gray-400">一次性服务</p>
                  </div>
                </div>

                {/* 描述 */}
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{service.desc}</p>

                {/* 特性列表 */}
                <ul className="space-y-1.5 mb-4 flex-1">
                  {service.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <Check className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: service.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* 价格 + 支付按钮 */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-end justify-between mb-3">
                    <span className="text-2xl font-bold text-gray-900">¥{service.price}</span>
                    <span className="text-xs text-gray-400">/次</span>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleShouqianbaPay(service.id, service.price, service.name)}
                      disabled={loading && selectedPlan !== service.id}
                      className="w-full py-2 rounded-xl font-medium transition-colors text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading && selectedPlan === service.id ? '处理中...' : '💚 微信/支付宝'}
                    </button>
                    <button
                      onClick={() => handleCryptoPay(service.id)}
                      disabled={loading && selectedPlan !== service.id}
                      className="w-full py-1.5 rounded-xl font-medium transition-colors text-xs bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      {loading && selectedPlan === service.id ? '处理中...' : 'USDT'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 联系方式 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-600">
        <p>如有支付问题，请联系客服：<span className="font-medium text-blue-600">15119885271</span></p>
        <p className="mt-1 text-xs text-gray-400">支持微信/支付宝/USDT 支付</p>
      </div>

      {/* ========================================
          管理员面板（仅 admin/super_admin 可见）
          ======================================== */}
      {isAdmin && (
        <div className="mt-8 border border-amber-200 rounded-2xl overflow-hidden">
          {/* 面板头部 */}
          <button
            onClick={() => setAdminOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-amber-800 text-sm">AI 会员管理面板</span>
              <span className="text-xs text-amber-500 bg-amber-200 px-1.5 py-0.5 rounded">管理员</span>
            </div>
            {adminOpen ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-amber-500" />}
          </button>

          {/* 面板内容 */}
          {adminOpen && (
            <div className="p-5 bg-white">
              {/* 说明 */}
              <div className="mb-4 flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                <Bot className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>
                  <b>AI 客服激活：</b>用户扫码支付后，AI 客服自动调用 <code className="bg-gray-200 px-1 rounded">/api/membership/check-and-activate</code> 确认到账并激活会员（有效期30天）。
                  <b className="ml-2">手动管理：</b>下方可手动激活或关闭指定用户的会员。
                </span>
              </div>

              {/* 操作反馈 */}
              {adminMsg && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${adminMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {adminMsg.text}
                </div>
              )}

              {/* 用户列表 */}
              {adminLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />加载中...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="pb-2 pr-4 font-medium">用户</th>
                        <th className="pb-2 pr-4 font-medium">邮箱</th>
                        <th className="pb-2 pr-4 font-medium">当前套餐</th>
                        <th className="pb-2 pr-4 font-medium">到期时间</th>
                        <th className="pb-2 font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map(u => {
                        const isCurrent = u.membership_type !== 'free';
                        return (
                          <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2.5 pr-4">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-gray-400" />
                                <span className="font-medium text-gray-800">{u.name || '—'}</span>
                                {u.role === 'super_admin' && <span className="text-xs bg-red-100 text-red-600 px-1 rounded">超管</span>}
                                {u.role === 'admin' && <span className="text-xs bg-amber-100 text-amber-600 px-1 rounded">管理员</span>}
                              </div>
                            </td>
                            <td className="py-2.5 pr-4 text-gray-500 text-xs">{u.email}</td>
                            <td className="py-2.5 pr-4">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                u.membership_type === 'free' ? 'bg-gray-100 text-gray-500' :
                                u.membership_type === 'basic' ? 'bg-blue-100 text-blue-700' :
                                u.membership_type === 'premium' ? 'bg-purple-100 text-purple-700' :
                                u.membership_type === 'enterprise' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {PLANS.find(p => p.id === u.membership_type)?.name || u.membership_type || '免费'}
                              </span>
                            </td>
                            <td className="py-2.5 pr-4 text-xs text-gray-400">
                              {u.membership_expires_at
                                ? new Date(u.membership_expires_at).toLocaleDateString('zh-CN')
                                : '—'}
                            </td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* 激活按钮组 */}
                                {['basic', 'premium', 'enterprise', 'flagship'].map(plan => (
                                  <button
                                    key={plan}
                                    onClick={() => handleAdminActivate(u.id, plan)}
                                    disabled={adminAction?.userId === u.id || u.membership_type === plan}
                                    className="text-xs px-2 py-1 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    title={`激活为 ${PLANS.find(p => p.id === plan)?.name}`}
                                  >
                                    {PLANS.find(p => p.id === plan)?.name}
                                  </button>
                                ))}
                                {/* 关闭会员 */}
                                {isCurrent && (
                                  <button
                                    onClick={() => handleAdminDeactivate(u.id)}
                                    disabled={adminAction?.userId === u.id}
                                    className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
                                    title="关闭会员，降级为免费"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    关闭
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {adminUsers.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-xs">暂无用户数据</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
