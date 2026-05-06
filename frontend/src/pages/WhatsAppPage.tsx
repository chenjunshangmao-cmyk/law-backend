/**
 * WhatsApp 中继引流管理页面
 * 用户管理跳转链接、查看统计数据
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'https://claw-backend-2026.onrender.com';

/** 带认证token的 fetch */
async function authFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  return res;
}

export default function WhatsAppPage() {
  const { user } = useAuth();
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    msg: '你好，我想咨询',
    pageTitle: '',
    companyName: '',
    description: '',
    buttonText: '立即咨询',
  });
  const [editingId, setEditingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [linksRes, statsRes] = await Promise.all([
        authFetch('/api/whatsapp/links'),
        authFetch('/api/whatsapp/stats'),
      ]);
      if (linksRes.ok) {
        const data = await linksRes.json();
        setLinks(data.data || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }
    } catch (err) {
      console.error('获取数据失败:', err);
      showToast('获取数据失败', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.phone.trim()) {
      showToast('请填写客户名称和手机号', 'error');
      return;
    }

    try {
      const url = editingId
        ? `/api/whatsapp/links/${editingId}`
        : `/api/whatsapp/links`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast(editingId ? '更新成功' : '创建成功', 'success');
        setShowForm(false);
        setEditingId(null);
        resetForm();
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || '操作失败', 'error');
      }
    } catch (err) {
      showToast('网络错误', 'error');
    }
  }

  async function handleDelete(linkId) {
    if (!confirm('确定删除这条链接吗？删除后不可恢复。')) return;
    try {
      const res = await authFetch(`/api/whatsapp/links/${linkId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('删除成功', 'success');
        fetchData();
      }
    } catch (err) {
      showToast('删除失败', 'error');
    }
  }

  async function handleReset(linkId) {
    try {
      const res = await authFetch(`/api/whatsapp/links/${linkId}/reset`, { method: 'POST' });
      if (res.ok) {
        showToast('计数已重置', 'success');
        fetchData();
      }
    } catch (err) {
      showToast('重置失败', 'error');
    }
  }

  function handleEdit(link) {
    setFormData({
      clientName: link.clientName,
      phone: link.phone,
      msg: link.msg || '',
      pageTitle: link.pageTitle || '',
      companyName: link.companyName || '',
      description: link.description || '',
      buttonText: link.buttonText || '立即咨询',
    });
    setEditingId(link.linkId);
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      clientName: '',
      phone: '',
      msg: '你好，我想咨询',
      pageTitle: '',
      companyName: '',
      description: '',
      buttonText: '立即咨询',
    });
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function showToast(msg, type = 'info') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const getLinkUrl = (linkId) => {
    // 跳转链接走后端（/go 路由在 claw-backend）
    const backendHost = import.meta.env.VITE_API_URL || 'https://claw-backend-2026.onrender.com';
    return `${backendHost}/go?id=${linkId}`;
  };

  const styles = {
    container: { maxWidth: 1200, margin: '0 auto', padding: '24px 16px' },
    header: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 24, flexWrap: 'wrap', gap: 12,
    },
    title: { fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: 0 },
    createBtn: {
      padding: '10px 24px', background: '#25D366', color: '#fff',
      border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
    },
    statsRow: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: 16, marginBottom: 28,
    },
    statCard: {
      background: '#fff', borderRadius: 12, padding: '16px 20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    statNum: { fontSize: 28, fontWeight: 700, color: '#1a1a2e' },
    statLabel: { fontSize: 13, color: '#888', marginTop: 4 },
    card: {
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16,
    },
    cardBody: { padding: '20px 24px' },
    cardRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      flexWrap: 'wrap', gap: 12,
    },
    linkInfo: { flex: 1, minWidth: 200 },
    clientName: { fontSize: 17, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 },
    phoneText: { fontSize: 14, color: '#666', marginBottom: 6 },
    linkUrl: {
      fontSize: 13, color: '#6366f1', wordBreak: 'break-all',
      cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6,
    },
    badge: {
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 500,
    },
    badgeActive: { background: '#e8f5e9', color: '#2e7d32' },
    badgeDisabled: { background: '#fce4ec', color: '#c62828' },
    actions: { display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 },
    iconBtn: {
      padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: 8,
      background: '#fff', cursor: 'pointer', fontSize: 13, color: '#555',
      display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
    },
    statsDetail: { marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 20, fontSize: 13, color: '#888' },
    // Form
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    },
    modal: {
      background: '#fff', borderRadius: 16, padding: 32, maxWidth: 520, width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflow: 'auto',
    },
    modalTitle: { fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 24 },
    formGroup: { marginBottom: 16 },
    label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 6 },
    input: {
      width: '100%', padding: '10px 14px', border: '1px solid #ddd',
      borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
      transition: 'border-color 0.15s',
    },
    textarea: {
      width: '100%', padding: '10px 14px', border: '1px solid #ddd',
      borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical',
      minHeight: 60, boxSizing: 'border-box',
    },
    formActions: { display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 },
    submitBtn: {
      padding: '10px 28px', background: '#25D366', color: '#fff',
      border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
    },
    cancelBtn: {
      padding: '10px 28px', background: '#f5f5f5', color: '#666',
      border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer',
    },
    // Toast
    toast: {
      position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
      padding: '12px 24px', borderRadius: 10, color: '#fff',
      fontSize: 14, fontWeight: 500, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    },
    tutorial: {
      background: '#fff', borderRadius: 14, padding: '20px 24px', marginBottom: 24,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e8f5e9',
    },
    tutorialTitle: { fontSize: 15, fontWeight: 600, color: '#2e7d32', marginBottom: 8 },
    tutorialText: { fontSize: 13, color: '#666', lineHeight: 1.7 },
    empty: { textAlign: 'center', padding: '60px 20px', color: '#999' },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>💬 WhatsApp 中继引流</h2>
        <button
          style={styles.createBtn}
          onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}
        >
          + 新建链接
        </button>
      </div>

      {/* 使用说明 */}
      <div style={styles.tutorial}>
        <div style={styles.tutorialTitle}>📖 使用说明</div>
        <div style={styles.tutorialText}>
          1. 创建链接 → 填写客户名称和 WhatsApp 手机号<br />
          2. 拿到生成的落地页链接 → 复制链接<br />
          3. 在 TikTok 广告后台「落地页」位置贴上链接<br />
          4. 客户点击广告 → 打开中间页 → 自动跳转到 WhatsApp
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statNum}>{stats.totalLinks}</div>
            <div style={styles.statLabel}>总链接数</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNum}>{stats.activeLinks}</div>
            <div style={styles.statLabel}>活跃链接</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNum}>{stats.totalClicks}</div>
            <div style={styles.statLabel}>总点击量</div>
          </div>
        </div>
      )}

      {/* Link List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>加载中...</div>
      ) : links.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🔗</div>
          <p>还没有创建任何链接</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>点击上方按钮创建第一个</p>
        </div>
      ) : (
        links.map(link => (
          <div key={link.linkId} style={styles.card}>
            <div style={styles.cardBody}>
              <div style={styles.cardRow}>
                <div style={styles.linkInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={styles.clientName}>{link.clientName}</span>
                    <span style={{
                      ...styles.badge,
                      ...(link.disabled ? styles.badgeDisabled : styles.badgeActive)
                    }}>
                      {link.disabled ? '已停用' : '使用中'}
                    </span>
                  </div>
                  <div style={styles.phoneText}>📞 {link.phone}</div>
                  {link.msg && <div style={{ fontSize: 13, color: '#888', marginBottom: 6 }}>💬 {link.msg}</div>}
                  <div
                    style={styles.linkUrl}
                    onClick={() => copyToClipboard(getLinkUrl(link.linkId))}
                    title="点击复制链接"
                  >
                    🔗 {getLinkUrl(link.linkId)}
                    <span style={{ fontSize: 11, color: copiedId === getLinkUrl(link.linkId) ? '#25D366' : '#999' }}>
                      {copiedId === getLinkUrl(link.linkId) ? '✓ 已复制' : '📋 复制'}
                    </span>
                  </div>
                </div>
                <div style={styles.actions}>
                  <button style={styles.iconBtn} onClick={() => handleEdit(link)}>✏️ 编辑</button>
                  <button style={styles.iconBtn} onClick={() => handleReset(link.linkId)}>🔄 重置</button>
                  <button
                    style={{ ...styles.iconBtn, color: '#e53935', borderColor: '#ffcdd2' }}
                    onClick={() => handleDelete(link.linkId)}
                  >🗑️ 删除</button>
                </div>
              </div>
              <div style={styles.statsDetail}>
                <span>👁️ 点击: {link.clicks || 0}</span>
                <span>📅 创建: {new Date(link.createdAt).toLocaleDateString()}</span>
                {link.lastClickAt && <span>🕐 最后点击: {new Date(link.lastClickAt).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
        ))
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>{editingId ? '编辑链接' : '创建新链接'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>客户名称 *</label>
                <input
                  style={styles.input}
                  value={formData.clientName}
                  onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="例如：王老板/TK广告客户A"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>WhatsApp 手机号 *</label>
                <input
                  style={styles.input}
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="例如：8613812345678"
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>含国家区号，如中国手机号请加 86</div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>自动欢迎语</label>
                <input
                  style={styles.input}
                  value={formData.msg}
                  onChange={e => setFormData({ ...formData, msg: e.target.value })}
                  placeholder="例如：你好，我想咨询产品"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>落地页标题</label>
                <input
                  style={styles.input}
                  value={formData.pageTitle}
                  onChange={e => setFormData({ ...formData, pageTitle: e.target.value })}
                  placeholder="留空自动生成"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>品牌名称</label>
                <input
                  style={styles.input}
                  value={formData.companyName}
                  onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="显示在落地页上方的品牌名"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>描述文案</label>
                <textarea
                  style={styles.textarea}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="显示在按钮上方的描述文字"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>按钮文字</label>
                <input
                  style={styles.input}
                  value={formData.buttonText}
                  onChange={e => setFormData({ ...formData, buttonText: e.target.value })}
                  placeholder="默认：立即咨询"
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={handleCancel}>取消</button>
                <button type="submit" style={styles.submitBtn}>
                  {editingId ? '保存修改' : '创建链接'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === 'error' ? '#e53935' : toast.type === 'success' ? '#25D366' : '#323232',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
