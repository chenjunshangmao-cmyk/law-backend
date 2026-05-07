import React, { useState } from 'react';
import { BookOpen, FileText, Megaphone, RefreshCw, Copy, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

type Tab = 'novel' | 'script' | 'copy';

export default function WriterPage() {
  const [tab, setTab] = useState<Tab>('copy');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 文案表单
  const [copyForm, setCopyForm] = useState({ productName: '', productDesc: '', type: 'marketing' });

  // 脚本表单
  const [scriptForm, setScriptForm] = useState({ productName: '', productDesc: '', scriptType: 'live' });

  // 小说表单
  const [novelForm, setNovelForm] = useState({ title: '', genre: '都市情感', synopsis: '', chapters: 10, action: 'outline' });

  const handleCopyGen = async () => {
    if (!copyForm.productName.trim()) { setMsg({ type: 'error', text: '请输入产品名称' }); return; }
    setLoading(true); setMsg(null); setResult('');
    try {
      const fn = copyForm.type === 'marketing' ? api.writer.copy.marketing : api.writer.copy.product;
      const res = await fn({ productName: copyForm.productName, productDesc: copyForm.productDesc });
      if (res.success) { setResult(res.data); setMsg({ type: 'success', text: '生成成功！' }); }
      else setMsg({ type: 'error', text: res.error });
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setLoading(false); }
  };

  const handleScriptGen = async () => {
    if (!scriptForm.productName.trim()) { setMsg({ type: 'error', text: '请输入内容' }); return; }
    setLoading(true); setMsg(null); setResult('');
    try {
      const fn = scriptForm.scriptType === 'live' ? api.writer.script.live : scriptForm.scriptType === 'video' ? api.writer.script.video : api.writer.script.drama;
      const res = await fn({ 
        ...(scriptForm.scriptType === 'video' ? { topic: scriptForm.productName } : { productName: scriptForm.productName }),
        productDesc: scriptForm.productDesc 
      });
      if (res.success) { setResult(res.data); setMsg({ type: 'success', text: '生成成功！' }); }
      else setMsg({ type: 'error', text: res.error });
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setLoading(false); }
  };

  const handleNovelGen = async () => {
    if (!novelForm.title.trim()) { setMsg({ type: 'error', text: '请输入小说标题' }); return; }
    setLoading(true); setMsg(null); setResult('');
    try {
      let res;
      if (novelForm.action === 'outline') {
        res = await api.writer.novel.outline({ title: novelForm.title, genre: novelForm.genre, synopsis: novelForm.synopsis, chapters: novelForm.chapters });
      } else {
        setMsg({ type: 'success', text: '正在逐章生成，可能需要2-5分钟...' });
        res = await api.writer.novel.full({ title: novelForm.title, genre: novelForm.genre, synopsis: novelForm.synopsis, chapterCount: novelForm.chapters });
      }
      if (res.success) { 
        setResult(typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2)); 
        setMsg({ type: 'success', text: '生成成功！' }); 
      }
      else setMsg({ type: 'error', text: res.error });
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setLoading(false); }
  };

  const tabs = [
    { id: 'copy' as Tab, label: '营销文案', icon: <Megaphone size={16} /> },
    { id: 'script' as Tab, label: '脚本生成', icon: <FileText size={16} /> },
    { id: 'novel' as Tab, label: '小说创作', icon: <BookOpen size={16} /> },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 30 }}>✍️</span> AI 文案工厂
        </h1>
        <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 14 }}>AI生成营销文案 · 直播脚本 · 短剧剧本 · 长篇小说</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setResult(''); setMsg(null); }}
            style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid', cursor: 'pointer',
              fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              background: tab === t.id ? '#8b5cf6' : '#fff',
              color: tab === t.id ? '#fff' : '#64748b',
              borderColor: tab === t.id ? '#8b5cf6' : '#e5e7eb',
            }}>{t.icon} {t.label}</button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e5e7eb', marginBottom: 20 }}>
        {tab === 'copy' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>营销文案生成</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input placeholder="产品名称 *" value={copyForm.productName} onChange={e => setCopyForm(f => ({ ...f, productName: e.target.value }))}
                style={inputStyle()} />
              <select value={copyForm.type} onChange={e => setCopyForm(f => ({ ...f, type: e.target.value }))} style={{ ...inputStyle(), cursor: 'pointer' }}>
                <option value="marketing">全平台营销文案</option>
                <option value="product">电商详情页描述</option>
              </select>
            </div>
            <textarea placeholder="产品卖点描述（可选）" value={copyForm.productDesc} onChange={e => setCopyForm(f => ({ ...f, productDesc: e.target.value }))}
              rows={2} style={textareaStyle()} />
            <button onClick={handleCopyGen} disabled={loading} style={btnStyle(loading)}>
              {loading ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> 生成中...</> : '生成文案'}
            </button>
          </div>
        )}

        {tab === 'script' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>脚本生成</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input placeholder="产品名称/主题 *" value={scriptForm.productName} onChange={e => setScriptForm(f => ({ ...f, productName: e.target.value }))}
                style={inputStyle()} />
              <select value={scriptForm.scriptType} onChange={e => setScriptForm(f => ({ ...f, scriptType: e.target.value }))} style={{ ...inputStyle(), cursor: 'pointer' }}>
                <option value="live">直播脚本</option>
                <option value="video">短视频脚本</option>
                <option value="drama">短剧剧本</option>
              </select>
            </div>
            <textarea placeholder="产品卖点描述（可选）" value={scriptForm.productDesc} onChange={e => setScriptForm(f => ({ ...f, productDesc: e.target.value }))}
              rows={2} style={textareaStyle()} />
            <button onClick={handleScriptGen} disabled={loading} style={btnStyle(loading)}>
              {loading ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> 生成中...</> : '生成脚本'}
            </button>
          </div>
        )}

        {tab === 'novel' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>小说创作</h2>
            <input placeholder="小说标题 *" value={novelForm.title} onChange={e => setNovelForm(f => ({ ...f, title: e.target.value }))}
              style={{ ...inputStyle(), marginBottom: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <select value={novelForm.genre} onChange={e => setNovelForm(f => ({ ...f, genre: e.target.value }))} style={{ ...inputStyle(), cursor: 'pointer' }}>
                <option value="都市情感">都市情感</option><option value="玄幻奇幻">玄幻奇幻</option>
                <option value="悬疑推理">悬疑推理</option><option value="古代言情">古代言情</option>
                <option value="科幻未来">科幻未来</option><option value="现实题材">现实题材</option>
              </select>
              <select value={novelForm.chapters} onChange={e => setNovelForm(f => ({ ...f, chapters: Number(e.target.value) }))} style={{ ...inputStyle(), cursor: 'pointer' }}>
                {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n}章</option>)}
              </select>
              <select value={novelForm.action} onChange={e => setNovelForm(f => ({ ...f, action: e.target.value }))} style={{ ...inputStyle(), cursor: 'pointer' }}>
                <option value="outline">先出大纲</option>
                <option value="full">直接写全书</option>
              </select>
            </div>
            <textarea placeholder="故事简介（可选，越详细越好）" value={novelForm.synopsis} onChange={e => setNovelForm(f => ({ ...f, synopsis: e.target.value }))}
              rows={3} style={textareaStyle()} />
            <button onClick={handleNovelGen} disabled={loading} style={btnStyle(loading)}>
              {loading ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> 创作中...</> : '开始创作'}
            </button>
          </div>
        )}
      </div>

      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
          background: msg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: msg.type === 'success' ? '#16a34a' : '#dc2626',
          border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          {msg.type === 'success' ? <CheckCircle size={14} style={{ display: 'inline', marginRight: 6 }} /> : <XCircle size={14} style={{ display: 'inline', marginRight: 6 }} />}
          {msg.text}
        </div>
      )}

      {result && (
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>生成结果</h3>
            <button onClick={() => { navigator.clipboard.writeText(result); }} style={{
              padding: '4px 12px', background: 'none', border: '1px solid #e5e7eb', borderRadius: 6,
              cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: '#64748b' }}>
              <Copy size={12} /> 复制
            </button>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: '#334155', margin: 0, fontFamily: 'inherit' }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}

function inputStyle() { return { width: '100%', padding: '9px 13px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, background: '#fff' }; }
function textareaStyle() { return { ...inputStyle(), marginBottom: 14, resize: 'vertical' as const, fontFamily: 'inherit' }; }
function btnStyle(loading: boolean) { return { padding: '10px 22px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }; }
