/**
 * SmartPublishPage - 智能发布页
 * Bug2 修复：图片上传和发布功能
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
}

const CATEGORIES = ['服装', '鞋类', '箱包', '配饰', '家居', '美妆', '母婴', '玩具', '户外', '其他'];
const PLATFORMS = [
  { value: 'tiktok', label: 'TikTok Shop' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'ozon', label: 'OZON' },
  { value: 'all', label: '全平台' },
];

export default function SmartPublishPage() {
  const [form, setForm] = useState<PublishForm>({
    title: '', description: '', price: '', cost: '', profit: '', stock: '100',
    category: '服装', tags: '', images: [], platform: 'tiktok', accountId: '',
  });
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // 加载账号列表
  React.useEffect(() => {
    api.accounts.list().then(data => {
      setAccounts(data?.data || data || []);
    }).catch(() => {});
  }, []);

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
    // 生成预览
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

  async function handleGenerate() {
    if (!form.title && !form.description) {
      setMessage({ type: 'error', text: '请先填写产品名称或描述' });
      return;
    }
    setGenerating(true);
    setMessage(null);
    try {
      const result = await api.generate.text({
        prompt: `为以下产品生成英文标题和描述，用于跨境电商上架：${form.title} ${form.description}。类别：${form.category}`,
        type: 'product_description',
        language: 'en',
      });
      if (result?.data) {
        setForm(f => ({
          ...f,
          title: result.data.title || f.title,
          description: result.data.description || f.description,
          tags: result.data.tags || f.tags,
        }));
        setMessage({ type: 'success', text: 'AI文案生成成功！' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '生成失败' });
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish() {
    if (!form.title) { setMessage({ type: 'error', text: '请填写产品标题' }); return; }
    if (!form.price) { setMessage({ type: 'error', text: '请填写售价' }); return; }
    if (form.images.length === 0) { setMessage({ type: 'error', text: '请至少上传一张图片' }); return; }

    setPublishing(true);
    setMessage(null);
    try {
      // 先保存产品到数据库
      const product = await api.products.create({
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        cost: parseFloat(form.cost) || 0,
        category: form.category,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        images: previewImages,
        stock: parseInt(form.stock) || 100,
      });

      // 调用浏览器自动化发布
      const accountEmail = accounts.find(a => a.id === form.accountId)?.account_data?.email || '';
      if (form.platform === 'tiktok' && accountEmail) {
        const result = await api.browser.tiktok.publish({
          email: accountEmail,
          title: form.title,
          description: form.description,
          price: parseFloat(form.price),
          stock: parseInt(form.stock) || 100,
          images: form.images.map(f => f.name),
          accountId: form.accountId,
        });
        if (result.success) {
          setMessage({ type: 'success', text: `发布成功！产品已保存并推送到 TikTok Shop` });
        } else if (result.needLogin) {
          setMessage({ type: 'error', text: 'TikTok 账号未登录，请先在"店铺账号"页面添加并登录' });
        } else {
          setMessage({ type: 'error', text: result.error || '发布失败' });
        }
      } else {
        setMessage({ type: 'success', text: `产品已保存（ID: ${product?.id || product?.data?.id}），请前往店铺账号页面手动发布` });
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
              placeholder="如: Kids Fashion Summer Dress 2026" style={inputStyle} />
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
              placeholder="产品详细描述（AI将自动优化）..." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
          </FormField>
        </div>
        <div style={{ marginTop: 16 }}>
          <FormField label="Tags（用逗号分隔）">
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="kids, dress, summer, fashion" style={inputStyle} />
          </FormField>
        </div>

        <button onClick={handleGenerate} disabled={generating}
          style={{ marginTop: 16, padding: '10px 20px', background: generating ? '#9ca3af' : '#8b5cf6',
            color: '#fff', border: 'none', borderRadius: 8, cursor: generating ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
          {generating ? '🤖 AI生成中...' : '✨ AI生成/优化文案'}
        </button>
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
