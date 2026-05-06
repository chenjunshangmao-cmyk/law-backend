import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  // 支持多种参数格式：收钱吧返回 client_sn（下划线），我们的旧格式 clientSn（驼峰）
  const paid = searchParams.get('paid') || searchParams.get('clientSn') || searchParams.get('client_sn');
  const isFailure = searchParams.get('is_success') === 'F';
  const errorMsg = searchParams.get('error_message') || '';

  // 自动轮询支付状态
  const [orderStatus, setOrderStatus] = useState<string>('PENDING');
  const [polling, setPolling] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (!paid) return;

    let attempts = 0;
    const maxAttempts = 20; // 最多轮询 20 次（60秒）

    const checkOnce = async () => {
      if (attempts >= maxAttempts) {
        setPolling(false);
        return;
      }
      attempts++;
      setPollCount(attempts);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/shouqianba/query?sn=${encodeURIComponent(paid)}`
        );
        const data = await res.json();
        const s = data?.data?.orderStatus || data?.data?.status;
        if (s === 'PAID' || s === 'SUCCESS') {
          setOrderStatus('PAID');
          setPolling(false);
          return;
        }
      } catch (_) {
        // 网络错误继续重试
      }
    };

    // 立即查一次
    checkOnce();
    // 然后每3秒轮询
    const timer = setInterval(checkOnce, 3000);
    return () => clearInterval(timer);
  }, [paid]);

  // 支付成功后倒计时自动跳转
  useEffect(() => {
    if (orderStatus !== 'PAID') return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    // 倒计时结束，跳转登录
    window.location.href = '/login';
  }, [orderStatus, countdown]);

  // 收钱吧返回失败
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
          <Link
            to="/membership"
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
          >
            返回会员页
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            客服：<span className="text-indigo-600 font-medium">15119885271</span>
          </p>
        </div>
      </div>
    );
  }

  // 支付成功
  if (orderStatus === 'PAID') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">✅ 支付成功！</h1>
          <p className="text-gray-500 mb-6">
            系统已确认收款，会员已激活
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
        </div>
      </div>
    );
  }

  // 处理中（自动轮询）
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {polling ? (
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          ) : (
            <span className="text-2xl">⏳</span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {polling ? '正在确认支付...' : '等待支付确认'}
        </h1>
        <p className="text-gray-500 mb-3 text-sm">
          订单号：<span className="font-mono text-xs text-gray-600 break-all">{paid || '未知'}</span>
        </p>

        {polling ? (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              ⏱️ 系统正在自动查询支付结果（第 {pollCount} 次）...
            </p>
            <p className="text-xs text-blue-500 mt-1">
              如已付款，请稍等片刻，系统会自动确认
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700">
              ⚠️ 自动查询超时，但别担心
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              如果您已付款，稍后会自动到账。也可以联系客服确认
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium"
          >
            🔄 刷新页面重新查询
          </button>
          <Link
            to="/login"
            className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-center"
          >
            返回登录
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          客服：<span className="text-indigo-600 font-medium">15119885271</span>
        </p>
      </div>
    </div>
  );
}
