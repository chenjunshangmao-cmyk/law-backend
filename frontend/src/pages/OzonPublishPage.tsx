/**
 * OZON 智能发布页 v3（小红书风格重构版）
 * 双方案：链接拉取 + 自上传，AI辅助生成，利润计算，API发布
 * 新增：多规格变体、品牌信息、视频上传、运费设置
 */
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Upload, Sparkles, Package, Calculator, X, Wand2, Plus, Trash2, Check, ChevronDown, Image, Video, Settings } from 'lucide-react';
import api from '../services/api';

// 俄语文案风格
const COPY_STYLES = [
  { value: 'professional', label: '💼 专业', desc: '信息详实、权威可信' },
  { value: 'casual', label: '😊 友好', desc: '亲切自然、贴近生活' },
  { value: 'premium', label: '✨ 高端', desc: '突出品质、精致优雅' },
  { value: 'value', label: '💰 超值', desc: '强调性价比、促销感' },
];

// OZON 主要类目（俄文+中文对照）
const CATEGORIES = [
  { value: 'apparel', label: 'Одежда / 服装' },
  { value: 'shoes', label: 'Обувь / 鞋类' },
  { value: 'kids', label: 'Детские товары / 母婴' },
  { value: 'beauty', label: 'Красота и здоровье / 美妆健康' },
  { value: 'electronics', label: 'Электроника / 电子' },
  { value: 'home', label: 'Дом и сад / 家居园艺' },
  { value: 'sports', label: 'Спорт / 运动' },
  { value: 'toys', label: 'Игрушки / 玩具' },
  { value: 'auto', label: 'Автотовары / 汽配' },
  { value: 'pets', label: 'Зоотовары / 宠物' },
  { value: 'food', label: 'Продукты / 食品' },
  { value: 'other', label: 'Другое / 其他' },
];

// AI 生图风格（OZON 电商专用）
const AI_IMAGE_STYLES = [
  { value: 'model', label: '👩‍🦰 模特穿搭', desc: '俄罗斯模特展示' },
  { value: 'scene', label: '🏠 生活场景', desc: '融入真实场景' },
  { value: 'detail', label: '🔍 细节特写', desc: '材质工艺' },
  { value: 'flatlay', label: '📐 平铺摆拍', desc: 'ins风俯视' },
  { value: 'whitebg', label: '⬜ 白底主图', desc: '纯白背景' },
];

// ===== 变体类型 =====
interface Variant {
  id: string;
  color?: string;
  size?: string;
  price: string;
  oldPrice?: string;
  stock: string;
  sku?: string;
  images?: string[];
}

// ===== 主组件 =====
export default function OzonPublishPage() {
  const [tab, setTab] = useState<'fetch' | 'manual' | 'accounts'>('fetch');

  // ===== 账号 =====
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [loading, setLoading] = useState(true);

  // ===== 发布表单 =====
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [stock, setStock] = useState('100');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [tags, setTags] = useState('');
  const [specs, setSpecs] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [aiImages, setAiImages] = useState<string[]>([]);

  // ===== 新增：OZON 特有字段 =====
  const [brand, setBrand] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [country, setCountry] = useState('');
  const [weight, setWeight] = useState('200');
  const [length, setLength] = useState('20');
  const [width, setWidth] = useState('15');
  const [height, setHeight] = useState('5');
  const [videoUrl, setVideoUrl] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');

  // ===== 变体（颜色+尺码组合） =====
  const [variants, setVariants] = useState<Variant[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');
  const [showVariantPanel, setShowVariantPanel] = useState(false);

  // ===== 链接拉取 =====
  const [productUrl, setProductUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchedProduct, setFetchedProduct] = useState<any>(null);
  const [pipelineStep, setPipelineStep] = useState(0);

  // ===== 自上传 =====
  const [manualFiles, setManualFiles] = useState<File[]>([]);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualSpecs, setManualSpecs] = useState('');

  // ===== AI =====
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiImageGenerating, setAiImageGenerating] = useState(false);
  const [copyStyle, setCopyStyle] = useState('professional');
  const [aiImageStyle, setAiImageStyle] = useState('model');
  const [aiImageCount, setAiImageCount] = useState(4);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // ===== 利润计算 =====
  const [showCalculator, setShowCalculator] = useState(false);
  const [costPrice, setCostPrice] = useState('');
  const [profitRate, setProfitRate] = useState('30');
  const [exchangeRate, setExchangeRate] = useState('12');

  // ===== 发布 =====
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadAccounts(); }, []);

  async function loadAccounts() {
    setLoading(true);
    try {
      const res = await api.accounts.list();
      const saved = (res.data || []).filter((a: any) => a.platform === 'ozon');
      setAccounts(saved);
      if (saved.length > 0 && !selectedAccount) setSelectedAccount(saved[0].id || '');
    } catch {} finally { setLoading(false); }
  }

  // ===== 工具函数 =====
  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const base64s = await Promise.all(Array.from(files).map(fileToBase64));
    setImages(prev => [...prev, ...base64s].slice(0, 15));
    showMsg('success', `已上传 ${files.length} 张图片`);
  }

  function removeImage(idx: number) { setImages(prev => prev.filter((_, i) => i !== idx)); }
  function removeAiImage(idx: number) { setAiImages(prev => prev.filter((_, i) => i !== idx)); }

  function showMsg(type: 'success' | 'error' | 'info', text: string) {
    setMessage({ type, text });
    if (type !== 'info') setTimeout(() => setMessage(null), 5000);
  }

  // ===== 变体生成 =====
  function addColor() {
    const c = newColor.trim();
    if (c && !colors.includes(c)) { setColors(prev => [...prev, c]); }
    setNewColor('');
  }

  function addSize() {
    const s = newSize.trim();
    if (s && !sizes.includes(s)) { setSizes(prev => [...prev, s]); }
    setNewSize('');
  }

  function removeColor(c: string) { setColors(prev => prev.filter(x => x !== c)); generateVariants(); }
  function removeSize(s: string) { setSizes(prev => prev.filter(x => x !== s)); generateVariants(); }

  function generateVariants() {
    const basePrice = parseFloat(price) || 0;
    const baseOld = parseFloat(oldPrice) || 0;
    const baseStock = parseInt(stock) || 100;
    const newVariants: Variant[] = [];

    if (colors.length === 0 && sizes.length === 0) {
      // 无规格：单一商品
      newVariants.push({
        id: `single_${Date.now()}`,
        price: price || '',
        oldPrice: oldPrice || '',
        stock: stock || '100',
        sku: sku || `SKU-${Date.now()}`,
      });
    } else if (colors.length > 0 && sizes.length > 0) {
      colors.forEach(c => sizes.forEach(s => {
        newVariants.push({
          id: `v_${c}_${s}_${Date.now()}`,
          color: c, size: s,
          price: String(basePrice), oldPrice: String(baseOld), stock: String(baseStock),
          sku: `${sku || 'SKU'}_${c}_${s}`.replace(/\s/g, '-'),
        });
      }));
    } else if (colors.length > 0) {
      colors.forEach(c => {
        newVariants.push({
          id: `v_${c}_${Date.now()}`,
          color: c,
          price: String(basePrice), oldPrice: String(baseOld), stock: String(baseStock),
          sku: `${sku || 'SKU'}_${c}`.replace(/\s/g, '-'),
        });
      });
    } else if (sizes.length > 0) {
      sizes.forEach(s => {
        newVariants.push({
          id: `v_${s}_${Date.now()}`,
          size: s,
          price: String(basePrice), oldPrice: String(baseOld), stock: String(baseStock),
          sku: `${sku || 'SKU'}_${s}`.replace(/\s/g, '-'),
        });
      });
    }
    setVariants(newVariants);
  }

  function updateVariant(id: string, field: keyof Variant, value: string) {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  }

  function removeVariant(id: string) {
    setVariants(prev => prev.filter(v => v.id !== id));
  }

  // ===== 链接拉取 =====
  async function handleFetchProduct() {
    if (!productUrl.trim()) { showMsg('error', '请输入商品链接'); return; }
    setFetching(true); setPipelineStep(1);
    showMsg('info', '🔍 正在抓取商品信息...');
    try {
      const res = await api.ozonPublish.ai.fetchProduct({ url: productUrl.trim() });
      if (!res?.success) throw new Error(res?.error || '抓取失败');
      const product = res.data;
      setFetchedProduct(product);
      if (product.title) setTitle(product.title.slice(0, 250));
      if (product.description) setContent(product.description);
      if (product.price) setCostPrice(String(product.price));
      if (product.sku) setSku(product.sku);
      if (product.images?.length) setImages(product.images.slice(0, 15));
      if (product.specs) setSpecs(product.specs);
      setPipelineStep(2);
      showMsg('success', `✅ 抓取成功：${product.title?.slice(0, 30)}`);
      setPipelineStep(3);
      showMsg('info', '🧠 AI 竞品分析 + 生成俄语文案...');
      const analysisRes = await api.ozonPublish.ai.competitiveAnalysis({ productData: product });
      if (analysisRes?.success && analysisRes?.data) {
        const plan = analysisRes.data.planA || analysisRes.data.planB;
        if (plan) {
          if (plan.title) setTitle(plan.title.slice(0, 250));
          if (plan.content) setContent(plan.content);
          if (plan.price) setPrice(plan.price);
          if (plan.oldPrice) setOldPrice(plan.oldPrice);
          if (plan.category) setCategory(plan.category);
          if (plan.tags && Array.isArray(plan.tags)) setTags(plan.tags.join(', '));
        }
        setPipelineStep(4);
        showMsg('success', '🎉 AI 分析完成，表单已自动填写');
      }
    } catch (err: any) {
      showMsg('error', `抓取失败：${err.message}`);
      setPipelineStep(0);
    } finally { setFetching(false); }
  }

  function handleManualConfirm() {
    if (manualTitle) setTitle(manualTitle.slice(0, 250));
    if (manualDesc) setContent(manualDesc);
    if (manualPrice) { setCostPrice(manualPrice); setPrice(manualPrice); }
    if (manualSpecs) setSpecs(manualSpecs);
    showMsg('success', '信息已填入发布表单');
  }

  // ===== AI 俄语文案生成 =====
  async function handleGenerateCopy() {
    if (!title && !content) { showMsg('error', '请先填写商品名称或描述'); return; }
    setAiGenerating(true);
    showMsg('info', '✍️ AI 生成俄语文案...');
    try {
      const res = await api.ozonPublish.ai.generateContent({
        productName: title,
        productDescription: content,
        style: copyStyle,
        category,
      });
      if (res?.success && res?.data) {
        const d = res.data;
        if (d.title) setTitle(d.title.slice(0, 250));
        if (d.content) setContent(d.content);
        if (d.tags && Array.isArray(d.tags)) setTags(d.tags.join(', '));
        if (d.price) setPrice(d.price);
        if (d.oldPrice) setOldPrice(d.oldPrice);
        showMsg('success', '✅ 俄语文案已生成');
      } else { throw new Error(res?.error || '生成失败'); }
    } catch (err: any) { showMsg('error', `文案生成失败：${err.message}`); }
    finally { setAiGenerating(false); }
  }

  // ===== AI 场景图生成 =====
  async function handleGenerateImages() {
    if (images.length === 0) { showMsg('error', '请先上传产品图片'); return; }
    setAiImageGenerating(true);
    showMsg('info', '🎨 AI 正在生成场景图，约需60-90秒...');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://claw-backend-2026.onrender.com'}/api/ozon-publish/ai/generate-images`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            images: images.slice(0, 5),
            style: aiImageStyle,
            count: aiImageCount,
            productName: title,
          }),
        }
      );
      const data = await res.json();
      if (data?.success && data.data?.images?.length > 0) {
        setAiImages(prev => [...prev, ...data.data.images]);
        showMsg('success', `✅ 已生成 ${data.data.images.length} 张场景图`);
      } else { throw new Error(data?.error || '无返回图片'); }
    } catch (err: any) { showMsg('error', `生图失败：${err.message}`); }
    finally { setAiImageGenerating(false); }
  }

  // ===== 利润计算 =====
  function calculateProfit() {
    const cost = parseFloat(costPrice) || 0;
    const rate = parseFloat(profitRate) || 30;
    const exr = parseFloat(exchangeRate) || 12;
    if (cost <= 0) { showMsg('error', '请填写供货价'); return; }
    const sellPrice = Math.round(cost * exr * (1 + rate / 100));
    const oPrice = Math.round(sellPrice * 1.3);
    setPrice(String(sellPrice));
    setOldPrice(String(oPrice));
    setDiscountPercent('20');
    showMsg('success', `售价：₽${sellPrice}（利润率${rate}%，折扣≈${Math.round((oPrice - sellPrice) / oPrice * 100)}%）`);
  }

  // ===== 发布 =====
  async function handlePublish() {
    if (!selectedAccount) { showMsg('error', '请选择 OZON 账号'); return; }
    if (!title.trim()) { showMsg('error', '请填写商品名称'); return; }
    const allImages = [...images, ...aiImages].slice(0, 15);
    setPublishing(true);
    try {
      const payload: any = {
        accountId: selectedAccount,
        name: title.trim(),
        offer_id: sku || `SKU-${Date.now()}`,
        price: variants.length > 0 && variants[0].price ? variants[0].price : (price || '0'),
        old_price: variants.length > 0 && variants[0].oldPrice ? variants[0].oldPrice : (oldPrice || undefined),
        currency_code: 'RUB',
        vat: '0',
        images: allImages.length > 0 ? allImages : undefined,
        primary_image: allImages[0] || undefined,
        attributes: [],
        weight: parseInt(weight) || 200,
        weight_unit: 'g',
        height: parseInt(height) || 10,
        width: parseInt(width) || 10,
        depth: parseInt(length) || 10,
        dimension_unit: 'cm',
      };

      if (brand) payload.attributes.push({ id: 'brand', value: brand });
      if (manufacturer) payload.attributes.push({ id: 'manufacturer', value: manufacturer });
      if (country) payload.attributes.push({ id: 'country_of_origin', value: country });

      const result = await api.ozonPublish.api.publish(payload);
      if (result?.success) {
        showMsg('success', `✅ 已提交到 OZON！任务ID: ${result.data?.task_id || 'N/A'}。1-3天审核`);
        clearAll();
      } else { showMsg('error', result?.error || '发布失败'); }
    } catch (err: any) { showMsg('error', `发布失败：${err.message}`); }
    finally { setPublishing(false); }
  }

  function clearAll() {
    setTitle(''); setContent(''); setPrice(''); setOldPrice(''); setStock('100');
    setCategory(''); setSku(''); setTags(''); setSpecs('');
    setImages([]); setAiImages([]);
    setProductUrl(''); setFetchedProduct(null); setPipelineStep(0);
    setManualTitle(''); setManualDesc(''); setManualPrice(''); setManualSpecs('');
    setCostPrice(''); setProfitRate('30'); setExchangeRate('12');
    setBrand(''); setManufacturer(''); setCountry(''); setWeight('200');
    setLength('20'); setWidth('15'); setHeight('5'); setVideoUrl('');
    setVariants([]); setColors([]); setSizes([]);
  }

  const selectedAcc = accounts.find(a => a.id === selectedAccount);

  // ===== 渲染 =====
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== 顶部导航栏 ===== */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Package size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">OZON 智能发布</h1>
            <p className="text-xs text-gray-400">链接抓取 · AI生图 · 多规格 · API发布</p>
          </div>
          {selectedAcc && (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-blue-700 font-medium">{selectedAcc.name}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1">
          {[
            { key: 'fetch', label: '🔗 链接拉取' },
            { key: 'manual', label: '📷 自上传' },
            { key: 'accounts', label: '🏪 账号' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ===== 消息提示 ===== */}
        {message && (
          <div className={`mb-5 p-3 rounded-xl text-sm flex items-center gap-2 shadow-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200'
            : message.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'info' && <RefreshCw size={14} className="animate-spin flex-shrink-0" />}
            {message.type === 'success' && <Check size={14} className="flex-shrink-0" />}
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto opacity-60 hover:opacity-100">×</button>
          </div>
        )}

        {/* ===== 账号管理 Tab ===== */}
        {tab === 'accounts' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-4 text-gray-800">🏪 OZON 账号</h2>
            {loading ? <p className="text-gray-400 text-sm">加载中...</p>
             : accounts.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-lg mb-2">暂无 OZON 账号</p>
                <p className="text-sm">请在「店铺账号」添加 OZON 账号（Client ID + API Key）</p>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((acc: any) => (
                  <div key={acc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{acc.name || 'OZON Account'}</p>
                        <p className="text-xs text-gray-400">{acc.id}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">已绑定</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== 链接拉取 Tab ===== */}
        {tab === 'fetch' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔗</span>
                <h3 className="font-semibold text-blue-800 text-sm">粘贴商品链接自动抓取</h3>
              </div>
              <p className="text-xs text-blue-600 mb-3">支持 1688、淘宝、天猫、AliExpress、Amazon 等平台</p>
              <div className="flex gap-2">
                <input
                  value={productUrl}
                  onChange={e => setProductUrl(e.target.value)}
                  placeholder="https://detail.1688.com/offer/xxx.html"
                  className="flex-1 p-3 border border-blue-300 rounded-xl text-sm focus:border-blue-500 outline-none bg-white"
                  disabled={fetching}
                />
                <button
                  onClick={handleFetchProduct}
                  disabled={fetching || !productUrl.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm transition-opacity"
                >
                  {fetching ? '⏳ 抓取中...' : '🔍 抓取'}
                </button>
              </div>
              {pipelineStep > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  {['抓取', '解析', 'AI分析', '完成'].map((label, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-gray-300">›</span>}
                      <span className={`px-2.5 py-1 rounded-full font-medium ${
                        pipelineStep > i + 1 ? 'bg-green-100 text-green-700'
                        : pipelineStep === i + 1 && fetching ? 'bg-blue-100 text-blue-600 animate-pulse'
                        : pipelineStep === i + 1 ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                      }`}>
                        {pipelineStep > i + 1 ? '✓' : pipelineStep === i + 1 && fetching ? '…' : ''}{label}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {fetchedProduct && (
              <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-sm">
                <div className="bg-blue-50 px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-800">📦 抓取结果</span>
                  <span className="text-xs text-blue-500">{fetchedProduct.platform || ''}</span>
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">{fetchedProduct.title}</h4>
                  {fetchedProduct.price && (
                    <p className="text-lg font-bold text-red-500 mb-2">¥{fetchedProduct.price}</p>
                  )}
                  {fetchedProduct.specs && (
                    <div className="mb-3 p-2.5 bg-gray-50 rounded-lg text-xs text-gray-600 whitespace-pre-line border border-gray-100">
                      {fetchedProduct.specs}
                    </div>
                  )}
                  {fetchedProduct.images?.length > 0 && (
                    <div className="grid grid-cols-5 gap-2">
                      {fetchedProduct.images.slice(0, 10).map((img: string, idx: number) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                          <img src={img} alt="" className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== 自上传 Tab ===== */}
        {tab === 'manual' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm flex items-center gap-2">
                <Upload size={16} className="text-blue-500" /> 上传产品信息
              </h3>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">产品图片</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files) return;
                      setManualFiles(prev => [...prev, ...Array.from(files)]);
                      const base64s = await Promise.all(Array.from(files).map(fileToBase64));
                      setImages(prev => [...prev, ...base64s]);
                    }}
                    className="hidden" id="ozon-manual-upload" />
                  <span className="text-blue-500 text-2xl block mb-1">📷</span>
                  <p className="text-sm text-gray-500">点击上传产品图片</p>
                  <p className="text-xs text-gray-400">支持 JPG/PNG，最多15张</p>
                </div>
              </div>
              <div className="space-y-3">
                <input value={manualTitle} onChange={e => setManualTitle(e.target.value)}
                  placeholder="商品名称（中文）" maxLength={250}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                <textarea value={manualDesc} onChange={e => setManualDesc(e.target.value)}
                  placeholder="商品描述/卖点/详情..." rows={3}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:border-blue-400 outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={manualPrice} onChange={e => setManualPrice(e.target.value)}
                    placeholder="供货价（¥人民币）" type="number"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                  <textarea value={manualSpecs} onChange={e => setManualSpecs(e.target.value)}
                    placeholder="规格（如：颜色:红/蓝&#10;尺码:S/M/L）" rows={2}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:border-blue-400 outline-none" />
                </div>
                <button onClick={handleManualConfirm}
                  className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
                  ✅ 确认，填入发布表单
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== 共用发布表单 ===== */}
        {tab !== 'accounts' && (
          <div className="space-y-4 mt-5">

            {/* ===== 第一步：账号选择 ===== */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
                选择发布账号
              </h3>
              <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:border-blue-400 outline-none">
                <option value="">-- 选择 OZON 账号 --</option>
                {accounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>{acc.name || acc.id}</option>
                ))}
              </select>
            </div>

            {/* ===== 第二步：商品图片（小红书风格大图预览） ===== */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-3.5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-500 text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
                  📷 产品图片 <span className="text-xs text-purple-500 font-normal">（{images.length}/15张）</span>
                </h3>
                <label className="text-xs text-purple-600 bg-white border border-purple-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors">
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  + 添加图片
                </label>
              </div>

              {images.length > 0 ? (
                <div className="p-4">
                  {/* 主图 */}
                  <div className="grid grid-cols-5 gap-3">
                    {/* 第一张：大图 */}
                    <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden border-2 border-purple-200 bg-gray-50 aspect-square">
                      <img src={images[0]} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">主图</div>
                      <button onClick={() => removeImage(0)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">×</button>
                    </div>
                    {/* 其他图 */}
                    {images.slice(1, 9).map((img, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50 aspect-square">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(idx + 1)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">×</button>
                      </div>
                    ))}
                    {/* 添加更多 */}
                    {images.length < 15 && (
                      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-colors aspect-square"
                        onClick={() => {
                          const inp = document.createElement('input');
                          inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = true;
                          inp.onchange = handleImageUpload;
                          inp.click();
                        }}>
                        <span className="text-2xl text-gray-300">+</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-purple-50 rounded-2xl flex items-center justify-center">
                    <Image size={28} className="text-purple-400" />
                  </div>
                  <p className="text-sm text-gray-400 mb-2">暂无产品图片</p>
                  <label className="inline-block px-4 py-2 bg-purple-500 text-white text-sm rounded-lg cursor-pointer hover:bg-purple-600 transition-colors">
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    上传图片
                  </label>
                </div>
              )}

              {/* AI 场景图 */}
              {images.length > 0 && (
                <div className="border-t border-purple-100">
                  <div className="px-5 py-3 bg-purple-50 flex items-center gap-2">
                    <Wand2 size={14} className="text-purple-500" />
                    <span className="text-sm font-medium text-purple-700">🎨 AI 场景图生成</span>
                    {aiImageGenerating && <RefreshCw size={12} className="text-purple-500 animate-spin" />}
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {AI_IMAGE_STYLES.map(s => (
                        <button key={s.value}
                          onClick={() => setAiImageStyle(s.value)}
                          title={s.desc}
                          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${aiImageStyle === s.value ? 'bg-purple-500 text-white border-purple-500' : 'text-purple-600 border-purple-200 hover:border-purple-400'}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      {[2, 4, 6].map(n => (
                        <button key={n}
                          onClick={() => setAiImageCount(n)}
                          className={`w-8 h-8 text-xs rounded-full transition-colors ${aiImageCount === n ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                          {n}
                        </button>
                      ))}
                      <span className="text-xs text-gray-400">张</span>
                      <button onClick={handleGenerateImages} disabled={aiImageGenerating}
                        className="ml-auto px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-lg font-medium hover:opacity-90 disabled:opacity-50">
                        {aiImageGenerating ? '⏳ 生成中...' : '🎨 生成'}
                      </button>
                    </div>
                    {aiImages.length > 0 && (
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {aiImages.map((img, idx) => (
                          <div key={idx} className="relative rounded-lg overflow-hidden border border-purple-100 aspect-square">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => removeAiImage(idx)}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ===== 第三步：商品基本信息 ===== */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-bold">3</span>
                📝 商品基本信息
              </h3>

              {/* 标题 */}
              <div className="mb-4">
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600">商品名称（俄文）<span className="text-red-400">*</span></label>
                  <span className="text-xs text-gray-400">{title.length}/250</span>
                </div>
                <input value={title} onChange={e => setTitle(e.target.value.slice(0, 250))}
                  placeholder="俄文商品名称，建议含关键词（AI 可自动生成）" maxLength={250}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
              </div>

              {/* 类目 + SKU */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">商品类目</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-white focus:border-blue-400 outline-none">
                    <option value="">选择类目</option>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">SKU 货号</label>
                  <input value={sku} onChange={e => setSku(e.target.value)}
                    placeholder="商品货号（必填）" maxLength={50}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                </div>
              </div>

              {/* 品牌 + 制造商 + 产地 */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">品牌</label>
                  <input value={brand} onChange={e => setBrand(e.target.value)}
                    placeholder="品牌名" maxLength={100}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">制造商</label>
                  <input value={manufacturer} onChange={e => setManufacturer(e.target.value)}
                    placeholder="制造商" maxLength={100}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">原产国</label>
                  <input value={country} onChange={e => setCountry(e.target.value)}
                    placeholder="中国" maxLength={50}
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                </div>
              </div>

              {/* 描述 */}
              <div className="mb-4">
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-600">商品描述（俄文）</label>
                  <button onClick={() => setShowAiPanel(!showAiPanel)}
                    className="text-xs text-indigo-500 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors">
                    {showAiPanel ? '收起 AI' : '✨ AI 生成'}
                  </button>
                </div>
                <textarea value={content} onChange={e => setContent(e.target.value)}
                  placeholder="俄文商品描述，建议含规格参数、材质、用途等（AI 可自动生成）" rows={5}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:border-blue-400 outline-none" />

                {/* AI 生成面板 */}
                {showAiPanel && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs text-indigo-600 font-medium">文案风格：</span>
                      {COPY_STYLES.map(s => (
                        <button key={s.value}
                          onClick={() => setCopyStyle(s.value)}
                          title={s.desc}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${copyStyle === s.value ? 'bg-indigo-500 text-white border-indigo-500' : 'text-indigo-600 border-indigo-200 hover:border-indigo-400'}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleGenerateCopy} disabled={aiGenerating}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm">
                      {aiGenerating ? '⏳ AI 生成中...' : '✍️ AI 生成俄语文案'}
                    </button>
                  </div>
                )}
              </div>

              {/* 关键词 */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">关键词（SEO）</label>
                <input value={tags} onChange={e => setTags(e.target.value)}
                  placeholder="用逗号分隔，如：платье, летнее, хлопок" maxLength={500}
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
              </div>

              {/* 规格属性 */}
              <div className="mb-0">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">规格属性（备用文本）</label>
                <textarea value={specs} onChange={e => setSpecs(e.target.value)}
                  placeholder="每行一个规格，如：&#10;颜色: 红色, 蓝色&#10;尺码: S, M, L, XL&#10;材质: 纯棉"
                  rows={3} className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:border-blue-400 outline-none" />
              </div>
            </div>

            {/* ===== 第四步：多规格变体（核心新增） ===== */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <button
                onClick={() => { setShowVariantPanel(!showVariantPanel); if (!showVariantPanel) generateVariants(); }}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-500 text-white rounded-full text-xs flex items-center justify-center font-bold">4</span>
                  <span className="text-sm font-semibold text-gray-700">🎯 多规格变体</span>
                  {variants.length > 0 && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{variants.length} 个规格</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!showVariantPanel && variants.length === 0 && (
                    <span className="text-xs text-gray-400">可选：颜色 / 尺码</span>
                  )}
                  <span className={`text-gray-400 transition-transform ${showVariantPanel ? 'rotate-180' : ''}`}>
                    <ChevronDown size={16} />
                  </span>
                </div>
              </button>

              {showVariantPanel && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                  {/* 颜色选择 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">颜色选项</label>
                    <div className="flex gap-2 mb-2">
                      <input value={newColor} onChange={e => setNewColor(e.target.value)}
                        placeholder="如：红色、蓝色、黑色"
                        onKeyDown={e => e.key === 'Enter' && addColor()}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none" />
                      <button onClick={addColor}
                        className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors">+ 添加</button>
                    </div>
                    {colors.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {colors.map(c => (
                          <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs">
                            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                            {c}
                            <button onClick={() => removeColor(c)} className="text-gray-400 hover:text-red-500 ml-0.5">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 尺码选择 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">尺码选项</label>
                    <div className="flex gap-2 mb-2">
                      <input value={newSize} onChange={e => setNewSize(e.target.value)}
                        placeholder="如：S、M、L、XL、38、39、40"
                        onKeyDown={e => e.key === 'Enter' && addSize()}
                        className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:border-blue-400 outline-none" />
                      <button onClick={addSize}
                        className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors">+ 添加</button>
                    </div>
                    {sizes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {sizes.map(s => (
                          <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs">
                            {s}
                            <button onClick={() => removeSize(s)} className="text-gray-400 hover:text-red-500 ml-0.5">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 生成按钮 */}
                  <div className="flex gap-2">
                    <button onClick={generateVariants}
                      className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors">
                      🔄 生成变体表
                    </button>
                    {(colors.length > 0 || sizes.length > 0) && (
                      <button onClick={() => { setColors([]); setSizes([]); setVariants([]); }}
                        className="px-4 py-2 bg-gray-100 text-gray-500 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                        清空规格
                      </button>
                    )}
                  </div>

                  {/* 变体表格 */}
                  {variants.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            {colors.length > 0 && <th className="p-2 text-left text-gray-500 font-medium">颜色</th>}
                            {sizes.length > 0 && <th className="p-2 text-left text-gray-500 font-medium">尺码</th>}
                            <th className="p-2 text-left text-gray-500 font-medium">售价 (₽)</th>
                            <th className="p-2 text-left text-gray-500 font-medium">原价 (₽)</th>
                            <th className="p-2 text-left text-gray-500 font-medium">库存</th>
                            <th className="p-2 text-left text-gray-500 font-medium">SKU</th>
                            <th className="p-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.map(v => (
                            <tr key={v.id} className="border-t border-gray-100 hover:bg-gray-50">
                              {colors.length > 0 && (
                                <td className="p-2">
                                  <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-gray-600">{v.color || '-'}</span>
                                </td>
                              )}
                              {sizes.length > 0 && (
                                <td className="p-2">
                                  <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-gray-600">{v.size || '-'}</span>
                                </td>
                              )}
                              <td className="p-2">
                                <input value={v.price} onChange={e => updateVariant(v.id, 'price', e.target.value)}
                                  placeholder="0" type="number"
                                  className="w-20 p-1 border border-gray-200 rounded text-xs text-right focus:border-blue-400 outline-none" />
                              </td>
                              <td className="p-2">
                                <input value={v.oldPrice || ''} onChange={e => updateVariant(v.id, 'oldPrice', e.target.value)}
                                  placeholder="原价" type="number"
                                  className="w-20 p-1 border border-gray-200 rounded text-xs text-right focus:border-blue-400 outline-none" />
                              </td>
                              <td className="p-2">
                                <input value={v.stock} onChange={e => updateVariant(v.id, 'stock', e.target.value)}
                                  placeholder="100" type="number"
                                  className="w-16 p-1 border border-gray-200 rounded text-xs text-right focus:border-blue-400 outline-none" />
                              </td>
                              <td className="p-2">
                                <input value={v.sku || ''} onChange={e => updateVariant(v.id, 'sku', e.target.value)}
                                  placeholder="SKU" maxLength={50}
                                  className="w-24 p-1 border border-gray-200 rounded text-xs focus:border-blue-400 outline-none" />
                              </td>
                              <td className="p-2">
                                <button onClick={() => removeVariant(v.id)}
                                  className="text-red-400 hover:text-red-600 p-1">
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {variants.length === 0 && (colors.length === 0 && sizes.length === 0) && (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      <p>添加颜色/尺码后点击「生成变体表」创建多规格商品</p>
                      <p className="text-xs mt-1">无规格时可填写下方基础价格（单规格模式）</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ===== 第五步：价格与物流 ===== */}
            {variants.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-500 text-white rounded-full text-xs flex items-center justify-center font-bold">5</span>
                  💰 价格设置
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">售价 (₽) <span className="text-red-400">*</span></label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                      placeholder="0"
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">原价 (₽)</label>
                    <input type="number" value={oldPrice} onChange={e => setOldPrice(e.target.value)}
                      placeholder="划线价"
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">折扣 (%)</label>
                    <input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)}
                      placeholder="自动"
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">库存</label>
                    <input type="number" value={stock} onChange={e => setStock(e.target.value)}
                      placeholder="100"
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">重量 (g)</label>
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                      placeholder="200"
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">长×宽×高 (cm)</label>
                    <div className="flex gap-1">
                      <input type="number" value={length} onChange={e => setLength(e.target.value)}
                        placeholder="长" className="w-full p-3 border border-gray-200 rounded-xl text-xs text-center focus:border-blue-400 outline-none" />
                      <input type="number" value={width} onChange={e => setWidth(e.target.value)}
                        placeholder="宽" className="w-full p-3 border border-gray-200 rounded-xl text-xs text-center focus:border-blue-400 outline-none" />
                      <input type="number" value={height} onChange={e => setHeight(e.target.value)}
                        placeholder="高" className="w-full p-3 border border-gray-200 rounded-xl text-xs text-center focus:border-blue-400 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">视频链接</label>
                    <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                      placeholder="视频URL"
                      className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:border-blue-400 outline-none" />
                  </div>
                </div>
              </div>
            )}

            {/* ===== 利润计算（可折叠） ===== */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calculator size={16} className="text-green-500" />
                  <span className="text-sm font-medium text-gray-700">💰 利润计算器</span>
                  {price && <span className="text-xs text-green-600 font-bold">₽{price}</span>}
                </div>
                <span className="text-gray-400 text-sm">{showCalculator ? '收起 ▲' : '展开 ▼'}</span>
              </button>
              {showCalculator && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">供货价 (¥)</label>
                      <input type="number" value={costPrice} onChange={e => setCostPrice(e.target.value)}
                        placeholder="供货价"
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">利润率 (%)</label>
                      <input type="number" value={profitRate} onChange={e => setProfitRate(e.target.value)}
                        placeholder="30"
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">汇率 (1¥=)</label>
                      <input type="number" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)}
                        placeholder="12"
                        className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-blue-400 outline-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={calculateProfit}
                      className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 shadow-sm">
                      📐 计算售价
                    </button>
                    <span className="text-xs text-gray-400">售价 = 供货价 × 汇率 × (1 + 利润率%)</span>
                  </div>
                  {price && (
                    <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center gap-4 text-sm">
                        <span>售价 <strong className="text-green-700 text-base">₽{price}</strong></span>
                        <span className="text-gray-400">|</span>
                        <span>利润 <strong className="text-orange-600">₽{Math.max(0, Math.round(parseFloat(price) - parseFloat(costPrice) * parseFloat(exchangeRate))).toLocaleString()}</strong></span>
                        {discountPercent && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">-{discountPercent}%</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ===== 发布按钮 ===== */}
            <button
              onClick={handlePublish}
              disabled={publishing || !selectedAccount || !title.trim()}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-base font-bold hover:opacity-90 disabled:opacity-40 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2"
            >
              {publishing ? (
                <><RefreshCw size={18} className="animate-spin" /> 发布中...</>
              ) : (
                <>🚀 发布到 OZON</>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center pb-4">
              通过 Seller API 发布，通常 1-3 天 OZON 审核 · 变体商品按规格数量分别生成 SKU
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
