/**
 * AiContentPage - AI智能图文
 * - AI 识别图片 + 批量文案生成 + AI生图
 * - 本地保存图文内容
 * - 图文库：查看/复制/下载已保存内容
 */
import React, { useState, useEffect } from 'react';
import api from '../services/api';

// ===== 常量 =====
const COPY_STYLES = [
  { value: '种草', label: '✨ 种草推荐' },
  { value: '测评', label: '🔍 真实测评' },
  { value: '日常', label: '🌸 日常分享' },
  { value: '带货', label: '🛒 好物带货' },
];

const IMG_STYLES = [
  { value: 'product', label: '📷 产品白底' },
  { value: 'lifestyle', label: '🏠 生活场景' },
  { value: 'flatlay', label: '📊 平铺摆拍' },
  { value: 'model', label: '👩 模特上身' },
  { value: 'detail', label: '🔍 细节特写' },
  { value: 'aesthetic', label: '✨ 氛围感' },
];

interface SavedContent {
  id: string;
  title: string;
  content: string;
  tags: string[];
  images: string[]; // base64
  createdAt: string;
  source: string; // 'ai' | 'manual'
}

const STORAGE_KEY = 'claw_ai_content_library';

// ===== 工具函数 =====
function loadLibrary(): SavedContent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}
function saveLibrary(items: SavedContent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function downloadImage(base64: string, filename: string) {
  const a = document.createElement('a');
  a.href = base64;
  a.download = filename;
  a.click();
}
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export default function AiContentPage() {
  // Tab
  const [tab, setTab] = useState<'generate' | 'library'>('generate');

  // AI生成区域
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [productName, setProductName] = useState('');
  const [imageDesc, setImageDesc] = useState(''); // 用户对生图方向的自定义描述

  // AI 状态
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalyzingCopy, setAiAnalyzingCopy] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<any>(null);
  const [copyStyle, setCopyStyle] = useState('种草');
  const [imgStyle, setImgStyle] = useState('product');
  const [copyPlans, setCopyPlans] = useState<any[]>([]);
  const [selectedCopyIdx, setSelectedCopyIdx] = useState(-1);
  const [genCount, setGenCount] = useState(3);

  // 消息
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // 图文库
  const [library, setLibrary] = useState<SavedContent[]>(loadLibrary);
  const [searchText, setSearchText] = useState('');

  useEffect(() => { saveLibrary(library); }, [library]);

  // ===== AI 功能 =====
  async function handleAnalyze() {
    if (images.length === 0) { setMessage({ type: 'error', text: '请先上传图片' }); return; }
    setAiAnalyzing(true);
    try {
      const result = await api.xiaohongshu.ai.analyzeImage(images[0]);
      if (result?.success) {
        setImageAnalysis(result.data);
        setProductName(result.data.productName || '');
        setMessage({ type: 'success', text: `识别完成：${result.data.productName || '商品'}` });
      } else throw new Error(result?.error || '识别失败');
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
    finally { setAiAnalyzing(false); }
  }

  async function handleGenerateMulti() {
    setAiAnalyzingCopy(true);
    setMessage({ type: 'info', text: '✍️ AI 生成4种风格文案...' });
    try {
      const result = await api.xiaohongshu.ai.generateMultiContent({
        imageDescription: imageAnalysis?.description || '',
        productName: productName || title || '商品',
        extraInfo: [imageAnalysis?.features?.join('、'), imageDesc || ''].filter(Boolean).join(' | ') || '',
      });
      if (result?.success && result?.data?.plans) {
        setCopyPlans(result.data.plans);
        setMessage({ type: 'success', text: '✅ 已生成4种风格文案，点击选择' });
      } else throw new Error(result?.error || '生成失败');
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
    finally { setAiAnalyzingCopy(false); }
  }

  async function handleTextToImage() {
    if (!productName && !title) { setMessage({ type: 'error', text: '请先输入产品名称' }); return; }
    setAiGenerating(true);
    setMessage({ type: 'info', text: '🎨 AI 生成图片中...' });
    const newImgs: string[] = [];
    try {
      for (let i = 0; i < genCount; i++) {
        const prompt = `${productName || title} ${imgStyle} product photo——${imageDesc || 'high quality professional commercial photography'}`;
        const result = await api.xiaohongshu.ai.textToImage({ prompt, style: imgStyle });
        if (result?.success && result?.data?.url) {
          try {
            const resp = await fetch(result.data.url);
            const blob = await resp.blob();
            const b64 = await new Promise<string>(r => { const rd = new FileReader(); rd.onloadend = () => r(rd.result as string); rd.readAsDataURL(blob); });
            newImgs.push(b64);
          } catch { newImgs.push(result.data.url); }
        }
      }
      if (newImgs.length > 0) {
        setImages(prev => [...prev, ...newImgs]);
        setMessage({ type: 'success', text: `✅ 生成 ${newImgs.length} 张图片` });
      } else throw new Error('未生成有效图片');
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
    finally { setAiGenerating(false); }
  }

  async function handleImageToImage() {
    if (images.length === 0) { setMessage({ type: 'error', text: '请先上传图片' }); return; }
    setAiGenerating(true);
    setMessage({ type: 'info', text: '🎨 AI 风格迁移中...' });
    try {
      const result = await api.xiaohongshu.ai.imageToImage({ imageBase64: images[0], style: imgStyle as any });
      if (result?.success && result?.data?.url) {
        try {
          const resp = await fetch(result.data.url);
          const blob = await resp.blob();
          const b64 = await new Promise<string>(r => { const rd = new FileReader(); rd.onloadend = () => r(rd.result as string); rd.readAsDataURL(blob); });
          setImages(prev => [...prev, b64]);
        } catch { setImages(prev => [...prev, result.data.url]); }
        setMessage({ type: 'success', text: '✅ 风格迁移完成' });
      } else throw new Error(result?.error || '失败');
    } catch (e: any) { setMessage({ type: 'error', text: e.message }); }
    finally { setAiGenerating(false); }
  }

  function selectCopyPlan(idx: number) {
    setSelectedCopyIdx(idx);
    const plan = copyPlans[idx];
    if (plan) {
      setTitle(plan.title || '');
      setContent(plan.content || '');
      if (plan.tags) setTags(Array.isArray(plan.tags) ? plan.tags.join(' ') : plan.tags);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files; if (!files) return;
    const base64s = await Promise.all(Array.from(files).map(fileToBase64));
    setImages(prev => [...prev, ...base64s].slice(0, 9));
  }

  function removeImage(i: number) { setImages(prev => prev.filter((_, j) => j !== i)); }

  // ===== 保存 =====
  function handleSave() {
    if (!title && !content && images.length === 0) {
      setMessage({ type: 'error', text: '请先生成或填写内容' }); return;
    }
    const item: SavedContent = {
      id: Date.now().toString(),
      title: title || '未命名',
      content: content || '',
      tags: tags.split(/[,\s#]+/).filter(Boolean),
      images: images.filter(i => i.startsWith('data:')),
      createdAt: new Date().toISOString(),
      source: 'ai',
    };
    setLibrary(prev => [item, ...prev]);
    setMessage({ type: 'success', text: '✅ 已保存到图文库' });
  }

  function handleDelete(id: string) {
    setLibrary(prev => prev.filter(i => i.id !== id));
  }

  // ===== 样式 =====
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
  const btnStyle = (color: string): React.CSSProperties => ({ padding: '8px 16px', background: color, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 });
  const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e5e7eb', marginBottom: 16 };
  const disabledBtn = (color: string) => ({ ...btnStyle(color), opacity: 0.5, cursor: 'not-allowed' });

  return (
    <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🤖 AI 智能图文</h2>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>上传图片 → AI生成文案+配图 → 保存到本地图文库</p>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { key: 'generate', label: '✨ AI 生成' },
          { key: 'library', label: `📚 图文库 (${library.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            style={{ padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: tab === t.key ? '#8b5cf6' : '#f3f4f6', color: tab === t.key ? '#fff' : '#374151' }}>
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: message.type === 'success' ? '#ecfdf5' : '#fef2f2', color: message.type === 'success' ? '#059669' : '#dc2626', fontSize: 13 }}>
          {message.text}
        </div>
      )}

      {/* ========== AI 生成 Tab ========== */}
      {tab === 'generate' && (
        <>
          {/* 上传图片区域 */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>📷 上传产品图片</h3>
            <label style={{ display: 'inline-block', padding: '10px 20px', background: '#8b5cf6', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
              📁 选择图片
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            <span style={{ marginLeft: 10, fontSize: 13, color: '#9ca3af' }}>支持多选，最多9张</span>

            {images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: 2, right: 2, width: 22, height: 22, borderRadius: 11, border: 'none', background: 'rgba(0,0,0,0.5)', color: '#fff', cursor: 'pointer', fontSize: 12 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI 操作面板 */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🧠 AI 操作</h3>

            {/* Step 1: 识别 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Step 1 · 识别图片</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={handleAnalyze} disabled={aiAnalyzing} style={aiAnalyzing ? disabledBtn('#8b5cf6') : btnStyle('#8b5cf6')}>
                  {aiAnalyzing ? '🔄 识别中...' : '🔍 识别图片'}
                </button>
                <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="或手动输入产品名称" style={{ ...inputStyle, flex: 1 }} />
              </div>
              {imageAnalysis && (
                <div style={{ marginTop: 8, padding: 8, background: '#f0fdf4', borderRadius: 6, fontSize: 12 }}>
                  ✅ {imageAnalysis.productName} | {imageAnalysis.category} | {(imageAnalysis.features || []).join('、')}
                </div>
              )}
            </div>

            {/* Step 2: 批量文案 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Step 2 · 批量生成文案</p>
              <button onClick={handleGenerateMulti} disabled={aiAnalyzingCopy} style={aiAnalyzingCopy ? disabledBtn('#10b981') : btnStyle('#10b981')}>
                {aiAnalyzingCopy ? '🔄 生成中...' : '✍️ 生成4种文案'}
              </button>
              {copyPlans.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginTop: 10 }}>
                  {copyPlans.map((plan, i) => (
                    <div key={i} onClick={() => selectCopyPlan(i)}
                      style={{ padding: 10, borderRadius: 8, cursor: 'pointer', border: selectedCopyIdx === i ? '2px solid #8b5cf6' : '1px solid #e5e7eb', background: selectedCopyIdx === i ? '#f5f3ff' : '#fff' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{COPY_STYLES[i]?.label || plan.style || `方案${i + 1}`}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', maxHeight: 60, overflow: 'hidden' }}>{plan.content?.substring(0, 80)}...</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: AI 生图 */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Step 3 · AI 配图</p>
              <div style={{ marginBottom: 8 }}>
                <input value={imageDesc} onChange={e => setImageDesc(e.target.value)}
                  placeholder="描述你想要的效果，例如：白色背景、暖色调、柔光、俯拍、近景特写..."
                  style={{ ...inputStyle, fontSize: 12 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={imgStyle} onChange={e => setImgStyle(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}>
                  {IMG_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <input type="number" min={1} max={8} value={genCount} onChange={e => setGenCount(Number(e.target.value))} style={{ width: 50, padding: '6px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, textAlign: 'center' }} />
                <span style={{ fontSize: 12, color: '#9ca3af' }}>张</span>
                <button onClick={handleTextToImage} disabled={aiGenerating} style={aiGenerating ? disabledBtn('#f59e0b') : btnStyle('#f59e0b')}>
                  {aiGenerating ? '🔄 生成中...' : '🎨 文生图'}
                </button>
                <button onClick={handleImageToImage} disabled={aiGenerating || images.length === 0} style={(aiGenerating || images.length === 0) ? disabledBtn('#ec4899') : btnStyle('#ec4899')}>
                  {aiGenerating ? '🔄 迁移中...' : '🖼️ 风格迁移'}
                </button>
              </div>
            </div>
          </div>

          {/* 编辑区域 */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>✏️ 编辑内容</h3>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 4 }}>标题（≤20字）</label>
              <input value={title} onChange={e => setTitle(e.target.value)} maxLength={20} placeholder="输入标题" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 4 }}>正文</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="输入正文内容" style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 4 }}>标签（用空格或逗号分隔）</label>
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="#标签1 #标签2" style={inputStyle} />
            </div>
            <button onClick={handleSave} style={btnStyle('#059669')}>💾 保存到图文库</button>
          </div>
        </>
      )}

      {/* ========== 图文库 Tab ========== */}
      {tab === 'library' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索标题或内容..." style={{ ...inputStyle, flex: 1 }} />
            {library.length > 0 && (
              <button onClick={() => { if (confirm('确定清空全部？')) setLibrary([]); }} style={btnStyle('#ef4444')}>🗑️ 清空</button>
            )}
          </div>

          {library.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
              📭 还没有保存的图文，去「AI生成」创建吧
            </div>
          )}

          {library.filter(i => !searchText || i.title.includes(searchText) || i.content.includes(searchText)).map(item => (
            <div key={item.id} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{item.title}</h4>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>
                    {new Date(item.createdAt).toLocaleString()} · {item.images.length}张图 · {item.content.length}字
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { copyToClipboard(`标题：${item.title}\n\n${item.content}\n\n${item.tags.map(t => '#' + t).join(' ')}`); setMessage({ type: 'success', text: '已复制文案' }); }} style={btnStyle('#6b7280')}>📋 复制</button>
                  <button onClick={() => handleDelete(item.id)} style={btnStyle('#ef4444')}>🗑️</button>
                </div>
              </div>

              {item.content && (
                <div style={{ fontSize: 13, color: '#374151', background: '#f9fafb', padding: 10, borderRadius: 8, marginBottom: 10, whiteSpace: 'pre-wrap' }}>
                  {item.content}
                </div>
              )}

              {item.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                  {item.tags.map((t, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '2px 8px', background: '#ede9fe', color: '#7c3aed', borderRadius: 10 }}>#{t}</span>
                  ))}
                </div>
              )}

              {item.images.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {item.images.map((img, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={img} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      <button onClick={() => downloadImage(img, `claw_${item.title}_${i + 1}.jpg`)}
                        style={{ position: 'absolute', bottom: 4, right: 4, padding: '3px 8px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>
                        ⬇
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
