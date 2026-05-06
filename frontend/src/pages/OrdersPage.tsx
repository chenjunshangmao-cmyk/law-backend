import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, CheckCircle, Clock, XCircle, CreditCard, ShoppingBag, Sparkles } from 'lucide-react';
import api from '../services/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  paid:      { label: '已支付',     color: 'text-green-700',  bg: 'bg-green-50',    icon: CheckCircle },
  pending:   { label: '待支付',     color: 'text-yellow-700', bg: 'bg-yellow-50',   icon: Clock },
  cancelled: { label: '已取消',     color: 'text-gray-600',   bg: 'bg-gray-50',     icon: XCircle },
  failed:    { label: '支付失败',   color: 'text-red-600',    bg: 'bg-red-50',      icon: XCircle },
};

export default function OrdersPage() {
  const [searchParams] = useSearchParams();
  const highlightOrder = searchParams.get('new') || '';
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [polling, setPolling] = useState(false);
  const limit = 10;

  const loadOrders = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.payment.orders(p, limit);
      setOrders(res.orders || []);
      setTotal(res.total || 0);
      setPage(p);

      // 如果有待支付订单，启动自动轮询
      const hasPending = (res.orders || []).some((o: any) => o.status === 'pending');
      setPolling(hasPending);
    } catch (e: any) {
      setError(e.message || '加载订单失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(1); }, [loadOrders]);

  // 自动轮询：待支付订单每5秒刷新一次
  useEffect(() => {
    if (!polling) return;
    const timer = setInterval(() => {
      loadOrders(page);
    }, 5000);
    return () => clearInterval(timer);
  }, [polling, page, loadOrders]);

  // 高亮新订单（闪烁效果，3秒后消失）
  const [flashOrder, setFlashOrder] = useState(highlightOrder);
  useEffect(() => {
    if (!highlightOrder) return;
    setFlashOrder(highlightOrder);
    const t = setTimeout(() => setFlashOrder(''), 5000);
    return () => clearTimeout(t);
  }, [highlightOrder]);

  const totalPages = Math.ceil(total / limit);
  const StatusIcon = (status: string) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            我的订单
          </h1>
          <p className="text-gray-500 mt-1">
            {polling ? '⏱️ 正在监控支付状态...' : '查看所有会员套餐和业务服务的购买记录'}
          </p>
        </div>
        <button
          onClick={() => loadOrders(page)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* 自动轮询提示 */}
      {polling && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          <span className="text-sm text-blue-700">
            您有待支付的订单，系统每5秒自动检查支付状态
          </span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* 加载中 */}
      {loading && orders.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mr-3" />
          <span className="text-gray-500">加载订单中...</span>
        </div>
      ) : orders.length === 0 ? (
        /* 空状态 */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">暂无订单</h3>
          <p className="text-gray-400 mb-6">您还没有购买任何会员套餐或业务服务</p>
          <a
            href="/membership"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            前往会员中心
          </a>
        </div>
      ) : (
        <>
          {/* 订单列表 */}
          <div className="space-y-4">
            {orders.map((order) => {
              const statusKey = (order.status || 'pending').toLowerCase().replace('_', '');
              const isNew = flashOrder && order.order_no === flashOrder;
              return (
                <div
                  key={order.order_no}
                  className={`bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition-shadow ${
                    isNew ? 'border-indigo-400 ring-2 ring-indigo-200 shadow-lg shadow-indigo-100' : 'border-gray-100'
                  }`}
                >
                  {isNew && (
                    <div className="flex items-center gap-1 mb-2">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span className="text-xs text-indigo-600 font-medium">新订单</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    {/* 左侧：订单信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900 truncate">
                          {order.plan_name || '未知套餐'}
                        </span>
                        {StatusIcon(statusKey)}
                        {order.status === 'pending' && (
                          <span className="text-xs text-yellow-600 animate-pulse">等待付款...</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" />
                          订单号：<span className="font-mono text-xs">{order.order_no}</span>
                        </span>
                        {order.payway && (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {order.payway}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 右侧：金额和时间 */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-gray-900">
                        ¥{((order.amount || 0) / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {order.paid_at
                          ? `支付于 ${new Date(order.paid_at).toLocaleString('zh-CN')}`
                          : order.created_at
                          ? `创建于 ${new Date(order.created_at).toLocaleString('zh-CN')}`
                          : ''}
                      </div>
                    </div>
                  </div>
                  {/* 操作按钮 */}
                  {order.status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                      <a
                        href="/membership"
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                      >
                        返回支付
                      </a>
                      <span className="text-xs text-gray-400">
                        或等待自动确认，无需重复操作
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => loadOrders(page - 1)}
                disabled={page <= 1 || loading}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                上一页
              </button>
              <span className="px-3 py-2 text-sm text-gray-500">
                第 {page} / {totalPages} 页，共 {total} 条
              </span>
              <button
                onClick={() => loadOrders(page + 1)}
                disabled={page >= totalPages || loading}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
