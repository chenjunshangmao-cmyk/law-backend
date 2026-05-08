/**
 * AIGatewayPage.tsx — AI网关管理面板（仅管理员可见）
 * 
 * 功能：查看各平台状态、配置API Key、测试连接、查看用量
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AIGatewayPage.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface ProviderStatus {
  id: string;
  name: string;
  enabled: boolean;
  hasKey: boolean;
  models: string[];
  usage: { calls: number; tokens: number; cost: number; lastUsed: string | null };
  freeModel: { provider: string; name: string; cost: number; quota: number } | null;
}

interface GatewayStatus {
  currentProvider: string | null;
  todayUsage: { calls: number; tokens: number; cost: number };
  providers: ProviderStatus[];
  failCounts: { provider: string; fails: number }[];
}

// 预设的 Provider 信息
const PROVIDER_INFO: Record<string, { name: string; url: string; envKey: string; freeTier: string }> = {
  deepseek: { name: 'DeepSeek', url: 'https://platform.deepseek.com', envKey: 'DEEPSEEK_API_KEY', freeTier: '注册送¥10额度' },
  aliyun: { name: '阿里百炼', url: 'https://bailian.console.aliyun.com', envKey: 'BAILIAN_API_KEY', freeTier: '开通送100万tokens' },
  baidu: { name: '百度千帆', url: 'https://console.bce.baidu.com/qianfan', envKey: 'BAIDU_API_KEY', freeTier: 'ERNIE Speed 完全免费' },
  zhipu: { name: '智谱AI', url: 'https://open.bigmodel.cn', envKey: 'ZHIPU_API_KEY', freeTier: 'GLM-4-Flash 完全免费' },
  tencent: { name: '腾讯混元', url: 'https://console.cloud.tencent.com/hunyuan', envKey: 'HUNYUAN_API_KEY', freeTier: '混元Lite 完全免费' },
  bytedance: { name: '字节豆包', url: 'https://console.volcengine.com/ark', envKey: 'BYTEDANCE_API_KEY', freeTier: '注册送50万tokens' },
  moonshot: { name: '月之暗面', url: 'https://platform.moonshot.cn', envKey: 'MOONSHOT_API_KEY', freeTier: '注册送¥15额度' },
  siliconflow: { name: 'SiliconFlow', url: 'https://siliconflow.cn', envKey: 'SILICONFLOW_API_KEY', freeTier: '注册送¥10额度' },
};

export default function AIGatewayPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 管理员检测
  const isAdmin = user?.email === 'runzefeicui@163.com';

  useEffect(() => {
    if (isAdmin) loadStatus();
  }, [isAdmin]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/gateway/status`);
      const data = await res.json();
      if (data.success) setStatus(data.data);
    } catch (e) {
      setMessage('加载失败: ' + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testProvider = async (provider: string) => {
    setTesting(provider);
    try {
      const res = await fetch(`${API_BASE}/api/gateway/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      setTestResults(prev => ({
        ...prev,
        [provider]: data.success ? `✅ 连接正常 (${data.data?.model || provider})` : `❌ ${data.error}`,
      }));
    } catch (e) {
      setTestResults(prev => ({ ...prev, [provider]: `❌ ${(e as Error).message}` }));
    } finally {
      setTesting(null);
    }
  };

  const testAll = async () => {
    const providers = status?.providers?.filter(p => p.hasKey).map(p => p.id) || [];
    for (const p of providers) {
      await testProvider(p);
    }
  };

  if (!isAdmin) {
    return (
      <div className="ag-page">
        <div className="ag-unauthorized">
          <h2>🔒 管理员专属</h2>
          <p>此页面仅管理员可访问</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ag-page">
      <div className="ag-header">
        <h2>🔌 AI统一网关 · 管理面板</h2>
        <div className="ag-header-actions">
          <button className="ag-btn ag-btn-sm" onClick={loadStatus}>🔄 刷新</button>
          <button className="ag-btn ag-btn-primary" onClick={testAll} disabled={!!testing}>
            🧪 全部测试
          </button>
        </div>
      </div>

      {message && (
        <div className={`ag-message ${message.includes('失败') || message.includes('❌') ? 'ag-error' : 'ag-success'}`}>
          {message}
        </div>
      )}

      {/* 今日用量概览 */}
      {status && (
        <div className="ag-summary">
          <div className="ag-stat">
            <span className="ag-stat-label">今日调用</span>
            <span className="ag-stat-val">{status.todayUsage.calls}</span>
          </div>
          <div className="ag-stat">
            <span className="ag-stat-label">今日Token</span>
            <span className="ag-stat-val">{status.todayUsage.tokens.toLocaleString()}</span>
          </div>
          <div className="ag-stat">
            <span className="ag-stat-label">今日花费</span>
            <span className="ag-stat-val">¥{status.todayUsage.cost.toFixed(4)}</span>
          </div>
          <div className="ag-stat">
            <span className="ag-stat-label">当前Provider</span>
            <span className="ag-stat-val">{status.currentProvider || '未指定'}</span>
          </div>
        </div>
      )}

      {/* Provider列表 */}
      <div className="ag-providers">
        <h3>平台状态</h3>
        {loading ? (
          <p className="ag-loading">加载中...</p>
        ) : (
          <div className="ag-provider-grid">
            {(status?.providers || []).map(provider => {
              const info = PROVIDER_INFO[provider.id];
              const testResult = testResults[provider.id];
              const isTesting = testing === provider.id;

              return (
                <div
                  key={provider.id}
                  className={`ag-provider-card ${provider.hasKey ? 'ag-configured' : 'ag-unconfigured'} ${provider.enabled && provider.hasKey ? 'ag-online' : ''}`}
                >
                  <div className="ag-provider-header">
                    <span className="ag-provider-status">
                      {provider.hasKey && provider.enabled ? '🟢' : provider.hasKey ? '🟡' : '⚫'}
                    </span>
                    <h4>{info?.name || provider.id}</h4>
                    {provider.freeModel?.cost === 0 && (
                      <span className="ag-badge ag-free">免费</span>
                    )}
                  </div>

                  <div className="ag-provider-body">
                    <div className="ag-provider-info">
                      <span>模型: {provider.models.join(', ')}</span>
                      {info && <span>免费额度: {info.freeTier}</span>}
                      {info && (
                        <a href={info.url} target="_blank" rel="noopener noreferrer" className="ag-link">
                          去注册 →
                        </a>
                      )}
                    </div>

                    <div className="ag-provider-usage">
                      <span>调用 {provider.usage.calls}次</span>
                      <span>{provider.usage.tokens.toLocaleString()} tokens</span>
                    </div>

                    {provider.hasKey && (
                      <div className="ag-provider-key">
                        <span className="ag-key-indicator">🔑 已配置</span>
                      </div>
                    )}

                    {!provider.hasKey && info && (
                      <div className="ag-key-input-row">
                        <input
                          type="password"
                          placeholder={`输入 ${info.envKey}`}
                          value={apiKeyInputs[provider.id] || ''}
                          onChange={e => setApiKeyInputs(prev => ({ ...prev, [provider.id]: e.target.value }))}
                          className="ag-input"
                        />
                      </div>
                    )}
                  </div>

                  <div className="ag-provider-footer">
                    <button
                      className="ag-btn ag-btn-sm"
                      onClick={() => testProvider(provider.id)}
                      disabled={!provider.hasKey || isTesting}
                    >
                      {isTesting ? '⏳' : '🧪'} 测试
                    </button>
                    {testResult && (
                      <span className={`ag-test-result ${testResult.includes('✅') ? 'ag-test-ok' : 'ag-test-fail'}`}>
                        {testResult}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 提示 */}
      <div className="ag-tips">
        <h4>💡 使用说明</h4>
        <ol>
          <li>去各平台注册免费账号，获取 API Key</li>
          <li>在 Render 环境变量中配置：<code>DEEPSEEK_API_KEY</code>、<code>BAILIAN_API_KEY</code>、<code>BAIDU_API_KEY</code> 等</li>
          <li>网关自动按「免费优先」顺序选择可用平台</li>
          <li>更新环境变量后需重新部署 Render（自动检测 GitHub push）</li>
          <li>百度千帆格式：<code>API_KEY|SECRET_KEY</code>（竖线分隔）</li>
        </ol>
      </div>
    </div>
  );
}
