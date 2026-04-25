import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function XiaohongshuPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [tab, setTab] = useState<'accounts' | 'publish'>('accounts');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    try {
      const res = await api.xiaohongshu?.listAccounts?.();
      setAccounts(res?.data || []);
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📕</span>
        <h1 className="text-xl font-bold text-gray-900">小红书</h1>
      </div>

      {/* Tab */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('accounts')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'accounts' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          账号管理
        </button>
        <button
          onClick={() => setTab('publish')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'publish' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          发布笔记
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* 账号管理 */}
      {tab === 'accounts' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📕 小红书账号</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">加载中...</p>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-lg mb-2">暂未绑定小红书账号</p>
              <p className="text-sm">请先在"店铺账号"页面添加小红书账号</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc: any) => (
                <div key={acc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{acc.name || acc.account_data?.nickname || '小红书账号'}</p>
                    <p className="text-xs text-gray-400">{acc.account_data?.email || '未设置'}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    acc.status === 'active' || acc.account_status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {acc.status === 'active' || acc.account_status === 'active' ? '已绑定' : '未激活'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 发布笔记 */}
      {tab === 'publish' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">📝 发布笔记</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择账号</label>
              <select
                value={selectedAccount}
                onChange={e => setSelectedAccount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">请先选择账号</option>
                {accounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>{acc.name || acc.account_data?.nickname || acc.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="输入笔记标题..."
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="输入笔记内容..."
                rows={6}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-vertical"
              />
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
                发布笔记
              </button>
              <button className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600">
                发布视频
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部说明 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
        <p className="text-sm text-red-700">
          📕 小红书功能：绑定账号 → 发布图文笔记/短视频
        </p>
        <p className="text-xs text-red-500 mt-1">
          当前仅支持已绑定的账号发布，更多功能持续开发中
        </p>
      </div>
    </div>
  );
}
