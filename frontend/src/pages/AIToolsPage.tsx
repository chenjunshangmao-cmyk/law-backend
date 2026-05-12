/**
 * AIToolsPage - AI 图像工具箱
 * 纯前端处理：智能抠图（@imgly/background-removal）/ 图片去水印 / 智能消除（Canvas）
 */
import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, Scissors, Eraser, Brush, Image as ImageIcon, RefreshCw, AlertTriangle } from 'lucide-react';

type Tool = 'remove-bg' | 'remove-watermark' | 'smart-erase';

const TOOLS: { key: Tool; icon: React.ElementType; name: string; desc: string; color: string }[] = [
  { key: 'remove-bg', icon: Scissors, name: '智能抠图', desc: '一键去除背景，保留主体', color: '#6366f1' },
  { key: 'remove-watermark', icon: Brush, name: '图片去水印', desc: 'AI 智能移除水印/文字', color: '#f59e0b' },
  { key: 'smart-erase', icon: Eraser, name: '智能消除', desc: '涂抹区域，AI 自动填充修复', color: '#10b981' },
];

// ====== 纯前端去水印 ======
function removeWatermark(imageData: ImageData, selection?: { x: number; y: number; w: number; h: number }): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  // 确定处理区域：如果用户选了区域只处理该区域，否则全图
  const sx = selection ? Math.max(0, selection.x) : 0;
  const sy = selection ? Math.max(0, selection.y) : 0;
  const sw = selection ? Math.min(width - sx, selection.w) : width;
  const sh = selection ? Math.min(height - sy, selection.h) : height;

  // Telea inpainting 简化版：对每个像素，用周围已知像素加权平均填充
  // 检测"水印候选"：高亮度、低饱和度的区域（常见水印特征）
  const isWatermark = (idx: number): boolean => {
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const minRGB = Math.min(r, g, b);
    const maxRGB = Math.max(r, g, b);
    const saturation = maxRGB === 0 ? 0 : (maxRGB - minRGB) / maxRGB;
    // 水印特征：亮度高（>180），饱和度低（<0.3），或者纯白接近色
    return luminance > 180 && saturation < 0.3;
  };

  // 标记所有水印像素
  const watermarkPixels = new Set<number>();
  for (let y = sy; y < sy + sh; y++) {
    for (let x = sx; x < sx + sw; x++) {
      const idx = (y * width + x) * 4;
      if (isWatermark(idx)) {
        watermarkPixels.add(y * width + x);
      }
    }
  }

  // 对水印像素做修复（从近到远传播颜色）
  const getPixel = (px: number, py: number): [number, number, number, number] | null => {
    if (px < 0 || px >= width || py < 0 || py >= height) return null;
    const idx = (py * width + px) * 4;
    return [output[idx], output[idx + 1], output[idx + 2], output[idx + 3]];
  };

  const paintPixel = (px: number, py: number, color: [number, number, number, number]) => {
    const idx = (py * width + px) * 4;
    output[idx] = color[0];
    output[idx + 1] = color[1];
    output[idx + 2] = color[2];
    output[idx + 3] = color[3];
  };

  // 多次迭代修复
  const MAX_ITERATIONS = 3;
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const toFix: Array<{ x: number; y: number; color: [number, number, number, number] }> = [];

    for (const key of watermarkPixels) {
      const y = Math.floor(key / width);
      const x = key % width;

      // 检查周围8个方向是否有非水印像素
      let count = 0;
      let sumR = 0, sumG = 0, sumB = 0, sumA = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const neighborKey = (y + dy) * width + (x + dx);
          if (!watermarkPixels.has(neighborKey)) {
            const px = getPixel(x + dx, y + dy);
            if (px) {
              // 距离越近权重大
              const weight = 1 / (Math.abs(dx) + Math.abs(dy));
              sumR += px[0] * weight;
              sumG += px[1] * weight;
              sumB += px[2] * weight;
              sumA += (px[3] ?? 255) * weight;
              count += weight;
            }
          }
        }
      }

      if (count > 0) {
        toFix.push({
          x, y,
          color: [
            Math.round(sumR / count),
            Math.round(sumG / count),
            Math.round(sumB / count),
            Math.round(sumA / count),
          ],
        });
      }
    }

    // 应用修复
    for (const fix of toFix) {
      paintPixel(fix.x, fix.y, fix.color);
      watermarkPixels.delete(fix.y * width + fix.x);
    }

    if (toFix.length === 0) break;
  }

  return new ImageData(output, width, height);
}

// ====== 纯前端智能消除 ======
function smartErase(
  imageData: ImageData,
  erasePoints: Array<{ x: number; y: number }>,
  brushSize: number
): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  // 为每个涂抹点创建一个圆形遮罩
  const maskSet = new Set<number>();
  for (const pt of erasePoints) {
    const radius = brushSize / 2;
    for (let dy = -Math.ceil(radius); dy <= Math.ceil(radius); dy++) {
      for (let dx = -Math.ceil(radius); dx <= Math.ceil(radius); dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          const px = Math.round(pt.x + dx);
          const py = Math.round(pt.y + dy);
          if (px >= 0 && px < width && py >= 0 && py < height) {
            maskSet.add(py * width + px);
          }
        }
      }
    }
  }

  // 用近邻像素修复（同去水印算法）
  const getPixel = (px: number, py: number): [number, number, number, number] | null => {
    if (px < 0 || px >= width || py < 0 || py >= height) return null;
    const idx = (py * width + px) * 4;
    return [output[idx], output[idx + 1], output[idx + 2], output[idx + 3]];
  };

  const neighbors = [
    [-1, -1, 0.5], [0, -1, 1], [1, -1, 0.5],
    [-1, 0, 1],                [1, 0, 1],
    [-1, 1, 0.5],  [0, 1, 1],  [1, 1, 0.5],
  ];

  for (let iter = 0; iter < 5; iter++) {
    const toFix: Array<{ key: number; color: [number, number, number, number] }> = [];

    for (const key of maskSet) {
      const py = Math.floor(key / width);
      const px = key % width;

      let count = 0;
      let sumR = 0, sumG = 0, sumB = 0, sumA = 0;

      for (const [dx, dy, weight] of neighbors) {
        const nk = (py + dy) * width + (px + dx);
        if (!maskSet.has(nk)) {
          const px2 = getPixel(px + dx, py + dy);
          if (px2) {
            sumR += px2[0] * weight;
            sumG += px2[1] * weight;
            sumB += px2[2] * weight;
            sumA += (px2[3] ?? 255) * weight;
            count += weight;
          }
        }
      }

      if (count > 0) {
        toFix.push({
          key,
          color: [
            Math.round(sumR / count),
            Math.round(sumG / count),
            Math.round(sumB / count),
            Math.round(sumA / count),
          ],
        });
      }
    }

    for (const fix of toFix) {
      const idx = fix.key * 4;
      output[idx] = fix.color[0];
      output[idx + 1] = fix.color[1];
      output[idx + 2] = fix.color[2];
      output[idx + 3] = fix.color[3];
      maskSet.delete(fix.key);
    }

    if (toFix.length === 0) break;
  }

  return new ImageData(output, width, height);
}

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<Tool>('remove-bg');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // 涂抹坐标（智能消除用）
  const [brushSize, setBrushSize] = useState(30);
  const [erasePoints, setErasePoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ====== 纯前端去水印 ======
  const handleRemoveWatermark = () => {
    if (!file || !imgRef.current) return;
    setProcessing(true); setError('');

    try {
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = removeWatermark(imageData);
      ctx.putImageData(result, 0, 0);

      canvas.toBlob(blob => {
        if (blob) {
          setResultUrl(URL.createObjectURL(blob));
        } else {
          setError('处理失败');
        }
        setProcessing(false);
      }, 'image/png');
    } catch (e: any) {
      setError('去水印失败: ' + (e.message || '未知错误'));
      setProcessing(false);
    }
  };

  // ====== 纯前端智能消除 ======
  const handleSmartErase = () => {
    if (!file || !imgRef.current || erasePoints.length === 0) {
      setError('请先涂抹要消除的区域');
      return;
    }
    setProcessing(true); setError('');

    try {
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = smartErase(imageData, erasePoints, brushSize);
      ctx.putImageData(result, 0, 0);

      canvas.toBlob(blob => {
        if (blob) {
          setResultUrl(URL.createObjectURL(blob));
        } else {
          setError('处理失败');
        }
        setProcessing(false);
      }, 'image/png');
    } catch (e: any) {
      setError('消除失败: ' + (e.message || '未知错误'));
      setProcessing(false);
    }
  };

  const handleProcess = () => {
    if (activeTool === 'remove-bg') removeBackground();
    else if (activeTool === 'remove-watermark') handleRemoveWatermark();
    else if (activeTool === 'smart-erase') handleSmartErase();
  };

  // Canvas 涂抹（智能消除-选择区域）
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const currentTool = TOOLS.find(t => t.key === activeTool)!;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🤖 AI 图像工具箱</h2>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
        全部在浏览器本地处理 · 图片不上传服务器 · 不消耗额度
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
        {/* 上传/预览区域 */}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  {activeTool === 'smart-erase' && erasePoints.length > 0 && (
                    <p style={{ fontSize: 12, color: '#f59e0b' }}>已涂抹 {erasePoints.length} 个点</p>
                  )}
                  <button onClick={handleProcess}
                    style={{ padding: '10px 28px', background: currentTool.color, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
                    <currentTool.icon size={18} /> {currentTool.name}
                  </button>
                </div>
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
        <strong>💡 提示：</strong> 全部工具在浏览器本地完成，图片不会上传服务器，无需消耗额度。去水印自动识别高亮区域进行修复，智能消除需要涂抹要清除的区域。
      </div>
    </div>
  );
}
