import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, Shield, Crown, Zap, Building2, Sparkles, History, RefreshCw, Clock } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PLAN_INFO: Record<string, { name: string; price: string; icon: any; color: string }> = {
  free:      { name: '免费体验', price: '¥0', icon: Zap, color: 'gray' },
  basic:     { name: '基础版',   price: '¥199/月', icon: Shield, color: 'blue' },
  premium:   { name: '专业版',   price: '¥499/月', icon: Crown, color: 'purple' },
  enterprise:{ name: '企业版',   price: '¥1599/月', icon: Building2, color: 'amber' },
  flagship:  { name: '旗舰版',   price: '¥5888/月', icon: Sparkles, color: 'red' },
};

export default function AdminTogglesPage() {
  const { user } = useAuth();
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const load = async () => {
    try {
      const [tRes, lRes] = await Promise.all([
        api.get('/api/admin/toggles'),
        api.get('/api/admin/toggles/logs'),
      ]);
      if (tRes.success) setToggles(tRes.data);
      if (lRes.success) setLogs(lRes.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const toggle = async (plan: string, enabled: boolean) => {
    try {
      const res = await api.put(`/api/admin/toggles/${plan}`, { enabled });
      if (res.success) {
        setToggles({ ...res.data });
        load(); // 刷新日志
      }
    } catch {}
  };

  const forceCheck = async () => {
    try {
      const res = await api.post('/api/admin/toggles/ai-check', {});
      if (res.success) {
        alert(`✅ 巡查完成\n检查 ${res.data.total} 人\n降级 ${res.data.demoted} 人`);
        load();
      }
    } catch {}
  };

  if (!isAdmin) {
    return <div className="p-6 text-center text-gray-400">无权访问</div>;
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-400">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-indigo-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">会员开关面板</h1>
              <p className="text-sm text-gray-500">管理员：开哪个档位，用户就能用哪个档位的功能</p>
            </div>
          </div>
          <button
            onClick={forceCheck}
            className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg"
          >
            <RefreshCw className="w-3 h-3" />
            AI巡查降级
          </button>
        </div>

        {/* 5个开关卡片 */}
        <div className="grid gap-4 md:grid-cols-5">
          {Object.entries(PLAN_INFO).map(([id, info]) => {
            const Icon = info.icon;
            const enabled = toggles[id] || false;

            return (
              <div
                key={id}
                className={`rounded-xl border-2 p-4 transition-all cursor-pointer ${
                  enabled
                    ? `border-${info.color}-400 bg-white shadow-md`
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
                onClick={() => toggle(id, !enabled)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-${info.color}-100 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${info.color}-600`} />
                  </div>
                  {enabled ? (
                    <ToggleRight className={`w-6 h-6 text-${info.color}-500`} />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <h3 className={`font-bold text-sm ${enabled ? 'text-gray-900' : 'text-gray-500'}`}>{info.name}</h3>
                <p className={`text-xs mt-1 ${enabled ? 'text-gray-500' : 'text-gray-400'}`}>{info.price}</p>
                {enabled && (
                  <span className={`inline-block mt-2 text-xs bg-${info.color}-100 text-${info.color}-700 px-2 py-0.5 rounded-full`}>
                    已开启
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 提示 */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          <strong>⚡ 规则说明：</strong> 每个用户能用的功能由开关状态决定。<br />
          用户会员到期后，AI 巡查会降级为免费版（12小时宽限期）。<br />
          如果需要 AI 手动激活某个用户，直接来这开对应档位即可。
        </div>

        {/* 操作日志 */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="font-bold text-gray-700 text-sm">操作记录</h2>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-xs">暂无操作记录</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="p-2 text-left">时间</th>
                    <th className="p-2 text-left">操作</th>
                    <th className="p-2 text-left">档位</th>
                    <th className="p-2 text-left">操作人</th>
                    <th className="p-2 text-left">原因</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any, i: number) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-2 text-gray-500">
                        {new Date(log.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 rounded ${
                          log.action === '开启' || log.action === 'AI激活' ? 'bg-green-100 text-green-700' :
                          log.action === '关闭' || log.action === 'AI降级' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-2 font-medium">{log.plan}</td>
                      <td className="p-2 text-gray-500">{log.operator?.substring(0, 12)}...</td>
                      <td className="p-2 text-gray-400">{log.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
