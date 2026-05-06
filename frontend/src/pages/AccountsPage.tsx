import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, TestTube2, Settings, CheckCircle, XCircle, AlertCircle, ExternalLink, Key, ShieldCheck } from 'lucide-react';
import api, { authFetch } from '../services/api';
import { Account, PLATFORM_CONFIG } from '../types';

const PLATFORMS = Object.keys(PLATFORM_CONFIG);

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // 添加账号表单
  const [form, setForm] = useState({
    platform: 'tiktok',
    name: '',
    username: '',
    email: '',
    password: '',
    // OZON API 授权字段
    clientId: '',
    apiKey: '',
  });

  // 测试中的账号 ID
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // OZON 同步数据缓存
  const [syncData, setSyncData] = useState<Record<string, any>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.accounts.list();
      const backendAccounts: Account[] = res.data || [];
      
      // 🔵 同时加载 YouTube OAuth 授权的账号（存在 youtube_authorizations 表，不在 accounts 表）
      let ytOauthAccounts: Account[] = [];
      try {
        const ytRes = await api.browser.youtube.listAccounts();
        const oauthList = ytRes?.accounts || [];
        ytOauthAccounts = oauthList.map((a: any) => ({
          id: `yt-oauth-${a.channelId || a.id}`,
          platform: 'youtube',
          name: a.channelTitle || a.email || 'YouTube 频道',
          username: a.email || '',
          status: (a.tokenValid !== false && a.valid !== false) ? 'active' as Account['status'] : 'expired' as Account['status'],
          createdAt: a.createdAt || new Date().toISOString(),
          authMethod: 'oauth',
          account_data: {
            channelId: a.channelId,
            channelTitle: a.channelTitle,
            email: a.email,
            thumbnail: a.thumbnail,
            expiresAt: a.expiresAt,
          },
        }));
      } catch { /* YouTube OAuth 不可用时忽略 */ }
      
      // 同时加载小红书账号（仅从 localStorage 读取，不查桥接状态避免触发浏览器导航）
      const xhsAccounts: Account[] = [];
      try {
        const saved = localStorage.getItem('xhs_mcp_accounts');
        const ids: string[] = saved ? JSON.parse(saved) : [];
        if (!ids.includes('default')) ids.unshift('default');
        for (const id of ids) {
          xhsAccounts.push({
            id: `xhs-${id}`,
            platform: 'xiaohongshu',
            name: id === 'default' ? '小红书默认账号' : id,
            username: id,
            status: 'unknown' as Account['status'],
            createdAt: new Date().toISOString(),
          });
        }
      } catch { /* localStorage 读取失败 */ }
      
      // 合并：backend + YouTube OAuth + 小红书（去重：如果 backend 已有 YouTube OAuth 账号则跳过）
      const existingYtIds = new Set(backendAccounts
        .filter(a => a.platform === 'youtube')
        .map(a => a.id));
      const dedupedYt = ytOauthAccounts.filter(a => !existingYtIds.has(a.id));
      setAccounts([...backendAccounts, ...dedupedYt, ...xhsAccounts]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 判断当前选择平台类型
  const isOzonPlatform = form.platform === 'ozon';
  const isYouTubePlatform = form.platform === 'youtube';
  const isXhsPlatform = form.platform === 'xiaohongshu';

  // YouTube OAuth 授权（弹窗方式）
  const handleYouTubeAuth = async () => {
    const name = form.name || 'YouTube 账号';
    if (!name) { setAddError('请输入账号名称'); return; }
    setAddLoading(true);
    setAddError('');
    try {
      const res = await api.accounts.youtubeAuthorize({ name });
      const authUrl = res?.data?.authUrl;
      if (!authUrl) { throw new Error('获取授权链接失败'); }

      // 打开 OAuth 弹窗
      const popup = window.open(authUrl, 'youtube-auth',
        'width=600,height=700,menubar=no,toolbar=no,location=yes,status=yes');

      if (!popup) {
        setAddError('弹窗被浏览器拦截，请允许弹窗后重试');
        return;
      }

      // 监听 postMessage 回调
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'youtube_auth_success') {
          window.removeEventListener('message', handleMessage);
          setShowAdd(false);
          setForm({ platform: 'tiktok', name: '', username: '', email: '', password: '', clientId: '', apiKey: '' });
          loadAccounts();
          alert(`YouTube 账号「${event.data?.data?.channelTitle || ''}」绑定成功！`);
        }
      };
      window.addEventListener('message', handleMessage);

      // 超时清理
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        setAddLoading(false);
      }, 120000);

    } catch (e: any) {
      setAddError(e.message || 'YouTube 授权失败');
      setAddLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    // YouTube 走 OAuth 弹窗
    if (isYouTubePlatform) {
      return handleYouTubeAuth();
    }

    // OZON 平台走 API 授权流程
    if (isOzonPlatform) {
      if (!form.name || !form.clientId || !form.apiKey) {
        setAddError('请填写：账号名称、Client ID、API Key');
        return;
      }
      setAddLoading(true);
      setAddError('');
      try {
        const res = await api.accounts.ozonAuthorize({
          name: form.name,
          clientId: form.clientId,
          apiKey: form.apiKey,
        });

        setShowAdd(false);
        setForm({
          platform: 'tiktok', name: '', username: '', email: '', password: '',
          clientId: '', apiKey: '',
        });
        await loadAccounts();
        alert(res?.message || 'OZON 账号授权成功！');
      } catch (e: any) {
        setAddError(e.message || 'OZON 授权失败');
      } finally {
        setAddLoading(false);
      }
      return;
    }

    // 小红书：跳转到小红书页面进行扫码登录
    if (isXhsPlatform) {
      setShowAdd(false);
      window.location.href = '/xiaohongshu';
      return;
    }

    // 其他平台走原有逻辑
    if (!form.name) {
      setAddError('请输入账号名称');
      return;
    }

    setAddLoading(true);
    setAddError('');
    try {
      const credentials: any = {};
      if (form.email) credentials.email = form.email;
      if (form.password) credentials.password = form.password;

      await api.accounts.create({
        platform: form.platform,
        name: form.name,
        username: form.username || undefined,
        credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
      });

      setShowAdd(false);
      setForm({ platform: 'tiktok', name: '', username: '', email: '', password: '', clientId: '', apiKey: '' });
      await loadAccounts();
    } catch (e: any) {
      setAddError(e.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此账号？')) return;
    
    // YouTube OAuth 账号：调用撤销授权 API
    if (id.startsWith('yt-oauth-')) {
      try {
        // Extract channelId from id format: yt-oauth-{channelId}
        const channelId = id.replace('yt-oauth-', '');
        await authFetch(`/api/auth/youtube/accounts/${encodeURIComponent(channelId)}`, { method: 'DELETE' });
        await loadAccounts();
      } catch (e: any) {
        alert(e.message);
      }
      return;
    }
    
    // 小红书账号：从 localStorage 删除
    if (id.startsWith('xhs-')) {
      const accountId = id.replace('xhs-', '');
      try {
        const saved = localStorage.getItem('xhs_mcp_accounts');
        if (saved) {
          const ids: string[] = JSON.parse(saved);
          const updated = ids.filter(i => i !== accountId);
          localStorage.setItem('xhs_mcp_accounts', JSON.stringify(updated));
        }
        await loadAccounts();
      } catch (e: any) {
        alert(e.message);
      }
      return;
    }
    
    try {
      await api.accounts.delete(id);
      await loadAccounts();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await api.accounts.test(id);
      alert(res.data?.message || '测试完成');
      await loadAccounts();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setTestingId(null);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await api.accounts.sync(id);
      if (res.data) {
        setSyncData(prev => ({ ...prev, [id]: res.data }));
      }
      await loadAccounts();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSyncingId(null);
    }
  };

  const handleLogin = async (account: Account) => {
    // YouTube OAuth 账号 → 不需要登录
    if (account.platform === 'youtube' && account.authMethod === 'oauth') {
      alert('🔵 这是通过 Google OAuth 授权的账号，Token 自动管理，无需手动登录。');
      return;
    }
    
    try {
      let res;
      if (account.platform === 'tiktok') {
        res = await api.browser.tiktok.login(account.username || account.name);
      } else if (account.platform === 'youtube') {
        res = await api.browser.youtube.login(account.username || account.name);
      } else if (account.platform === 'ozon') {
        res = await api.browser.ozon.login(account.username || account.name);
      } else {
        alert(`${account.platform} 平台暂不支持自动登录`);
        return;
      }
      
      if (res?.success) {
        alert(`${PLATFORM_CONFIG[account.platform]?.name || account.platform} 浏览器已打开，请手动完成登录`);
      } else {
        alert(res?.error || '启动浏览器失败');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-400" />;
      case 'expired': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      active: '正常', inactive: '未激活', expired: '已过期', error: '异常'
    };
    return map[status] || status;
  };

  // OZON 数据面板渲染
  const renderOzonStats = (accountId: string) => {
    const data = syncData[accountId];
    if (!data) return null;

    const { stats, ordersSummary } = data;

    return (
      <div
        style={{
          marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8,
          border: '1px solid #e2e8f0', fontSize: 13
        }}
      >
        {/* 商品统计 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <StatBox label="全部商品" value={stats?.total || 0} color="#6366f1" />
          <StatBox label="在售" value={stats?.active || 0} color="#059669" />
          <StatBox label="审核中" value={stats?.awaiting_approval || 0} color="#d97706" />
          <StatBox label="已归档" value={stats?.archived || stats?.rejected || 0} color="#6b7280" />
        </div>

        {/* 订单统计 */}
        {ordersSummary && (
          <>
            <div style={{ height: 1, background: '#e5e7eb', margin: '8px 0' }} />
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: 8, fontSize: 12 }}>📦 近7天订单</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <StatBox label="待发货" value={ordersSummary.awaiting_delivery || 0} color="#d97706" />
              <StatBox label="已送达" value={ordersSummary.delivered || 0} color="#059669" />
              <StatBox label="已取消" value={ordersSummary.cancelled || 0} color="#ef4444" />
            </div>
          </>
        )}
      </div>
    );
  };

  // 统计框小组件
  function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
    return (
      <div style={{ textAlign: 'center', padding: '6px 4px', background: '#fff', borderRadius: 6, border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{label}</div>
      </div>
    );
  }

  // 最后一个同步时间格式化
  function formatSyncTime(isoStr: string | undefined | null) {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      if (diffMs < 60000) return '刚刚';
      if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}分钟前`;
      return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return isoStr; }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">店铺账号</h1>
          <p className="text-gray-500 mt-1">管理各平台电商账号</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadAccounts}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            添加账号
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={loadAccounts} className="ml-2 underline">重试</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🏪</div>
          <p className="text-lg">还没有添加账号</p>
          <p className="text-sm mt-1">添加您的电商平台账号开始管理</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 添加第一个账号
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map(account => {
            const platformInfo = PLATFORM_CONFIG[account.platform] || { name: account.platform, color: '#666', icon: '🔗' };
            return (
              <div key={account.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{platformInfo.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{account.name}</div>
                      <div className="text-xs text-gray-500">{platformInfo.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(account.status)}
                    <span className={`text-xs ${
                      account.status === 'active' ? 'text-green-600' :
                      account.status === 'error' ? 'text-red-600' :
                      account.status === 'expired' ? 'text-yellow-600' : 'text-gray-400'
                    }`}>
                      {getStatusText(account.status)}
                    </span>
                  </div>
                </div>
                
                {account.username && (
                  <div className="text-sm text-gray-500 mb-3 truncate">
                    @{account.username}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {/* 小红书：跳转到发布管理页 */}
                  {account.platform === 'xiaohongshu' && (
                    <a
                      href="/xiaohongshu"
                      onClick={(e) => {
                        e.preventDefault();
                        // 设置选中的小红书账号
                        const xhsId = account.id.replace('xhs-', '');
                        try {
                          const saved = localStorage.getItem('xhs_selected_account');
                          if (saved !== xhsId) localStorage.setItem('xhs_selected_account', xhsId);
                        } catch {}
                        window.location.href = '/xiaohongshu';
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      <ExternalLink className="w-3 h-3" />
                      发布管理
                    </a>
                  )}
                  
                  {/* 登录按钮（TikTok/YouTube/OZON 平台，排除小红书） */}
                  {['tiktok', 'youtube', 'ozon'].includes(account.platform) && (
                    account.platform === 'youtube' && account.authMethod === 'oauth' ? (
                      <span className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-green-600 border border-green-200 rounded-lg bg-green-50">
                        <CheckCircle className="w-3 h-3" />
                        已授权
                      </span>
                    ) : (
                      <button
                        onClick={() => handleLogin(account)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                      >
                        <ExternalLink className="w-3 h-3" />
                        登录
                      </button>
                    )
                  )}
                  
                  {/* 测试按钮（排除小红书） */}
                  {account.platform !== 'xiaohongshu' && (
                    <button
                      onClick={() => handleTest(account.id)}
                      disabled={testingId === account.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-green-600 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50"
                    >
                      <TestTube2 className="w-3 h-3" />
                      {testingId === account.id ? '测试中...' : '测试'}
                    </button>
                  )}
                  
                  {account.platform === 'ozon' && (
                    <button
                      onClick={() => handleSync(account.id)}
                      disabled={syncingId === account.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncingId === account.id ? 'animate-spin' : ''}`} />
                      {syncingId === account.id ? '同步中...' : '同步'}
                    </button>
                  )}

                  {/* OZON 数据面板展开按钮 */}
                  {account.platform === 'ozon' && syncData[account.id] && (
                    <button
                      onClick={() => setExpandedId(expandedId === account.id ? null : account.id)}
                      style={{
                        fontSize: 11, padding: '4px 8px', color: '#6366f1',
                        background: '#eef2ff', border: 'none', borderRadius: 4, cursor: 'pointer'
                      }}
                    >
                      {expandedId === account.id ? '收起数据' : '📊 数据'} 
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    删除
                  </button>
                </div>

                {/* 同步时间 */}
                {account.last_sync && account.platform === 'ozon' && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af' }}>
                    上次同步：{formatSyncTime(account.last_sync)}
                  </div>
                )}

                {/* YouTube 频道信息 */}
                {account.platform === 'youtube' && account.account_data?.channelTitle && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: '#f8fafc', borderRadius: 6, fontSize: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#374151', fontWeight: 600 }}>
                      📺 {account.account_data.channelTitle}
                    </div>
                    {account.account_data.email && (
                      <div style={{ color: '#6b7280', marginTop: 2 }}>{account.account_data.email}</div>
                    )}
                    {account.account_data.expiresAt && (
                      <div style={{ color: new Date(account.account_data.expiresAt) > new Date() ? '#059669' : '#ef4444', marginTop: 2 }}>
                        Token {new Date(account.account_data.expiresAt) > new Date() ? '有效' : '已过期'}
                      </div>
                    )}
                  </div>
                )}

                {/* OZON 数据面板 */}
                {account.platform === 'ozon' && expandedId === account.id && renderOzonStats(account.id)}
              </div>
            );
          })}
        </div>
      )}

      {/* 添加账号弹窗 */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">添加平台账号</h2>
            
            {addError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {addError}
              </div>
            )}
            
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">平台</label>
                <select
                  value={form.platform}
                  onChange={e => setForm({ ...form, platform: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PLATFORMS.map(p => (
                    <option key={p} value={p}>
                      {PLATFORM_CONFIG[p].icon} {PLATFORM_CONFIG[p].name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ===== OZON 平台：API 授权模式 ===== */}
              {isOzonPlatform ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold">OZON API 直接授权</p>
                      <p className="mt-1 text-blue-600">输入 Client ID 和 API Key，系统自动验证并创建账号</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">账号名称 *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="例：OZON主店铺"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Key className="w-4 h-4 inline mr-1" />Client ID *
                    </label>
                    <input
                      type="text"
                      value={form.clientId}
                      onChange={e => setForm({ ...form, clientId: e.target.value })}
                      placeholder="OZON Seller API 的 Client ID（在 seller.ozon.ru 获取）"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Key className="w-4 h-4 inline mr-1" />API Key *
                    </label>
                    <input
                      type="password"
                      value={form.apiKey}
                      onChange={e => setForm({ ...form, apiKey: e.target.value })}
                      placeholder="OZON Seller API 的 API Key"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded p-2.5">
                    <p className="text-xs text-gray-500">
                      🔑 在 OZON Seller 后台 → 设置 → API 密钥 中获取 Client ID 和 API Key
                    </p>
                  </div>
                </>
              ) : isXhsPlatform ? (
                <>
              {/* ===== 小红书：扫码登录 ===== */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm font-medium text-red-800 mb-2">📕 小红书扫码登录</div>
                <p className="text-xs text-red-600 mb-3">
                  小红书账号通过扫码方式登录，请在「小红书发布管理」页面完成。
                </p>
                <p className="text-xs text-red-500">
                  点击下方按钮将跳转到小红书管理页面进行扫码添加。
                </p>
              </div>
                </>
              ) : isYouTubePlatform ? (
                <>
              {/* ===== YouTube 平台：OAuth 授权 ===== */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账号名称 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="例：主频道、测试号"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-800 mb-2">🔵 YouTube OAuth 授权</div>
                <p className="text-xs text-blue-600 mb-3">
                  点击下方按钮将跳转到 Google 授权页面，授权后 Claw 可管理您的 YouTube 频道。
                </p>
                <div className="flex items-center gap-3 text-xs text-blue-500">
                  <span>✅ 上传视频</span>
                  <span>✅ 管理频道</span>
                  <span>✅ 查看数据</span>
                </div>
              </div>
                </>
              ) : (
                <>
              {/* ===== 其他平台：普通表单 ===== */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账号名称 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="例：主店铺、测试号"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="平台用户名（选填）"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">登录邮箱</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="平台登录邮箱（选填）"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
                </>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setAddError(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {addLoading
                    ? (isXhsPlatform ? '跳转中...' : isOzonPlatform ? '验证中...' : isYouTubePlatform ? '跳转中...' : '添加中...')
                    : (isXhsPlatform ? '📕 去小红书扫码' : isOzonPlatform ? '🔗 授权并添加' : isYouTubePlatform ? '🔵 Google 授权' : '确认添加')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
