/**
 * LiveStreamPage.tsx — AI数字人直播控制面板 v1.0
 * 
 * 功能：开播/下播、实时监控、脚本管理、弹幕面板、AI脚本生成
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './LiveStreamPage.css';

// ═══ 类型定义 ═══
interface LiveStatus {
  status: string;
  avatarName: string;
  platform: string;
  resolution: string;
  fps: number;
  uptime: number;
  totalFrames: number;
  totalMessages: number;
  totalGifts: number;
  errors: number;
  scriptQueue: number;
  currentScript: string | null;
  chat: {
    onlineClients: number;
    totalMessages: number;
    totalLikes: number;
  };
}

interface Platform {
  id: string;
  name: string;
  rtmpTemplate: string;
  needStreamKey: boolean;
  icon: string;
  maxBitrate: string;
  maxResolution: string;
}

interface ChatMessage {
  type: string;
  user: string;
  text: string;
  timestamp: number;
}

interface AvatarProfile {
  id: string;
  name: string;
  gender: string;
  style: string;
  description: string;
  voice: string;
  voiceLabel: string;
  tags: string[];
  avatar: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '';

// ═══ 主组件 ═══
export default function LiveStreamPage() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [profiles, setProfiles] = useState<AvatarProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('xiaorui');
  const [selectedPlatform, setSelectedPlatform] = useState('custom');
  const [streamKey, setStreamKey] = useState('');
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [autoReply, setAutoReply] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scripts, setScripts] = useState<string[]>([]);
  const [newScript, setNewScript] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [announceText, setAnnounceText] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [generatedSegments, setGeneratedSegments] = useState<any[]>([]);
  
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // 轮询直播状态
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/live-stream/status`);
      const data = await res.json();
      if (data.success) setStatus(data.data);
    } catch (e) {
      // 静默处理
    }
  }, []);

  useEffect(() => {
    loadPlatforms();
    loadProfiles();
    pollStatus();
    pollRef.current = setInterval(pollStatus, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const loadPlatforms = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/live-stream/platforms`);
      const data = await res.json();
      if (data.success) setPlatforms(data.data.platforms);
    } catch (e) {}
  };

  const loadProfiles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/live-stream/profiles`);
      const data = await res.json();
      if (data.success) {
        setProfiles(data.data.profiles);
        if (!selectedProfile) setSelectedProfile(data.data.default || 'xiaorui');
      }
    } catch (e) {}
  };

  // ═══ 直播控制 ═══
  const startLive = async () => {
    setLoading(true);
    setError('');
    try {
      // 构造初始脚本
      const initScripts = scripts.length > 0
        ? scripts.map(text => ({ text, duration: 30 }))
        : [];

      const res = await fetch(`${API_BASE}/api/live-stream/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          streamKey: selectedPlatform !== 'custom' ? streamKey : undefined,
          rtmpUrl: selectedPlatform === 'custom' ? rtmpUrl : undefined,
          profileId: selectedProfile,
          autoReply,
          scripts: initScripts,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus(data.data.status);
      } else {
        setError(data.error || '启动失败');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const stopLive = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/live-stream/stop`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatus(null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const pauseLive = async () => {
    await fetch(`${API_BASE}/api/live-stream/pause`, { method: 'POST' });
    pollStatus();
  };

  const resumeLive = async () => {
    await fetch(`${API_BASE}/api/live-stream/resume`, { method: 'POST' });
    pollStatus();
  };

  // ═══ 脚本管理 ═══
  const addScript = async () => {
    if (!newScript.trim()) return;
    try {
      await fetch(`${API_BASE}/api/live-stream/script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newScript.trim(), duration: 30 }),
      });
      setScripts(prev => [...prev, newScript.trim()]);
      setNewScript('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const removeScript = (idx: number) => {
    setScripts(prev => prev.filter((_, i) => i !== idx));
  };

  const sendAnnounce = async () => {
    if (!announceText.trim()) return;
    try {
      await fetch(`${API_BASE}/api/live-stream/announce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: announceText.trim(), priority: 10 }),
      });
      setAnnounceText('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ═══ AI脚本生成 ═══
  const generateScript = async () => {
    if (!productName.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/live-stream/generate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, productDesc }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedScript(data.data.script);
        setGeneratedSegments(data.data.segments);
        // 自动添加到脚本队列
        data.data.segments.forEach((seg: any) => {
          setScripts(prev => [...prev, seg.text]);
        });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  // ═══ 状态样式 ═══
  const isLive = status?.status === 'live';
  const isPaused = status?.status === 'paused';
  const statusColor = isLive ? '#00e676' : isPaused ? '#ff9800' : '#f44336';
  const statusText = isLive ? '● 直播中' : isPaused ? '⏸ 已暂停' : '○ 未开播';

  return (
    <div className="livestream-page">
      {/* 顶部栏 */}
      <div className="ls-header">
        <h1>🎥 AI数字人直播控制台</h1>
        <div className="ls-status-badge" style={{ color: statusColor }}>
          {statusText}
        </div>
      </div>

      {error && (
        <div className="ls-error" onClick={() => setError('')}>
          ⚠️ {error} (点击关闭)
        </div>
      )}

      <div className="ls-main">
        {/* 左侧：控制面板 */}
        <div className="ls-left">
          {/* ─── 直播配置 ─── */}
          <div className="ls-card">
            <h3>👤 主播形象</h3>
            
            <div className="ls-profile-grid">
              {profiles.map(profile => {
                const isSelected = selectedProfile === profile.id;
                const genderColor = profile.gender === 'female' ? '#ff69b4' : '#4da6ff';
                return (
                  <div
                    key={profile.id}
                    className={`ls-profile-card ${isSelected ? 'ls-profile-selected' : ''}`}
                    onClick={() => setSelectedProfile(profile.id)}
                    style={isSelected ? { borderColor: genderColor, boxShadow: `0 0 0 2px ${genderColor}40` } : {}}
                  >
                    <div className="ls-profile-avatar">{profile.avatar}</div>
                    <div className="ls-profile-info">
                      <span className="ls-profile-name" style={{ color: isSelected ? genderColor : '#e0e0e0' }}>
                        {profile.name}
                      </span>
                      <span className="ls-profile-style">{profile.description}</span>
                      <div className="ls-profile-tags">
                        {profile.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="ls-profile-tag">{tag}</span>
                        ))}
                      </div>
                      <span className="ls-profile-voice">🎙️ {profile.voiceLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <label className="ls-checkbox">
              <input
                type="checkbox"
                checked={autoReply}
                onChange={e => setAutoReply(e.target.checked)}
              />
              🤖 启用AI自动回复弹幕
            </label>

            <label>推流平台</label>
            <select
              value={selectedPlatform}
              onChange={e => {
                setSelectedPlatform(e.target.value);
                setStreamKey('');
                setRtmpUrl('');
              }}
              disabled={isLive}
            >
              {platforms.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {selectedPlatform === 'custom' ? (
              <>
                <label>RTMP推流地址</label>
                <input
                  type="text"
                  value={rtmpUrl}
                  onChange={e => setRtmpUrl(e.target.value)}
                  disabled={isLive}
                  placeholder="rtmp://your-server/live/stream-key"
                />
              </>
            ) : (
              <>
                <label>推流密钥 (Stream Key)</label>
                <input
                  type="text"
                  value={streamKey}
                  onChange={e => setStreamKey(e.target.value)}
                  disabled={isLive}
                  placeholder={`${selectedPlatform}推流密钥`}
                />
              </>
            )}

            <label className="ls-checkbox">
              <input
                type="checkbox"
                checked={autoReply}
                onChange={e => setAutoReply(e.target.checked)}
              />
              🤖 启用AI自动回复弹幕
            </label>

            {/* 控制按钮 */}
            <div className="ls-controls">
              {!isLive ? (
                <button
                  className="ls-btn ls-btn-start"
                  onClick={startLive}
                  disabled={loading}
                >
                  {loading ? '准备中...' : '🔴 开播'}
                </button>
              ) : (
                <>
                  {isPaused ? (
                    <button className="ls-btn ls-btn-resume" onClick={resumeLive}>
                      ▶️ 继续
                    </button>
                  ) : (
                    <button className="ls-btn ls-btn-pause" onClick={pauseLive}>
                      ⏸️ 暂停
                    </button>
                  )}
                  <button
                    className="ls-btn ls-btn-stop"
                    onClick={stopLive}
                    disabled={loading}
                  >
                    {loading ? '停止中...' : '⏹️ 下播'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ─── 脚本管理 ─── */}
          <div className="ls-card">
            <h3>📝 直播脚本管理</h3>
            
            <div className="ls-script-input">
              <input
                type="text"
                value={newScript}
                onChange={e => setNewScript(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addScript()}
                placeholder="输入一段直播话术（30秒左右）"
              />
              <button className="ls-btn-sm" onClick={addScript}>添加</button>
            </div>

            <div className="ls-script-list">
              {scripts.length === 0 ? (
                <p className="ls-empty">暂无脚本，添加一些话术或使用AI生成</p>
              ) : (
                scripts.map((script, idx) => (
                  <div key={idx} className="ls-script-item">
                    <span className="ls-script-idx">{idx + 1}</span>
                    <span className="ls-script-text">{script.substring(0, 60)}{script.length > 60 ? '...' : ''}</span>
                    <button className="ls-btn-xs" onClick={() => removeScript(idx)}>✕</button>
                  </div>
                ))
              )}
            </div>

            <button
              className="ls-btn ls-btn-ai"
              onClick={() => setShowGenerateModal(true)}
            >
              🤖 AI生成直播脚本
            </button>
          </div>

          {/* ─── 主播公告 ─── */}
          <div className="ls-card">
            <h3>📢 主播公告</h3>
            <div className="ls-script-input">
              <input
                type="text"
                value={announceText}
                onChange={e => setAnnounceText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendAnnounce()}
                placeholder="发送一条公告给观众..."
              />
              <button className="ls-btn-sm" onClick={sendAnnounce}>发送</button>
            </div>
          </div>
        </div>

        {/* 右侧：监控面板 */}
        <div className="ls-right">
          {/* ─── 实时状态 ─── */}
          <div className="ls-card">
            <h3>📊 实时监控</h3>
            {status ? (
              <div className="ls-stats-grid">
                <div className="ls-stat">
                  <span className="ls-stat-label">状态</span>
                  <span className="ls-stat-val" style={{ color: statusColor }}>
                    {isLive ? '直播中' : isPaused ? '已暂停' : status.status}
                  </span>
                </div>
                <div className="ls-stat">
                  <span className="ls-stat-label">时长</span>
                  <span className="ls-stat-val">{formatTime(status.uptime)}</span>
                </div>
                <div className="ls-stat">
                  <span className="ls-stat-label">帧率</span>
                  <span className="ls-stat-val">{status.fps} fps</span>
                </div>
                <div className="ls-stat">
                  <span className="ls-stat-label">分辨率</span>
                  <span className="ls-stat-val">{status.resolution}</span>
                </div>
                <div className="ls-stat">
                  <span className="ls-stat-label">总帧数</span>
                  <span className="ls-stat-val">{status.totalFrames.toLocaleString()}</span>
                </div>
                <div className="ls-stat">
                  <span className="ls-stat-label">错误</span>
                  <span className="ls-stat-val" style={{ color: status.errors > 0 ? '#f44336' : '#00e676' }}>
                    {status.errors}
                  </span>
                </div>
                <div className="ls-stat">
                  <span className="ls-stat-label">在线观众</span>
                  <span className="ls-stat-val">{status.chat?.onlineClients || 0}</span>
                </div>
                <div className="ls-stat">
                  <span className="ls-stat-label">弹幕消息</span>
                  <span className="ls-stat-val">{status.chat?.totalMessages || 0}</span>
                </div>
                <div className="ls-stat">
                  <span className="ls-stat-label">点赞</span>
                  <span className="ls-stat-val">❤️ {status.chat?.totalLikes || 0}</span>
                </div>
                <div className="ls-stat">
                  <span className="ls-stat-label">礼物</span>
                  <span className="ls-stat-val">🎁 {status.totalGifts}</span>
                </div>
                <div className="ls-stat">
                  <span className="ls-stat-label">脚本队列</span>
                  <span className="ls-stat-val">{status.scriptQueue} 段</span>
                </div>
                <div className="ls-stat ls-stat-wide">
                  <span className="ls-stat-label">当前播放</span>
                  <span className="ls-stat-val">{status.currentScript || '无'}</span>
                </div>
              </div>
            ) : (
              <p className="ls-empty">未开播，暂无数据</p>
            )}
          </div>

          {/* ─── 弹幕面板（模拟） ─── */}
          {isLive && (
            <div className="ls-card">
              <h3>💬 弹幕面板</h3>
              <div className="ls-chat-box">
                {chatMessages.length === 0 ? (
                  <p className="ls-empty">暂无消息</p>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className="ls-chat-msg">
                      <span className="ls-chat-user">{msg.user || '观众'}:</span>
                      <span> {msg.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ─── 快速操作 ─── */}
          <div className="ls-card">
            <h3>⚡ 快速操作</h3>
            <div className="ls-quick-actions">
              <button className="ls-btn-sm" onClick={() => setScripts(prev => [
                ...prev,
                '欢迎来到云南瑞丽翡翠直播间！家人们右上角点个关注！',
                '今天给大家带来的都是缅甸A货翡翠，每一件都有鉴定证书！',
                '感谢家人们的支持，觉得主播讲得好的点点赞！',
              ])}>
                📋 添加默认话术
              </button>
              <button className="ls-btn-sm" onClick={loadPlatforms}>
                🔄 刷新平台列表
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── AI脚本生成弹窗 ─── */}
      {showGenerateModal && (
        <div className="ls-modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="ls-modal" onClick={e => e.stopPropagation()}>
            <h3>🤖 AI生成直播脚本</h3>
            
            <label>产品名称</label>
            <input
              type="text"
              value={productName}
              onChange={e => setProductName(e.target.value)}
              placeholder="如：缅甸A货翡翠手镯"
            />

            <label>产品描述（可选）</label>
            <textarea
              value={productDesc}
              onChange={e => setProductDesc(e.target.value)}
              placeholder="种水、颜色、产地、卖点等..."
              rows={3}
            />

            <button
              className="ls-btn ls-btn-ai"
              onClick={generateScript}
              disabled={generating || !productName.trim()}
            >
              {generating ? '生成中...' : '🎬 生成直播脚本'}
            </button>

            {generatedScript && (
              <div className="ls-generated">
                <h4>📜 生成的完整脚本:</h4>
                <pre>{generatedScript}</pre>
                <p className="ls-hint">✅ 已自动添加 {generatedSegments.length} 段到脚本队列</p>
              </div>
            )}

            <button className="ls-btn-sm" onClick={() => setShowGenerateModal(false)}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
