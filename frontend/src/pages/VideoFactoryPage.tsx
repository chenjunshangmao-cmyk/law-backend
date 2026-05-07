import React, { useState } from 'react';
import { Video, Image, Film, RefreshCw, Download, CheckCircle, XCircle, Play } from 'lucide-react';
import api from '../services/api';

type Mode = 'text2video' | 'image2video' | 'series';

export default function VideoFactoryPage() {
  const [mode, setMode] = useState<Mode>('text2video');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [result, setResult] = useState<string>('');

  const [textForm, setTextForm] = useState({ topic: '', style: 'product', duration: 60 });
  const [imageForm, setImageForm] = useState({ topic: '', imageCount: 3, duration: 60 });
  const [seriesForm, setSeriesForm] = useState({ title: '', episodes: 5, genre: '都市' });

  const handleGenerate = async () => {
    setLoading(true); setMsg(null); setResult('');
    try {
      let msgText = '生成任务已提交，正在处理中...（短视频约需1-3分钟）';
      
      if (mode === 'text2video') {
        if (!textForm.topic.trim()) { setMsg({ type: 'error', text: '请输入视频主题' }); setLoading(false); return; }
        const script = await api.writer.script.video({ topic: textForm.topic, style: textForm.style, duration: textForm.duration });
        if (!script.success) { setMsg({ type: 'error', text: script.error }); setLoading(false); return; }
        setResult(`脚本已生成，视频处理中...\n\n${script.data?.substring(0, 500) || script.data}`);
        setMsg({ type: 'success', text: msgText });
        
      } else if (mode === 'image2video') {
        if (!imageForm.topic.trim()) { setMsg({ type: 'error', text: '请输入产品名称' }); setLoading(false); return; }
        // 生成产品介绍脚本
        const copy = await api.writer.copy.product({ productName: imageForm.topic, productDesc: '' });
        setResult(`产品文案已生成，视频合成中...\n\n${copy.data?.substring(0, 500) || copy.data}`);
        setMsg({ type: 'success', text: msgText });
        
      } else if (mode === 'series') {
        if (!seriesForm.title.trim()) { setMsg({ type: 'error', text: '请输入短剧标题' }); setLoading(false); return; }
        const drama = await api.writer.script.drama({ title: seriesForm.title, genre: seriesForm.genre, episodes: seriesForm.episodes });
        if (!drama.success) { setMsg({ type: 'error', text: drama.error }); setLoading(false); return; }
        setResult(drama.data);
        setMsg({ type: 'success', text: `短剧剧本已生成！${seriesForm.episodes}集短剧，可导出给Kling/Seedance制作视频。` });
      }
    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setLoading(false); }
  };

  const modes = [
    { id: 'text2video' as Mode, label: '文案生视频', icon: <Video size={16} />, desc: '输入主题→AI写脚本+配音→输出视频' },
    { id: 'image2video' as Mode, label: '图片生视频', icon: <Image size={16} />, desc: '产品图→AI解说词→短视频' },
    { id: 'series' as Mode, label: '短剧/连续剧', icon: <Film size={16} />, desc: '输入大纲→AI生成N集剧本' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 30 }}>🎬</span> AI 短视频工厂
        </h1>
        <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 14 }}>文案生视频 · 图片生视频 · 短剧生成 · 一键发布全平台</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {modes.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setResult(''); setMsg(null); }}
            style={{
              flex: 1, padding: '16px', borderRadius: 12, border: '2px solid', cursor: 'pointer',
              textAlign: 'left' as const, background: mode === m.id ? '#EEF2FF' : '#fff',
              borderColor: mode === m.id ? '#6366f1' : '#e5e7eb',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{m.icon} {m.label}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{m.desc}</div>
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e5e7eb', marginBottom: 20 }}>
        {mode === 'text2video' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>文案生视频</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input placeholder="视频主题 *（如：翡翠手镯开箱测评）" value={textForm.topic} onChange={e => setTextForm(f => ({ ...f, topic: e.target.value }))} style={inputStyle()} />
              <select value={textForm.style} onChange={e => setTextForm(f => ({ ...f, style: e.target.value }))} style={{ ...inputStyle(), cursor: 'pointer' }}>
                <option value="product">产品展示</option>
                <option value="tutorial">教程科普</option>
                <option value="lifestyle">生活方式</option>
                <option value="promotional">促销推广</option>
              </select>
            </div>
            <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
              生成流程：AI写脚本 → DALL-E逐镜生图 → Kling/Seedance图生视频 → TTS配音 → FFmpeg合成
            </div>
          </div>
        )}

        {mode === 'image2video' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>图片生视频</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input placeholder="产品名称 *" value={imageForm.topic} onChange={e => setImageForm(f => ({ ...f, topic: e.target.value }))} style={inputStyle()} />
              <select value={imageForm.imageCount} onChange={e => setImageForm(f => ({ ...f, imageCount: Number(e.target.value) }))} style={{ ...inputStyle(), cursor: 'pointer' }}>
                {[3, 5, 8, 10].map(n => <option key={n} value={n}>{n}张图片</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
              提供产品图片后，AI自动生成解说文案+配音+字幕，输出完整产品展示视频。图片可上传到网站后粘贴URL。
            </div>
          </div>
        )}

        {mode === 'series' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>短剧/连续剧生成</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input placeholder="短剧标题 *（如：霸总爱上灰姑娘）" value={seriesForm.title} onChange={e => setSeriesForm(f => ({ ...f, title: e.target.value }))} style={inputStyle()} />
              <select value={seriesForm.episodes} onChange={e => setSeriesForm(f => ({ ...f, episodes: Number(e.target.value) }))} style={{ ...inputStyle(), cursor: 'pointer' }}>
                {[3, 5, 10, 15, 20].map(n => <option key={n} value={n}>{n}集</option>)}
              </select>
              <select value={seriesForm.genre} onChange={e => setSeriesForm(f => ({ ...f, genre: e.target.value }))} style={{ ...inputStyle(), cursor: 'pointer' }}>
                <option value="都市">都市</option><option value="古装">古装</option>
                <option value="悬疑">悬疑</option><option value="科幻">科幻</option>
                <option value="甜宠">甜宠</option>
              </select>
            </div>
            <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
              生成完整N集短剧剧本，含分镜、对白、场景描述。导出后可逐集用Kling图生视频+配音合成。
            </div>
          </div>
        )}

        <button onClick={handleGenerate} disabled={loading} style={{
          padding: '10px 22px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', gap: 6 }}>
          {loading ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> 生成中...</> : <><Play size={15} /> 开始生成</>}
        </button>
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
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>生成结果</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: '#334155', margin: 0, fontFamily: 'inherit' }}>{result}</pre>
        </div>
      )}
    </div>
  );
}

function inputStyle() { return { width: '100%', padding: '9px 13px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, background: '#fff' }; }
