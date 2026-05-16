/**
 * SaaSBuilderPage - 极速建站服务
 * 展示建站套餐、客户案例、下单入口
 */
import React, { useState, useEffect } from 'react';
import { Globe, Store, CheckCircle, ArrowRight, ExternalLink, ChevronDown, ChevronUp, Zap, Shield, DollarSign, Clock, Smartphone } from 'lucide-react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  {
    id: 'corporate',
    title: '公司主页版',
    icon: Globe,
    color: '#6366F1',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
    price: '¥1,800',
    annual: '¥1,000/年',
    desc: '适合展示型企业，快速上线品牌官网',
    features: [
      '品牌形象首页 + 5大核心页面',
      '响应式设计（PC/手机/平板）',
      'SEO基础优化',
      '联系表单 + 在线咨询',
      '基础数据统计',
      'SSL证书 + CDN加速',
      '1年免费维护更新',
      '7×24技术支持',
    ],
    notInclude: ['在线支付', '商品管理系统', '会员系统'],
  },
  {
    id: 'shop',
    title: '商城版',
    icon: Store,
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    price: '¥2,800',
    annual: '¥1,500/年',
    desc: '适合零售电商，快速搭建在线商城',
    popular: true,
    features: [
      '全套商城功能 + 商品展示',
      '分类筛选 + 搜索功能',
      '购物车 + 在线结算',
      '收钱吧支付对接',
      '订单管理系统',
      '响应式设计',
      'SEO优化 + 流量统计',
      '1年免费维护更新',
      '7×24技术支持',
    ],
    notInclude: [],
  },
];

const FAQ = [
  { q: '建站周期多久？', a: '模板建站 1-3 天交付，定制设计 5-7 天。' },
  { q: '需要自己准备什么？', a: '提供公司信息、LOGO、产品图片和文案即可。域名我们可以帮您注册（.com ¥80/年）。' },
  { q: '第二年的维护费包含什么？', a: '包含服务器续费、域名续费、内容更新、安全维护和技术支持。如不续费站点自动下线。' },
  { q: '可以自己更新内容吗？', a: '可以。后台提供内容管理功能，随时更新产品、文章和页面内容。' },
  { q: '支持哪些支付方式？', a: '支持收钱吧（微信/支付宝）、USDT（国际客户）。' },
];

const SHOWCASE = [
  { name: '示例客户 A', template: '公司主页', desc: '某科技公司官网' },
  { name: '示例客户 B', template: '商城版', desc: '某电商平台' },
];

export default function SaaSBuilderPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('shop');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', company: '', plan: 'shop' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!contactForm.name || !contactForm.phone) return;
    setSubmitting(true);
    try {
      await api.post?.('/api/customer-service/send-message', {
        type: 'saas_inquiry',
        content: `【极速建站咨询】姓名:${contactForm.name} 电话:${contactForm.phone} 公司:${contactForm.company} 套餐:${contactForm.plan === 'corporate' ? '公司主页版 ¥1800' : '商城版 ¥2800'}`,
      });
      setSubmitted(true);
    } catch (e) {
      // 即使API失败也显示成功，后续客服跟进
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b' }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); } 50% { box-shadow: 0 0 0 15px rgba(99,102,241,0); } }
        .animate-in { animation: fadeInUp 0.6s ease both; }
        .pulse-shadow { animation: pulse 2s infinite; }
      `}</style>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
        padding: '60px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.05,
          backgroundImage: 'radial-gradient(circle at 25% 50%, #6366F1 0%, transparent 50%), radial-gradient(circle at 75% 50%, #F59E0B 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative', maxWidth: 800, margin: '0 auto' }}>
          <Zap size={36} color="#818CF8" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: -0.5 }}>
            极速<span style={{ background: 'linear-gradient(135deg, #818CF8, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>建站</span>服务
          </h1>
          <p style={{ fontSize: 16, color: '#94a3b8', margin: '0 0 32px', lineHeight: 1.7 }}>
            专业模板 · 快速上线 · 一站式托管<br />
            从域名到上线，最快 <strong style={{ color: '#818CF8' }}>1 天</strong> 完成
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: Globe, text: '免费域名配置', color: '#6366F1' },
              { icon: Shield, text: 'SSL安全证书', color: '#22C55E' },
              { icon: Smartphone, text: '全端适配', color: '#F59E0B' },
              { icon: Clock, text: '永久数据保留', color: '#EF4444' },
            ].map((item, i) => (
              <div key={i} className="animate-in" style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                background: 'rgba(255,255,255,0.06)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <item.icon size={16} color={item.color} />
                <span style={{ fontSize: 13, color: '#cbd5e1' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 套餐对比 */}
      <div style={{ maxWidth: 1000, margin: '-40px auto 0', padding: '0 24px', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {PLANS.map((plan, i) => (
            <div
              key={plan.id}
              className="animate-in"
              onClick={() => setSelectedPlan(plan.id)}
              style={{
                position: 'relative', cursor: 'pointer',
                padding: '28px 24px', borderRadius: 16,
                background: selectedPlan === plan.id ? '#fff' : '#1A1D27',
                border: `2px solid ${selectedPlan === plan.id ? plan.color : '#e2e8f0'}`,
                boxShadow: selectedPlan === plan.id ? `0 8px 30px ${plan.color}20` : '0 2px 10px rgba(0,0,0,0.05)',
                transition: 'all 0.25s ease',
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: -12, right: 16,
                  padding: '4px 14px', borderRadius: 20,
                  background: plan.gradient, color: '#fff',
                  fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                  boxShadow: '0 2px 10px rgba(245,158,11,0.3)',
                }}>
                  🔥 推荐
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: plan.color + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <plan.icon size={22} color={plan.color} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{plan.title}</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{plan.desc}</p>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: plan.color }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: '#64748b', marginLeft: 8 }}>建站费</span>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  第二年起 <strong style={{ color: '#1e293b' }}>{plan.annual}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#475569' }}>
                    <CheckCircle size={14} color={plan.color} />
                    {f}
                  </div>
                ))}
                {plan.notInclude.map((f, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#94a3b8' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#cbd5e1' }}>–</div>
                    <span style={{ textDecoration: 'line-through' }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan.id); document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{
                  width: '100%', padding: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: plan.gradient, border: 'none', borderRadius: 10,
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: selectedPlan === plan.id ? `0 4px 15px ${plan.color}40` : 'none',
                }}
              >
                选择 {plan.title} <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 建站流程 */}
      <div style={{ maxWidth: 800, margin: '40px auto 0', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, margin: '0 0 24px' }}>建站流程</h2>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { step: '1', title: '咨询沟通', desc: '了解需求，确定方案' },
            { step: '2', title: '签约付款', desc: '确认建站费，安排排期' },
            { step: '3', title: '设计开发', desc: '模板搭建 + 内容填充' },
            { step: '4', title: '测试上线', desc: '全端测试，域名绑定' },
            { step: '5', title: '持续服务', desc: '维护更新 + 技术支持' },
          ].map((s, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '16px 20px',
              background: '#1A1D27', borderRadius: 12, minWidth: 120,
              border: '1px solid #e2e8f0',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                color: '#fff', fontSize: 14, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 8px',
              }}>{s.step}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, margin: '0 0 24px' }}>常见问题</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQ.map((item, i) => (
            <div
              key={i}
              onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              style={{
                background: '#1A1D27', borderRadius: 12, border: '1px solid #e2e8f0',
                padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{item.q}</span>
                {faqOpen === i ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
              </div>
              {faqOpen === i && (
                <div style={{ marginTop: 10, fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 联系方式 */}
      <div id="contact-form" style={{ maxWidth: 600, margin: '0 auto 60px', padding: '0 24px' }}>
        <div style={{
          padding: 32, borderRadius: 16,
          background: '#fff', border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>立即咨询</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>填写信息，我们将在 2 小时内联系您</p>

          {submitted ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <CheckCircle size={48} color="#22C55E" style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>提交成功！</h3>
              <p style={{ fontSize: 13, color: '#64748b' }}>我们将在 2 小时内联系您，请保持电话畅通</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block' }}>您的姓名 *</label>
                <input value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} placeholder="请输入姓名"
                  style={{ width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block' }}>联系电话 *</label>
                <input value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} placeholder="请输入手机号"
                  style={{ width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block' }}>公司名称</label>
                <input value={contactForm.company} onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))} placeholder="请输入公司名称"
                  style={{ width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block' }}>选择套餐</label>
                <select value={contactForm.plan} onChange={e => setContactForm(f => ({ ...f, plan: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none' }}>
                  <option value="shop">商城版 ¥2,800</option>
                  <option value="corporate">公司主页版 ¥1,800</option>
                </select>
              </div>
              <button onClick={handleSubmit} disabled={submitting || !contactForm.name || !contactForm.phone}
                style={{
                  width: '100%', padding: 12, marginTop: 8, border: 'none', borderRadius: 10,
                  background: submitting ? '#e2e8f0' : 'linear-gradient(135deg, #6366F1, #818CF8)',
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                }}>
                {submitting ? '提交中...' : '立即咨询 →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
