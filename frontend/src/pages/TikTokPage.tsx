import React, { useState, useEffect, useCallback } from 'react';
import { Play, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock, Upload, Video, Zap, Sparkles } from 'lucide-react';
import api from '../services/api';

// ============================================================
// 类型定义
// ============================================================
interface TikTokAccount {
  email: string;
  accountId?: string;
  status: 'logged_in' | 'not_logged_in' | 'checking' | string;
  sessionValid?: boolean;
  lastLogin?: string;
}

interface PublishForm {
  title: string;
  description: string;
  price: string;
  stock: string;
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
// 主页面
// ============================================================
export default function TikTokPage() {
  // 系统状态
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loadingSystem, setLoadingSystem] = useState(false);

  // 账号列表
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);

  // 登录表单
  const [loginEmail, setLoginEmail] = useState('');
  const [loginAccountId, setLoginAccountId] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginMsg, setLoginMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  // 发布表单
  const [publishEmail, setPublishEmail] = useState('');
  const [publishForm, setPublishForm] = useState<PublishForm>({
    title: '',
    description: '',
    price: '',
    stock: '100',
  });
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  // AI 生成状态
  const [productName, setProductName] = useState('');
  const [genStyle, setGenStyle] = useState('professional');
  const [genLoading, setGenLoading] = useState(false);
  const [genMsg, setGenMsg] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [genTextResult, setGenTextResult] = useState<{
    title?: string; description?: string; features?: string[]; keywords?: string[]
  } | null>(null);
  const [genImageResult, setGenImageResult] = useState<{
    description?: string; imageUrl?: string
  } | null>(null);

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
          const res = await api.browser.tiktok.status(acc.email, acc.accountId);
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

  // 加载保存的账号
  useEffect(() => {
    loadSystemStatus();
    // 尝试从后端获取已保存的账号列表
    loadSavedAccounts();
  }, [loadSystemStatus]);

  // 账号有变化时自动检查状态
  useEffect(() => {
    if (accounts.length > 0) {
      const timer = setTimeout(checkAllAccounts, 500);
      return () => clearTimeout(timer);
    }
  }, [accounts, checkAllAccounts]);

  // 从后端获取已保存的 TikTok 账号
  const loadSavedAccounts = async () => {
    try {
      const res = await api.accounts.list();
      const saved = (res.data || []).filter((a: any) => a.platform === 'tiktok');
      if (saved.length > 0) {
        setAccounts(saved.map((a: any) => ({
          email: a.username || a.email || '',
          accountId: a.accountId,
          status: 'checking',
          sessionValid: undefined,
        })));
        // 默认选中第一个
        if (!publishEmail && saved[0]) {
          setPublishEmail(saved[0].username || saved[0].email || '');
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
      setLoginMsg({ type: 'error', text: '请输入 TikTok 账号邮箱' });
      return;
    }
    setLoggingIn(true);
    setLoginMsg(null);
    try {
      const res = await api.browser.tiktok.login(loginEmail.trim(), loginAccountId.trim() || undefined);
      if (res.success) {
        setLoginMsg({ type: 'success', text: res.note || '浏览器已打开，请在浏览器中完成 TikTok 登录' });

        // 添加到账号列表
        const newAcc: TikTokAccount = {
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
            platform: 'tiktok',
            name: `TikTok ${loginEmail.trim()}`,
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
  const handleCheckAccount = async (acc: TikTokAccount) => {
    setAccounts(prev => prev.map(a => a.email === acc.email && a.accountId === acc.accountId
      ? { ...a, status: 'checking' } : a));
    try {
      const res = await api.browser.tiktok.status(acc.email, acc.accountId);
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

  // 发布产品
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishEmail.trim()) {
      setPublishMsg({ type: 'error', text: '请先选择要发布的 TikTok 账号' });
      return;
    }
    if (!publishForm.title.trim()) {
      setPublishMsg({ type: 'error', text: '请输入产品标题' });
      return;
    }
    setPublishing(true);
    setPublishMsg(null);
    try {
      const res = await api.browser.tiktok.publish({
        email: publishEmail.trim(),
        title: publishForm.title.trim(),
        description: publishForm.description.trim(),
        price: publishForm.price ? parseFloat(publishForm.price) : undefined,
        stock: publishForm.stock ? parseInt(publishForm.stock) : 100,
      });

      if (res.success) {
        setPublishMsg({
          type: 'success',
          text: res.message || '产品发布请求已提交！请等待浏览器自动化完成发布',
        });
        // 重置表单
        setPublishForm({ title: '', description: '', price: '', stock: '100' });
      } else if (res.needLogin) {
        setPublishMsg({ type: 'error', text: '该账号未登录，请先完成 TikTok 登录' });
      } else {
        setPublishMsg({ type: 'error', text: res.error || '发布失败' });
      }
    } catch (err: any) {
      setPublishMsg({ type: 'error', text: err.message });
    } finally {
      setPublishing(false);
    }
  };

  // 刷新系统状态
  const handleRefreshSystem = () => {
    loadSystemStatus();
    checkAllAccounts();
  };

  // AI 生成文案
  const handleGenText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setGenMsg({ type: 'error', text: '请输入产品名称' });
      return;
    }
    setGenLoading(true);
    setGenMsg(null);
    setGenTextResult(null);
    try {
      const res = await api.generate.text({
        prompt: '',
        productName: productName.trim(),
        productDescription: publishForm.description || undefined,
        platform: 'tiktok',
        style: genStyle,
      });
      if (res.success && res.data?.text) {
        const data = res.data.text;
        // 支持对象格式和纯文本格式
        const parsed = typeof data === 'string' ? tryParseJSON(data) : data;
        setGenTextResult(parsed || null);
        // 自动填充表单
        if (parsed?.title) setPublishForm(f => ({ ...f, title: parsed.title }));
        if (parsed?.description) setPublishForm(f => ({ ...f, description: parsed.description }));
        setGenMsg({ type: 'success', text: '文案生成成功，已自动填入表单！' });
      } else {
        setGenMsg({ type: 'error', text: res.error || '文案生成失败' });
      }
    } catch (err: any) {
      setGenMsg({ type: 'error', text: err.message });
    } finally {
      setGenLoading(false);
    }
  };

  // AI 生成图片描述
  const handleGenImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setGenMsg({ type: 'error', text: '请输入产品名称' });
      return;
    }
    setGenLoading(true);
    setGenMsg(null);
    setGenImageResult(null);
    try {
      const res = await api.generate.image({
        description: '',
        productName: productName.trim(),
        productDescription: publishForm.description || undefined,
        style: genStyle,
      });
      if (res.success && res.data) {
        setGenImageResult(res.data);
        setGenMsg({ type: 'success', text: '图片描述生成成功！' });
      } else {
        setGenMsg({ type: 'error', text: res.error || '图片描述生成失败' });
      }
    } catch (err: any) {
      setGenMsg({ type: 'error', text: err.message });
    } finally {
      setGenLoading(false);
    }
  };

  // 辅助：尝试解析 JSON
  function tryParseJSON(str: string) {
    try {
      const r = JSON.parse(str);
      // 提取可能的 title/description
      if (typeof r === 'object') return r;
    } catch {}
    // 尝试从文本中提取 JSON
    const m = str.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch {}
    }
    return null;
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>

      {/* 页面标题 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 30 }}>🎵</span>
          TikTok Shop 管理
        </h1>
        <p style={{ color: '#64748b', margin: '6px 0 0', fontSize: 14 }}>
          浏览器自动化 · 手动登录 · 自动发布产品
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

      {/* ========== AI 生成区域 ========== */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24, marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="#f59e0b" />
          AI 文案 & 图片生成
        </h2>

        {/* 产品名称输入 */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
            产品名称 *
          </label>
          <input
            type="text"
            value={productName}
            onChange={e => setProductName(e.target.value)}
            placeholder="如: Kids Summer Cotton Dress"
            style={{
              width: '100%', padding: '9px 13px', borderRadius: 8,
              border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = '#f59e0b'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* 文案风格选择 */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
            文案风格
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { value: 'professional', label: '专业简洁' },
              { value: 'casual', label: '轻松活泼' },
              { value: 'youth', label: '年轻潮流' },
              { value: 'luxury', label: '高端奢华' },
            ].map(s => (
              <button
                key={s.value}
                onClick={() => setGenStyle(s.value)}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: 13,
                  border: genStyle === s.value ? '2px solid #f59e0b' : '1.5px solid #e5e7eb',
                  background: genStyle === s.value ? '#fef3c7' : '#fff',
                  color: genStyle === s.value ? '#92400e' : '#64748b',
                  cursor: 'pointer', fontWeight: genStyle === s.value ? 600 : 400,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI 按钮组 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <button
            onClick={handleGenText}
            disabled={genLoading}
            style={{
              flex: 1, padding: '10px 16px', background: '#f59e0b', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: genLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: genLoading ? 0.7 : 1,
            }}
          >
            {genLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={15} />}
            AI 生成文案
          </button>
          <button
            onClick={handleGenImage}
            disabled={genLoading}
            style={{
              flex: 1, padding: '10px 16px', background: '#8b5cf6', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
              cursor: genLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: genLoading ? 0.7 : 1,
            }}
          >
            {genLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Video size={15} />}
            AI 生成图片描述
          </button>
        </div>

        {/* 生成结果消息 */}
        {genMsg && (
          <div style={{
            marginBottom: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13,
            background: genMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: genMsg.type === 'success' ? '#16a34a' : '#dc2626',
            border: `1px solid ${genMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            {genMsg.type === 'success' && <CheckCircle size={14} style={{ display: 'inline', marginRight: 6 }} />}
            {genMsg.type === 'error' && <XCircle size={14} style={{ display: 'inline', marginRight: 6 }} />}
            {genMsg.text}
          </div>
        )}

        {/* 文案生成结果 */}
        {genTextResult && (
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 8 }}>📝 生成的文案</div>
            {genTextResult.title && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>标题：</span>
                <span style={{ fontSize: 14, color: '#1e293b' }}>{genTextResult.title}</span>
              </div>
            )}
            {genTextResult.description && (
              <div style={{ marginBottom: 8, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                {genTextResult.description}
              </div>
            )}
            {genTextResult.features && genTextResult.features.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>产品特点：</span>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {genTextResult.features.map((f, i) => <li key={i} style={{ fontSize: 13, color: '#475569' }}>{f}</li>)}
                </ul>
              </div>
            )}
            {genTextResult.keywords && genTextResult.keywords.length > 0 && (
              <div>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>关键词：</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {genTextResult.keywords.map((k, i) => (
                    <span key={i} style={{
                      padding: '2px 10px', borderRadius: 12, fontSize: 11,
                      background: '#e0f2fe', color: '#0369a1',
                    }}>#{k}</span>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => setGenTextResult(null)}
              style={{
                marginTop: 10, background: 'none', border: '1px solid #e5e7eb',
                borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#64748b',
              }}
            >
              收起
            </button>
          </div>
        )}

        {/* 图片描述结果 */}
        {genImageResult && (
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, border: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 8 }}>🎨 图片描述</div>
            {genImageResult.description && (
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{genImageResult.description}</div>
            )}
            {genImageResult.imageUrl && (
              <img
                src={genImageResult.imageUrl}
                alt="AI生成的图片"
                style={{ marginTop: 10, maxWidth: '100%', borderRadius: 8, maxHeight: 200 }}
                onError={e => (e.currentTarget.style.display = 'none')}
              />
            )}
            <button
              onClick={() => setGenImageResult(null)}
              style={{
                marginTop: 10, background: 'none', border: '1px solid #e5e7eb',
                borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#64748b',
              }}
            >
              收起
            </button>
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
          <Play size={18} color="#ef4444" />
          步骤1：TikTok 账号登录
        </h2>

        <form onSubmit={handleLogin} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              TikTok 账号邮箱
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
              onFocus={e => e.target.style.borderColor = '#ef4444'}
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
              placeholder="如: shop1"
              style={{
                width: '100%', padding: '9px 13px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = '#ef4444'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <button
            type="submit"
            disabled={loggingIn}
            style={{
              padding: '9px 20px', background: '#ef4444', color: '#fff',
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
                    <span style={{ fontSize: 20 }}>🎵</span>
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
                        setPublishEmail(acc.email);
                        setAccounts(prev => prev.filter(a => a.email !== acc.email || a.accountId !== acc.accountId));
                      }}
                      disabled={acc.status !== 'logged_in'}
                      title="选择此账号发布"
                      style={{
                        background: acc.status === 'logged_in' ? '#ef4444' : '#e5e7eb',
                        border: 'none', borderRadius: 6,
                        padding: '4px 10px', fontSize: 12, cursor: acc.status === 'logged_in' ? 'pointer' : 'not-allowed',
                        color: '#fff', fontWeight: 600,
                      }}
                    >
                      发布
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========== 发布区域 ========== */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Upload size={18} color="#8b5cf6" />
          步骤2：发布产品到 TikTok Shop
        </h2>

        <form onSubmit={handlePublish}>
          {/* 账号选择 */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              发布到账号 *
            </label>
            <select
              value={publishEmail}
              onChange={e => setPublishEmail(e.target.value)}
              style={{
                width: '100%', padding: '9px 13px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                background: '#fff', cursor: 'pointer',
              }}
            >
              <option value="">-- 选择已登录的 TikTok 账号 --</option>
              {accounts.filter(a => a.status === 'logged_in').map((acc, i) => (
                <option key={i} value={acc.email}>
                  🎵 {acc.email}{acc.accountId ? ` (${acc.accountId})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 产品信息 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                产品标题 *
              </label>
              <input
                type="text"
                value={publishForm.title}
                onChange={e => setPublishForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Kids Fashion Dress Summer 2026"
                style={{
                  width: '100%', padding: '9px 13px', borderRadius: 8,
                  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                美元价格 ($)
              </label>
              <input
                type="number"
                value={publishForm.price}
                onChange={e => setPublishForm(f => ({ ...f, price: e.target.value }))}
                placeholder="19.99"
                step="0.01"
                style={{
                  width: '100%', padding: '9px 13px', borderRadius: 8,
                  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
                库存数量
              </label>
              <input
                type="number"
                value={publishForm.stock}
                onChange={e => setPublishForm(f => ({ ...f, stock: e.target.value }))}
                placeholder="100"
                style={{
                  width: '100%', padding: '9px 13px', borderRadius: 8,
                  border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 5, fontWeight: 500 }}>
              产品描述
            </label>
            <textarea
              value={publishForm.description}
              onChange={e => setPublishForm(f => ({ ...f, description: e.target.value }))}
              placeholder="High quality summer dress for kids..."
              rows={3}
              style={{
                width: '100%', padding: '9px 13px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = '#8b5cf6'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <button
            type="submit"
            disabled={publishing}
            style={{
              width: '100%', padding: '12px', background: '#8b5cf6', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
              cursor: publishing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, opacity: publishing ? 0.7 : 1,
            }}
          >
            {publishing ? (
              <>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                发布中，请稍候...
              </>
            ) : (
              <>
                <Upload size={18} />
                立即发布到 TikTok Shop
              </>
            )}
          </button>
        </form>

        {publishMsg && (
          <div style={{
            marginTop: 14, padding: '12px 16px', borderRadius: 8, fontSize: 14,
            background: publishMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : publishMsg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
            color: publishMsg.type === 'success' ? '#16a34a' : publishMsg.type === 'error' ? '#dc2626' : '#2563eb',
            border: `1px solid ${publishMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : publishMsg.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
          }}>
            {publishMsg.type === 'success' && <CheckCircle size={15} style={{ display: 'inline', marginRight: 6 }} />}
            {publishMsg.type === 'error' && <XCircle size={15} style={{ display: 'inline', marginRight: 6 }} />}
            {publishMsg.text}
          </div>
        )}

        <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
          <strong style={{ color: '#334155' }}>使用流程：</strong><br />
          1️⃣ 在上方输入 TikTok 账号邮箱，点击「打开浏览器登录」<br />
          2️⃣ 在弹出的浏览器中手动登录 TikTok（只需操作一次）<br />
          3️⃣ 登录成功后，选择该账号填写产品信息并发布<br />
          ⚠️ 首次使用需手动登录，之后浏览器会自动复用 Session
        </div>
      </div>
    </div>
  );
}
