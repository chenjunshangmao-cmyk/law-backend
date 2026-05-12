/**
 * AIToolsPage v2 — AI 电商设计工具箱
 * 参考美图设计室(designkit.cn) + 淘宝/天猫/拼多多/抖音电商场景
 * 
 * 功能：
 *   电商套图：商品套图 | A+详情页 | AI商品图 | 爆款复刻
 *   图片处理：智能抠图 | 去水印 | 智能消除 | 变清晰 | 批处理
 *   AI内容：  AI海报 | AI文案
 */
import React, { useState, useRef, useCallback } from 'react';
import api from '../services/api';
import {
  Upload, Download, Scissors, Eraser, Brush, Image as ImageIcon,
  RefreshCw, AlertTriangle, Grid3X3, FileText, Palette, Camera,
  Layers, Zap, Sparkles, Copy, Wand2, MessageSquare, Film,
} from 'lucide-react';

// ═══════════════════════════════════════════
// 工具定义
// ═══════════════════════════════════════════
const TOOL_CATEGORIES = [
  {
    id: 'ecommerce',
    name: '电商套图',
    tools: [
      { key: 'product-kit', icon: Grid3X3, name: '商品套图', desc: '一键生成主图+副图+白底图+轮播图', color: '#534AB7', badge: '热门', badgeColor: '#A32D2D', badgeBg: '#FCEBEB' },
      { key: 'detail-page', icon: FileText, name: 'A+详情页', desc: '智能生成淘宝/天猫详情页图文排版', color: '#0F6E56', badge: '新增' },
      { key: 'ai-product-img', icon: Camera, name: 'AI商品图', desc: '上传产品自动生成白底图+场景图', color: '#185FA5', badge: '新增' },
      { key: 'hot-clone', icon: Wand2, name: '爆款复刻', desc: '参考爆款图AI生成同风格产品图', color: '#D4537E', badge: '新增' },
    ],
  },
  {
    id: 'image',
    name: '图片处理',
    tools: [
      { key: 'remove-bg', icon: Scissors, name: '智能抠图', desc: '一键去除背景保留主体(WASM本地)', color: '#534AB7' },
      { key: 'remove-watermark', icon: Brush, name: '去水印', desc: 'AI智能移除水印/文字/LOGO', color: '#BA7517' },
      { key: 'smart-erase', icon: Eraser, name: '智能消除', desc: '涂抹区域AI自动填充修复', color: '#0F6E56' },
      { key: 'enhance', icon: Zap, name: '变清晰', desc: '低分辨率图片AI增强至4K', color: '#185FA5', badge: '新增' },
      { key: 'batch', icon: Layers, name: '批处理', desc: '批量抠图/加水印/改尺寸50张', color: '#BA7517', badge: '新增' },
    ],
  },
  {
    id: 'content',
    name: 'AI内容',
    tools: [
      { key: 'ai-poster', icon: Palette, name: 'AI海报', desc: '活动促销+店铺装修海报生成', color: '#D85A30', badge: '新增' },
      { key: 'ai-copy', icon: MessageSquare, name: 'AI文案', desc: '标题优化+卖点+详情描述+脚本', color: '#3B6D11', badge: '新增' },
    ],
  },
];

// ═══════════════════════════════════════════
// AI文案模板
// ═══════════════════════════════════════════
const COPY_TEMPLATES = [
  { key: 'title', name: '标题优化', desc: '淘宝/拼多多搜索标题生成', icon: '🔤', prompt: '为以下产品生成5个高转化电商标题，包含核心关键词、卖点词、长尾词，每个标题30字内。产品信息：' },
  { key: 'selling', name: '卖点提炼', desc: '5点核心卖点+痛点+解决方案', icon: '💎', prompt: '为产品提炼5个核心卖点，每个卖点包含：痛点→解决方案→效果。要口语化、打动人心。产品信息：' },
  { key: 'detail', name: '详情描述', desc: 'A+级详情页文案+排版建议', icon: '📝', prompt: '撰写产品详情页文案，包含：场景引入→产品参数→核心卖点→使用效果→售后保障。产品信息：' },
  { key: 'script', name: '短视频脚本', desc: '带货/测评/开箱视频脚本', icon: '🎬', prompt: '写一个30秒带货短视频脚本，包含：开头钩子(3秒)→产品展示→效果演示→成交话术。产品信息：' },
];

// ═══════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════
export default function AIToolsPage() {
  const [activeTab, setActiveTab] = useState('ecommerce');
  const [activeTool, setActiveTool] = useState('product-kit');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // 涂抹
  const [brushSize, setBrushSize] = useState(30);
  const [erasePoints, setErasePoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // AI文案
  const [copyProduct, setCopyProduct] = useState('');
  const [copyTemplate, setCopyTemplate] = useState('title');
  const [copyResult, setCopyResult] = useState('');
  const [copyGenerating, setCopyGenerating] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) { setError('请选择图片文件'); return; }
    if (f.size > 20 * 1024 * 1024) { setError('图片不能超过20MB'); return; }
    setError(''); setFile(f); setResultUrl(''); setErasePoints([]);
    setPreviewUrl(URL.createObjectURL(f));
  }, []);

  // 后端处理 - 增强错误处理
  const processWithBackend = async (action: string, extra?: (fd: FormData) => void) => {
    if (!file) return;
    setProcessing(true); setError(''); setInfo('云端AI处理中（约10-30秒）...');
    const fd = new FormData(); fd.append('image', file);
    if (extra) extra(fd);
    try {
      const res = await api.aiTools.process(action, fd);
      const d = res.data; // d = { result, format, note } (authFetch已剥掉外层structure)
      // ★ 修复：res.success 才是成功标志，d 是内层data
      if (res.success && d?.result) {
        try {
          const bytes = new Uint8Array(atob(d.result).split('').map(c => c.charCodeAt(0)));
          const blob = new Blob([bytes], { type: `image/${d.format || 'png'}` });
          if (blob.size < 50) throw new Error('结果图片异常（过小）');
          setResultUrl(URL.createObjectURL(blob));
        } catch (decodeErr: any) {
          console.error('Base64解码失败:', decodeErr.message);
          setError('图片解码失败: ' + decodeErr.message);
          if (file) setResultUrl(URL.createObjectURL(file));
          setInfo('已返回原图，请重试');
        }
        if (d.note) setInfo(d.note); else setInfo('处理完成');
      } else {
        setError(d?.error || res.error || '处理失败，请重试');
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) setError('登录已过期，请重新登录');
      else if (status === 413) setError('图片过大，请压缩后重试（最大20MB）');
      else if (e?.message?.includes('Network') || e?.message?.includes('timeout')) setError('网络超时，请检查连接后重试');
      else setError('云处理失败: ' + (e?.response?.data?.error || e.message || '未知错误'));
      // 降级返回原图
      if (file) setResultUrl(URL.createObjectURL(file));
      setInfo('已返回原图');
    }
    finally { setProcessing(false); }
  };

  // 智能抠图(WASM) - 增强错误处理和降级
  const removeBackground = async () => {
    if (!file) return;
    setProcessing(true); setError(''); setProgress(0); setInfo('正在加载AI模型...');
    try {
      const { removeBackground: doRemove } = await import('@imgly/background-removal');
      let blob: Blob = file;

      // 处理大图：超过3MB先压缩
      if (file.size > 3 * 1024 * 1024) {
        setInfo('压缩大图中...');
        const bmp = await createImageBitmap(file, { resizeWidth: 1200, resizeHeight: 1200, resizeQuality: 'high' });
        const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
        c.getContext('2d')!.drawImage(bmp, 0, 0);
        blob = await new Promise(r => c.toBlob(r!, 'image/png', 0.85)); bmp.close();
      }

      setInfo('AI抠图中（首次需下载约40MB模型）...');
      // ★ 修复：用安全回调包装 progress，防止回调异常导致整个抠图失败
      let lastProgress = 0;
      const resultBlob = await doRemove(blob, {
        progress: (key: string, cur: number, tot: number) => {
          try {
            if (tot > 0) {
              const pct = Math.round((cur / tot) * 100);
              if (pct !== lastProgress) {
                lastProgress = pct;
                setProgress(pct);
              }
            }
            setInfo(`AI抠图中... ${cur}/${tot}`);
          } catch {
            // 回调异常不应该中断抠图流程
          }
        },
        model: 'medium', output: { format: 'image/png', quality: 1 },
      });
      // ★ 验证结果是否为有效图像
      if (resultBlob && resultBlob.size > 100) {
        setResultUrl(URL.createObjectURL(resultBlob));
        setInfo('抠图完成');
        setProgress(0);
      } else {
        throw new Error('抠图结果异常（文件过小），请尝试更换图片');
      }
    } catch (e: any) {
      const msg = e.message || '未知错误';
      if (msg.includes('model')) {
        setError('AI模型下载失败，请检查网络后刷新重试（需下载约40MB模型文件）');
      } else if (msg.includes('memory') || msg.includes('WASM') || msg.includes('out of')) {
        setError('图片过大导致内存不足，请尝试使用小于3MB的图片');
      } else if (msg.includes('abort') || msg.includes('AbortError')) {
        setError('操作已取消或超时，请重试');
      } else {
        setError('抠图失败: ' + msg);
      }
      // 降级：返回原图
      if (file) setResultUrl(URL.createObjectURL(file));
      setInfo('已返回原图，可尝试更换图片或使用其他工具');
    }
    finally { setProcessing(false); setProgress(0); }
  };

  const handleProcess = () => {
    switch (activeTool) {
      case 'remove-bg': removeBackground(); break;
      case 'remove-watermark': processWithBackend('remove-watermark'); break;
      case 'smart-erase':
        if (erasePoints.length === 0) { setError('请先涂抹要消除的区域'); return; }
        processWithBackend('smart-erase', fd => { fd.append('maskPoints', JSON.stringify(erasePoints)); fd.append('brushSize', String(brushSize)); });
        break;
      case 'enhance': processWithBackend('enhance'); break;
      case 'batch': processWithBackend('batch'); break;
      case 'product-kit': processWithBackend('product-kit'); break;
      case 'detail-page': processWithBackend('detail-page'); break;
      case 'ai-product-img': processWithBackend('ai-product-img'); break;
      case 'hot-clone': processWithBackend('hot-clone'); break;
      case 'ai-poster': processWithBackend('ai-poster'); break;
    }
  };

  // AI文案生成
  const generateCopy = async () => {
    if (!copyProduct.trim()) { setError('请输入产品信息'); return; }
    setCopyGenerating(true); setError(''); setCopyResult('');
    const tpl = COPY_TEMPLATES.find(t => t.key === copyTemplate)!;
    try {
      const res = await api.aiTools.generateCopy({ product: copyProduct, template: copyTemplate, prompt: tpl.prompt });
      setCopyResult(res.data?.data?.copy || res.data?.copy || '生成失败，请重试');
    } catch (e: any) { setError('文案生成失败: ' + (e?.response?.data?.error || e.message)); }
    finally { setCopyGenerating(false); }
  };

  const reset = () => { setFile(null); setPreviewUrl(''); setResultUrl(''); setError(''); setInfo(''); setErasePoints([]); setProgress(0); };

  // 涂抹
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current, img = imgRef.current; if (!c || !img) return null;
    const r = c.getBoundingClientRect();
    return { x: Math.round((e.clientX - r.left) * (img.naturalWidth / r.width)), y: Math.round((e.clientY - r.top) * (img.naturalHeight / r.height)) };
  };

  const tools = TOOL_CATEGORIES.flatMap(c => c.tools);
  const currentTool = tools.find(t => t.key === activeTool)!;
  const isEraseTool = activeTool === 'smart-erase';
  const isCopyTool = activeTool === 'ai-copy';

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* ═══ Header ═══ */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          🤖 AI 电商设计工具箱
          <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 12, background: '#EEEDFE', color: '#534AB7' }}>
            11个工具
          </span>
        </h2>
        <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
          专为淘宝/天猫/拼多多/抖音电商打造 · 商品图+详情页+海报+文案一站式AI生成
        </p>
      </div>

      {/* ═══ 分类标签 ═══ */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {TOOL_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => { setActiveTab(cat.id); setActiveTool(cat.tools[0].key); reset(); }}
            style={{
              padding: '8px 18px', borderRadius: 8, border: activeTab === cat.id ? '2px solid #534AB7' : '1px solid #e5e7eb',
              background: activeTab === cat.id ? '#EEEDFE' : '#fff', cursor: 'pointer',
              fontWeight: activeTab === cat.id ? 600 : 400, fontSize: 14, color: activeTab === cat.id ? '#534AB7' : '#374151',
              transition: 'all 0.2s',
            }}>{cat.name}</button>
        ))}
      </div>

      {/* ═══ 工具卡片 ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 20 }}>
        {TOOL_CATEGORIES.find(c => c.id === activeTab)?.tools.map(t => (
          <div key={t.key} onClick={() => { setActiveTool(t.key); reset(); }}
            style={{
              padding: 14, borderRadius: 10, cursor: 'pointer',
              border: activeTool === t.key ? `2px solid ${t.color}` : '1px solid #e5e7eb',
              background: activeTool === t.key ? `${t.color}0A` : '#fff',
              transition: 'all 0.15s', position: 'relative',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${t.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <t.icon size={18} color={t.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>{t.desc}</div>
              </div>
            </div>
            {t.badge && (
              <span style={{
                position: 'absolute', top: 8, right: 8, fontSize: 10, fontWeight: 500,
                padding: '1px 7px', borderRadius: 8,
                background: t.badgeColor ? `${t.badgeColor}15` : '#EAF3DE',
                color: t.badgeColor || '#3B6D11',
              }}>{t.badge}</span>
            )}
          </div>
        ))}
      </div>

      {/* ═══ AI文案模式 ═══ */}
      {isCopyTool && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 24, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={20} color="#3B6D11" /> AI智能文案生成
          </h3>

          {/* 模板选择 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
            {COPY_TEMPLATES.map(t => (
              <button key={t.key} onClick={() => { setCopyTemplate(t.key); setCopyResult(''); }}
                style={{
                  padding: '12px 10px', borderRadius: 8, border: copyTemplate === t.key ? '2px solid #3B6D11' : '1px solid #e5e7eb',
                  background: copyTemplate === t.key ? '#EAF3DE' : '#f9fafb', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.desc}</div>
              </button>
            ))}
          </div>

          {/* 输入区 */}
          <textarea value={copyProduct} onChange={e => setCopyProduct(e.target.value)}
            placeholder="输入产品信息：产品名称、材质、规格、价格、适用人群、核心卖点..."
            rows={3}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical', marginBottom: 12, boxSizing: 'border-box' }} />

          <button onClick={generateCopy} disabled={copyGenerating || !copyProduct.trim()}
            style={{
              padding: '10px 28px', borderRadius: 8, background: '#3B6D11', color: '#fff', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, opacity: copyGenerating ? 0.6 : 1,
            }}>
            {copyGenerating ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
            {copyGenerating ? '生成中...' : '生成文案'}
          </button>

          {/* 结果 */}
          {copyResult && (
            <div style={{ marginTop: 16, padding: 16, background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>生成结果</span>
                <button onClick={() => { navigator.clipboard.writeText(copyResult); setInfo('已复制'); setTimeout(() => setInfo(''), 2000); }}
                  style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Copy size={14} /> 复制
                </button>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.8, color: '#374151', margin: 0, fontFamily: 'inherit' }}>{copyResult}</pre>
            </div>
          )}
        </div>
      )}

      {/* ═══ 图片处理工作区 ═══ */}
      {!isCopyTool && (
        <div style={{ display: 'grid', gridTemplateColumns: previewUrl ? '1fr 1fr' : '1fr', gap: 16 }}>
          {/* 上传区 */}
          <div style={{
            background: '#fff', borderRadius: 14, border: '2px dashed #d1d5db', padding: 30,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 380, position: 'relative', overflow: 'hidden',
          }}>
            {!previewUrl ? (
              <>
                <Upload size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: '0 0 4px 0' }}>{currentTool.name}</p>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 6 }}>{currentTool.desc}</p>
                <p style={{ fontSize: 12, color: '#d1d5db', marginBottom: 16 }}>支持 JPG / PNG / WebP，最大 20MB</p>
                <button onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '10px 28px', borderRadius: 8, background: currentTool.color, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  上传图片
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </>
            ) : (
              <div style={{ width: '100%', position: 'relative' }}>
                <img ref={imgRef} src={previewUrl} alt="preview" style={{ width: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 8 }} />
                {isEraseTool && (
                  <canvas ref={canvasRef} onMouseDown={e => { setIsDrawing(true); const pt = getCoords(e); if (pt) setErasePoints(prev => [...prev, pt]); }}
                    onMouseMove={e => { if (!isDrawing) return; const pt = getCoords(e); if (pt) setErasePoints(prev => [...prev, pt]); }}
                    onMouseUp={() => setIsDrawing(false)} onMouseLeave={() => setIsDrawing(false)}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'crosshair', borderRadius: 8 }} />
                )}
                {isEraseTool && (
                  <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 12 }}>
                    <span>涂抹消除 · {erasePoints.length}个点</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>笔刷:</span>
                      <input type="range" min="10" max="60" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} style={{ width: 80 }} />
                      <span>{brushSize}px</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 结果区 */}
          {previewUrl && (
            <div style={{ background: '#fff', borderRadius: 14, border: '2px solid #e5e7eb', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 380 }}>
              {processing ? (
                <div style={{ textAlign: 'center' }}>
                  <RefreshCw size={36} color={currentTool.color} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                  <p style={{ fontSize: 15, fontWeight: 600 }}>处理中...</p>
                  {progress > 0 && (
                    <div style={{ width: 200, height: 6, background: '#e5e7eb', borderRadius: 3, margin: '10px auto' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: currentTool.color, borderRadius: 3, transition: 'width 0.3s' }} />
                    </div>
                  )}
                  {info && <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>{info}</p>}
                </div>
              ) : resultUrl ? (
                <>
                  <img src={resultUrl} alt="result" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8, marginBottom: 16 }} />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <a href={resultUrl} download={activeTool + '.png'}
                      style={{ padding: '8px 20px', background: '#10b981', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Download size={16} /> 下载
                    </a>
                    <button onClick={reset} style={{ padding: '8px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                      重新上传
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <ImageIcon size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
                  <p style={{ color: '#9ca3af', marginBottom: 20, fontSize: 13 }}>{currentTool.desc}</p>
                  <button onClick={handleProcess} disabled={isEraseTool && erasePoints.length === 0}
                    style={{
                      padding: '10px 28px', background: currentTool.color, color: '#fff', border: 'none', borderRadius: 8,
                      cursor: isEraseTool && erasePoints.length === 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto',
                      opacity: isEraseTool && erasePoints.length === 0 ? 0.5 : 1,
                    }}>
                    <currentTool.icon size={18} /> {currentTool.name}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} color="#dc2626" /> <span style={{ color: '#dc2626', fontSize: 13 }}>{error}</span>
        </div>
      )}
      {info && !processing && (
        <div style={{ marginTop: 12, padding: '10px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 13, color: '#166534' }}>{info}</div>
      )}

      {/* 底部说明 */}
      <div style={{ marginTop: 24, padding: 14, background: '#f9fafb', borderRadius: 10, fontSize: 12, color: '#6b7280', lineHeight: 1.8 }}>
        <strong>💡 提示：</strong> 智能抠图在浏览器本地完成（WASM）。商品套图/A+详情页/AI海报/爆款复刻由AI云端处理（DeepSeek+多模型）。AI文案支持标题优化、卖点提炼、详情描述、短视频脚本4种模板。
      </div>
    </div>
  );
}
