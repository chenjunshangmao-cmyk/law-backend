import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, TestTube2, Settings, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import api from '../services/api';
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
  });

  // 测试中的账号 ID
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.accounts.list();
      setAccounts(res.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setForm({ platform: 'tiktok', name: '', username: '', email: '', password: '' });
      await loadAccounts();
    } catch (e: any) {
      setAddError(e.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此账号？')) return;
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
      alert(res.message || '同步完成');
      await loadAccounts();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSyncingId(null);
    }
  };

  const handleLogin = async (account: Account) => {
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
                  {/* 登录按钮（TikTok/YouTube/OZON 平台） */}
                  {['tiktok', 'youtube', 'ozon'].includes(account.platform) && (
                    <button
                      onClick={() => handleLogin(account)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                    >
                      <ExternalLink className="w-3 h-3" />
                      登录
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleTest(account.id)}
                    disabled={testingId === account.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-green-600 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50"
                  >
                    <TestTube2 className="w-3 h-3" />
                    {testingId === account.id ? '测试中...' : '测试'}
                  </button>
                  
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
                  
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    删除
                  </button>
                </div>
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
                  {addLoading ? '添加中...' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
