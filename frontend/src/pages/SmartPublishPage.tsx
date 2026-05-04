/**
 * SmartPublishPage - 智能发布页（统一入口）
 * - 全部平台通过下拉菜单切换
 * - 多语言文案生成
 * - Amazon/Shopee/Lazada → 通用保存发布
 * - TikTok/OZON/YouTube → 提示前往独立页面
 */
import React, { useState, useRef } from 'react';
import { api } from '../services/api';

interface PublishForm {
  title: string;
  description: string;
  price: string;
  cost: string;
  profit: string;
  stock: string;
  category: string;
  tags: string;
  images: File[];
  platform: string;
  accountId: string;
  language: string; // 目标语言
}

interface LanguageOption {
  code: string;
  name: string;
  locale: string;
  defaultPlatforms: string[];
}

interface MultiLangContent {
  [lang: string]: {
    title: string;
    description: string;
    features: string[];
    keywords: string[];
  } | null;
}

const CATEGORIES = ['服装', '鞋类', '箱包', '配饰', '家居', '美妆', '母婴', '玩具', '户外', '其他'];
// ★ 全部平台统一下拉
const PLATFORMS = [
  { value: 'tiktok', label: 'TikTok Shop', standalone: true },
  { value: 'ozon', label: 'OZON', standalone: true },
  { value: 'youtube', label: 'YouTube', standalone: true },
  { value: 'amazon', label: 'Amazon', standalone: false },
  { value: 'shopee', label: 'Shopee', standalone: false },
  { value: 'lazada', label: 'Lazada', standalone: false },
];

// 语言/平台映射
const LANG_PLATFORM_MAP: Record<string, string> = {
  amazon: 'en', shopee: 'en', lazada: 'en',
  '1688': 'zh', taobao: 'zh', pdd: 'zh',
  tiktok: 'en', ozon: 'ru', youtube: 'en', // 保留映射供其他页面参考
};

// 支持的语言
const LANGUAGES: LanguageOption[] = [
  { code: 'zh', name: '中文', locale: 'zh-CN', defaultPlatforms: ['amazon'] },
  { code: 'en', name: 'English', locale: 'en-US', defaultPlatforms: ['tiktok', 'amazon', 'shopee', 'lazada', 'youtube'] },
  { code: 'ru', name: 'Русский', locale: 'ru-RU', defaultPlatforms: ['ozon'] },
  { code: 'ja', name: '日本語', locale: 'ja-JP', defaultPlatforms: [] },
];

export default function SmartPublishPage() {
  const [form, setForm] = useState<PublishForm>({
    title: '', description: '', price: '', cost: '', profit: '', stock: '100',
    category: '服装', tags: '', images: [], platform: 'amazon', accountId: '', language: 'en',
  });
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [multiLang, setMultiLang] = useState<MultiLangContent>({});
  const [showLangPanel, setShowLangPanel] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 加载账号列表
  React.useEffect(() => {
    api.accounts.list().then(data => {
      setAccounts(data?.data || data || []);
    }).catch(() => {});
  }, []);

  // 当平台改变时，自动切换目标语言
  React.useEffect(() => {
    const defaultLang = LANG_PLATFORM_MAP[form.platform] || 'en';
    setForm(f => ({ ...f, language: defaultLang }));
  }, [form.platform]);

  // 计算利润
  React.useEffect(() => {
    const p = parseFloat(form.price);
    const c = parseFloat(form.cost);
    if (p && c && p > c) {
      setForm(f => ({ ...f, profit: (p - c).toFixed(2) }));
    }
  }, [form.price, form.cost]);

  function handleImageFiles(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    setForm(f => ({ ...f, images: [...f.images, ...newFiles] }));
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        setPreviewImages(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  }

  // AI生成文案
  async function handleGenerate() {
    if (!form.title && !form.description) {
      setMessage({ type: 'error', text: '请先填写产品名称或描述' });
      return;
    }
    setGenerating(true);
    setMessage(null);
    try {
      const result = await api.generate.text({
        productName: form.title,
        productDescription: form.description,
        platform: form.platform,
        language: form.language,
      });
      if (result?.data?.text) {
        const t = result.data.text;
        setForm(f => ({
          ...f,
          title: t.title || f.title,
          description: t.description || f.description,
          tags: (t.keywords || []).join(', '),
        }));
        // 保存多语言到预览
        setMultiLang(prev => ({
          ...prev,
          [form.language]: { title: t.title, description: t.description, features: t.features || [], keywords: t.keywords || [] }
        }));
        setMessage({ type: 'success', text: `${getLangName(form.language)}文案生成成功！` });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '生成失败' });
    } finally {
      setGenerating(false);
    }
  }

  // 翻译到其他语言
  async function handleTranslate(targetLang: string) {
    if (!form.title) { setMessage({ type: 'error', text: '请先生成文案' }); return; }
    setTranslating(true);
    setMessage(null);
    try {
      const sourceText = {
        title: form.title,
        description: form.description,
        features: [],
        keywords: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      const result = await api.generate.translate({
        text: sourceText,
        sourceLang: 'zh',
        targetLang,
        platform: form.platform,
      });
      if (result?.data?.translated) {
        const t = result.data.translated;
        setMultiLang(prev => ({
          ...prev,
          [targetLang]: { title: t.title, description: t.description, features: t.features || [], keywords: t.keywords || [] }
        }));
        setMessage({ type: 'success', text: `翻译成${getLangName(targetLang)}成功！` });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '翻译失败' });
    } finally {
      setTranslating(false);
    }
  }

  // 切换到某语言的文案预览
  function switchToLang(lang: string) {
    const content = multiLang[lang];
    if (content) {
      setForm(f => ({
        ...f,
        language: lang,
        title: content.title || f.title,
        description: content.description || f.description,
        tags: (content.keywords || []).join(', '),
      }));
    } else {
      setForm(f => ({ ...f, language: lang }));
    }
  }

  function getLangName(code: string) {
    return LANGUAGES.find(l => l.code === code)?.name || code;
  }

  // 发布
  async function handlePublish() {
    if (!form.title) { setMessage({ type: 'error', text: '请填写产品标题' }); return; }
    if (!form.price) { setMessage({ type: 'error', text: '请填写售价' }); return; }
    if (form.images.length === 0) { setMessage({ type: 'error', text: '请至少上传一张图片' }); return; }

    setPublishing(true);
    setMessage(null);
    try {
      // 保存产品到数据库
      const product = await api.products.create({
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        cost: parseFloat(form.cost) || 0,
        category: form.category,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        images: previewImages,
        stock: parseInt(form.stock) || 100,
        platform: form.platform,
        language: form.language,
      });

      const account = accounts.find(a => a.id === form.accountId);

      // 有独立页面的平台 → 提示跳转
      const standalonePlatform = PLATFORMS.find(p => p.value === form.platform);
      if (standalonePlatform?.standalone) {
        const routes: Record<string, string> = {
          tiktok: '/tiktok-publish',
          ozon: '/ozon-publish',
          youtube: '/youtube',
        };
        const route = routes[form.platform];
        setMessage({
          type: 'success',
          text: `产品已保存。${standalonePlatform.label} 有独立发布页面，${route ? `请前往 ${route} 使用完整功能` : '请从导航栏进入'}`,
        });
      } else {
        // 通用平台：保存到数据库
        setMessage({ type: 'success', text: `产品已保存（ID: ${product?.id || product?.data?.id}）${account ? `，关联: ${account.name}` : ''}` });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '发布失败，请重试' });
    } finally {
      setPublishing(false);
    }
  }

  const filteredAccounts = accounts.filter(a => !form.platform || form.platform === 'all' || a.platform === form.platform);

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🛍️ 智能发布</h2>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 20,
          background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: message.type === 'success' ? '#059669' : '#dc2626',
          border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
        }}>
          {message.text}
        </div>
      )}

      {/* 基础信息 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📦 产品信息</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="产品名称 *" required>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="输入中文名称，AI自动翻译" style={inputStyle} />
          </FormField>
          <FormField label="产品类别">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="售价 (USD) *" required>
            <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              placeholder="19.99" step="0.01" min="0" style={inputStyle} />
          </FormField>
          <FormField label="成本 (CNY)">
            <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
              placeholder="45.00" step="0.01" min="0" style={inputStyle} />
          </FormField>
          <FormField label="预计利润 (USD)">
            <input value={form.profit} readOnly placeholder="自动计算" style={{ ...inputStyle, background: '#f9fafb', color: '#059669', fontWeight: 600 }} />
          </FormField>
          <FormField label="库存">
            <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
              placeholder="100" min="1" style={inputStyle} />
          </FormField>
        </div>
        <div style={{ marginTop: 16 }}>
          <FormField label="产品描述">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="产品详细描述（AI将自动优化并翻译）..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </FormField>
        </div>
        <div style={{ marginTop: 16 }}>
          <FormField label="Tags / 关键词">
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="kids, dress, summer" style={inputStyle} />
          </FormField>
        </div>

        {/* 语言选择和AI生成 */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginRight: 8 }}>目标语言：</label>
            <select value={form.language} onChange={e => switchToLang(e.target.value)} style={{
              padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14
            }}>
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.name} ({l.locale})</option>
              ))}
            </select>
          </div>
          <button onClick={handleGenerate} disabled={generating}
            style={{ padding: '10px 20px', background: generating ? '#9ca3af' : '#8b5cf6',
              color: '#fff', border: 'none', borderRadius: 8, cursor: generating ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            {generating ? '🤖 生成中...' : `✨ AI生成${getLangName(form.language)}文案`}
          </button>
          <button onClick={() => setShowLangPanel(!showLangPanel)}
            style={{ padding: '10px 20px', background: '#fff', color: '#374151',
              border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            🌐 多语言 {showLangPanel ? '收起' : '展开'}
          </button>
        </div>

        {/* 多语言翻译面板 */}
        {showLangPanel && (
          <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>多语言翻译</h4>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {LANGUAGES.filter(l => l.code !== form.language).map(lang => (
                <div key={lang.code} style={{
                  flex: '1 1 180px', padding: 12, borderRadius: 8, background: multiLang[lang.code] ? '#ecfdf5' : '#fff',
                  border: `1px solid ${multiLang[lang.code] ? '#6ee7b7' : '#e5e7eb'}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    {lang.name}
                  </div>
                  {multiLang[lang.code] ? (
                    <div style={{ fontSize: 12, color: '#059669' }}>✅ 已翻译</div>
                  ) : (
                    <button onClick={() => handleTranslate(lang.code)} disabled={translating}
                      style={{ fontSize: 12, padding: '4px 10px', background: translating ? '#9ca3af' : '#6366f1',
                        color: '#fff', border: 'none', borderRadius: 4, cursor: translating ? 'not-allowed' : 'pointer' }}>
                      {translating ? '翻译中...' : '翻译到此语言'}
                    </button>
                  )}
                  {multiLang[lang.code] && (
                    <button onClick={() => switchToLang(lang.code)}
                      style={{ fontSize: 12, padding: '4px 10px', marginLeft: 6, background: '#374151',
                        color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                      预览
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 图片上传 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🖼️ 产品图片 {form.images.length > 0 && `(${form.images.length}张)`}</h3>

        {previewImages.length === 0 && (
          <div style={{ border: '2px dashed #d1d5db', borderRadius: 12, padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
            <div>点击下方按钮上传产品图片</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>支持 JPG/PNG/WebP，单张不超过 5MB</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, marginTop: 16 }}>
          {previewImages.map((src, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '1' }}>
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
              <button onClick={() => removeImage(i)} style={{
                position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>×</button>
              {i === 0 && <div style={{ position: 'absolute', bottom: 4, left: 4, background: '#6366f1', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>主图</div>}
            </div>
          ))}
        </div>

        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
          onChange={e => handleImageFiles(e.target.files)} />
        <button onClick={() => fileRef.current?.click()} style={{
          marginTop: 16, padding: '10px 20px', background: '#fff', color: '#374151',
          border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontWeight: 600
        }}>
          ➕ 添加图片
        </button>
      </div>

      {/* 发布设置 */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 16, border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🚀 发布设置</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FormField label="发布平台">
            <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} style={inputStyle}>
              {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </FormField>
          <FormField label="店铺账号">
            <select value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))} style={inputStyle}>
              <option value="">-- 选择账号 --</option>
              {filteredAccounts.map(a => (
                <option key={a.id} value={a.id}>{a.platform?.toUpperCase()} - {a.account_name || a.name}</option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* 发布按钮 */}
      <button onClick={handlePublish} disabled={publishing} style={{
        width: '100%', padding: '14px', background: publishing ? '#9ca3af' : '#059669',
        color: '#fff', border: 'none', borderRadius: 10, cursor: publishing ? 'not-allowed' : 'pointer',
        fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
      }}>
        {publishing ? '⏳ 发布中，请勿关闭...' : '🚀 立即发布'}
      </button>
    </div>
  );
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #d1d5db',
  borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
