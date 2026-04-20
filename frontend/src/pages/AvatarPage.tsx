import React, { useState, useEffect, useCallback } from 'react';
import { Wand2, Video, FileText, Upload, Download, Trash2, Play, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import api from '../services/api';

// ============================================================
// 类型定义
// ============================================================
interface GeneratedScript {
  id: string;
  script: string;
  keywords: string[];
  hashtags: string[];
  scene: string;
  createdAt: string;
}

interface VideoItem {
  id: string;
  name: string;
  path: string;
  duration: number;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | string;
  createdAt: string;
}

interface ScriptForm {
  productName: string;
  productDesc: string;
  scene: string;
}

interface GenerateForm {
  script: string;
  productName: string;
  productDesc: string;
  avatarStyle: string;
  voiceId: string;
  background: string;
  music: string;
}

// ============================================================
// 状态组件
// ============================================================
function StatusBadge({ type, children }: { type: 'success' | 'error' | 'info' | 'warning'; children: React.ReactNode }) {
  const configs = {
    success: { bg: 'rgba(34,197,94,0.12)', color: '#16a34a', icon: <CheckCircle size={13} /> },
    error:   { bg: 'rgba(239,68,68,0.12)', color: '#dc2626', icon: <XCircle size={13} /> },
    info:    { bg: 'rgba(59,130,246,0.12)', color: '#2563eb', icon: <AlertCircle size={13} /> },
    warning: { bg: 'rgba(245,158,11,0.12)', color: '#d97706', icon: <Clock size={13} /> },
  };
  const c = configs[type];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 12,
      fontSize: 13, fontWeight: 600,
      background: c.bg, color: c.color,
    }}>
      {c.icon} {children}
    </span>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

// ============================================================
// 主页面
// ============================================================
export default function AvatarPage() {
  // 脚本生成
  const [scriptForm, setScriptForm] = useState<ScriptForm>({
    productName: '',
    productDesc: '',
    scene: 'product',
  });
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [scriptMsg, setScriptMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [editableScript, setEditableScript] = useState('');

  // 视频生成
  const [generateForm, setGenerateForm] = useState<GenerateForm>({
    script: '',
    productName: '',
    productDesc: '',
    avatarStyle: 'professional',
    voiceId: 'female',
    background: 'office',
    music: 'none',
  });
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [generateMsg, setGenerateMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 视频列表
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [uploadModal, setUploadModal] = useState<{ show: boolean; videoId: string; videoName: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 加载视频列表
  const loadVideos = useCallback(async () => {
    setLoadingVideos(true);
    try {
      const res = await api.avatar.list({ status: videoStatus || undefined, limit: 50 });
      setVideos(res.data || []);
    } catch (e: any) {
      console.error('加载视频列表失败:', e);
    } finally {
      setLoadingVideos(false);
    }
  }, [videoStatus]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // 生成脚本
  const handleGenerateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptForm.productName.trim()) {
      setScriptMsg({ type: 'error', text: '请输入产品名称' });
      return;
    }
    setGeneratingScript(true);
    setScriptMsg(null);
    try {
      const res = await api.avatar.generateScript({
        productName: scriptForm.productName.trim(),
        productDesc: scriptForm.productDesc.trim(),
        scene: scriptForm.scene,
      });
      if (res.success && res.data) {
        setGeneratedScript(res.data);
        setEditableScript(res.data.script || '');
        setGenerateForm(f => ({ ...f, script: res.data.script || '', productName: scriptForm.productName, productDesc: scriptForm.productDesc }));
        setScriptMsg({ type: 'success', text: '脚本生成成功！可以编辑后再生成视频' });
      } else {
        setScriptMsg({ type: 'error', text: res.error || '脚本生成失败' });
      }
    } catch (err: any) {
      setScriptMsg({ type: 'error', text: err.message });
    } finally {
      setGeneratingScript(false);
    }
  };

  // 生成视频
  const handleGenerateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateForm.script.trim()) {
      setGenerateMsg({ type: 'error', text: '请先生成或输入脚本内容' });
      return;
    }
    if (!generateForm.productName.trim()) {
      setGenerateMsg({ type: 'error', text: '请输入产品名称' });
      return;
    }
    setGeneratingVideo(true);
    setGenerateMsg(null);
    try {
      const res = await api.avatar.generate({
        script: generateForm.script.trim(),
        productName: generateForm.productName.trim(),
        productDesc: generateForm.productDesc.trim(),
        avatarStyle: generateForm.avatarStyle,
        voiceId: generateForm.voiceId,
        background: generateForm.background,
        music: generateForm.music,
      });
      if (res.success && res.data) {
        setGenerateMsg({ type: 'success', text: `视频生成任务已提交！ID: ${res.data.id}，请等待处理...` });
        setTimeout(loadVideos, 2000);
      } else {
        setGenerateMsg({ type: 'error', text: res.error || '视频生成失败' });
      }
    } catch (err: any) {
      setGenerateMsg({ type: 'error', text: err.message });
    } finally {
      setGeneratingVideo(false);
    }
  };

  // 删除视频
  const handleDeleteVideo = async (id: string) => {
    if (!confirm('确定要删除这个视频吗？')) return;
    try {
      const res = await api.avatar.deleteVideo(id);
      if (res.success) {
        setVideos(prev => prev.filter(v => v.id !== id));
      } else {
        alert(res.error || '删除失败');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 下载视频
  const handleDownloadVideo = (video: VideoItem) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'https://claw-backend-2026.onrender.com';
    const token = localStorage.getItem('token');
    const url = `${baseUrl}/api/avatar/${video.id}/download${token ? `?token=${token}` : ''}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = video.name || 'avatar-video.mp4';
    a.click();
  };

  // 上传到平台
  const handleUpload = async (platform: 'youtube' | 'tiktok' | 'shipinhao') => {
    if (!uploadModal) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const res = await api.avatar.upload({
        id: uploadModal.videoId,
        title: uploadModal.videoName.replace(/\.[^.]+$/, ''),
        description: `AI数字人视频 - ${uploadModal.videoName}`,
        platform,
      });
      if (res.success) {
        setUploadResult({ type: 'success', text: `成功上传到 ${platform === 'shipinhao' ? '视频号' : platform.toUpperCase()}！` });
      } else {
        setUploadResult({ type: 'error', text: res.error || '上传失败' });
      }
    } catch (err: any) {
      setUploadResult({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  // 获取状态标签
  function getStatusBadge(status: string) {
    switch (status) {
      case 'completed': return <StatusBadge type="success">已完成</StatusBadge>;
      case 'processing': return <StatusBadge type="info"><RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> 处理中</StatusBadge>;
      case 'pending': return <StatusBadge type="warning">排队中</StatusBadge>;
      case 'failed': return <StatusBadge type="error">失败</StatusBadge>;
      default: return <StatusBadge type="info">{status}</StatusBadge>;
    }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>

      {/* 页面标题 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 30 }}>🤖</span>
          AI 数字人直播管理
        </h1>
        <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 14 }}>
          AI 生成直播脚本 · 数字人视频制作 · 一键发布到各大平台
        </p>
      </div>

      {/* ========== 区块1：AI 脚本生成 ========== */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24, marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} color="#8b5cf6" />
          区块1：AI 脚本生成
        </h2>

        <form onSubmit={handleGenerateScript}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                产品名称 *
              </label>
              <input
                type="text"
                value={scriptForm.productName}
                onChange={e => setScriptForm(f => ({ ...f, productName: e.target.value }))}
                placeholder="如：儿童夏季连衣裙 2026新款"
                style={inputStyle('#8b5cf6')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                直播场景
              </label>
              <select
                value={scriptForm.scene}
                onChange={e => setScriptForm(f => ({ ...f, scene: e.target.value }))}
                style={{ ...inputStyle('#8b5cf6'), cursor: 'pointer' }}
              >
                <option value="product">产品介绍</option>
                <option value="lifestyle">生活方式</option>
                <option value="educational">知识科普</option>
                <option value="promotional">促销推广</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              产品描述（可选）
            </label>
            <textarea
              value={scriptForm.productDesc}
              onChange={e => setScriptForm(f => ({ ...f, productDesc: e.target.value }))}
              placeholder="产品的详细特点、卖点、适合人群等描述..."
              rows={2}
              style={{ ...textareaStyle('#8b5cf6'), resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={generatingScript}
            style={{
              padding: '10px 22px', background: '#8b5cf6', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: generatingScript ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: generatingScript ? 0.7 : 1,
            }}
          >
            {generatingScript
              ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> 生成中...</>
              : <><Wand2 size={15} /> 生成直播脚本</>
            }
          </button>
        </form>

        {scriptMsg && (
          <div style={msgStyle(scriptMsg.type)}>
            {scriptMsg.type === 'success' && <CheckCircle size={14} style={{ display: 'inline', marginRight: 6 }} />}
            {scriptMsg.type === 'error' && <XCircle size={14} style={{ display: 'inline', marginRight: 6 }} />}
            {scriptMsg.text}
          </div>
        )}

        {/* 生成的脚本展示 */}
        {generatedScript && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>生成的脚本（可编辑）</label>
              <StatusBadge type="success">已生成</StatusBadge>
            </div>
            <textarea
              value={editableScript}
              onChange={e => {
                setEditableScript(e.target.value);
                setGenerateForm(f => ({ ...f, script: e.target.value }));
              }}
              rows={6}
              style={textareaStyle('#8b5cf6')}
              placeholder="生成的脚本将显示在这里..."
            />

            {/* 关键词 */}
            {generatedScript.keywords && generatedScript.keywords.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>关键词</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {generatedScript.keywords.map((kw, i) => (
                    <span key={i} style={{
                      padding: '3px 10px', background: 'rgba(139,92,246,0.1)',
                      color: '#7c3aed', borderRadius: 12, fontSize: 12, fontWeight: 500,
                    }}>{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* 标签 */}
            {generatedScript.hashtags && generatedScript.hashtags.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>热门标签</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {generatedScript.hashtags.map((tag, i) => (
                    <span key={i} style={{
                      padding: '3px 10px', background: 'rgba(59,130,246,0.1)',
                      color: '#2563eb', borderRadius: 12, fontSize: 12, fontWeight: 500,
                    }}>#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========== 区块2：数字人视频生成 ========== */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24, marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Video size={18} color="#3B82F6" />
          区块2：数字人视频生成
        </h2>

        <form onSubmit={handleGenerateVideo}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              直播脚本 *
            </label>
            <textarea
              value={generateForm.script}
              onChange={e => setGenerateForm(f => ({ ...f, script: e.target.value }))}
              placeholder="请使用上方生成的脚本，或手动输入脚本内容..."
              rows={4}
              style={textareaStyle('#3B82F6')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                产品名称 *
              </label>
              <input
                type="text"
                value={generateForm.productName}
                onChange={e => setGenerateForm(f => ({ ...f, productName: e.target.value }))}
                placeholder="产品名称"
                style={inputStyle('#3B82F6')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                产品描述
              </label>
              <input
                type="text"
                value={generateForm.productDesc}
                onChange={e => setGenerateForm(f => ({ ...f, productDesc: e.target.value }))}
                placeholder="产品描述"
                style={inputStyle('#3B82F6')}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                形象风格
              </label>
              <select
                value={generateForm.avatarStyle}
                onChange={e => setGenerateForm(f => ({ ...f, avatarStyle: e.target.value }))}
                style={{ ...inputStyle('#3B82F6'), cursor: 'pointer' }}
              >
                <option value="professional">专业商务</option>
                <option value="casual">休闲自然</option>
                <option value="cute">可爱甜美</option>
                <option value="expert">专家权威</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                声音选择
              </label>
              <select
                value={generateForm.voiceId}
                onChange={e => setGenerateForm(f => ({ ...f, voiceId: e.target.value }))}
                style={{ ...inputStyle('#3B82F6'), cursor: 'pointer' }}
              >
                <option value="female">女声 · 温柔亲切</option>
                <option value="male">男声 · 磁性专业</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                背景场景
              </label>
              <select
                value={generateForm.background}
                onChange={e => setGenerateForm(f => ({ ...f, background: e.target.value }))}
                style={{ ...inputStyle('#3B82F6'), cursor: 'pointer' }}
              >
                <option value="office">办公室场景</option>
                <option value="studio">专业演播室</option>
                <option value="home">居家场景</option>
                <option value="outdoor">户外场景</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                背景音乐
              </label>
              <select
                value={generateForm.music}
                onChange={e => setGenerateForm(f => ({ ...f, music: e.target.value }))}
                style={{ ...inputStyle('#3B82F6'), cursor: 'pointer' }}
              >
                <option value="none">无背景音乐</option>
                <option value="upbeat">轻快节奏</option>
                <option value="calm">舒缓轻柔</option>
                <option value="dynamic">活力动感</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={generatingVideo}
            style={{
              width: '100%', padding: '12px', background: '#3B82F6', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: generatingVideo ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: generatingVideo ? 0.7 : 1,
            }}
          >
            {generatingVideo
              ? <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> 视频生成中，请稍候...</>
              : <><Play size={18} /> 生成数字人视频</>
            }
          </button>
        </form>

        {generateMsg && (
          <div style={msgStyle(generateMsg.type)}>
            {generateMsg.type === 'success' && <CheckCircle size={14} style={{ display: 'inline', marginRight: 6 }} />}
            {generateMsg.type === 'error' && <XCircle size={14} style={{ display: 'inline', marginRight: 6 }} />}
            {generateMsg.text}
          </div>
        )}
      </div>

      {/* ========== 区块3：已生成视频列表 ========== */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Video size={18} color="#6366f1" />
            区块3：已生成视频列表
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select
              value={videoStatus}
              onChange={e => setVideoStatus(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none', cursor: 'pointer' }}
            >
              <option value="">全部状态</option>
              <option value="completed">已完成</option>
              <option value="processing">处理中</option>
              <option value="pending">排队中</option>
              <option value="failed">失败</option>
            </select>
            <button
              onClick={loadVideos}
              disabled={loadingVideos}
              style={{
                background: 'none', border: '1px solid #e5e7eb', borderRadius: 8,
                padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                color: '#64748b', fontSize: 13, fontWeight: 500,
              }}
            >
              <RefreshCw size={13} style={{ animation: loadingVideos ? 'spin 1s linear infinite' : 'none' }} />
              刷新
            </button>
          </div>
        </div>

        {loadingVideos ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ marginTop: 10 }}>加载中...</div>
          </div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <Video size={40} style={{ marginBottom: 10 }} />
            <div>暂无视频，请先生成视频</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>视频名称</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>时长</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>大小</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>状态</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>创建时间</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#64748b', fontWeight: 600 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {videos.map(video => (
                  <tr key={video.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', color: '#1a1a2e', fontWeight: 500, maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.name}</div>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>
                      {video.duration ? formatDuration(video.duration) : '-'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>
                      {video.size ? formatSize(video.size) : '-'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {getStatusBadge(video.status)}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 12 }}>
                      {formatDate(video.createdAt)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            if (video.status === 'completed' && video.path) {
                              window.open(video.path, '_blank');
                            }
                          }}
                          disabled={video.status !== 'completed'}
                          style={{
                            padding: '3px 8px', background: video.status === 'completed' ? '#6366f1' : '#e5e7eb',
                            color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: video.status === 'completed' ? 'pointer' : 'not-allowed',
                          }}
                        >
                          预览
                        </button>
                        <button
                          onClick={() => handleDownloadVideo(video)}
                          disabled={video.status !== 'completed'}
                          style={{
                            padding: '3px 8px', background: video.status === 'completed' ? '#3B82F6' : '#e5e7eb',
                            color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: video.status === 'completed' ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', gap: 3,
                          }}
                        >
                          <Download size={11} /> 下载
                        </button>
                        <button
                          onClick={() => setUploadModal({ show: true, videoId: video.id, videoName: video.name })}
                          disabled={video.status !== 'completed'}
                          style={{
                            padding: '3px 8px', background: video.status === 'completed' ? '#8b5cf6' : '#e5e7eb',
                            color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: video.status === 'completed' ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', gap: 3,
                          }}
                        >
                          <Upload size={11} /> 发布
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          style={{
                            padding: '3px 8px', background: 'rgba(239,68,68,0.1)',
                            color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 3,
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 上传平台 Modal */}
      {uploadModal?.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000,
        }} onClick={() => setUploadModal(null)}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: 28, width: 400,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>
              发布到平台
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
              选择要发布的平台：<strong>{uploadModal.videoName}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => handleUpload('youtube')}
                disabled={uploading}
                style={platformBtn('#FF0000', uploading)}
              >
                📹 YouTube
              </button>
              <button
                onClick={() => handleUpload('tiktok')}
                disabled={uploading}
                style={platformBtn('#000000', uploading)}
              >
                🎵 TikTok
              </button>
              <button
                onClick={() => handleUpload('shipinhao')}
                disabled={uploading}
                style={platformBtn('#07C160', uploading)}
              >
                💬 视频号
              </button>
            </div>
            {uploadResult && (
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 8, fontSize: 13,
                background: uploadResult.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: uploadResult.type === 'success' ? '#16a34a' : '#dc2626',
                border: `1px solid ${uploadResult.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                {uploadResult.text}
              </div>
            )}
            <button
              onClick={() => setUploadModal(null)}
              style={{
                marginTop: 12, width: '100%', padding: '8px', background: 'none',
                border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13,
                cursor: 'pointer', color: '#64748b',
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 辅助样式函数
// ============================================================
function inputStyle(accent: string) {
  return {
    width: '100%', padding: '9px 13px', borderRadius: 8,
    border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', background: '#fff',
    transition: 'border-color 0.15s',
  } as React.CSSProperties;
}

function textareaStyle(accent: string) {
  return {
    width: '100%', padding: '9px 13px', borderRadius: 8,
    border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit',
    resize: 'vertical' as const,
  } as React.CSSProperties;
}

function msgStyle(type: 'success' | 'error' | 'info') {
  const configs = {
    success: { bg: 'rgba(34,197,94,0.1)', color: '#16a34a', border: 'rgba(34,197,94,0.3)' },
    error:   { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', border: 'rgba(239,68,68,0.3)' },
    info:    { bg: 'rgba(59,130,246,0.1)', color: '#2563eb', border: 'rgba(59,130,246,0.3)' },
  };
  const c = configs[type];
  return {
    marginTop: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13,
    background: c.bg, color: c.color, border: `1px solid ${c.border}`,
  } as React.CSSProperties;
}

function platformBtn(color: string, disabled: boolean) {
  return {
    width: '100%', padding: '11px', background: disabled ? '#e5e7eb' : color,
    color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
    fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
  } as React.CSSProperties;
}
