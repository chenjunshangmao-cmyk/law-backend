/**
 * TikTok AI 商品搬运发布页
 * 复用小红书模板架构，适配 TikTok Shop 特性：
 * - 英文文案生成
 * - 美元定价
 * - TikTok Shop 发布字段（标题/描述/价格/库存/类目）
 * - 浏览器自动化发布
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Play, RefreshCw, CheckCircle, XCircle, Upload, Sparkles, ShoppingBag, Zap } from 'lucide-react';
import api from '../services/api';

// AI 文案风格选项（英文）
const COPY_STYLES = [
  { value: 'professional', label: '💼 Professional', desc: 'Clean & concise' },
  { value: 'casual', label: '🎉 Casual & Fun', desc: 'Relaxed & playful' },
  { value: 'youth', label: '🔥 Trendy', desc: 'Young & fashionable' },
  { value: 'luxury', label: '✨ Premium', desc: 'High-end & elegant' },
];

// TikTok 商品类目
const CATEGORIES = [
  'Women\'s Clothing', 'Men\'s Clothing', 'Kids\' Clothing',
  'Accessories', 'Shoes', 'Bags', 'Beauty', 'Home & Garden',
  'Electronics', 'Sports', 'Toys', 'Pet Supplies', 'Other',
];

export default function TikTokPublishPage() {
  // Tab 切换
  const [tab, setTab] = useState<'publish' | 'accounts'>('publish');

  // 账号
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(false);

  // 发布表单
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('100');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState('');

  // AI 商品搬运流程
  const [productUrl, setProductUrl] = useState('');
  const [fetchedProduct, setFetchedProduct] = useState<any>(null);
  const [competitiveResult, setCompetitiveResult] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<'A' | 'B'>('A');
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineBusy, setPipelineBusy] = useState(false);
  const [autoPublish, setAutoPublish] = useState(false);

  // AI 状态
  const [aiGenerating, setAiGenerating] = useState(false);
  const [copyStyle, setCopyStyle] = useState('professional');
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 加载账号
  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    setLoading(true);
    try {
      const res = await api.accounts.list();
      const saved = (res.data || []).filter((a: any) => a.platform === 'tiktok');
      setAccounts(saved);
      if (saved.length > 0 && !selectedAccount) {
        setSelectedAccount(saved[0].username || saved[0].email || '');
      }
    } catch { }
    finally { setLoading(false); }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const base64Images = await Promise.all(Array.from(files).map(f => fileToBase64(f)));
      setImages(prev => [...prev, ...base64Images].slice(0, 9));
      setMessage({ type: 'success', text: `Added ${files.length} image(s)` });
    } catch (err: any) {
      setMessage({ type: 'error', text: `Image upload failed: ${err.message}` });
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  // =============================================
  // AI 商品搬运：一键全流程
  // =============================================
  async function handlePipelineFetch() {
    if (!productUrl.trim()) {
      setMessage({ type: 'error', text: 'Please paste a product link first' });
      return;
    }
    setPipelineBusy(true);
    setPipelineStep(1);
    setMessage({ type: 'info', text: '🔍 Step 1/3: Fetching product info...' });

    try {
      // Step 1: 抓取产品
      const res = await api.tiktokPublish.ai.fetchProduct({ url: productUrl.trim() });
      if (!res?.success) throw new Error(res?.error || 'Fetch failed');

      setFetchedProduct(res.data);
      setPipelineStep(2);
      setMessage({ type: 'info', text: `✅ Fetched: ${(res.data.title || 'Product').slice(0, 30)}, starting analysis...` });

      // Step 2: 竞品分析
      setPipelineStep(3);
      setMessage({ type: 'info', text: '🧠 Step 2/3: AI competitive analysis + generating TikTok listing...' });

      const analysisRes = await api.tiktokPublish.ai.competitiveAnalysis({ productData: res.data });
      if (!analysisRes?.success) throw new Error(analysisRes?.error || 'Analysis failed');

      setCompetitiveResult(analysisRes.data);
      setPipelineStep(4);
      setMessage({ type: 'success', text: '🎉 Analysis complete! Select a plan → auto-fill form' });
    } catch (err: any) {
      setPipelineStep(fetchedProduct ? 2 : 0);
      setMessage({ type: 'error', text: `Pipeline error: ${err.message}` });
    } finally {
      setPipelineBusy(false);
    }
  }

  // 选择方案并自动填表
  function applyPlan(planKey: 'A' | 'B') {
    const plan = planKey === 'A' ? competitiveResult?.planA : competitiveResult?.planB;
    if (!plan) return;
    setSelectedPlan(planKey);
    if (plan.title) setTitle(plan.title.slice(0, 150));
    if (plan.content) setContent(plan.content);
    if (plan.tags && Array.isArray(plan.tags)) setTags(plan.tags.join(', '));
    if (plan.price) setPrice(plan.price);
    if (plan.category) setCategory(plan.category);
    if (fetchedProduct?.images?.length) {
      setImages(fetchedProduct.images.slice(0, 9));
    }
    setMessage({ type: 'success', text: `✅ Plan ${planKey} applied, form auto-filled. Review and publish!` });
  }

  // AI 单独生成文案
  async function handleGenerateCopy() {
    if (!title && !content) {
      setMessage({ type: 'error', text: 'Please enter a product name or description first' });
      return;
    }
    setAiGenerating(true);
    setMessage({ type: 'info', text: '✍️ AI generating TikTok listing...' });
    try {
      const res = await api.tiktokPublish.ai.generateContent({
        productName: title,
        productDescription: content,
        style: copyStyle,
        category,
      });
      if (res?.success && res?.data) {
        const { title: t, content: c, tags: tgs, price: p } = res.data;
        if (t) setTitle(t.slice(0, 150));
        if (c) setContent(c);
        if (tgs && Array.isArray(tgs)) setTags(tgs.join(', '));
        if (p) setPrice(p);
        setMessage({ type: 'success', text: '✅ TikTok listing generated!' });
      } else {
        throw new Error(res?.error || 'Generation failed');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Generation failed: ${err.message}` });
    } finally {
      setAiGenerating(false);
    }
  }

  // 发布到 TikTok Shop
  async function handlePublish() {
    if (!selectedAccount) {
      setMessage({ type: 'error', text: 'Please select a TikTok account first' });
      return;
    }
    if (!title.trim()) {
      setMessage({ type: 'error', text: 'Product title is required' });
      return;
    }
    setPublishing(true);
    setMessage(null);
    try {
      const tagList = tags.split(/[,，\s]+/).filter(t => t.trim());
      const result = await api.browser.tiktok.publish({
        email: selectedAccount,
        title: title.trim(),
        description: content.trim(),
        price: price ? parseFloat(price) : undefined,
        stock: stock ? parseInt(stock) : 100,
        category: category || undefined,
        tags: tagList,
      });
      if (result?.success) {
        setMessage({ type: 'success', text: '✅ Product published to TikTok Shop!' });
        clearForm();
      } else if (result?.needLogin) {
        setMessage({ type: 'error', text: 'Account not logged in. Please login first.' });
      } else {
        setMessage({ type: 'error', text: result?.error || 'Publish failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Publish failed' });
    } finally {
      setPublishing(false);
    }
  }

  function clearForm() {
    setTitle(''); setContent(''); setPrice(''); setStock('100');
    setCategory(''); setImages([]); setTags('');
    setProductUrl(''); setFetchedProduct(null); setCompetitiveResult(null);
    setSelectedPlan('A'); setPipelineStep(0); setPipelineBusy(false);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
          <ShoppingBag size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">TikTok Shop 发布</h1>
          <p className="text-sm text-gray-500">AI 商品搬运 · 自动化发布</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('publish')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'publish' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
        >
          🚀 AI 商品搬运
        </button>
        <button
          onClick={() => setTab('accounts')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'accounts' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
        >
          📕 账号管理
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-start gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200'
          : message.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200'
          : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'info' && <span className="animate-spin text-base">⚙️</span>}
          <span>{message.text}</span>
        </div>
      )}

      {/* ========== 账号管理 Tab ========== */}
      {tab === 'accounts' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">🎵 TikTok Shop 账号</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-lg mb-2">No TikTok accounts linked</p>
              <p className="text-sm">Please add a TikTok account in "店铺账号" page first</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc: any) => (
                <div key={acc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{acc.name || acc.username || 'TikTok Account'}</p>
                    <p className="text-xs text-gray-400">{acc.username || acc.email || ''}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${acc.status === 'active' || acc.account_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {acc.status === 'active' || acc.account_status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== AI 商品搬运 Tab ========== */}
      {tab === 'publish' && (
        <div className="space-y-4">

          {/* Step 1: 输入产品链接 */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🚀</span>
              <h3 className="font-semibold text-pink-800">AI 商品搬运 → TikTok Shop</h3>
              <span className="text-xs text-pink-500 bg-pink-100 px-2 py-0.5 rounded-full">One-Click Pipeline</span>
            </div>
            <p className="text-xs text-pink-600 mb-3">
              Paste product link → Auto fetch → AI analysis → Generate English listing → Auto publish
            </p>
            <div className="flex gap-2">
              <input
                value={productUrl}
                onChange={e => setProductUrl(e.target.value)}
                placeholder="Paste product link (1688/Taobao/Amazon/AliExpress etc.)"
                className="flex-1 p-2.5 border border-pink-300 rounded-lg text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-200 outline-none"
                disabled={pipelineBusy}
              />
              <button
                onClick={handlePipelineFetch}
                disabled={pipelineBusy || !productUrl.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-all"
              >
                {pipelineBusy ? '⏳ Processing...' : '🔍 Fetch & Analyze'}
              </button>
            </div>

            {/* 流程进度 */}
            {pipelineStep > 0 && (
              <div className="mt-3 flex items-center gap-1 text-xs">
                {[
                  { s: 1, label: 'Fetch' },
                  { s: 2, label: 'Fetched' },
                  { s: 3, label: 'AI Analysis' },
                  { s: 4, label: 'Select Plan' },
                ].map(({ s, label }, idx) => (
                  <React.Fragment key={s}>
                    {idx > 0 && <span className="text-gray-300">→</span>}
                    <span className={`px-2 py-0.5 rounded-full ${
                      pipelineStep >= s
                        ? pipelineStep === s && pipelineBusy
                          ? 'bg-pink-100 text-pink-600 animate-pulse'
                          : 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {pipelineStep > s ? '✅' : pipelineStep === s && pipelineBusy ? '⏳' : `${s}.`}{label}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* 抓取到的产品预览 */}
          {fetchedProduct && (
            <div className="border border-blue-200 rounded-xl overflow-hidden">
              <div className="bg-blue-50 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">📦 Fetched Product</span>
                <span className="text-xs text-blue-500">{fetchedProduct.platform || 'unknown'}</span>
              </div>
              <div className="p-4">
                <h4 className="font-medium text-gray-900 text-sm mb-2">{fetchedProduct.title}</h4>
                {fetchedProduct.price && (
                  <p className="text-lg font-bold text-red-600 mb-2">¥{fetchedProduct.price}</p>
                )}
                {fetchedProduct.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-3">{fetchedProduct.description}</p>
                )}
                {(fetchedProduct.images?.length > 0 || fetchedProduct.imageUrls?.length > 0) && (
                  <div className="grid grid-cols-4 gap-2">
                    {(fetchedProduct.imageUrls || fetchedProduct.images)?.slice(0, 8).map((img: string, idx: number) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 竞品分析结果 + 方案选择 */}
          {competitiveResult && (
            <div className="border border-purple-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3">
                <span className="text-sm font-semibold text-purple-800">🧠 AI Competitive Analysis</span>
              </div>

              {competitiveResult.analysis && (
                <div className="p-4 bg-white border-b border-purple-100">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-pink-50 p-2 rounded-lg">
                      <p className="text-xs text-pink-600 mb-1">💰 Suggested Price</p>
                      <p className="text-sm font-bold text-pink-800">
                        ${competitiveResult.analysis.priceSuggestion || 'TBD'}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">📊 Market Insight</p>
                      <p className="text-xs text-blue-800">
                        {competitiveResult.analysis.marketInsight || 'TBD'}
                      </p>
                    </div>
                  </div>
                  {competitiveResult.analysis.topSellingPoints?.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">🔥 Key Selling Points</p>
                      <div className="flex flex-wrap gap-1">
                        {competitiveResult.analysis.topSellingPoints.map((sp: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-pink-50 text-pink-600 text-xs rounded-full border border-pink-100">
                            {sp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 方案选择 */}
              <div className="p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Select a listing plan:</p>
                {[{ key: 'A', plan: competitiveResult.planA }, { key: 'B', plan: competitiveResult.planB }].map(({ key, plan }) => (
                  plan && (
                    <div
                      key={key}
                      onClick={() => applyPlan(key as 'A' | 'B')}
                      className={`cursor-pointer border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                        selectedPlan === key
                          ? 'border-purple-500 bg-purple-50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                            selectedPlan === key ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {key}
                          </span>
                          <span className="font-medium text-sm">{plan.style || `Plan ${key}`}</span>
                        </div>
                        {selectedPlan === key && (
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Selected</span>
                        )}
                      </div>
                      <h5 className="font-semibold text-gray-900 text-sm mb-1">{plan.title}</h5>
                      <p className="text-xs text-gray-500 line-clamp-3 mb-2">{plan.content?.slice(0, 150)}...</p>
                      {plan.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {plan.tags.slice(0, 6).map((tag: string, i: number) => (
                            <span key={i} className="text-xs text-pink-500">#{tag}</span>
                          ))}
                        </div>
                      )}
                      {plan.price && (
                        <div className="mt-2 text-sm font-bold text-green-600">${plan.price}</div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* 发布表单 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Upload size={18} className="text-purple-500" />
              TikTok Shop Listing
            </h2>

            <div className="space-y-4">
              {/* 选择账号 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TikTok Account *</label>
                <select
                  value={selectedAccount}
                  onChange={e => setSelectedAccount(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">-- Select account --</option>
                  {accounts.map((acc: any) => (
                    <option key={acc.id} value={acc.username || acc.email || acc.id}>
                      🎵 {acc.name || acc.username || acc.email || acc.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* 产品标题 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Product Title *</label>
                  <span className="text-xs text-gray-400">{title.length}/150</span>
                </div>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value.slice(0, 150))}
                  placeholder="e.g. Kids Summer Cotton Dress - Lightweight & Breathable"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  maxLength={150}
                />
              </div>

              {/* 价格 + 库存 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="19.99"
                    step="0.01"
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    placeholder="100"
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* 类目 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 产品描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="High quality summer dress for kids. Lightweight, breathable cotton fabric..."
                  rows={5}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-vertical"
                />
              </div>

              {/* 标签/关键词 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keywords / Tags</label>
                <input
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="kids dress, summer dress, cotton dress (comma separated)"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
                {tags && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.split(/[,，\s]+/).filter(t => t.trim()).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-pink-50 text-pink-600 text-xs rounded-full border border-pink-100">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 图片上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Images
                  <span className="ml-2 text-xs text-gray-400">{images.length}/9</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-pink-400 transition-colors">
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" id="tk-image-upload" />
                  <label htmlFor="tk-image-upload" className="cursor-pointer">
                    <span className="text-pink-500 text-2xl">📷</span>
                    <p className="text-sm text-gray-500 mt-1">Click to upload images</p>
                    <p className="text-xs text-gray-400">JPG/PNG, up to 9 images</p>
                  </label>
                </div>
                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI 单独生成文案 */}
              <div className="border border-purple-200 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-purple-800 flex items-center gap-1">
                    <Sparkles size={14} /> AI Content Generator
                  </span>
                </div>
                <div className="p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-purple-600">Style:</span>
                    {COPY_STYLES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => setCopyStyle(s.value)}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${copyStyle === s.value ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-purple-600 border-purple-200 hover:border-purple-400'}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerateCopy}
                    disabled={aiGenerating}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {aiGenerating ? '⚙️ Generating...' : '✍️ AI Generate TikTok Listing'}
                  </button>
                </div>
              </div>

              {/* 自动发布开关 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🤖</span>
                  <span className="text-sm text-gray-700">Auto publish after filling</span>
                </div>
                <button
                  onClick={() => setAutoPublish(!autoPublish)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoPublish ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoPublish ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* 发布按钮 */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handlePublish}
                  disabled={publishing || loading || aiGenerating}
                  className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    publishing || loading || aiGenerating
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white'
                  }`}
                >
                  {publishing ? (
                    <><RefreshCw size={16} className="animate-spin" /> Publishing...</>
                  ) : (
                    <><Upload size={16} /> Publish to TikTok Shop</>
                  )}
                </button>
                <button
                  onClick={clearForm}
                  className="px-4 py-3 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* 底部说明 */}
          <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
            <p className="text-sm text-pink-700">
              🚀 AI商品搬运：粘贴产品链接→自动抓取→竞品分析→生成英文Listing→一键发布到TikTok Shop
            </p>
            <p className="text-xs text-pink-500 mt-1">💡 请确认账号已登录TikTok Shop，产品信息符合平台规范</p>
          </div>
        </div>
      )}
    </div>
  );
}
