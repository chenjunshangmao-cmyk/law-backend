import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('请输入姓名'); setLoading(false); return; }
        await register(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🦞</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: 2 }}>CLAW</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>外贸智能工具平台</div>
        </div>

        {/* 切换 Tab */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.08)',
          borderRadius: 10, padding: 4, marginBottom: 28,
        }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
              flex: 1, padding: '8px 0', borderRadius: 7, fontSize: 14, fontWeight: 600,
              background: mode === m ? 'rgba(99,102,241,0.9)' : 'transparent',
              color: mode === m ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s',
              border: 'none', cursor: 'pointer',
            }}>
              {m === 'login' ? '登录' : '注册'}
            </button>
          ))}
        </div>

        {/* 错误提示 */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '10px 14px', color: '#fca5a5',
            fontSize: 13, marginBottom: 20,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 6 }}>
                姓名
              </label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="请输入您的姓名"
                required
                style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 6 }}>
              邮箱
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="请输入邮箱地址"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 6 }}>
              密码
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'register' ? '至少6位密码' : '请输入密码'}
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              marginTop: 8,
              padding: '14px 0', borderRadius: 10,
              background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              color: '#fff', fontSize: 16, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', display: 'inline-block',
                }} />
                {mode === 'login' ? '登录中...' : '注册中...'}
              </>
            ) : (
              mode === 'login' ? '登录' : '创建账号'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 14,
  outline: 'none',
};
