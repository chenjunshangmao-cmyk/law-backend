/**
 * CalculatorPage - 完整版利润计算器
 * 链路：成本 → 国内物流 → 国际物流 → 后程费用 → 佣金 → 利润 → 销售价格
 * 售价档位：30%/50%/70%/90% 利润，选完后可一键填入发布页
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface CostBreakdown {
  product: number;
  shipping: number;
  tax: number;
  other: number;
  commission: number;
  commissionRate: number;
  fixedFee: number;
  total: number;
}

interface PlatformResult {
  platform: string;
  platformName: string;
  currency: string;
  exchangeRate: number;
  suggestedPrice: number;
  suggestedPriceLocal: number;
  costs: CostBreakdown;
  profit: number;
  profitLocal: number;
  profitRate: number;
}

interface PriceTier {
  label: string;
  profitRate: number;  // 目标利润率 %
  color: string;
}

const PRICE_TIERS: PriceTier[] = [
  { label: '薄利冲量', profitRate: 30, color: '#059669' },
  { label: '标准利润', profitRate: 50, color: '#6366f1' },
  { label: '高利润',   profitRate: 70, color: '#f59e0b' },
  { label: '暴利',     profitRate: 90, color: '#dc2626' },
];

const PRESETS = [
  { name: '童装', cost: 45, weight: 300, other: 5 },
  { name: '饰品', cost: 20, weight: 100, other: 2 },
  { name: '女鞋', cost: 60, weight: 600, other: 8 },
  { name: '箱包', cost: 80, weight: 500, other: 10 },
  { name: '家居', cost: 50, weight: 800, other: 6 },
  { name: '自定义', cost: 0, weight: 0, other: 0 },
];

export default function CalculatorPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    costPrice: '',
    weight: '',
    logisticsProvider: '',
    destination: 'RU',
    additionalCosts: '',
    taxRate: '13',
    selectedTier: 50,      // 默认50%利润档位
    selectedPlatforms: ['ozon'] as string[],
  });

  const [logisticsOptions, setLogisticsOptions] = useState<any[]>([]);
  const [platformOptions, setPlatformOptions] = useState<any[]>([]);
  const [allTierResults, setAllTierResults] = useState<Record<number, { results: PlatformResult[]; summary: any }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFormKey, setLastFormKey] = useState('');

  useEffect(() => {
    Promise.all([
      api.calculate.logistics().catch(() => ({ data: [] })),
      api.calculate.platforms().catch(() => ({ data: [] }))
    ]).then(([logi, plat]) => {
      setLogisticsOptions(Array.isArray(logi?.data?.logistics) ? logi.data.logistics : (Array.isArray(logi?.data) ? logi.data : []));
      setPlatformOptions(Array.isArray(plat?.data?.platforms) ? plat.data.platforms : (Array.isArray(plat?.data) ? plat.data : []));
    });
  }, []);

  const currentTierResults = allTierResults[form.selectedTier];

  const applyPreset = (p: typeof PRESETS[0]) => {
    if (p.name === '自定义') return;
    setForm(f => ({ ...f, costPrice: String(p.cost), weight: String(p.weight), additionalCosts: String(p.other) }));
  };

  const calculateAll = async () => {
    setError('');
    setAllTierResults({});

    const costPrice = parseFloat(form.costPrice);
    const weight = parseFloat(form.weight);
    if (!costPrice || costPrice <= 0) { setError('请输入商品成本'); return; }
    if (!weight || weight <= 0) { setError('请输入商品重量'); return; }
    if (!form.logisticsProvider) { setError('请选择物流渠道'); return; }
    if (form.selectedPlatforms.length === 0) { setError('请选择至少一个销售平台'); return; }

    setLoading(true);
    try {
      // 同时计算4个利润档位
      const tierPromises = PRICE_TIERS.map(async tier => {
        const res = await api.calculate.profit({
          costPrice, weight,
          logisticsProvider: form.logisticsProvider,
          destination: form.destination,
          platforms: form.selectedPlatforms,
          additionalCosts: parseFloat(form.additionalCosts) || 0,
          taxRate: parseFloat(form.taxRate) / 100,
          targetProfitRate: tier.profitRate,
        });
        return { tier: tier.profitRate, data: res?.data };
      });

      const allResults = await Promise.all(tierPromises);
      const resultMap: Record<number, any> = {};
      for (const r of allResults) {
        if (r.data) resultMap[r.tier] = r.data;
      }
      setAllTierResults(resultMap);
      setLastFormKey(JSON.stringify({ costPrice, weight, logistics: form.logisticsProvider, dest: form.destination }));
    } catch (err: any) {
      setError(err?.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 一键填入发布页
  const applyToPublish = (platform: string, price: number, tierLabel: string) => {
    try {
      // 存储到 sessionStorage，发布页读取
      const publishData = {
        price,
        tier: tierLabel,
        platform,
        currency: currentTierResults?.results?.find(r => r.platform === platform)?.currency || '',
        calculatedAt: new Date().toISOString(),
      };
      sessionStorage.setItem('claw_publish_price', JSON.stringify(publishData));
      navigate('/publish');
    } catch (e) {
      // ignore
    }
  };

  const togglePlatform = (key: string) => {
    setForm(f => ({
      ...f,
      selectedPlatforms: f.selectedPlatforms.includes(key) ? f.selectedPlatforms.filter(k => k !== key) : [...f.selectedPlatforms, key]
    }));
  };

  const platformIcons: Record<string, string> = {
    ozon: '🇷🇺', tiktok: '🎵', youtube: '▶️', amazon: '🇺🇸',
    shopee: '🛍️', lazada: '🛒', wildberries: '📦', aliexpress: '🌐',
    etsy: '🧶', ebay: '🏷️',
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>💰 完整利润计算器</h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        成本 → 物流 → 平台佣金 → 选择利润档位 → 自动设置售价 → 一键填入发布
      </p>

      {/* 快捷预设 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>📋 快捷预设</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => applyPreset(p)}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >{p.name}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16 }}>
        {/* 左栏 */}
        <div>
          {/* 商品信息 */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>📦 商品信息</h3>
            <InputField label="商品成本 ¥" value={form.costPrice} onChange={v => setForm(f => ({...f, costPrice: v}))} placeholder="45" suffix="元" />
            <InputField label="重量" value={form.weight} onChange={v => setForm(f => ({...f, weight: v}))} placeholder="300" suffix="克" />
            <InputField label="其他费用 ¥" value={form.additionalCosts} onChange={v => setForm(f => ({...f, additionalCosts: v}))} placeholder="5" suffix="元" />
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>目的地</label>
              <select value={form.destination} onChange={e => setForm(f => ({...f, destination: e.target.value}))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }}>
                <option value="RU">🇷🇺 俄罗斯</option><option value="US">🇺🇸 美国</option><option value="SG">🇸🇬 新加坡</option>
                <option value="MY">🇲🇾 马来西亚</option><option value="TH">🇹🇭 泰国</option><option value="PH">🇵🇭 菲律宾</option>
                <option value="VN">🇻🇳 越南</option><option value="ID">🇮🇩 印尼</option><option value="EU">🇪🇺 欧洲</option>
                <option value="JP">🇯🇵 日本</option><option value="KR">🇰🇷 韩国</option>
              </select>
            </div>
          </div>

          {/* 物流 */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>🚚 物流渠道</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {logisticsOptions.map(logi => (
                <label key={logi.code} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, border: '2px solid ' + (form.logisticsProvider === logi.code ? '#6366f1' : '#e5e7eb'), background: form.logisticsProvider === logi.code ? '#eef2ff' : '#fff', cursor: 'pointer' }}>
                  <input type="radio" name="logistics" value={logi.code} checked={form.logisticsProvider === logi.code} onChange={() => setForm(f => ({...f, logisticsProvider: logi.code}))} style={{ accentColor: '#6366f1' }} />
                  <div style={{ fontSize: 13 }}><strong>{logi.name}</strong> · {logi.deliveryTime} · ¥{logi.basePrice}</div>
                </label>
              ))}
            </div>
          </div>

          {/* 平台 */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14 }}>🌐 销售平台</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {platformOptions.map(p => (
                <button key={p.key} onClick={() => togglePlatform(p.key)}
                  style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '2px solid ' + (form.selectedPlatforms.includes(p.key) ? '#6366f1' : '#e5e7eb'), background: form.selectedPlatforms.includes(p.key) ? '#eef2ff' : '#fff', color: form.selectedPlatforms.includes(p.key) ? '#4338ca' : '#374151', cursor: 'pointer' }}
                >{platformIcons[p.key] || '🌐'} {p.name}</button>
              ))}
            </div>
            <InputField label="增值税率 %" value={form.taxRate} onChange={v => setForm(f => ({...f, taxRate: v}))} suffix="%" />
          </div>

          <button onClick={calculateAll} disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? '#9ca3af' : '#059669', color: '#fff', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 16, fontWeight: 700 }}
          >{loading ? '⏳ 计算中...' : '🧮 计算全部利润档位'}</button>

          {error && <div style={{ marginTop: 12, padding: 12, background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>⚠️ {error}</div>}
        </div>

        {/* 右栏 */}
        <div>
          {/* 售价档位选择 */}
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>📊 选择利润档位</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {PRICE_TIERS.map(tier => {
              const tierData = allTierResults[tier.profitRate];
              const isSelected = form.selectedTier === tier.profitRate;
              const hasData = !!tierData;
              return (
                <div key={tier.profitRate} onClick={() => setForm(f => ({...f, selectedTier: tier.profitRate}))}
                  style={{
                    padding: 14, borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                    border: `3px solid ${isSelected ? tier.color : '#e5e7eb'}`,
                    background: isSelected ? `${tier.color}10` : '#fff',
                    transition: 'all 0.15s', opacity: hasData || !lastFormKey ? 1 : 0.5,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: tier.color }}>{tier.profitRate}%</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{tier.label}</div>
                  {hasData && tierData?.results?.[0] && (
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#111', marginTop: 4 }}>
                      {tierData.results[0].currency === 'RUB' ? '₽' : tierData.results[0].currency === 'USD' ? '$' : tierData.results[0].currency === 'SGD' ? 'S$' : '¥'}
                      {tierData.results[0].suggestedPrice.toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 当前档位结果 */}
          {currentTierResults ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 成本汇总 */}
              {currentTierResults.summary && (
                <div style={{ padding: 16, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📋 成本汇总 (CNY)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                    {[
                      { label: '商品成本', value: currentTierResults.summary.baseCosts.product },
                      { label: '国际物流', value: currentTierResults.summary.baseCosts.shipping },
                      { label: '税费', value: currentTierResults.summary.baseCosts.tax },
                      { label: '其他费用', value: currentTierResults.summary.baseCosts.other },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
                        <span style={{ color: '#6b7280' }}>{r.label}</span>
                        <span style={{ fontWeight: 600 }}>¥{r.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ borderTop: '2px solid #6366f1', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ fontWeight: 700 }}>基础总成本</span>
                    <span style={{ fontWeight: 800, color: '#4338ca' }}>¥{currentTierResults.summary.baseCosts.total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* 各平台结果 */}
              {currentTierResults.results?.map((r: PlatformResult) => {
                const tier = PRICE_TIERS.find(t => t.profitRate === form.selectedTier)!;
                return (
                  <div key={r.platform} style={{
                    padding: 16, borderRadius: 12, border: '1px solid #e5e7eb',
                    background: '#fff',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        {platformIcons[r.platform] || '🌐'} {r.platformName}
                        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>({r.currency})</span>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#d1fae5', color: '#059669' }}>
                        {tier.label}
                      </span>
                    </div>

                    {/* 建议售价 - 大号展示 */}
                    <div style={{ textAlign: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>建议零售价</div>
                      <div style={{ fontSize: 32, fontWeight: 800, color: tier.color }}>
                        {r.currency === 'RUB' ? '₽' : r.currency === 'USD' ? '$' : r.currency === 'SGD' ? 'S$' : '¥'}
                        {r.suggestedPrice.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                        约 ¥{r.suggestedPriceLocal?.toFixed(2) || (r.suggestedPrice * r.exchangeRate).toFixed(2)}
                      </div>
                    </div>

                    {/* 利润信息 */}
                    <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginBottom: 12 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>利润 ({r.currency})</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>
                          {r.currency === 'RUB' ? '₽' : r.currency === 'USD' ? '$' : 'S$'}
                          {r.profitLocal.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>利润 (CNY)</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>¥{r.profit.toFixed(2)}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>利润率</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: tier.color }}>{r.profitRate}%</div>
                      </div>
                    </div>

                    {/* 一键填入发布 */}
                    <button onClick={() => applyToPublish(r.platform, r.suggestedPrice, tier.label)}
                      style={{
                        width: '100%', padding: '10px', borderRadius: 8,
                        background: '#6366f1', color: '#fff', border: 'none',
                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      }}
                    >🚀 以此价格填写发布 ({r.platformName})</button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb' }}>
              {allTierResults[30] || allTierResults[50] ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#d1d5db' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>👈</div>
                  <div style={{ fontSize: 14 }}>点击上方利润档位查看详情</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 60, color: '#d1d5db' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>🧮</div>
                  <div style={{ fontSize: 14 }}>填写参数后点击"计算全部利润档位"</div>
                  <div style={{ fontSize: 12, color: '#e5e7eb', marginTop: 4 }}>系统自动计算 30%/50%/70%/90% 四档</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, suffix }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; suffix?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', paddingRight: suffix ? 28 : 12 }}
        />
        {suffix && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>{suffix}</span>}
      </div>
    </div>
  );
}
