/**
 * SceneEditor.tsx — 直播场景布局编辑器 v2.0
 * 
 * 功能：
 * - 实时预览直播画面布局
 * - SSE实时动画预览（服务端渲染数字人帧 → 前端显示）
 * - 横屏/竖屏切换
 * - 拖拽添加叠加元素（微信二维码、广告词、LED跑马灯、产品卡）
 * - 元素属性编辑（位置、大小、颜色、文字内容、动画）
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  SceneConfig,
  OverlayElement,
  OverlayType,
  Orientation,
  DEFAULT_PORTRAIT_SCENE,
  DEFAULT_LANDSCAPE_SCENE,
  createOverlay,
  generateOverlayId,
  PLATFORM_ORIENTATION,
} from '../types/SceneConfig';
import './SceneEditor.css';

interface SceneEditorProps {
  sceneConfig: SceneConfig;
  onSceneConfigChange: (config: SceneConfig) => void;
  avatarImageUrl?: string;      // 当前选中主播的照片URL
  avatarName?: string;
  disabled?: boolean;
  compact?: boolean;             // 紧凑模式（嵌入到LiveStreamPage中）
}

const API_BASE = import.meta.env.VITE_API_URL || '';

// 叠加元素类型配置
const OVERLAY_TYPES: { type: OverlayType; icon: string; label: string }[] = [
  { type: 'qrcode', icon: '📱', label: '二维码' },
  { type: 'text-banner', icon: '📝', label: '广告词' },
  { type: 'led-marquee', icon: '💡', label: 'LED跑马灯' },
  { type: 'product-card', icon: '🛍️', label: '产品卡' },
  { type: 'image', icon: '🖼️', label: '图片' },
];

// 动画选项
const ANIMATIONS: { value: string; label: string }[] = [
  { value: 'none', label: '无动画' },
  { value: 'marquee', label: '跑马灯滚动' },
  { value: 'blink', label: '闪烁' },
  { value: 'pulse', label: '脉冲' },
  { value: 'slide-in', label: '滑入' },
];

export default function SceneEditor({
  sceneConfig,
  onSceneConfigChange,
  avatarImageUrl,
  avatarName,
  disabled = false,
  compact = false,
}: SceneEditorProps) {
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // ─── SSE 实时预览状态 ───
  const [isLivePreview, setIsLivePreview] = useState(false);
  const [previewSvg, setPreviewSvg] = useState('');
  const [previewFrame, setPreviewFrame] = useState(0);
  const [previewSpeaking, setPreviewSpeaking] = useState(false);
  const [previewScript, setPreviewScript] = useState('');
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');
  const eventSourceRef = useRef<EventSource | null>(null);

  const API_BASE2 = import.meta.env.VITE_API_URL || '';

  // ─── SSE 实时预览：启动/停止 ───
  const startLivePreview = useCallback(() => {
    if (isLivePreview) return;
    setPreviewStatus('connecting');
    setIsLivePreview(true);

    const params = new URLSearchParams({
      profileId: 'xiaorui',
      orientation: sceneConfig.orientation,
    });
    const url = `${API_BASE2}/api/live-stream/preview-stream?${params}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('init', (e) => {
      const data = JSON.parse(e.data);
      console.log('[SceneEditor] SSE预览初始化:', data);
    });

    es.addEventListener('frame', (e) => {
      const data = JSON.parse(e.data);
      setPreviewSvg(data.svg);
      setPreviewFrame(data.frame);
      setPreviewSpeaking(data.speaking);
      setPreviewScript(data.script || '');
      if (previewStatus !== 'live') setPreviewStatus('live');
    });

    es.onerror = () => {
      setPreviewStatus('error');
      stopLivePreview();
    };
  }, [isLivePreview, sceneConfig.orientation, previewStatus]);

  const stopLivePreview = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsLivePreview(false);
    setPreviewSvg('');
    setPreviewStatus('idle');
    setPreviewScript('');
    setPreviewSpeaking(false);
  }, []);

  // 方向/主播切换时重启预览
  useEffect(() => {
    if (isLivePreview) {
      stopLivePreview();
      setTimeout(() => startLivePreview(), 300);
    }
  }, [sceneConfig.orientation]);

  // 清理
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  // 根据所选平台自动切换方向
  const switchOrientation = useCallback((orientation: Orientation) => {
    if (disabled) return;
    const newConfig = orientation === 'landscape'
      ? { ...DEFAULT_LANDSCAPE_SCENE, overlays: sceneConfig.overlays }
      : { ...DEFAULT_PORTRAIT_SCENE, overlays: sceneConfig.overlays };
    onSceneConfigChange(newConfig);
  }, [disabled, sceneConfig.overlays, onSceneConfigChange]);

  // 添加叠加元素
  const addOverlay = useCallback((type: OverlayType) => {
    if (disabled) return;
    const overlay = createOverlay(type);
    onSceneConfigChange({
      ...sceneConfig,
      overlays: [...sceneConfig.overlays, overlay],
    });
    setSelectedOverlayId(overlay.id);
    setShowAddMenu(false);
  }, [disabled, sceneConfig, onSceneConfigChange]);

  // 删除叠加元素
  const removeOverlay = useCallback((id: string) => {
    if (disabled) return;
    onSceneConfigChange({
      ...sceneConfig,
      overlays: sceneConfig.overlays.filter(o => o.id !== id),
    });
    if (selectedOverlayId === id) setSelectedOverlayId(null);
  }, [disabled, sceneConfig, onSceneConfigChange, selectedOverlayId]);

  // 切换元素启用状态
  const toggleOverlay = useCallback((id: string) => {
    if (disabled) return;
    onSceneConfigChange({
      ...sceneConfig,
      overlays: sceneConfig.overlays.map(o =>
        o.id === id ? { ...o, enabled: !o.enabled } : o
      ),
    });
  }, [disabled, sceneConfig, onSceneConfigChange]);

  // 更新元素属性
  const updateOverlay = useCallback((id: string, updates: Partial<OverlayElement>) => {
    if (disabled) return;
    onSceneConfigChange({
      ...sceneConfig,
      overlays: sceneConfig.overlays.map(o =>
        o.id === id ? { ...o, ...updates } as OverlayElement : o
      ),
    });
  }, [disabled, sceneConfig, onSceneConfigChange]);

  // 更新元素样式
  const updateOverlayStyle = useCallback((id: string, styleUpdates: Record<string, any>) => {
    if (disabled) return;
    onSceneConfigChange({
      ...sceneConfig,
      overlays: sceneConfig.overlays.map(o =>
        o.id === id ? { ...o, style: { ...o.style, ...styleUpdates } } : o
      ),
    });
  }, [disabled, sceneConfig, onSceneConfigChange]);

  // 更新元素内容
  const updateOverlayContent = useCallback((id: string, contentUpdates: Record<string, any>) => {
    if (disabled) return;
    onSceneConfigChange({
      ...sceneConfig,
      overlays: sceneConfig.overlays.map(o =>
        o.id === id ? { ...o, content: { ...o.content, ...contentUpdates } } : o
      ),
    });
  }, [disabled, sceneConfig, onSceneConfigChange]);

  // 更新底部栏
  const updateBottomBar = useCallback((updates: Record<string, any>) => {
    if (disabled) return;
    onSceneConfigChange({
      ...sceneConfig,
      bottomBar: { ...sceneConfig.bottomBar, ...updates },
    });
  }, [disabled, sceneConfig, onSceneConfigChange]);

  // ─── 拖拽处理 ───
  const handleMouseDown = useCallback((e: React.MouseEvent, overlayId: string) => {
    if (disabled) return;
    e.stopPropagation();
    setSelectedOverlayId(overlayId);
    setDragging(overlayId);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [disabled]);

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

      setDragStart({ x: e.clientX, y: e.clientY });

      onSceneConfigChange({
        ...sceneConfig,
        overlays: sceneConfig.overlays.map(o => {
          if (o.id !== dragging) return o;
          return {
            ...o,
            position: {
              x: Math.max(0, Math.min(100, o.position.x + dx)),
              y: Math.max(0, Math.min(100, o.position.y + dy)),
            },
          };
        }),
      });
    };

    const handleMouseUp = () => setDragging(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, dragStart, sceneConfig, onSceneConfigChange]);

  // ─── 画布缩放 ───
  const canvasScale = sceneConfig.orientation === 'landscape' ? 0.35 : 0.22;
  const canvasW = sceneConfig.width * canvasScale;
  const canvasH = sceneConfig.height * canvasScale;

  const selectedOverlay = sceneConfig.overlays.find(o => o.id === selectedOverlayId);

  // ─── 渲染叠加元素 SVG 预览（用于实际渲染参考） ───
  const renderOverlayPreview = (overlay: OverlayElement) => {
    const { position, size, style, content, animation } = overlay;
    const left = (position.x / 100) * canvasW;
    const top = (position.y / 100) * canvasH;
    const w = size.width * canvasScale;
    const h = size.height * canvasScale;

    const animClass = animation !== 'none' ? `se-overlay-${animation}` : '';

    switch (overlay.type) {
      case 'qrcode':
        return (
          <div
            key={overlay.id}
            className={`se-overlay se-qrcode ${animClass} ${overlay.id === selectedOverlayId ? 'se-selected' : ''} ${overlay.enabled ? '' : 'se-disabled'}`}
            style={{
              left, top, width: w, height: h,
              backgroundColor: style.backgroundColor,
              borderRadius: style.borderRadius,
              padding: (style.padding || 10) * canvasScale,
              border: overlay.id === selectedOverlayId ? '2px solid #6c5ce7' : style.borderWidth ? `${style.borderWidth}px solid ${style.borderColor}` : 'none',
            }}
            onMouseDown={(e) => handleMouseDown(e, overlay.id)}
          >
            <div className="se-qr-placeholder">📱 QR</div>
            <div style={{ fontSize: (style.fontSize || 12) * canvasScale, color: style.color, textAlign: 'center' }}>
              {content.text || '扫码加微信'}
            </div>
          </div>
        );

      case 'text-banner':
        return (
          <div
            key={overlay.id}
            className={`se-overlay se-text-banner ${animClass} ${overlay.id === selectedOverlayId ? 'se-selected' : ''} ${overlay.enabled ? '' : 'se-disabled'}`}
            style={{
              left, top, width: w, height: h,
              backgroundColor: style.backgroundColor,
              color: style.color,
              fontSize: (style.fontSize || 16) * canvasScale,
              fontWeight: style.fontWeight || 'normal',
              borderRadius: style.borderRadius,
              border: style.borderWidth ? `${style.borderWidth}px solid ${style.borderColor}` : 'none',
              padding: (style.padding || 10) * canvasScale,
              textAlign: (style.textAlign || 'center') as any,
              whiteSpace: 'pre-wrap',
              overflow: 'hidden',
            }}
            onMouseDown={(e) => handleMouseDown(e, overlay.id)}
          >
            {content.text || '广告词'}
          </div>
        );

      case 'led-marquee':
        return (
          <div
            key={overlay.id}
            className={`se-overlay se-led ${overlay.id === selectedOverlayId ? 'se-selected' : ''} ${overlay.enabled ? '' : 'se-disabled'}`}
            style={{
              left, top, width: w, height: h,
              backgroundColor: style.backgroundColor,
              color: style.color,
              fontSize: Math.max(8, (style.fontSize || 14) * canvasScale),
              fontFamily: style.fontFamily,
              borderRadius: style.borderRadius,
              border: style.borderWidth ? `${style.borderWidth}px solid ${style.borderColor}` : 'none',
              padding: `${2 * canvasScale}px ${6 * canvasScale}px`,
              overflow: 'hidden',
            }}
            onMouseDown={(e) => handleMouseDown(e, overlay.id)}
          >
            <div className="se-marquee-text">
              {content.text || 'LED滚动文字...'}
            </div>
          </div>
        );

      case 'product-card':
        return (
          <div
            key={overlay.id}
            className={`se-overlay se-product-card ${animClass} ${overlay.id === selectedOverlayId ? 'se-selected' : ''} ${overlay.enabled ? '' : 'se-disabled'}`}
            style={{
              left, top, width: w, height: h,
              backgroundColor: style.backgroundColor,
              color: style.color,
              borderRadius: style.borderRadius,
              border: style.borderWidth ? `${style.borderWidth}px solid ${style.borderColor}` : 'none',
              padding: (style.padding || 12) * canvasScale,
              fontSize: (style.fontSize || 14) * canvasScale,
              textAlign: 'center',
            }}
            onMouseDown={(e) => handleMouseDown(e, overlay.id)}
          >
            <div className="se-product-img">🛍️</div>
            <div className="se-product-name" style={{ fontSize: Math.max(8, (style.fontSize || 14) * canvasScale) }}>
              {content.productName || '产品名称'}
            </div>
            <div className="se-product-price" style={{ color: '#ffd700', fontSize: Math.max(7, ((style.fontSize || 14) - 2) * canvasScale) }}>
              {content.productPrice || ''}
            </div>
          </div>
        );

      case 'image':
        return (
          <div
            key={overlay.id}
            className={`se-overlay se-image-overlay ${overlay.id === selectedOverlayId ? 'se-selected' : ''} ${overlay.enabled ? '' : 'se-disabled'}`}
            style={{
              left, top, width: w, height: h,
              backgroundColor: style.backgroundColor || '#2a2a4a',
              borderRadius: style.borderRadius,
              border: overlay.id === selectedOverlayId ? '2px solid #6c5ce7' : '1px dashed #555',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseDown={(e) => handleMouseDown(e, overlay.id)}
          >
            {content.imageUrl ? (
              <img src={content.imageUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%' }} />
            ) : (
              <span style={{ fontSize: 10, color: '#666' }}>🖼️ 图片</span>
            )}
          </div>
        );
    }
  };

  // ─── 紧凑模式（嵌入LiveStreamPage） ───
  if (compact) {
    return (
      <div className="se-compact">
        <div className="se-compact-header">
          <h4>🎬 直播画面预览与编辑</h4>
          <div className="se-orientation-switch">
            <button
              className={`se-orientation-btn ${sceneConfig.orientation === 'portrait' ? 'se-active' : ''}`}
              onClick={() => switchOrientation('portrait')}
              disabled={disabled}
            >📱 竖屏</button>
            <button
              className={`se-orientation-btn ${sceneConfig.orientation === 'landscape' ? 'se-active' : ''}`}
              onClick={() => switchOrientation('landscape')}
              disabled={disabled}
            >🖥️ 横屏</button>
          </div>
        </div>

        {/* 实时预览控制按钮 */}
        <div className="se-preview-controls">
          {!isLivePreview ? (
            <button
              className="se-preview-btn se-preview-start"
              onClick={startLivePreview}
              disabled={disabled}
            >
              ▶️ 实时预览
            </button>
          ) : (
            <button
              className="se-preview-btn se-preview-stop"
              onClick={stopLivePreview}
            >
              ⏹ 停止预览
            </button>
          )}
          <span className={`se-preview-status se-preview-${previewStatus}`}>
            {previewStatus === 'connecting' && '⏳ 连接中...'}
            {previewStatus === 'live' && `🔴 直播中 · 帧#${previewFrame}`}
            {previewStatus === 'error' && '⚠️ 连接失败'}
            {previewStatus === 'idle' && '点击预览查看直播画面'}
          </span>
        </div>

        {/* 画布预览 */}
        <div className="se-canvas-wrapper">
          {isLivePreview && previewSvg ? (
            <div
              className="se-canvas se-canvas-live"
              style={{
                width: canvasW,
                height: canvasH,
              }}
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          ) : (
            <div
              ref={canvasRef}
              className="se-canvas"
              style={{
                width: canvasW,
                height: canvasH,
                background: sceneConfig.background.type === 'gradient'
                  ? `linear-gradient(180deg, ${sceneConfig.background.value.split(',').join(',')})`
                  : sceneConfig.background.value,
              }}
            >
              {/* 数字人区域 */}
              <div
                className="se-avatar-area"
                style={{
                  left: `${sceneConfig.avatar.x}%`,
                  top: `${sceneConfig.avatar.y}%`,
                  width: `${sceneConfig.avatar.width}%`,
                  height: `${sceneConfig.avatar.height}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {avatarImageUrl ? (
                  <img src={avatarImageUrl} alt={avatarName || '主播'} className="se-avatar-img" />
                ) : (
                  <div className="se-avatar-placeholder">
                    <span>👤</span>
                    <span style={{ fontSize: Math.max(8, 12 * canvasScale), color: '#888' }}>{avatarName || 'AI主播'}</span>
                  </div>
                )}
              </div>

              {/* 叠加元素（仅非实时预览时显示） */}
              {sceneConfig.overlays.filter(o => o.enabled).map(renderOverlayPreview)}

              {/* 底部信息栏 */}
              {sceneConfig.bottomBar.enabled && (
                <div
                  className="se-bottom-bar"
                  style={{
                    height: sceneConfig.bottomBar.height * canvasScale,
                    backgroundColor: sceneConfig.bottomBar.backgroundColor,
                    color: sceneConfig.bottomBar.textColor,
                    fontSize: Math.max(7, 10 * canvasScale),
                  }}
                >
                  {sceneConfig.bottomBar.showLiveDot && <span className="se-live-dot">🔴 LIVE</span>}
                  <span>{sceneConfig.bottomBar.text}</span>
                  {sceneConfig.bottomBar.showTimer && <span className="se-timer">00:00</span>}
                </div>
              )}
            </div>
          )}

          {/* AI话术字幕 */}
          {isLivePreview && previewSpeaking && previewScript && (
            <div className="se-subtitle-bar">
              <span className="se-subtitle-icon">🗣️</span>
              <span className="se-subtitle-text">{previewScript}</span>
            </div>
          )}
        </div>

        {/* 添加元素按钮 */}
        <div className="se-add-bar">
          {OVERLAY_TYPES.map(ot => (
            <button
              key={ot.type}
              className="se-add-btn"
              onClick={() => addOverlay(ot.type)}
              disabled={disabled}
              title={ot.label}
            >
              {ot.icon} {ot.label}
            </button>
          ))}
        </div>

        {/* 元素列表 */}
        {sceneConfig.overlays.length > 0 && (
          <div className="se-overlay-list">
            {sceneConfig.overlays.map(overlay => (
              <div
                key={overlay.id}
                className={`se-overlay-item ${overlay.id === selectedOverlayId ? 'se-overlay-item-active' : ''} ${!overlay.enabled ? 'se-overlay-item-off' : ''}`}
                onClick={() => setSelectedOverlayId(overlay.id)}
              >
                <span className="se-overlay-item-icon">
                  {OVERLAY_TYPES.find(ot => ot.type === overlay.type)?.icon}
                </span>
                <span className="se-overlay-item-label">{overlay.label}</span>
                <button
                  className="se-overlay-toggle"
                  onClick={(e) => { e.stopPropagation(); toggleOverlay(overlay.id); }}
                >
                  {overlay.enabled ? '👁️' : '🚫'}
                </button>
                <button
                  className="se-overlay-delete"
                  onClick={(e) => { e.stopPropagation(); removeOverlay(overlay.id); }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 属性编辑面板 */}
        {selectedOverlay && (
          <OverlayPropertyEditor
            overlay={selectedOverlay}
            onUpdate={(u) => updateOverlay(selectedOverlay.id, u)}
            onStyleUpdate={(s) => updateOverlayStyle(selectedOverlay.id, s)}
            onContentUpdate={(c) => updateOverlayContent(selectedOverlay.id, c)}
            disabled={disabled}
          />
        )}

        {/* 底部栏设置 */}
        <div className="se-bottom-bar-settings">
          <label className="se-checkbox-label">
            <input
              type="checkbox"
              checked={sceneConfig.bottomBar.enabled}
              onChange={e => updateBottomBar({ enabled: e.target.checked })}
              disabled={disabled}
            />
            显示底部信息栏
          </label>
          {sceneConfig.bottomBar.enabled && (
            <input
              type="text"
              value={sceneConfig.bottomBar.text}
              onChange={e => updateBottomBar({ text: e.target.value })}
              placeholder="底部滚动文字"
              disabled={disabled}
              className="se-input"
            />
          )}
        </div>
      </div>
    );
  }

  // ─── 完整模式 ───
  return (
    <div className="se-full-editor">
      <div className="se-toolbar">
        <h3>🎬 直播画面编辑器</h3>
        <div className="se-orientation-switch">
          <button
            className={`se-orientation-btn ${sceneConfig.orientation === 'portrait' ? 'se-active' : ''}`}
            onClick={() => switchOrientation('portrait')}
            disabled={disabled}
          >📱 竖屏 9:16</button>
          <button
            className={`se-orientation-btn ${sceneConfig.orientation === 'landscape' ? 'se-active' : ''}`}
            onClick={() => switchOrientation('landscape')}
            disabled={disabled}
          >🖥️ 横屏 16:9</button>
        </div>
      </div>

      <div className="se-editor-body">
        {/* 左侧：元素面板 */}
        <div className="se-left-panel">
          <h4>叠加元素</h4>
          <div className="se-add-buttons">
            {OVERLAY_TYPES.map(ot => (
              <button
                key={ot.type}
                className="se-add-type-btn"
                onClick={() => addOverlay(ot.type)}
                disabled={disabled}
              >
                {ot.icon} {ot.label}
              </button>
            ))}
          </div>

          <div className="se-overlay-list-full">
            {sceneConfig.overlays.length === 0 ? (
              <p className="se-empty-hint">点击上方按钮添加叠加元素</p>
            ) : (
              sceneConfig.overlays.map(overlay => (
                <div
                  key={overlay.id}
                  className={`se-overlay-item ${overlay.id === selectedOverlayId ? 'se-overlay-item-active' : ''} ${!overlay.enabled ? 'se-overlay-item-off' : ''}`}
                  onClick={() => setSelectedOverlayId(overlay.id)}
                >
                  <span className="se-overlay-item-icon">
                    {OVERLAY_TYPES.find(ot => ot.type === overlay.type)?.icon}
                  </span>
                  <span className="se-overlay-item-label">{overlay.label}</span>
                  <div className="se-overlay-item-actions">
                    <button onClick={(e) => { e.stopPropagation(); toggleOverlay(overlay.id); }}>
                      {overlay.enabled ? '👁️' : '🚫'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeOverlay(overlay.id); }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 中间：画布 */}
        <div className="se-canvas-container">
          <div
            ref={canvasRef}
            className="se-canvas"
            style={{
              width: canvasW,
              height: canvasH,
              background: sceneConfig.background.type === 'gradient'
                ? `linear-gradient(180deg, ${sceneConfig.background.value.split(',').join(',')})`
                : sceneConfig.background.value,
            }}
          >
            {/* 数字人区域 */}
            <div
              className="se-avatar-area"
              style={{
                left: `${sceneConfig.avatar.x}%`,
                top: `${sceneConfig.avatar.y}%`,
                width: `${sceneConfig.avatar.width}%`,
                height: `${sceneConfig.avatar.height}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {avatarImageUrl ? (
                <img src={avatarImageUrl} alt={avatarName || '主播'} className="se-avatar-img" />
              ) : (
                <div className="se-avatar-placeholder">
                  <span>👤</span>
                  <span>{avatarName || 'AI主播'}</span>
                </div>
              )}
            </div>

            {/* 叠加元素 */}
            {sceneConfig.overlays.filter(o => o.enabled).map(renderOverlayPreview)}

            {/* 底部信息栏 */}
            {sceneConfig.bottomBar.enabled && (
              <div
                className="se-bottom-bar"
                style={{
                  height: sceneConfig.bottomBar.height * canvasScale,
                  backgroundColor: sceneConfig.bottomBar.backgroundColor,
                  color: sceneConfig.bottomBar.textColor,
                  fontSize: Math.max(7, 10 * canvasScale),
                }}
              >
                {sceneConfig.bottomBar.showLiveDot && <span className="se-live-dot">🔴 LIVE</span>}
                <span>{sceneConfig.bottomBar.text}</span>
                {sceneConfig.bottomBar.showTimer && <span className="se-timer">00:00</span>}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：属性面板 */}
        <div className="se-right-panel">
          {selectedOverlay ? (
            <OverlayPropertyEditor
              overlay={selectedOverlay}
              onUpdate={(u) => updateOverlay(selectedOverlay.id, u)}
              onStyleUpdate={(s) => updateOverlayStyle(selectedOverlay.id, s)}
              onContentUpdate={(c) => updateOverlayContent(selectedOverlay.id, c)}
              disabled={disabled}
            />
          ) : (
            <div className="se-no-selection">
              <p>👆 点击画布上的元素进行编辑</p>
              <p className="se-hint">或点击左侧列表选择元素</p>
            </div>
          )}

          {/* 底部栏设置 */}
          <div className="se-bottom-settings">
            <h4>底部信息栏</h4>
            <label className="se-checkbox-label">
              <input
                type="checkbox"
                checked={sceneConfig.bottomBar.enabled}
                onChange={e => updateBottomBar({ enabled: e.target.checked })}
                disabled={disabled}
              />
              启用
            </label>
            {sceneConfig.bottomBar.enabled && (
              <>
                <input
                  type="text"
                  value={sceneConfig.bottomBar.text}
                  onChange={e => updateBottomBar({ text: e.target.value })}
                  placeholder="底部文字"
                  disabled={disabled}
                  className="se-input"
                />
                <label className="se-checkbox-label">
                  <input
                    type="checkbox"
                    checked={sceneConfig.bottomBar.showLiveDot}
                    onChange={e => updateBottomBar({ showLiveDot: e.target.checked })}
                    disabled={disabled}
                  />
                  显示LIVE红点
                </label>
                <label className="se-checkbox-label">
                  <input
                    type="checkbox"
                    checked={sceneConfig.bottomBar.showTimer}
                    onChange={e => updateBottomBar({ showTimer: e.target.checked })}
                    disabled={disabled}
                  />
                  显示时长
                </label>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ 叠加元素属性编辑器 ═══
function OverlayPropertyEditor({
  overlay,
  onUpdate,
  onStyleUpdate,
  onContentUpdate,
  disabled,
}: {
  overlay: OverlayElement;
  onUpdate: (u: Partial<OverlayElement>) => void;
  onStyleUpdate: (s: Record<string, any>) => void;
  onContentUpdate: (c: Record<string, any>) => void;
  disabled: boolean;
}) {
  return (
    <div className="se-property-panel">
      <h4>📐 属性编辑</h4>
      <div className="se-prop-group">
        <label>名称</label>
        <input
          type="text"
          value={overlay.label}
          onChange={e => onUpdate({ label: e.target.value })}
          disabled={disabled}
          className="se-input"
        />
      </div>

      <div className="se-prop-group">
        <label>位置 X% / Y%</label>
        <div className="se-prop-row">
          <input
            type="number"
            value={Math.round(overlay.position.x)}
            onChange={e => onUpdate({ position: { ...overlay.position, x: Number(e.target.value) } })}
            disabled={disabled}
            className="se-input se-input-sm"
            min={0} max={100}
          />
          <input
            type="number"
            value={Math.round(overlay.position.y)}
            onChange={e => onUpdate({ position: { ...overlay.position, y: Number(e.target.value) } })}
            disabled={disabled}
            className="se-input se-input-sm"
            min={0} max={100}
          />
        </div>
      </div>

      <div className="se-prop-group">
        <label>大小 W×H (px)</label>
        <div className="se-prop-row">
          <input
            type="number"
            value={overlay.size.width}
            onChange={e => onUpdate({ size: { ...overlay.size, width: Number(e.target.value) } })}
            disabled={disabled}
            className="se-input se-input-sm"
          />
          <input
            type="number"
            value={overlay.size.height}
            onChange={e => onUpdate({ size: { ...overlay.size, height: Number(e.target.value) } })}
            disabled={disabled}
            className="se-input se-input-sm"
          />
        </div>
      </div>

      <div className="se-prop-group">
        <label>字号</label>
        <input
          type="number"
          value={overlay.style.fontSize || 16}
          onChange={e => onStyleUpdate({ fontSize: Number(e.target.value) })}
          disabled={disabled}
          className="se-input se-input-sm"
        />
      </div>

      <div className="se-prop-group">
        <label>文字颜色</label>
        <input
          type="color"
          value={overlay.style.color || '#ffffff'}
          onChange={e => onStyleUpdate({ color: e.target.value })}
          disabled={disabled}
          className="se-input-color"
        />
      </div>

      <div className="se-prop-group">
        <label>背景颜色</label>
        <input
          type="text"
          value={overlay.style.backgroundColor || ''}
          onChange={e => onStyleUpdate({ backgroundColor: e.target.value })}
          disabled={disabled}
          placeholder="rgba(0,0,0,0.6) 或 #ffffff"
          className="se-input"
        />
      </div>

      <div className="se-prop-group">
        <label>边框颜色</label>
        <input
          type="text"
          value={overlay.style.borderColor || ''}
          onChange={e => onStyleUpdate({ borderColor: e.target.value })}
          disabled={disabled}
          placeholder="#ffd700"
          className="se-input"
        />
      </div>

      <div className="se-prop-group">
        <label>圆角 (px)</label>
        <input
          type="number"
          value={overlay.style.borderRadius || 0}
          onChange={e => onStyleUpdate({ borderRadius: Number(e.target.value) })}
          disabled={disabled}
          className="se-input se-input-sm"
        />
      </div>

      <div className="se-prop-group">
        <label>动画</label>
        <select
          value={overlay.animation}
          onChange={e => onUpdate({ animation: e.target.value as any })}
          disabled={disabled}
          className="se-input"
        >
          {ANIMATIONS.map(a => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      <div className="se-prop-group">
        <label>层级</label>
        <input
          type="number"
          value={overlay.zIndex}
          onChange={e => onUpdate({ zIndex: Number(e.target.value) })}
          disabled={disabled}
          className="se-input se-input-sm"
        />
      </div>

      {/* 类型特定属性 */}
      {overlay.type === 'qrcode' && (
        <>
          <div className="se-prop-divider">二维码设置</div>
          <div className="se-prop-group">
            <label>提示文字</label>
            <input
              type="text"
              value={overlay.content.text || ''}
              onChange={e => onContentUpdate({ text: e.target.value })}
              disabled={disabled}
              className="se-input"
            />
          </div>
          <div className="se-prop-group">
            <label>二维码内容/链接</label>
            <input
              type="text"
              value={overlay.content.qrValue || ''}
              onChange={e => onContentUpdate({ qrValue: e.target.value })}
              disabled={disabled}
              placeholder="微信号或链接"
              className="se-input"
            />
          </div>
        </>
      )}

      {(overlay.type === 'text-banner' || overlay.type === 'led-marquee') && (
        <>
          <div className="se-prop-divider">文字内容</div>
          <div className="se-prop-group">
            <label>文字内容</label>
            <textarea
              value={overlay.content.text || ''}
              onChange={e => onContentUpdate({ text: e.target.value })}
              disabled={disabled}
              rows={overlay.type === 'led-marquee' ? 1 : 3}
              className="se-input se-textarea"
            />
          </div>
        </>
      )}

      {overlay.type === 'product-card' && (
        <>
          <div className="se-prop-divider">产品信息</div>
          <div className="se-prop-group">
            <label>产品名称</label>
            <input
              type="text"
              value={overlay.content.productName || ''}
              onChange={e => onContentUpdate({ productName: e.target.value })}
              disabled={disabled}
              className="se-input"
            />
          </div>
          <div className="se-prop-group">
            <label>价格</label>
            <input
              type="text"
              value={overlay.content.productPrice || ''}
              onChange={e => onContentUpdate({ productPrice: e.target.value })}
              disabled={disabled}
              className="se-input"
            />
          </div>
          <div className="se-prop-group">
            <label>描述</label>
            <input
              type="text"
              value={overlay.content.text || ''}
              onChange={e => onContentUpdate({ text: e.target.value })}
              disabled={disabled}
              className="se-input"
            />
          </div>
        </>
      )}

      {overlay.type === 'image' && (
        <>
          <div className="se-prop-divider">图片设置</div>
          <div className="se-prop-group">
            <label>图片URL</label>
            <input
              type="text"
              value={overlay.content.imageUrl || ''}
              onChange={e => onContentUpdate({ imageUrl: e.target.value })}
              disabled={disabled}
              placeholder="https://..."
              className="se-input"
            />
          </div>
        </>
      )}
    </div>
  );
}
