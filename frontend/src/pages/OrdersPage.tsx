import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RefreshCw, CheckCircle, Clock, XCircle, CreditCard, ShoppingBag, Sparkles, Trash2, QrCode, ExternalLink, AlertTriangle } from 'lucide-react';
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

  // ★ 重新扫码弹窗
  const [reopenQR, setReopenQR] = useState<{ sn: string; payUrl: string; amount: number } | null>(null);
  const [reopenError, setReopenError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null); // 正在删除的订单号

  const loadOrders = useCallback(async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.payment.orders(p, limit);
      // API 返回 { success: true, data: { orders, total, page, limit } }
      const data = res?.data || res;
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setPage(p);

      // 如果有待支付订单，启动自动轮询
      const hasPending = (data.orders || []).some((o: any) => o.status === 'pending');
      setPolling(hasPending);
    } catch (e: any) {
      setError(e.message || '加载订单失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(1); }, [loadOrders]);

  // ★ 重新扫码：复用原订单的支付链接
  const handleReopen = async (sn: string) => {
    setReopenError('');
    try {
      const res = await api.shouqianba.reopen(sn);
      if (res?.success && res?.data?.payUrl) {
        setReopenQR({
          sn: res.data.sn,
          payUrl: res.data.payUrl,
          amount: res.data.totalAmount || 0
        });
      } else {
        setReopenError(res?.error || '无法重新打开该订单，请返回会员页重新下单');
      }
    } catch (e: any) {
      setReopenError(e.message || '请求失败');
    }
  };

  // ★ 删除订单
  const handleDeleteOrder = async (sn: string) => {
    if (!window.confirm('确定要删除该订单吗？删除后无法恢复。')) return;
    setDeleting(sn);
    try {
      const res = await api.shouqianba.deleteOrder(sn);
      if (res?.success) {
        loadOrders(page);
      } else {
        alert(res?.error || '删除失败');
      }
    } catch (e: any) {
      alert(e.message || '删除失败');
    } finally {
      setDeleting(null);
    }
  };

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

      {/* ★ 重新扫码弹窗 */}
      {reopenQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-green-600" />
                重新扫码支付
              </h2>
              <button
                onClick={() => setReopenQR(null)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <XCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 mb-1">
                订单号：<code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{reopenQR.sn}</code>
              </p>
              <p className="text-lg font-bold text-gray-900">
                ¥{(reopenQR.amount / 100).toFixed(2)}
              </p>
              <img
                src={'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(reopenQR.payUrl)}
                alt="支付二维码"
                className="mx-auto rounded-lg border border-gray-200 mt-3"
                style={{ width: 220, height: 220 }}
              />
              <p className="text-xs text-gray-400 mt-2">📱 请用手机微信/支付宝扫码支付</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-0.5">温馨提示</p>
                <p>这是原订单的支付二维码，扫码后无需重新下单。支付成功后系统会自动确认。</p>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={reopenQR.payUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1 hover:bg-green-700"
              >
                <ExternalLink className="w-4 h-4" />
                在浏览器中打开
              </a>
              <button
                onClick={() => setReopenQR(null)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重新扫码错误提示 */}
      {reopenError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-700">{reopenError}</p>
            <button
              onClick={() => setReopenError('')}
              className="text-xs text-amber-600 underline mt-1"
            >
              关闭
            </button>
          </div>
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
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleReopen(order.order_no)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        <QrCode className="w-3 h-3" />
                        重新扫码
                      </button>
                      <span className="text-xs text-gray-400">
                        复用原订单，无需重复创建
                      </span>
                      <div className="flex-1" />
                      <button
                        onClick={() => handleDeleteOrder(order.order_no)}
                        disabled={deleting === order.order_no}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        {deleting === order.order_no ? '删除中...' : '删除'}
                      </button>
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
