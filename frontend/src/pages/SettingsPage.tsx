/**
 * SettingsPage - 设置页
 */
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    company: '',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    orderAlert: true,
    taskComplete: true,
    systemNotice: true,
  });

  async function handleSaveProfile() {
    setSaving(true);
    setMessage(null);
    // 模拟保存
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setMessage({ type: 'success', text: '保存成功！' });
  }

  const tabs = [
    { id: 'profile', label: '👤 个人信息', desc: '管理账户基本信息' },
    { id: 'notification', label: '🔔 通知设置', desc: '配置消息通知方式' },
    { id: 'platform', label: '🔗 平台账号', desc: '管理已连接的店铺账号' },
    { id: 'security', label: '🔒 安全设置', desc: '密码和安全选项' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>⚙️ 设置</h2>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 20,
          background: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: message.type === 'success' ? '#059669' : '#dc2626',
          border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
        }}>{message.text}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
        {/* 侧边导航 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '12px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              textAlign: 'left', fontSize: 14, fontWeight: 600,
              background: activeTab === tab.id ? '#eff6ff' : 'transparent',
              color: activeTab === tab.id ? '#2563eb' : '#6b7280',
              transition: 'all 0.2s',
            }}>
              {tab.label}
              <div style={{ fontSize: 12, fontWeight: 400, marginTop: 2, color: activeTab === tab.id ? '#93c5fd' : '#9ca3af' }}>{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb' }}>
          {activeTab === 'profile' && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>个人信息</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { key: 'name', label: '姓名', placeholder: '您的姓名' },
                  { key: 'email', label: '邮箱', placeholder: 'your@email.com', type: 'email' },
                  { key: 'phone', label: '手机号', placeholder: '13800138000' },
                  { key: 'company', label: '公司名称', placeholder: '深圳市xxx贸易有限公司' },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
                    <input
                      type={type || 'text'}
                      value={(profile as any)[key]}
                      onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleSaveProfile} disabled={saving} style={{
                marginTop: 20, padding: '10px 24px', background: saving ? '#9ca3af' : '#059669',
                color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600
              }}>
                {saving ? '保存中...' : '💾 保存修改'}
              </button>
            </>
          )}

          {activeTab === 'notification' && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>通知设置</h3>
              {[
                { key: 'email', label: '📧 邮件通知', desc: '接收重要通知到邮箱' },
                { key: 'push', label: '📱 推送通知', desc: '浏览器推送通知' },
                { key: 'orderAlert', label: '🚨 订单异常提醒', desc: '订单状态异常时通知' },
                { key: 'taskComplete', label: '✅ 任务完成通知', desc: '自动化任务执行完成后通知' },
                { key: 'systemNotice', label: '📢 系统公告', desc: '接收系统更新和维护公告' },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>{desc}</div>
                  </div>
                  <ToggleSwitch
                    checked={(notifications as any)[key]}
                    onChange={v => setNotifications(n => ({ ...n, [key]: v }))}
                  />
                </div>
              ))}
            </>
          )}

          {activeTab === 'platform' && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>已连接平台</h3>
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔗</div>
                <div style={{ fontSize: 14 }}>前往「店铺账号」页面管理已连接的店铺账号</div>
                <a href="/accounts" style={{ display: 'inline-block', marginTop: 12, padding: '8px 20px', background: '#eff6ff', color: '#2563eb', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>前往管理 →</a>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>安全设置</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>🔑 修改密码</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>上次修改：从未</div>
                  </div>
                  <button style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>修改</button>
                </div>
                <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>🛡️ 两步验证</div>
                    <div style={{ fontSize: 13, color: '#dc2626', marginTop: 2 }}>未开启（建议开启）</div>
                  </div>
                  <button style={{ padding: '8px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#2563eb' }}>开启</button>
                </div>
                <div style={{ padding: 16, border: '1px solid #fee2e2', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>🚪 退出所有设备</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>立即登出所有登录设备</div>
                  </div>
                  <button onClick={logout} style={{ padding: '8px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#dc2626' }}>退出</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: checked ? '#059669' : '#d1d5db', position: 'relative', transition: 'background 0.2s',
    }}>
      <span style={{
        position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        left: checked ? 22 : 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}
