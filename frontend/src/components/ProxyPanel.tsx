/**
 * ProxyPanel.tsx — 海外推流代理面板 v1.0
 * 
 * 功能：
 * - 代理开关（开启/关闭）
 * - 自带代理 or Claw代理选择
 * - 区域选择 + 套餐选择
 * - 订阅状态显示（到期时间/剩余时长）
 * - 支付入口
 */

import React, { useState, useEffect } from 'react';
import '../pages/LiveStreamPage.css';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

interface ProxyPlan {
  id: string;
  name: string;
  price: number;
  regions: number;
  monthlyHours: number;
  concurrentPlatforms: number;
  maxBitrate: string;
  maxResolution: string;
  ipType: string;
  features: string[];
}

interface ProxyRegion {
  id: string;
  name: string;
  code: string;
  nodeCount: number;
  available: boolean;
  loadLevel: number;
}

interface ProxySubscription {
  id: number;
  plan_id: string;
  plan_name: string;
  amount: number;
  status: string;
  selected_regions: string[];
  hours_used: number;
  hours_limit: number;
  expires_at: string;
  daysRemaining: number;
  remainingHours: number;
  isExpired: boolean;
}

interface ProxyConfig {
  type: string;
  host: string;
  port: number;
  region: string;
}

interface Props {
  proxyEnabled: boolean;
  onProxyEnabledChange: (v: boolean) => void;
  useOwnProxy: boolean;
  onUseOwnProxyChange: (v: boolean) => void;
  ownProxyUrl: string;
  onOwnProxyUrlChange: (v: string) => void;
  ownProxyHost: string;
  onOwnProxyHostChange: (v: string) => void;
  ownProxyPort: string;
  onOwnProxyPortChange: (v: string) => void;
  ownProxyUser: string;
  onOwnProxyUserChange: (v: string) => void;
  ownProxyPass: string;
  onOwnProxyPassChange: (v: string) => void;
  selectedRegion: string;
  onRegionChange: (v: string) => void;
  selectedPlan: string;
  onPlanChange: (v: string) => void;
  disabled: boolean;
}

export default function ProxyPanel({
  proxyEnabled, onProxyEnabledChange,
  useOwnProxy, onUseOwnProxyChange,
  ownProxyUrl, onOwnProxyUrlChange,
  ownProxyHost, onOwnProxyHostChange,
  ownProxyPort, onOwnProxyPortChange,
  ownProxyUser, onOwnProxyUserChange,
  ownProxyPass, onOwnProxyPassChange,
  selectedRegion, onRegionChange,
  selectedPlan, onPlanChange,
  disabled,
}: Props) {
  const [plans, setPlans] = useState<ProxyPlan[]>([]);
  const [regions, setRegions] = useState<ProxyRegion[]>([]);
  const [subscription, setSubscription] = useState<ProxySubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  // 加载套餐和区域
  useEffect(() => {
    loadPlans();
    loadRegions();
    loadSubscription();
  }, []);

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadPlans = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stream-proxy/plans`);
      const data = await res.json();
      if (data.success) {
        setPlans(Object.values(data.data));
      }
    } catch (e) {}
  };

  const loadRegions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stream-proxy/regions`);
      const data = await res.json();
      if (data.success) {
        setRegions(data.data.filter((r: ProxyRegion) => r.available));
      }
    } catch (e) {}
  };

  const loadSubscription = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stream-proxy/subscription`, {
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubscription(data.data);
        // 自动设置区域和套餐
        if (data.data.selected_regions?.length > 0) {
          onRegionChange(data.data.selected_regions[0]);
        }
        if (data.data.plan_id) {
          onPlanChange(data.data.plan_id);
        }
      }
    } catch (e) {}
  };

  // 创建订单并跳转支付
  const handleCreateOrder = async () => {
    if (!selectedPlan) {
      setError('请选择代理套餐');
      return;
    }
    setCreatingOrder(true);
    setError('');
    try {
      const paymentMethod = 'shouqianba';
      const res = await fetch(`${API_BASE}/api/stream-proxy/order`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          selectedRegions: [selectedRegion],
          paymentMethod,
          durationMonths: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderResult(data.data);
        // 跳转收钱吧支付
        if (data.data.id) {
          handlePay(data.data);
        }
      } else {
        setError(data.error || '创建订单失败');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreatingOrder(false);
    }
  };

  const handlePay = async (order: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/payment/create`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.amount,
          orderNo: `PROXY-${order.id}`,
          description: `${order.plan_name} - 代理服务`,
          metadata: { type: 'proxy', orderId: order.id },
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.paymentUrl) {
        window.open(data.data.paymentUrl, '_blank');
        // 轮询激活
        pollActivation(order.id);
      } else {
        setError('发起支付失败，请稍后重试');
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const pollActivation = (orderId: number) => {
    let attempts = 0;
    const maxAttempts = 60;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${API_BASE}/api/stream-proxy/activate`, {
          method: 'POST',
          headers: { ...authHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (data.success) {
          clearInterval(interval);
          loadSubscription();
          setOrderResult(null);
        }
      } catch (e) {}
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setError('支付确认超时，如已付款请刷新页面');
      }
    }, 3000);
  };

  // 格式化价格
  const formatPrice = (priceInFen: number) => `¥${(priceInFen / 100).toLocaleString()}`;

  // 格式化时长
  const formatHours = (h: number) => h < 0 ? '不限' : `${h}h`;

  const selectedPlanObj = plans.find(p => p.id === selectedPlan);

  return (
    <div className="ls-card">
      <h3>🔒 推流代理</h3>
      <p className="ls-hint" style={{ marginBottom: 12 }}>
        直播推流到海外平台时需代理，否则可能被平台拒绝或限流
      </p>

      {error && (
        <div className="ls-error" onClick={() => setError('')} style={{ marginBottom: 8 }}>
          ⚠️ {error}
        </div>
      )}

      {/* 代理开关 */}
      <label className="ls-checkbox" style={{ marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={proxyEnabled}
          onChange={e => onProxyEnabledChange(e.target.checked)}
          disabled={disabled}
        />
        {proxyEnabled ? '🟢 代理已启用' : '⚪ 启用代理推流'}
      </label>

      {proxyEnabled && (
        <>
          {/* 代理方式选择 */}
          <div className="ls-proxy-mode">
            <label className="ls-radio">
              <input
                type="radio"
                checked={!useOwnProxy}
                onChange={() => onUseOwnProxyChange(false)}
                disabled={disabled}
              />
              🌐 使用 Claw 代理 (付费)
            </label>
            <label className="ls-radio">
              <input
                type="radio"
                checked={useOwnProxy}
                onChange={() => onUseOwnProxyChange(true)}
                disabled={disabled}
              />
              🔧 我用自己的代理
            </label>
          </div>

          {useOwnProxy ? (
            /* ─── 自带代理 ─── */
            <div className="ls-proxy-own">
              <label>代理地址</label>
              <input
                type="text"
                value={ownProxyHost}
                onChange={e => onOwnProxyHostChange(e.target.value)}
                disabled={disabled}
                placeholder="127.0.0.1"
              />
              <label>端口</label>
              <input
                type="number"
                value={ownProxyPort}
                onChange={e => onOwnProxyPortChange(e.target.value)}
                disabled={disabled}
                placeholder="1080"
              />
              <label>用户名 (可选)</label>
              <input
                type="text"
                value={ownProxyUser}
                onChange={e => onOwnProxyUserChange(e.target.value)}
                disabled={disabled}
                placeholder="代理认证用户名"
              />
              <label>密码 (可选)</label>
              <input
                type="password"
                value={ownProxyPass}
                onChange={e => onOwnProxyPassChange(e.target.value)}
                disabled={disabled}
                placeholder="代理认证密码"
              />
              {ownProxyHost && ownProxyPort && (
                <div className="ls-proxy-status" style={{ color: '#00e676' }}>
                  🟢 自定义代理已配置 ({(ownProxyHost)}:{ownProxyPort})
                </div>
              )}
            </div>
          ) : (
            /* ─── Claw 代理 ─── */
            <div className="ls-proxy-claw">
              {/* 已有订阅 */}
              {subscription && !subscription.isExpired ? (
                <div className="ls-subscription-info">
                  <div className="ls-sub-header">
                    <span style={{ color: '#00e676' }}>✅ 代理已激活</span>
                    <span className="ls-badge">{subscription.plan_name}</span>
                  </div>
                  <div className="ls-sub-details">
                    <div className="ls-sub-stat">
                      <span>剩余天数</span>
                      <strong style={{ color: subscription.daysRemaining < 7 ? '#ff9800' : '#00e676' }}>
                        {subscription.daysRemaining}天
                      </strong>
                    </div>
                    <div className="ls-sub-stat">
                      <span>剩余时长</span>
                      <strong>{formatHours(subscription.remainingHours)}</strong>
                    </div>
                    <div className="ls-sub-stat">
                      <span>到期时间</span>
                      <strong>{new Date(subscription.expires_at).toLocaleDateString('zh-CN')}</strong>
                    </div>
                  </div>

                  <label>推流区域</label>
                  <select
                    value={selectedRegion}
                    onChange={e => onRegionChange(e.target.value)}
                    disabled={disabled}
                  >
                    {(subscription.selected_regions || ['hongkong']).map((r: string) => {
                      const region = regions.find(rg => rg.id === r);
                      return (
                        <option key={r} value={r}>
                          {region ? region.name : r}
                        </option>
                      );
                    })}
                  </select>
                  
                  {selectedRegion && (
                    <div className="ls-proxy-status" style={{ color: '#00e676', marginTop: 8 }}>
                      🟢 代理就绪 — {regions.find(r => r.id === selectedRegion)?.name || selectedRegion}
                    </div>
                  )}
                </div>
              ) : (
                /* ─── 选购套餐 ─── */
                <div className="ls-proxy-purchase">
                  {/* 套餐选择 */}
                  <label>选择套餐</label>
                  <div className="ls-plan-grid">
                    {plans.map(plan => {
                      const isSelected = selectedPlan === plan.id;
                      const colors: Record<string, string> = {
                        starter: '#cd7f32',
                        standard: '#c0c0c0',
                        professional: '#ffd700',
                        enterprise: '#00bcd4',
                      };
                      return (
                        <div
                          key={plan.id}
                          className={`ls-plan-card ${isSelected ? 'ls-plan-selected' : ''}`}
                          onClick={() => !disabled && onPlanChange(plan.id)}
                          style={isSelected ? { borderColor: colors[plan.id] || '#666' } : {}}
                        >
                          <div className="ls-plan-name">{plan.name}</div>
                          <div className="ls-plan-price">
                            {formatPrice(plan.price)}
                            <span>/月</span>
                          </div>
                          <div className="ls-plan-features">
                            {plan.features.slice(0, 4).map((f, i) => (
                              <span key={i} className="ls-plan-feat">{f}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 区域选择 */}
                  <label style={{ marginTop: 12 }}>推流区域</label>
                  <select
                    value={selectedRegion}
                    onChange={e => onRegionChange(e.target.value)}
                    disabled={disabled}
                  >
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.nodeCount}节点)
                      </option>
                    ))}
                  </select>

                  {selectedPlanObj && (
                    <div className="ls-order-summary">
                      <span>💰 合计: <strong>{formatPrice(selectedPlanObj.price)}</strong>/月</span>
                      <span>📺 {selectedPlanObj.concurrentPlatforms}路并发 · {selectedPlanObj.maxResolution} · {selectedPlanObj.ipType === 'shared' ? '共享IP' : selectedPlanObj.ipType === 'dedicated' ? '独享IP' : '半独享IP'}</span>
                    </div>
                  )}

                  <button
                    className="ls-btn ls-btn-start"
                    onClick={handleCreateOrder}
                    disabled={creatingOrder || !selectedPlan || disabled}
                    style={{ marginTop: 12, width: '100%' }}
                  >
                    {creatingOrder ? '创建订单中...' : `💳 立即购买`}
                  </button>
                </div>
              )}

              {/* 订单已创建，等待支付 */}
              {orderResult && (
                <div className="ls-order-pending">
                  <p>📋 订单 #{orderResult.id} 已创建</p>
                  <p>支付完成后代理将自动激活</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
