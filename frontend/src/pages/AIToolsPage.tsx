/**
 * AIToolsPage - AI 图像工具箱
 * 会员付费后可使用：智能抠图 / 图片去水印 / 智能消除
 */
import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, Scissors, Eraser, Brush, Image as ImageIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../services/api';

type Tool = 'remove-bg' | 'remove-watermark' | 'smart-erase';

const TOOLS: { key: Tool; icon: React.ElementType; name: string; desc: string; color: string }[] = [
  { key: 'remove-bg', icon: Scissors, name: '智能抠图', desc: '一键去除背景，保留主体', color: '#6366f1' },
  { key: 'remove-watermark', icon: Brush, name: '图片去水印', desc: 'AI 智能移除水印/文字', color: '#f59e0b' },
  { key: 'smart-erase', icon: Eraser, name: '智能消除', desc: '涂抹区域，AI 自动填充修复', color: '#10b981' },
];

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool>('remove-bg');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 涂抹坐标（智能消除用）
  const [brushSize, setBrushSize] = useState(30);
  const [erasePoints, setErasePoints] = useState<{x:number;y:number}[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('image/')) { setError('请选择图片文件'); return; }
    if (f.size > 20 * 1024 * 1024) { setError('图片不能超过 20MB'); return; }
    setError('');
    setFile(f);
    setResultUrl('');
    setErasePoints([]);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  }, []);

  // ====== 智能抠图 (浏览器端 WASM) ======
  const removeBackground = async () => {
    if (!file) return;
    setProcessing(true); setError(''); setProgress(0);
    try {
      const { removeBackground: doRemove } = await import('@imgly/background-removal');
      
      // 小图直接用，大图先缩放
      let blob: Blob = file;
      if (file.size > 5 * 1024 * 1024) {
        const bmp = await createImageBitmap(file, { resizeWidth: 1200, resizeHeight: 1200, resizeQuality: 'high' });
        const c = document.createElement('canvas');
        c.width = bmp.width; c.height = bmp.height;
        c.getContext('2d')!.drawImage(bmp, 0, 0);
        blob = await new Promise(r => c.toBlob(r, 'image/png'));
        bmp.close();
      }

      const resultBlob = await doRemove(blob, {
        progress: (key: string, current: number, total: number) => {
          setProgress(Math.round((current / total) * 100));
          setInfo(`模型下载中... ${current}/${total}`);
        },
        model: 'medium',
        output: { format: 'image/png', quality: 1 },
      });

      const url = URL.createObjectURL(resultBlob);
      setResultUrl(url); setInfo('');
    } catch (e: any) {
      if (e?.message?.includes('model')) {
        setError('模型加载失败，请刷新页面重试（首次使用需下载约 40MB 模型）');
      } else {
        setError('抠图失败: ' + (e.message || '未知错误'));
      }
    } finally { setProcessing(false); setProgress(0); }
  };

  // ====== 图片去水印 / 智能消除（后端处理）======
  const processImage = async (action: 'remove-watermark' | 'smart-erase') => {
    if (!file) return;
    setProcessing(true); setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      if (action === 'smart-erase') {
        formData.append('maskPoints', JSON.stringify(erasePoints));
        formData.append('brushSize', String(brushSize));
      }

      const res = await api.aiTools.process(action, formData);
      
      if (res?.data?.resultUrl) {
        setResultUrl(res.data.resultUrl);
      } else if (res?.data?.result) {
        // base64 result
        const byteStr = atob(res.data.result);
        const byteArr = new Uint8Array(byteStr.length);
        for (let i = 0; i < byteStr.length; i++) byteArr[i] = byteStr.charCodeAt(i);
        const blob = new Blob([byteArr], { type: 'image/png' });
        setResultUrl(URL.createObjectURL(blob));
      } else {
        setError('处理失败，未返回结果');
      }
    } catch (e: any) {
      setError(e.message || '处理失败');
    } finally { setProcessing(false); }
  };

  const handleProcess = () => {
    if (activeTool === 'remove-bg') removeBackground();
    else processImage(activeTool);
  };

  // Canvas 涂抹
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current; if (!c) return null;
    const rect = c.getBoundingClientRect();
    const img = imgRef.current; if (!img) return null;
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    return { x: Math.round((e.clientX - rect.left) * scaleX), y: Math.round((e.clientY - rect.top) * scaleY) };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'smart-erase') return;
    setIsDrawing(true);
    const pt = getCanvasCoords(e); if (pt) setErasePoints(prev => [...prev, pt]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== 'smart-erase') return;
    const pt = getCanvasCoords(e); if (pt) setErasePoints(prev => [...prev, pt]);
  };

  const handleCanvasMouseUp = () => { setIsDrawing(false); };

  // 重置
  const handleReset = () => {
    setFile(null); setPreviewUrl(''); setResultUrl(''); setError(''); setInfo('');
    setErasePoints([]); setProgress(0);
  };

  // 结果展示
  const currentTool = TOOLS.find(t => t.key === activeTool)!;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🤖 AI 图像工具箱</h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
        会员专属 AI 图像处理工具 · 本地处理不消耗额度
      </p>

      {/* 工具选择 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {TOOLS.map(t => (
          <button key={t.key} onClick={() => { setActiveTool(t.key); setResultUrl(''); setErasePoints([]); }}
            style={{
              padding: '10px 18px', borderRadius: 10, border: `2px solid ${activeTool === t.key ? t.color : '#e5e7eb'}`,
              background: activeTool === t.key ? `${t.color}10` : '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14,
              transition: 'all 0.2s',
            }}
          >
            <t.icon size={18} color={t.color} /> {t.name}
          </button>
        ))}
      </div>

      {/* 主区域 */}
      <div style={{ display: 'grid', gridTemplateColumns: previewUrl ? '1fr 1fr' : '1fr', gap: 16 }}>
        {/* 上传区域 */}
        <div style={{
          background: '#fff', borderRadius: 14, border: '2px dashed #d1d5db', padding: 30,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 360, position: 'relative', overflow: 'hidden',
        }}>
          {!previewUrl ? (
            <>
              <Upload size={48} color="#9ca3af" style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>上传图片</p>
              <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>支持 JPG / PNG / WebP，最大 20MB</p>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ padding: '10px 28px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                选择文件
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </>
          ) : (
            <div style={{ width: '100%', position: 'relative' }}>
              <img ref={imgRef} src={previewUrl} alt="preview" style={{ width: '100%', maxHeight: 500, objectFit: 'contain', borderRadius: 8 }} />
              
              {/* 涂抹层（智能消除模式） */}
              {activeTool === 'smart-erase' && (
                <canvas ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    cursor: 'crosshair', borderRadius: 8,
                  }}
                />
              )}

              {/* 涂抹提示 */}
              {activeTool === 'smart-erase' && (
                <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>
                  ✏️ 涂抹要消除的区域 · 笔刷大小: {brushSize}px
                </div>
              )}
            </div>
          )}
        </div>

        {/* 结果区域 */}
        {previewUrl && (
          <div style={{
            background: '#fff', borderRadius: 14, border: '2px solid #e5e7eb', padding: 20,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 360,
          }}>
            {processing ? (
              <div style={{ textAlign: 'center' }}>
                <RefreshCw size={36} color="#6366f1" style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <p style={{ fontSize: 15, fontWeight: 600 }}>处理中...</p>
                {progress > 0 && (
                  <div style={{ width: 200, height: 6, background: '#e5e7eb', borderRadius: 3, margin: '10px auto' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: '#6366f1', borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                )}
                {info && <p style={{ fontSize: 12, color: '#888', marginTop: 6 }}>{info}</p>}
              </div>
            ) : resultUrl ? (
              <>
                <img src={resultUrl} alt="result" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8, marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <a href={resultUrl} download="result.png"
                    style={{ padding: '8px 20px', background: '#10b981', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Download size={16} /> 下载结果
                  </a>
                  <button onClick={handleReset}
                    style={{ padding: '8px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                    重新上传
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <ImageIcon size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
                <p style={{ color: '#9ca3af', marginBottom: 16 }}>{currentTool.desc}</p>
                <button onClick={handleProcess}
                  style={{ padding: '10px 28px', background: currentTool.color, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
                  <currentTool.icon size={18} /> {currentTool.name}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} color="#dc2626" /> <span style={{ color: '#dc2626', fontSize: 13 }}>{error}</span>
        </div>
      )}

      {/* 底部说明 */}
      <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 10, fontSize: 12, color: '#6b7280' }}>
        <strong>💡 提示：</strong> 智能抠图在浏览器本地完成，图片不会上传服务器。去水印和智能消除需要上传处理，处理完自动删除。
      </div>
    </div>
  );
}
