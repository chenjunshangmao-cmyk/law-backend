import React, { useState, useEffect, useCallback } from 'react';
import { Play, RefreshCw, CheckCircle, XCircle, Upload, Video, Zap, Globe, Lock, EyeOff, Image, Send } from 'lucide-react';
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

  // OAuth 授权
  const [authAccounts, setAuthAccounts] = useState<any[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  // 图文发布
  const [communityForm, setCommunityForm] = useState({
    email: '',
    text: '',
    title: '',
    images: '',
  });
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  const loadAuthAccounts = useCallback(async () => {
    try { const r = await api.browser.youtube.listAccounts(); if (r?.accounts) setAuthAccounts(r.accounts); } catch {}
  }, []);
  const startOAuth = async () => {
    setAuthLoading(true); setAuthMsg(null);
    try {
      const res = await api.browser.youtube.getAuthUrl();
      if (!res?.authUrl) { setAuthMsg({type:'error',text:'获取授权链接失败'}); return; }
      const w=600,h=700,popup=window.open(res.authUrl,'YouTubeOAuth',`width=${w},height=${h},left=${(screen.width-w)/2},top=${(screen.height-h)/2}`);
      const handler = (e:MessageEvent) => {
        if (e.data?.type==='youtube_auth_success') {
          setAuthMsg({type:'success',text:`✅ ${e.data.data?.email||'授权成功'}！`});
          loadAuthAccounts(); window.removeEventListener('message',handler);
        }
      };
      window.addEventListener('message',handler);
      setTimeout(()=>{ if(popup&&!popup.closed){ setAuthMsg({type:'error',text:'授权超时'}); window.removeEventListener('message',handler); } },30000);
    } catch(e:any) { setAuthMsg({type:'error',text:e.message||'授权失败'}); }
    finally { setAuthLoading(false); }
  };
  useEffect(() => { loadAuthAccounts(); }, [loadAuthAccounts]);

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

    // 判断是 OAuth 账号还是浏览器账号
    const oauthAcc = authAccounts.find((a: any) => a.email === uploadEmail.trim());
    
    try {
      if (oauthAcc?.channelId) {
        // ✅ OAuth 账号 → 使用 YouTube Data API 直接上传（无需浏览器）
        setUploadMsg({ type: 'info', text: '📡 使用 YouTube API 上传中...' });
        const res = await api.youtube.upload({
          channelId: oauthAcc.channelId,
          videoPath: uploadForm.videoPath.trim(),
          title: uploadForm.title.trim(),
          description: uploadForm.description.trim(),
          privacyStatus: uploadForm.privacy,
        });
        if (res.success) {
          setUploadMsg({ type: 'success', text: `✅ 上传成功！视频ID: ${res.data?.videoId || ''}` });
          setUploadForm({ videoPath: '', title: '', description: '', privacy: 'public' });
        } else {
          setUploadMsg({ type: 'error', text: res.error || '上传失败' });
        }
      } else {
        // 🖥️ 浏览器账号 → 使用浏览器自动化上传
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
      }
    } catch (err: any) {
      setUploadMsg({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  // 发布图文帖子
  const handlePostCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!communityForm.email.trim()) {
      setPostMsg({ type: 'error', text: '请先选择要发布的 YouTube 账号' });
      return;
    }
    if (!communityForm.text.trim()) {
      setPostMsg({ type: 'error', text: '请输入帖子内容' });
      return;
    }
    setPosting(true);
    setPostMsg(null);
    try {
      const imageList = communityForm.images.trim()
        ? communityForm.images.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const res = await api.browser.youtube.post({
        email: communityForm.email.trim(),
        text: communityForm.text.trim(),
        title: communityForm.title.trim() || undefined,
        images: imageList.length > 0 ? imageList : undefined,
      });

      if (res.success) {
        setPostMsg({ type: 'success', text: res.message || '社区帖子已发布！' });
        setCommunityForm({ email: '', text: '', title: '', images: '' });
      } else if (res.needLogin) {
        setPostMsg({ type: 'error', text: '该账号未登录，请先完成 YouTube 登录' });
      } else {
        setPostMsg({ type: 'error', text: res.error || '发布失败' });
      }
    } catch (err: any) {
      setPostMsg({ type: 'error', text: err.message });
    } finally {
      setPosting(false);
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

      {/* ========== Google OAuth 授权（推荐）========== */}
      <div style={{background:'linear-gradient(135deg,#f0f7ff,#e8f0fe)',borderRadius:14,padding:24,marginBottom:20,boxShadow:'0 1px 3px rgba(0,0,0,0.08)',border:'2px solid #4285f4'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h2 style={{fontSize:16,fontWeight:700,color:'#1a1a2e',margin:'0 0 4px'}}>🔐 Google 授权登录 <span style={{fontSize:11,background:'#4285f4',color:'#fff',padding:'2px 8px',borderRadius:10}}>推荐</span></h2>
            <p style={{color:'#64748b',fontSize:13,margin:0}}>一键授权，无需密码，Token 自动刷新</p>
          </div>
          <button onClick={startOAuth} disabled={authLoading}
            style={{padding:'10px 22px',background:'#4285f4',color:'#fff',border:'none',borderRadius:8,fontSize:14,fontWeight:600,cursor:'pointer',opacity:authLoading?0.6:1}}>
            {authLoading?'授权中...':'🔑 Google 授权'}
          </button>
        </div>
        {authMsg&&(<div style={{marginTop:12,padding:'8px 14px',borderRadius:8,fontSize:13,background:authMsg.type==='error'?'#fef2f2':authMsg.type==='success'?'#f0fdf4':'#eff6ff',color:authMsg.type==='error'?'#dc2626':authMsg.type==='success'?'#16a34a':'#2563eb'}}>{authMsg.text}</div>)}
        {authAccounts.length>0&&(<div style={{marginTop:16}}><div style={{fontSize:13,fontWeight:600,color:'#64748b',marginBottom:8}}>已授权账号：</div>
          {authAccounts.map((a:any)=>(<div key={a.channelId||a.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'#fff',borderRadius:8,marginBottom:6,border:'1px solid #e5e7eb'}}>
            {a.thumbnail&&<img src={a.thumbnail} alt="" style={{width:28,height:28,borderRadius:'50%'}}/>}
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:'#1a1a2e'}}>{a.channelTitle||a.email}</div><div style={{fontSize:12,color:'#94a3b8'}}>{a.email}</div></div>
            <StatusBadge ok={a.valid!==false}>{a.valid!==false?'有效':'已过期'}</StatusBadge>
          </div>))}
        </div>)}
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
        {(accounts.length > 0 || authAccounts.length > 0) && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: 1 }}>
              已管理的账号
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* 浏览器自动化账号 */}
              {accounts.map((acc, i) => (
                <div key={`browser-${i}`} style={{
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
              {/* OAuth 授权账号 */}
              {authAccounts.map((a: any, i: number) => (
                <div key={`oauth-${i}`} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: '#f0f7ff', borderRadius: 10, border: '1px solid #4285f4',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {a.thumbnail ? <img src={a.thumbnail} alt="" style={{width:32,height:32,borderRadius:'50%'}}/> : <span style={{fontSize:20}}>📺</span>}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{a.channelTitle || a.email}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.email}{a.channelId ? ` · ${a.channelId}` : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge ok={a.valid !== false}>{a.valid !== false ? '有效' : '已过期'}</StatusBadge>
                    <button
                      onClick={() => setUploadEmail(a.email)}
                      disabled={a.valid === false}
                      style={{
                        background: a.valid !== false ? '#FF0000' : '#e5e7eb',
                        border: 'none', borderRadius: 6,
                        padding: '4px 10px', fontSize: 12, cursor: a.valid !== false ? 'pointer' : 'not-allowed',
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
              <option value="">-- 选择 YouTube 账号 --</option>
              {/* 浏览器自动化账号（已登录） */}
              {accounts.filter(a => a.status === 'logged_in').length > 0 && (
                <optgroup label="🖥️ 浏览器登录账号">
                  {accounts.filter(a => a.status === 'logged_in').map((acc, i) => (
                    <option key={`browser-${i}`} value={acc.email}>
                      📹 {acc.email}{acc.accountId ? ` (${acc.accountId})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              {/* Google OAuth 授权账号 */}
              {authAccounts.length > 0 && (
                <optgroup label="🔐 Google OAuth 授权账号">
                  {authAccounts.filter(a => a.valid !== false).map((a: any, i: number) => (
                    <option key={`oauth-${i}`} value={a.email}>
                      📺 {a.channelTitle || a.email} {a.valid === false ? '(Token 已过期)' : ''}
                    </option>
                  ))}
                </optgroup>
              )}
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
          1️⃣ 点击上方「🔑 Google 授权」完成 OAuth 一键授权<br />
          2️⃣ 或在上方输入 YouTube 账号邮箱，点击「打开浏览器登录」<br />
          3️⃣ 授权/登录成功后，选择该账号，填写视频路径、标题等信息并上传<br />
          ⚠️ OAuth 账号走 YouTube API 直传（支持），浏览器账号走浏览器自动化<br />
          ⚠️ videoPath 必须是服务器上存在的视频文件路径（如 /videos/output.mp4）
        </div>
      </div>

      {/* ========== 图文发布（Community Post）========== */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24, marginTop: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image size={18} color="#FF0000" />
          发布社区帖子（图文）
        </h2>

        <form onSubmit={handlePostCommunity}>
          {/* 账号选择 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              发布到账号 *
            </label>
            <select
              value={communityForm.email}
              onChange={e => setCommunityForm(f => ({ ...f, email: e.target.value }))}
              style={{
                width: '100%', padding: '9px 13px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                background: '#fff', cursor: 'pointer',
              }}
            >
              <option value="">-- 选择 YouTube 账号 --</option>
              {/* 浏览器自动化账号 */}
              {accounts.filter(a => a.status === 'logged_in').length > 0 && (
                <optgroup label="🖥️ 浏览器登录账号">
                  {accounts.filter(a => a.status === 'logged_in').map((acc, i) => (
                    <option key={`cm-browser-${i}`} value={acc.email}>
                      📹 {acc.email}
                    </option>
                  ))}
                </optgroup>
              )}
              {/* OAuth 授权账号 */}
              {authAccounts.length > 0 && (
                <optgroup label="🔐 OAuth 授权账号">
                  {authAccounts.filter(a => a.valid !== false).map((a: any, i: number) => (
                    <option key={`cm-oauth-${i}`} value={a.email}>
                      📺 {a.channelTitle || a.email}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* 帖子标题 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              帖子标题 <span style={{ fontWeight: 400, color: '#94a3b8' }}>（选填）</span>
            </label>
            <input
              type="text"
              value={communityForm.title}
              onChange={e => setCommunityForm(f => ({ ...f, title: e.target.value }))}
              placeholder="新品发布、限时优惠..."
              style={{
                width: '100%', padding: '9px 13px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#FF0000'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* 帖子内容 */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              帖子内容 *
            </label>
            <textarea
              value={communityForm.text}
              onChange={e => setCommunityForm(f => ({ ...f, text: e.target.value }))}
              placeholder="写点什么吧... 可以加emoji、换行&#10;支持多段文字哦~"
              rows={5}
              style={{
                width: '100%', padding: '9px 13px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = '#FF0000'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* 图片路径 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              图片路径 <span style={{ fontWeight: 400, color: '#94a3b8' }}>（选填，逗号分隔，服务器路径）</span>
            </label>
            <input
              type="text"
              value={communityForm.images}
              onChange={e => setCommunityForm(f => ({ ...f, images: e.target.value }))}
              placeholder="/uploads/product1.jpg, /uploads/product2.jpg"
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
            disabled={posting}
            style={{
              width: '100%', padding: '12px', background: '#FF0000', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: posting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, opacity: posting ? 0.7 : 1,
            }}
          >
            {posting ? (
              <>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                发布中...
              </>
            ) : (
              <>
                <Send size={18} />
                发布图文帖子
              </>
            )}
          </button>
        </form>

        {postMsg && (
          <div style={{
            marginTop: 14, padding: '12px 16px', borderRadius: 8, fontSize: 14,
            background: postMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : postMsg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
            color: postMsg.type === 'success' ? '#16a34a' : postMsg.type === 'error' ? '#dc2626' : '#2563eb',
            border: `1px solid ${postMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : postMsg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
          }}>
            {postMsg.type === 'success' && <CheckCircle size={15} style={{ display: 'inline', marginRight: 6 }} />}
            {postMsg.type === 'error' && <XCircle size={15} style={{ display: 'inline', marginRight: 6 }} />}
            {postMsg.text}
          </div>
        )}

        <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
          <strong style={{ color: '#334155' }}>图文发布流程：</strong><br />
          1️⃣ 先完成 YouTube 登录或 OAuth 授权<br />
          2️⃣ 选择已登录/已授权的账号<br />
          3️⃣ 填写帖子内容（支持 emoji、换行、@提及）<br />
          4️⃣ 可选：添加图片路径（服务器上图片文件的路径，逗号分隔，最多5张）<br />
          ⚠️ 图文发布使用浏览器自动化，需在步骤1先完成登录
        </div>
      </div>
    </div>
  );
}
