import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  // 支持多种参数格式：收钱吧返回 client_sn（下划线），我们的旧格式 clientSn（驼峰）
  const paid = searchParams.get('paid') || searchParams.get('clientSn') || searchParams.get('client_sn');
  const isFailure = searchParams.get('is_success') === 'F';
  const errorMsg = searchParams.get('error_message') || '';
  const status = searchParams.get('status');

  // 轮询支付状态（页面加载后自动查询）
  const [orderStatus, setOrderStatus] = useState<string>('PENDING');
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (!paid) return;
    // 立即查询一次，然后每3秒轮询，最多查询6次
    let attempts = 0;
    const checkInterval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(
          `https://claw-backend-2026.onrender.com/api/shouqianba/query?sn=${encodeURIComponent(paid)}`
        );
        const data = await res.json();
        const s = data?.data?.orderStatus || data?.data?.status;
        if (s === 'PAID' || s === 'SUCCESS') {
          setOrderStatus('PAID');
          clearInterval(checkInterval);
        } else if (s === 'PENDING') {
          setOrderStatus('PENDING');
        }
      } catch (_) {}
      if (attempts >= 6) clearInterval(checkInterval);
    }, 3000);
    return () => clearInterval(checkInterval);
  }, [paid]);

  // 手动确认支付
  const handleManualConfirm = async () => {
    if (!paid) return;
    setConfirmLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('https://claw-backend-2026.onrender.com/api/shouqianba/force-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ sn: paid })
      });
      const data = await res.json();
      if (data.success) setOrderStatus('PAID');
    } catch (_) {}
    setConfirmLoading(false);
  };

  // 自动倒计时跳转
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const isSuccess = status === 'success' || orderStatus === 'PAID';

  // 收钱吧直接返回失败（签名错误等）
  if (isFailure) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">支付链接无效</h1>
          <p className="text-gray-500 mb-4 text-sm">
            {errorMsg ? decodeURIComponent(errorMsg) : '支付网关返回错误，请联系客服'}
          </p>
          <p className="text-xs text-gray-400">
            客服：<span className="text-indigo-600 font-medium">15119885271</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">✅ 支付成功！</h1>
            <p className="text-gray-500 mb-6">
              会员已激活，快去体验完整功能吧
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              登录账号
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-gray-400 mt-4">
              {countdown > 0 ? `${countdown}秒后自动跳转` : '正在跳转...'}
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏳</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">支付处理中</h1>
            <p className="text-gray-500 mb-3">
              订单号：<span className="font-mono text-xs text-gray-600 break-all">{paid || '未知'}</span>
            </p>
            {orderStatus === 'PENDING' && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  ⏱️ 系统正在查询支付结果，请稍候...（如已付款请点下方按钮）
                </p>
              </div>
            )}
            {orderStatus === 'FAILED' && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">❌ 支付失败，请重新下单</p>
              </div>
            )}
            <button
              onClick={handleManualConfirm}
              disabled={confirmLoading}
              className="w-full mb-3 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {confirmLoading ? '确认中...' : '✅ 我已支付，手动确认'}
            </button>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
            >
              返回登录
            </Link>
            <p className="text-xs text-gray-400 mt-4">
              如有问题请联系客服：<span className="text-indigo-600 font-medium">15119885271</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
