import React, { useState, useEffect, useCallback } from 'react';
import { Play, RefreshCw, CheckCircle, XCircle, Upload, Video, Zap, Globe, Lock, EyeOff, Cloud } from 'lucide-react';
import api from '../services/api';

// ============================================================
// 类型定义
// ============================================================
interface YouTubeAccount {
  email: string;
  accountId?: string;
  status: 'logged_in' | 'not_logged_in' | 'checking' | string;
  sessionValid?: boolean;
  lastLogin?: string;
}

interface UploadForm {
  videoPath: string;
  title: string;
  description: string;
  privacy: 'public' | 'unlisted' | 'private';
}

interface SystemStatus {
  environment: string;
  headless: boolean;
  playwright: boolean;
}

// ============================================================
// 状态组件
// ============================================================
function StatusBadge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 12,
      fontSize: 13, fontWeight: 600,
      background: ok ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      color: ok ? '#16a34a' : '#dc2626',
    }}>
      {ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
      {children}
    </span>
  );
}

// ============================================================
// 隐私选择图标
// ============================================================
function PrivacyIcon({ privacy }: { privacy: string }) {
  if (privacy === 'public') return <Globe size={14} />;
  if (privacy === 'unlisted') return <EyeOff size={14} />;
  return <Lock size={14} />;
}

// ============================================================
// 主页面
// ============================================================
export default function YouTubePage() {
  // 系统状态
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loadingSystem, setLoadingSystem] = useState(false);

  // 账号列表
  const [accounts, setAccounts] = useState<YouTubeAccount[]>([]);

  // 登录表单
  const [loginEmail, setLoginEmail] = useState('');
  const [loginAccountId, setLoginAccountId] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginMsg, setLoginMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  // 上传表单
  const [uploadEmail, setUploadEmail] = useState('');
  const [uploadForm, setUploadForm] = useState<UploadForm>({
    videoPath: '',
    title: '',
    description: '',
    privacy: 'public',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  // ===== API 模式（YouTube Data API v3，无需浏览器）=====
  interface OAuthAccount {
    channelId: string;
    channelTitle: string;
    email: string;
    thumbnail?: string;
    tokenValid: boolean;
  }
  const [oauthAccounts, setOauthAccounts] = useState<OAuthAccount[]>([]);
  const [apiTab, setApiTab] = useState<'browser' | 'api'>('browser');
  const [apiChannelId, setApiChannelId] = useState('');
  const [apiUploadForm, setApiUploadForm] = useState({ videoPath: '', title: '', description: '', tags: '', privacy: 'public' as const, thumbnailPath: '' });
  const [apiUploading, setApiUploading] = useState(false);
  const [apiUploadMsg, setApiUploadMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  // 加载系统状态
  const loadSystemStatus = useCallback(async () => {
    setLoadingSystem(true);
    try {
      const res = await api.browser.systemStatus();
      setSystemStatus(res.data?.system || null);
    } catch (e: any) {
      console.error('系统状态加载失败:', e);
    } finally {
      setLoadingSystem(false);
    }
  }, []);

  // 检查所有账号登录状态
  const checkAllAccounts = useCallback(async () => {
    if (accounts.length === 0) return;
    const updated = await Promise.all(
      accounts.map(async (acc) => {
        try {
          const res = await api.browser.youtube.status(acc.email, acc.accountId);
          return {
            ...acc,
            status: res.data?.loggedIn ? 'logged_in' : 'not_logged_in',
            sessionValid: res.data?.sessionValid,
            lastLogin: res.data?.lastLogin,
          };
        } catch {
          return { ...acc, status: 'not_logged_in' as const };
        }
      })
    );
    setAccounts(updated);
  }, [accounts]);

  // 加载已保存的账号
  useEffect(() => {
    loadSystemStatus();
    loadSavedAccounts();
    loadOAuthAccounts();
  }, [loadSystemStatus]);

  // 账号有变化时自动检查状态
  useEffect(() => {
    if (accounts.length > 0) {
      const timer = setTimeout(checkAllAccounts, 500);
      return () => clearTimeout(timer);
    }
  }, [accounts, checkAllAccounts]);

  // 从后端获取已保存的 YouTube 账号
  const loadSavedAccounts = async () => {
    try {
      const res = await api.accounts.list();
      const saved = (res.data || []).filter((a: any) => a.platform === 'youtube');
      if (saved.length > 0) {
        setAccounts(saved.map((a: any) => ({
          email: a.username || a.email || '',
          accountId: a.accountId,
          status: 'checking',
          sessionValid: undefined,
        })));
        if (!uploadEmail && saved[0]) {
          setUploadEmail(saved[0].username || saved[0].email || '');
        }
      }
    } catch {
      // ignore
    }
  };

  // 加载 OAuth 已授权账号（API 模式）
  const loadOAuthAccounts = async () => {
    try {
      const res = await api.youtube.accounts();
      if (res.data?.accounts?.length > 0) {
        setOauthAccounts(res.data.accounts);
        if (!apiChannelId && res.data.accounts[0]) {
          setApiChannelId(res.data.accounts[0].channelId);
        }
      }
    } catch { /* ignore */ }
  };

  // API 模式上传视频
  const handleApiUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiChannelId) { setApiUploadMsg({ type: 'error', text: '请先选择 YouTube 频道' }); return; }
    if (!apiUploadForm.videoPath.trim()) { setApiUploadMsg({ type: 'error', text: '请输入视频路径' }); return; }
    if (!apiUploadForm.title.trim()) { setApiUploadMsg({ type: 'error', text: '请输入视频标题' }); return; }

    setApiUploading(true);
    setApiUploadMsg(null);
    try {
      const res = await api.youtube.upload({
        channelId: apiChannelId,
        videoPath: apiUploadForm.videoPath.trim(),
        title: apiUploadForm.title.trim(),
        description: apiUploadForm.description.trim(),
        tags: apiUploadForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        privacyStatus: apiUploadForm.privacy,
        thumbnailPath: apiUploadForm.thumbnailPath || undefined,
      });

      if (res.data?.success) {
        const d = res.data.data;
        setApiUploadMsg({
          type: 'success',
          text: `上传成功! 视频ID: ${d.videoId} | 链接: ${d.videoUrl}`,
        });
        setApiUploadForm({ videoPath: '', title: '', description: '', tags: '', privacy: 'public', thumbnailPath: '' });
      } else {
        setApiUploadMsg({ type: 'error', text: res.data?.error || '上传失败' });
      }
    } catch (err: any) {
      setApiUploadMsg({ type: 'error', text: err.response?.data?.error || err.message });
    } finally {
      setApiUploading(false);
    }
  };

  // 添加账号并触发登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setLoginMsg({ type: 'error', text: '请输入 YouTube 账号邮箱' });
      return;
    }
    setLoggingIn(true);
    setLoginMsg(null);
    try {
      const res = await api.browser.youtube.login(loginEmail.trim(), loginAccountId.trim() || undefined);
      if (res.success) {
        setLoginMsg({ type: 'success', text: res.note || '浏览器已打开，请在浏览器中完成 YouTube 登录' });

        const newAcc: YouTubeAccount = {
          email: loginEmail.trim(),
          accountId: loginAccountId.trim() || undefined,
          status: 'checking',
        };
        const exists = accounts.find(a => a.email === newAcc.email && a.accountId === newAcc.accountId);
        if (!exists) {
          setAccounts(prev => [...prev, newAcc]);
        }

        // 自动保存为平台账号
        try {
          await api.accounts.create({
            platform: 'youtube',
            name: `YouTube ${loginEmail.trim()}`,
            username: loginEmail.trim(),
            credentials: { accountId: loginAccountId.trim() || undefined },
          });
        } catch { /* ignore */ }

        setLoginEmail('');
        setLoginAccountId('');
      } else {
        setLoginMsg({ type: 'error', text: res.error || '登录启动失败' });
      }
    } catch (err: any) {
      setLoginMsg({ type: 'error', text: err.message });
    } finally {
      setLoggingIn(false);
    }
  };

  // 重新检查单个账号
  const handleCheckAccount = async (acc: YouTubeAccount) => {
    setAccounts(prev => prev.map(a => a.email === acc.email && a.accountId === acc.accountId
      ? { ...a, status: 'checking' } : a));
    try {
      const res = await api.browser.youtube.status(acc.email, acc.accountId);
      setAccounts(prev => prev.map(a => a.email === acc.email && a.accountId === acc.accountId ? {
        ...a,
        status: res.data?.loggedIn ? 'logged_in' : 'not_logged_in',
        sessionValid: res.data?.sessionValid,
        lastLogin: res.data?.lastLogin,
      } : a));
    } catch {
      setAccounts(prev => prev.map(a => a.email === acc.email ? { ...a, status: 'not_logged_in' } : a));
    }
  };

  // 上传视频
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadEmail.trim()) {
      setUploadMsg({ type: 'error', text: '请先选择要上传的 YouTube 账号' });
      return;
    }
    if (!uploadForm.videoPath.trim()) {
      setUploadMsg({ type: 'error', text: '请输入视频文件路径（服务器上的路径）' });
      return;
    }
    if (!uploadForm.title.trim()) {
      setUploadMsg({ type: 'error', text: '请输入视频标题' });
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    try {
      const res = await api.browser.youtube.upload({
        email: uploadEmail.trim(),
        videoPath: uploadForm.videoPath.trim(),
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim(),
        privacy: uploadForm.privacy,
      });

      if (res.success) {
        setUploadMsg({
          type: 'success',
          text: res.message || '视频上传请求已提交！请等待浏览器自动化完成上传',
        });
        setUploadForm({ videoPath: '', title: '', description: '', privacy: 'public' });
      } else if (res.needLogin) {
        setUploadMsg({ type: 'error', text: '该账号未登录，请先完成 YouTube 登录' });
      } else {
        setUploadMsg({ type: 'error', text: res.error || '上传失败' });
      }
    } catch (err: any) {
      setUploadMsg({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  // 刷新系统状态
  const handleRefreshSystem = () => {
    loadSystemStatus();
    checkAllAccounts();
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>

      {/* 页面标题 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 30 }}>📹</span>
          YouTube 管理
        </h1>
        <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 14 }}>
          浏览器自动化 · 手动登录 · 自动上传视频
        </p>
      </div>

      {/* ========== 系统状态卡片 ========== */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: 20, marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="#f59e0b" />
            浏览器自动化系统
          </h2>
          <button
            onClick={handleRefreshSystem}
            disabled={loadingSystem}
            style={{
              background: 'none', border: '1px solid #e5e7eb', borderRadius: 8,
              padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              color: '#64748b', fontSize: 13, fontWeight: 500,
            }}
          >
            <RefreshCw size={14} style={{ animation: loadingSystem ? 'spin 1s linear infinite' : 'none' }} />
            刷新状态
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>运行环境</div>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>
              {loadingSystem ? '...' : (systemStatus?.environment === 'server' ? '☁️ 服务器' : '💻 本地开发')}
            </div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>浏览器模式</div>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>
              {loadingSystem ? '...' : (systemStatus?.headless ? '🔒 无头模式' : '🖥️ 可视化')}
            </div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>已登录账号</div>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>
              {accounts.filter(a => a.status === 'logged_in').length} / {accounts.length}
            </div>
          </div>
        </div>

        {!loadingSystem && systemStatus && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#fffbeb', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
            💡 服务器环境会自动在后台运行浏览器。本地开发环境会打开可见窗口。
          </div>
        )}
      </div>

      {/* ========== 登录区域 ========== */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24, marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Play size={18} color="#FF0000" />
          步骤1：YouTube 账号登录
        </h2>

        <form onSubmit={handleLogin} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              YouTube 账号邮箱
            </label>
            <input
              type="email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%', padding: '9px 13px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#FF0000'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div style={{ flex: '0 0 160px' }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              账号别名（可选）
            </label>
            <input
              type="text"
              value={loginAccountId}
              onChange={e => setLoginAccountId(e.target.value)}
              placeholder="如: channel1"
              style={{
                width: '100%', padding: '9px 13px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#FF0000'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <button
            type="submit"
            disabled={loggingIn}
            style={{
              padding: '9px 20px', background: '#FF0000', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: loggingIn ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              opacity: loggingIn ? 0.7 : 1, minHeight: 40,
            }}
          >
            {loggingIn ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={15} />}
            {loggingIn ? '启动中...' : '打开浏览器登录'}
          </button>
        </form>

        {loginMsg && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            fontSize: 13,
            background: loginMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : loginMsg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
            color: loginMsg.type === 'success' ? '#16a34a' : loginMsg.type === 'error' ? '#dc2626' : '#2563eb',
            border: `1px solid ${loginMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : loginMsg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
          }}>
            {loginMsg.type === 'success' && <CheckCircle size={14} style={{ display: 'inline', marginRight: 6 }} />}
            {loginMsg.type === 'error' && <XCircle size={14} style={{ display: 'inline', marginRight: 6 }} />}
            {loginMsg.text}
          </div>
        )}

        {/* 已登录账号列表 */}
        {accounts.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>
              已管理的账号
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {accounts.map((acc, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>📹</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{acc.email}</div>
                      {acc.accountId && (
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>别名: {acc.accountId}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {acc.status === 'checking' ? (
                      <StatusBadge ok={false}>
                        <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> 检查中
                      </StatusBadge>
                    ) : acc.status === 'logged_in' ? (
                      <StatusBadge ok={true}>
                        <CheckCircle size={12} /> 已登录
                        {acc.sessionValid === false && <span style={{ fontSize: 11, opacity: 0.8 }}> · Session过期</span>}
                      </StatusBadge>
                    ) : (
                      <StatusBadge ok={false}>未登录</StatusBadge>
                    )}
                    <button
                      onClick={() => handleCheckAccount(acc)}
                      style={{
                        background: 'none', border: '1px solid #e5e7eb', borderRadius: 6,
                        padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#64748b',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <RefreshCw size={12} /> 检查
                    </button>
                    <button
                      onClick={() => {
                        setUploadEmail(acc.email);
                        setAccounts(prev => prev.filter(a => a.email !== acc.email || a.accountId !== acc.accountId));
                      }}
                      disabled={acc.status !== 'logged_in'}
                      title="选择此账号上传"
                      style={{
                        background: acc.status === 'logged_in' ? '#FF0000' : '#e5e7eb',
                        border: 'none', borderRadius: 6,
                        padding: '4px 10px', fontSize: 12, cursor: acc.status === 'logged_in' ? 'pointer' : 'not-allowed',
                        color: '#fff', fontWeight: 600,
                      }}
                    >
                      上传
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========== 视频上传区域 ========== */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={18} color="#FF0000" />
          步骤2：上传视频到 YouTube
        </h2>

        <form onSubmit={handleUpload}>
          {/* 账号选择 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              上传到账号 *
            </label>
            <select
              value={uploadEmail}
              onChange={e => setUploadEmail(e.target.value)}
              style={{
                width: '100%', padding: '9px 13px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                background: '#fff', cursor: 'pointer',
              }}
            >
              <option value="">-- 选择已登录的 YouTube 账号 --</option>
              {accounts.filter(a => a.status === 'logged_in').map((acc, i) => (
                <option key={i} value={acc.email}>
                  📹 {acc.email}{acc.accountId ? ` (${acc.accountId})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 视频路径 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              视频文件路径 *
              <span style={{ fontWeight: 400, marginLeft: 6, color: '#94a3b8' }}>（服务器上的文件路径，如 /videos/myvideo.mp4）</span>
            </label>
            <input
              type="text"
              value={uploadForm.videoPath}
              onChange={e => setUploadForm(f => ({ ...f, videoPath: e.target.value }))}
              placeholder="/videos/myvideo.mp4"
              style={{
                width: '100%', padding: '9px 13px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#FF0000'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* 标题和隐私 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                视频标题 *
              </label>
              <input
                type="text"
                value={uploadForm.title}
                onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Amazing Product Review 2026"
                style={{
                  width: '100%', padding: '9px 13px', borderRadius: 8,
                  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#FF0000'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                可见性
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['public', 'unlisted', 'private'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setUploadForm(f => ({ ...f, privacy: p }))}
                    style={{
                      flex: 1,
                      padding: '7px 8px',
                      background: uploadForm.privacy === p ? '#FF0000' : '#f8fafc',
                      color: uploadForm.privacy === p ? '#fff' : '#64748b',
                      border: `1.5px solid ${uploadForm.privacy === p ? '#FF0000' : '#e5e7eb'}`,
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      transition: 'all 0.15s',
                    }}
                  >
                    <PrivacyIcon privacy={p} />
                    {p === 'public' ? '公开' : p === 'unlisted' ? '不公开' : '私有'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 描述 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              视频描述
            </label>
            <textarea
              value={uploadForm.description}
              onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
              placeholder="This video reviews an amazing product..."
              rows={4}
              style={{
                width: '100%', padding: '9px 13px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = '#FF0000'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            style={{
              width: '100%', padding: '12px', background: '#FF0000', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, opacity: uploading ? 0.7 : 1,
            }}
          >
            {uploading ? (
              <>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                上传中，请稍候...
              </>
            ) : (
              <>
                <Upload size={18} />
                立即上传到 YouTube
              </>
            )}
          </button>
        </form>

        {uploadMsg && (
          <div style={{
            marginTop: 14, padding: '12px 16px', borderRadius: 8, fontSize: 14,
            background: uploadMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : uploadMsg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
            color: uploadMsg.type === 'success' ? '#16a34a' : uploadMsg.type === 'error' ? '#dc2626' : '#2563eb',
            border: `1px solid ${uploadMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : uploadMsg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
          }}>
            {uploadMsg.type === 'success' && <CheckCircle size={15} style={{ display: 'inline', marginRight: 6 }} />}
            {uploadMsg.type === 'error' && <XCircle size={15} style={{ display: 'inline', marginRight: 6 }} />}
            {uploadMsg.text}
          </div>
        )}

        <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
          <strong style={{ color: '#334155' }}>使用流程：</strong><br />
          1️⃣ 在上方输入 YouTube 账号邮箱，点击「打开浏览器登录」<br />
          2️⃣ 在弹出的浏览器中手动登录 Google/YouTube（只需操作一次）<br />
          3️⃣ 登录成功后，选择该账号，填写视频路径、标题等信息并上传<br />
          ⚠️ videoPath 必须是服务器上存在的视频文件路径（如 /videos/output.mp4）<br />
          ⚠️ 首次使用需手动登录，之后浏览器会自动复用 Session
        </div>
      </div>

      {/* ========== API 模式（YouTube Data API v3）========== */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24, marginTop: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '2px solid #3b82f6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cloud size={18} color="#3b82f6" />
            API 模式：直接上传（无需浏览器）
            <span style={{
              fontSize: 11, background: '#3b82f6', color: '#fff', padding: '2px 8px', borderRadius: 10,
              fontWeight: 600, marginLeft: 6,
            }}>推荐</span>
          </h2>
          <button
            onClick={loadOAuthAccounts}
            style={{
              background: 'none', border: '1px solid #e5e7eb', borderRadius: 8,
              padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              color: '#64748b', fontSize: 13, fontWeight: 500,
            }}
          >
            <RefreshCw size={14} /> 刷新授权账号
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px', lineHeight: 1.5 }}>
          使用 YouTube Data API v3 直接上传视频，<strong style={{ color: '#1e40af' }}>无需浏览器，服务器端自动完成</strong>。
          需要先进行 Google OAuth 授权（在弹出的 Google 窗口中完成授权即可）。
        </p>

        {/* OAuth 授权入口 */}
        {oauthAccounts.length === 0 && (
          <div style={{
            marginBottom: 18, padding: '16px', background: '#eff6ff', borderRadius: 10,
            border: '1px solid #bfdbfe', textAlign: 'center',
          }}>
            <p style={{ fontSize: 14, color: '#1e40af', margin: '0 0 10px' }}>
              尚未授权 YouTube 账号，点击下方按钮完成 Google OAuth 授权
            </p>
            <button
              onClick={async () => {
                try {
                  const res = await api.youtube.oauthUrl();
                  if (res.data?.authUrl) {
                    window.open(res.data.authUrl, '_blank', 'width=600,height=700');
                    // 5 秒后刷新账号列表
                    setTimeout(loadOAuthAccounts, 5000);
                  }
                } catch { }
              }}
              style={{
                padding: '10px 28px', background: '#3b82f6', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              🔐 授权 YouTube 账号
            </button>
          </div>
        )}

        {/* 已授权账号 */}
        {oauthAccounts.length > 0 && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
              {oauthAccounts.map((a) => (
                <button
                  key={a.channelId}
                  onClick={() => setApiChannelId(a.channelId)}
                  style={{
                    padding: '12px 16px',
                    background: apiChannelId === a.channelId ? '#eff6ff' : '#f8fafc',
                    border: `2px solid ${apiChannelId === a.channelId ? '#3b82f6' : '#e5e7eb'}`,
                    borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'all 0.15s',
                  }}
                >
                  {a.thumbnail ? (
                    <img src={a.thumbnail} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  ) : (
                    <span style={{ fontSize: 28 }}>📹</span>
                  )}
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{a.channelTitle}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.email}</div>
                  </div>
                  {a.tokenValid ? (
                    <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✅ 有效</span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>⚠️ 过期</span>
                  )}
                </button>
              ))}
            </div>

            {/* API 上传表单 */}
            <form onSubmit={handleApiUpload}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                    视频文件路径 *
                  </label>
                  <input
                    type="text" value={apiUploadForm.videoPath}
                    onChange={e => setApiUploadForm(f => ({ ...f, videoPath: e.target.value }))}
                    placeholder="/videos/myvideo.mp4"
                    style={{ width: '100%', padding: '9px 13px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                    视频标题 *
                  </label>
                  <input
                    type="text" value={apiUploadForm.title}
                    onChange={e => setApiUploadForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Amazing Product Review"
                    style={{ width: '100%', padding: '9px 13px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#3b82f6'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                    标签（逗号分隔）
                  </label>
                  <input
                    type="text" value={apiUploadForm.tags}
                    onChange={e => setApiUploadForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="fashion, kids, review"
                    style={{ width: '100%', padding: '9px 13px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                    可见性
                  </label>
                  <select
                    value={apiUploadForm.privacy}
                    onChange={e => setApiUploadForm(f => ({ ...f, privacy: e.target.value as any }))}
                    style={{ width: '100%', padding: '9px 13px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', background: '#fff' }}
                  >
                    <option value="public">🌍 公开</option>
                    <option value="unlisted">🔗 不公开</option>
                    <option value="private">🔒 私有</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                    缩略图路径（可选）
                  </label>
                  <input
                    type="text" value={apiUploadForm.thumbnailPath}
                    onChange={e => setApiUploadForm(f => ({ ...f, thumbnailPath: e.target.value }))}
                    placeholder="/thumbnails/cover.jpg"
                    style={{ width: '100%', padding: '9px 13px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                  视频描述
                </label>
                <textarea
                  value={apiUploadForm.description}
                  onChange={e => setApiUploadForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Product review and unboxing..."
                  rows={3}
                  style={{ width: '100%', padding: '9px 13px', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                disabled={apiUploading}
                style={{
                  width: '100%', padding: '12px', background: '#3b82f6', color: '#fff',
                  border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                  cursor: apiUploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8, opacity: apiUploading ? 0.7 : 1,
                }}
              >
                {apiUploading ? (
                  <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> 上传中...</>
                ) : (
                  <><Cloud size={18} /> 通过 API 上传到 YouTube</>
                )}
              </button>
            </form>

            {apiUploadMsg && (
              <div style={{
                marginTop: 14, padding: '12px 16px', borderRadius: 8, fontSize: 14,
                background: apiUploadMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : apiUploadMsg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                color: apiUploadMsg.type === 'success' ? '#16a34a' : apiUploadMsg.type === 'error' ? '#dc2626' : '#2563eb',
                border: `1px solid ${apiUploadMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : apiUploadMsg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
              }}>
                {apiUploadMsg.type === 'success' && <CheckCircle size={15} style={{ display: 'inline', marginRight: 6 }} />}
                {apiUploadMsg.type === 'error' && <XCircle size={15} style={{ display: 'inline', marginRight: 6 }} />}
                {apiUploadMsg.text}
              </div>
            )}

            <div style={{ marginTop: 16, padding: '12px 14px', background: '#f0f9ff', borderRadius: 8, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              <strong style={{ color: '#1e40af' }}>API 模式说明：</strong><br />
              ✅ <strong>无需浏览器</strong> — 使用 YouTube Data API v3 直接上传，服务器端运行<br />
              ✅ <strong>自动 Token 刷新</strong> — OAuth refresh_token 自动续期，授权一次长期有效<br />
              ⚠️ <strong>配额限制</strong> — 每日默认 10,000 单位，上传一个视频消耗 ~1,600 单位（约 6 个/天）<br />
              ⚠️ <strong>视频上限</strong> — 最大 128GB，支持 MP4/MOV/AVI 等格式<br />
              💡 如需增加配额，前往 Google Cloud Console 申请提升
            </div>
          </>
        )}
      </div>
    </div>
  );
}
