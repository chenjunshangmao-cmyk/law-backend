/**
 * CalculatorPage - 定价计算器
 */
import React, { useState } from 'react';
import { api } from '../services/api';

interface PricingResult {
  cost: number;
  price: number;
  profit: number;
  profitMargin: number;
  roi: number;
  platformFee: number;
  logisticsCost: number;
  otherCost: number;
  totalCost: number;
  usdToCny?: number;
  suggestedPrice?: number;
}

const PRESETS = [
  { name: '童装', cost: 45, logistics: 30, other: 5 },
  { name: '女鞋', cost: 60, logistics: 35, other: 8 },
  { name: '箱包', cost: 80, logistics: 40, other: 10 },
  { name: '家居', cost: 50, logistics: 45, other: 6 },
  { name: '自定义', cost: 0, logistics: 0, other: 0 },
];

export default function CalculatorPage() {
  const [form, setForm] = useState({
    cost: '',           // 成本 CNY
    logistics: '35',     // 物流 CNY
    otherCost: '5',     // 其他费用 CNY
    platformFee: '0.15', // 平台抽成 (15%)
    exchangeRate: '7.2', // 汇率
    targetMargin: '30', // 目标利润率 %
    pricingMethod: 'margin', // margin | markup | fixed
  });
  const [result, setResult] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);

  function applyPreset(preset: typeof PRESETS[0]) {
    if (preset.name === '自定义') return;
    setForm(f => ({
      ...f,
      cost: preset.cost > 0 ? String(preset.cost) : f.cost,
      logistics: String(preset.logistics),
      otherCost: String(preset.other),
    }));
  }

  async function handleCalculate() {
    const cost = parseFloat(form.cost);
    const logistics = parseFloat(form.logistics);
    const otherCost = parseFloat(form.otherCost);
    const platformFeeRate = parseFloat(form.platformFee) / 100;
    const exchangeRate = parseFloat(form.exchangeRate);
    const targetMargin = parseFloat(form.targetMargin) / 100;

    if (!cost) { alert('请输入成本'); return; }

    setLoading(true);
    try {
      // 优先用API计算
      const apiResult = await api.calculate.quick({
        cost,
        logisticsCost: logistics,
        otherCost,
        platformFeeRate,
        exchangeRate,
        targetMargin,
      });
      if (apiResult?.success) {
        setResult(apiResult.data);
        return;
      }
    } catch {}

    // 本地计算 fallback
    const totalCost = cost + logistics + otherCost;
    const platformFeeUSD = totalCost / exchangeRate * platformFeeRate;
    const suggestedPrice = totalCost / exchangeRate / (1 - platformFeeRate - targetMargin);

    setResult({
      cost, logisticsCost: logistics, otherCost,
      platformFee: platformFeeUSD,
      totalCost,
      price: Math.ceil(suggestedPrice * 100) / 100,
      profit: Math.ceil((suggestedPrice - totalCost / exchangeRate) * 100) / 100,
      profitMargin: Math.ceil(targetMargin * 100),
      roi: Math.ceil((suggestedPrice - totalCost / exchangeRate) / (totalCost / exchangeRate) * 100),
      usdToCny: exchangeRate,
      suggestedPrice: Math.ceil(suggestedPrice * 100) / 100,
    });
    setLoading(false);
  }

  function copyToClipboard() {
    if (!result) return;
    const text = `成本: ¥${result.cost} | 物流: ¥${result.logisticsCost} | 定价: $${result.price} | 利润: $${result.profit} | 利润率: ${result.profitMargin}%`;
    navigator.clipboard.writeText(text).then(() => alert('已复制到剪贴板'));
  }

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🧮 定价计算器</h2>

      {/* 快捷预设 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>快捷预设</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => applyPreset(p)} style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid #d1d5db',
              background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>{p.name}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* 左侧：输入 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📥 成本输入（CNY）</h3>
          {[
            { key: 'cost', label: '产品成本 ¥', placeholder: '45' },
            { key: 'logistics', label: '物流费用 ¥', placeholder: '35' },
            { key: 'otherCost', label: '其他费用 ¥', placeholder: '5（包装/人工等）' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
              <input
                type="number"
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, marginTop: 24 }}>⚙️ 参数设置</h3>
          {[
            { key: 'platformFee', label: '平台抽成 %', suffix: '%' },
            { key: 'exchangeRate', label: '美元汇率 ¥', suffix: '' },
            { key: 'targetMargin', label: '目标利润率 %', suffix: '%' },
          ].map(({ key, label, suffix }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', paddingRight: 24 }}
                />
                {suffix && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14 }}>{suffix}</span>}
              </div>
            </div>
          ))}

          <button onClick={handleCalculate} disabled={loading} style={{
            width: '100%', padding: '12px', background: loading ? '#9ca3af' : '#059669',
            color: '#fff', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 700, marginTop: 8
          }}>
            {loading ? '⏳ 计算中...' : '🧮 开始计算'}
          </button>
        </div>

        {/* 右侧：结果 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>📤 计算结果</h3>
            {result && (
              <button onClick={copyToClipboard} style={{ padding: '5px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>复制</button>
            )}
          </div>

          {!result ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#d1d5db' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🧮</div>
              <div style={{ fontSize: 14 }}>输入成本后点击计算</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ResultRow label="📌 建议售价" value={`$${result.price?.toFixed(2)}`} highlight />
              <ResultRow label="💰 预期利润" value={`$${result.profit?.toFixed(2)}`} color="#059669" />
              <ResultRow label="📈 利润率" value={`${result.profitMargin}%`} />
              <ResultRow label="📊 ROI" value={`${result.roi}%`} />
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>成本明细（CNY）</div>
                <ResultRow label="产品成本" value={`¥${result.cost?.toFixed(2)}`} small />
                <ResultRow label="物流费用" value={`¥${result.logisticsCost?.toFixed(2)}`} small />
                <ResultRow label="其他费用" value={`¥${result.otherCost?.toFixed(2)}`} small />
                <ResultRow label="平台抽成" value={`$${result.platformFee?.toFixed(2)}`} small />
                <ResultRow label="总成本" value={`¥${result.totalCost?.toFixed(2)}`} small bold />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value, color, highlight, small, bold }: {
  label: string; value: string; color?: string; highlight?: boolean; small?: boolean; bold?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: small ? '4px 0' : '8px 0',
      borderBottom: '1px solid #f3f4f6',
    }}>
      <span style={{ fontSize: small ? 13 : 14, color: '#6b7280' }}>{label}</span>
      <span style={{
        fontSize: small ? 14 : 18, fontWeight: bold ? 700 : (highlight ? 700 : 500),
        color: color || (highlight ? '#059669' : '#111'),
      }}>{value}</span>
    </div>
  );
}
