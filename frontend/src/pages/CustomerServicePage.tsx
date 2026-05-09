import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot, MessageCircle, Send, Settings, TrendingUp, Activity,
  Users, Clock, CheckCircle, AlertCircle, RefreshCw,
  MessageSquare, Phone, Zap, Globe, Building2, ArrowRight,
  ExternalLink, QrCode, Copy, Check, X, Plus, ChevronDown,
  Trash2, Eye, Search, Play, Pause, Info, Sparkles
} from 'lucide-react';
import api from '../services/api';

// ─── 类型 ───
interface QuickReply {
  id: string;
  trigger: string;
  keywords: string[];
  response: string;
  enabled: boolean;
}

interface ChatSession {
  sessionId: string;
  platform: string;
  userId: string;
  firstMessage: string;
  lastReply: string;
  messageCount: number;
  lastActivity: string;
  status: 'active' | 'waiting' | 'closed';
}

interface PlatformConfig {
  key: string;
  name: string;
  configured: boolean;
  webhookUrl: string;
  configuredAt?: string;
}

// ─── 主组件 ───
export default function CustomerServicePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'quick-replies' | 'settings'>('overview');
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI 客服中心</h1>
              <p className="text-sm text-gray-500">LINE + 微信客服智能托管 · 多平台统一管理</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              运行中
            </span>
          </div>
        </div>

        {/* 标签页 */}
        <div className="flex gap-1 mt-4 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview' as const, icon: Activity, label: '概览' },
            { id: 'conversations' as const, icon: MessageCircle, label: '对话记录' },
            { id: 'quick-replies' as const, icon: Zap, label: '快捷回复' },
            { id: 'settings' as const, icon: Settings, label: '渠道配置' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'conversations' && <ConversationsTab />}
        {activeTab === 'quick-replies' && <QuickRepliesTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

// ─── 概览页 ───
function OverviewTab() {
  const [stats, setStats] = useState({
    totalSessions: 0, activeSessions: 0, totalMessages: 0,
    lineSessions: 0, wechatSessions: 0, waSessions: 0, avgResponseTime: '1.2s',
    satisfactionRate: '98%'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    try {
      const [csRes, lineRes, wechatRes, waRes] = await Promise.allSettled([
        api.get('/api/customer-service/stats'),
        api.get('/api/line/stats'),
        api.get('/api/wechat-cs/stats'),
        api.get('/api/whatsapp-cs/stats')
      ]);

      const csStats = csRes.status === 'fulfilled' ? csRes.value.data?.stats || {} : {};
      const lineStats = lineRes.status === 'fulfilled' ? lineRes.value.data?.stats || {} : {};
      const wechatStats = wechatRes.status === 'fulfilled' ? wechatRes.value.data?.stats || {} : {};
      const waStats = waRes.status === 'fulfilled' ? waRes.value.data?.stats || {} : {};

      setStats({
        totalSessions: csStats.totalSessions || 0,
        activeSessions: csStats.activeSessions || 0,
        totalMessages: csStats.totalMessages || 0,
        lineSessions: lineStats.lineSessions || 0,
        wechatSessions: wechatStats.wechatSessions || 0,
        waSessions: waStats.waSessions || 0,
        avgResponseTime: '1.2s',
        satisfactionRate: '98%'
      });
    } catch (err) {
      console.error('加载统计失败:', err);
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    { title: '总会话数', value: stats.totalSessions, icon: MessageSquare, color: 'violet', suffix: '个' },
    { title: '活跃会话', value: stats.activeSessions, icon: Activity, color: 'green', suffix: '个' },
    { title: '总消息数', value: stats.totalMessages, icon: Zap, color: 'blue', suffix: '条' },
    { title: '平均响应', value: stats.avgResponseTime, icon: Clock, color: 'amber', suffix: '' },
  ];

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.title}</span>
              <div className={`w-9 h-9 rounded-lg bg-${card.color}-100 flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 text-${card.color}-600`} />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </span>
              <span className="text-sm text-gray-500">{card.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 底部两栏 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 平台分布 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-violet-600" />
            平台分布
          </h3>
          <div className="space-y-4">
            <PlatformBar label="LINE (台湾)" count={stats.lineSessions} total={stats.totalSessions || 1} color="from-green-400 to-green-600" />
            <PlatformBar label="WhatsApp (海外)" count={stats.waSessions} total={stats.totalSessions || 1} color="from-emerald-400 to-emerald-600" />
            <PlatformBar label="微信客服 (大陆)" count={stats.wechatSessions} total={stats.totalSessions || 1} color="from-blue-400 to-blue-600" />
          </div>
        </div>

        {/* 服务链说明 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-violet-600" />
            服务流程
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <FlowStep icon={Megaphone} label="广告投放" desc="Google/FB/TikTok" />
            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
            <FlowStep icon={MessageCircle} label="AI客服" desc="自动应答接待" />
            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
            <FlowStep icon={DollarSign} label="Claw支付" desc="收钱吧/USDT" />
            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
            <FlowStep icon={CheckCircle} label="成交" desc="完成交易" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 对话记录页 ───
function ConversationsTab() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'line' | 'wechat' | 'whatsapp'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadSessions(); }, []);

  async function loadSessions() {
    setLoading(true);
    try {
      // 模拟数据 - 实际接入数据库后替换
      const fakeSessions: ChatSession[] = [
        { sessionId: 's1', platform: 'LINE', userId: 'U123456', firstMessage: '請問你們有賣翡翠手鐲嗎？', lastReply: '我們是代運營服務商，可以幫您管理翡翠銷售渠道...', messageCount: 8, lastActivity: new Date().toISOString(), status: 'active' },
        { sessionId: 's2', platform: 'WhatsApp', userId: '+886912345678', firstMessage: 'I saw your ad about jade jewelry, can you tell me more?', lastReply: 'Yes! We provide agency services for jade merchants in Ruili...', messageCount: 6, lastActivity: new Date(Date.now() - 120000).toISOString(), status: 'active' },
        { sessionId: 's3', platform: '微信客服', userId: 'oABCD', firstMessage: '你们接客服外包吗', lastReply: '是的！我们提供客服托管服务，包含LINE+WhatsApp+微信三平台...', messageCount: 5, lastActivity: new Date(Date.now() - 300000).toISOString(), status: 'active' },
        { sessionId: 's4', platform: 'LINE', userId: 'U789012', firstMessage: '我想了解一下收費標準', lastReply: '客服託管費 ¥500/月起，包含AI自動回覆+人工兜底...', messageCount: 12, lastActivity: new Date(Date.now() - 600000).toISOString(), status: 'active' },
        { sessionId: 's5', platform: 'WhatsApp', userId: '+886987654321', firstMessage: 'Do you handle TikTok ads for jade products?', lastReply: 'Yes we do! Google Ads + TikTok Ads targeting Taiwan market...', messageCount: 4, lastActivity: new Date(Date.now() - 1800000).toISOString(), status: 'active' },
        { sessionId: 's6', platform: '微信客服', userId: 'oEFGH', firstMessage: '你好', lastReply: '您好！Claw AI客服为您服务，请问有什么可以帮您？', messageCount: 3, lastActivity: new Date(Date.now() - 86400000).toISOString(), status: 'closed' },
      ];
      setSessions(fakeSessions);
    } catch (err) {
      console.error('加载会话失败:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredSessions = sessions
    .filter(s => filter === 'all' || s.platform.toLowerCase() === filter)
    .filter(s => !searchTerm || s.firstMessage.includes(searchTerm) || s.lastReply.includes(searchTerm));

  return (
    <div className="space-y-4">
      {/* 筛选栏 */}
      <div className="flex items-center gap-3">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['all', 'line', 'whatsapp', 'wechat'].map(f => (
            <button key={f} onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${filter === f ? 'bg-white shadow-sm text-violet-700' : 'text-gray-500'}`}
            >
              {f === 'all' ? '全部' : f === 'line' ? 'LINE' : f === 'whatsapp' ? 'WhatsApp' : '微信客服'}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索对话内容..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
        <button onClick={loadSessions} className="p-2 hover:bg-gray-100 rounded-lg">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* 会话列表 */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {loading ? (
          <div className="p-12 text-center text-gray-400">加载中...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无对话记录</p>
            <p className="text-sm text-gray-400 mt-1">当有客户通过 LINE / WhatsApp / 微信联系时，这里会显示对话记录</p>
          </div>
        ) : (
          filteredSessions.map(session => (
            <div key={session.sessionId} className="p-4 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    session.platform === 'LINE' ? 'bg-green-100 text-green-700' :
                    session.platform === 'WhatsApp' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{session.platform}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    session.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                  }`}>{session.status === 'active' ? '进行中' : '已结束'}</span>
                </div>
                <span className="text-xs text-gray-400">{formatTime(session.lastActivity)}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">{session.firstMessage}</p>
              <p className="text-sm text-gray-500 line-clamp-1">{session.lastReply}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                <span>用户: {session.userId}</span>
                <span>{session.messageCount} 条消息</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── 快捷回复页 ───
function QuickRepliesTab() {
  const [replies, setReplies] = useState<QuickReply[]>([
    { id: '1', trigger: '价格咨询', keywords: ['多少钱', '价格', '收费', '费用'], response: '客服托管费 ¥500/月起，包含AI自动回复+人工兜底，按咨询量阶梯定价。具体报价请看服务页～', enabled: true },
    { id: '2', trigger: '翡翠咨询', keywords: ['翡翠', '手镯', '吊坠', '玉器'], response: '我们帮瑞丽翡翠商家做代运营服务（广告投放+客服接待+支付收款），不是直接卖翡翠的哈～如果您是翡翠商家需要托管服务，欢迎咨询！', enabled: true },
    { id: '3', trigger: '支付方式', keywords: ['支付', '付款', '怎么付', '收款'], response: '我们支持微信/支付宝（收钱吧）和 USDT 加密货币支付，秒到账！需要哪个支付方式？', enabled: true },
    { id: '4', trigger: '广告投放', keywords: ['广告', '投流', '推广', 'Google'], response: '我们帮您投放Google/Facebook/TikTok广告，精准定位台湾翡翠买家，日预算¥300-500起，效果可追踪～', enabled: true },
    { id: '5', trigger: '开箱问候', keywords: ['你好', 'hello', '在吗', '您好'], response: '您好！这里是Claw AI客服中心 👋\n我们为翡翠珠宝商家提供客服托管、广告投放、支付收款一站式服务。请问有什么可以帮您？', enabled: true },
    { id: '6', trigger: '售后问题', keywords: ['退款', '退货', '投诉', '假货'], response: '非常抱歉给您带来不便！请您提供订单号，我会帮您转接人工客服处理。人工客服微信：ailaopojun0416', enabled: true },
  ]);
  const [editing, setEditing] = useState<QuickReply | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  function toggleReply(id: string) {
    setReplies(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  function deleteReply(id: string) {
    setReplies(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">AI 快捷回复规则</h3>
        <button onClick={() => { setEditing({ id: '', trigger: '', keywords: [], response: '', enabled: true }); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition"
        >
          <Plus className="w-4 h-4" /> 添加规则
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {replies.map(reply => (
          <div key={reply.id} className={`bg-white rounded-xl border p-5 transition ${reply.enabled ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-900">{reply.trigger}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleReply(reply.id)}
                  className={`relative w-9 h-5 rounded-full transition ${reply.enabled ? 'bg-violet-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition shadow ${reply.enabled ? 'left-4' : 'left-0.5'}`} />
                </button>
                <button onClick={() => deleteReply(reply.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {reply.keywords.map((kw, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-violet-50 text-violet-700 rounded">{kw}</span>
              ))}
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{reply.response}</p>
          </div>
        ))}
      </div>

      {/* 添加/编辑弹窗 */}
      {showAdd && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="font-semibold text-gray-900 mb-4">{editing.id ? '编辑规则' : '添加规则'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">触发名称</label>
                <input value={editing.trigger} onChange={e => setEditing({ ...editing, trigger: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="如：价格咨询" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">关键词（逗号分隔）</label>
                <input value={editing.keywords.join(',')} onChange={e => setEditing({ ...editing, keywords: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="多少钱, 价格, 收费" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">回复内容</label>
                <textarea value={editing.response} onChange={e => setEditing({ ...editing, response: e.target.value })} rows={4}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="输入AI自动回复的内容..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">取消</button>
              <button onClick={() => {
                const newReplies = editing.id ? replies.map(r => r.id === editing.id ? { ...editing, id: editing.id || Date.now().toString() } : r) : [...replies, { ...editing, id: Date.now().toString() }];
                setReplies(newReplies); setShowAdd(false);
              }}
                className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              >保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 渠道配置页 ───
function SettingsTab() {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([
    { key: 'line', name: 'LINE (台湾)', configured: false, webhookUrl: 'https://claw-backend-2026.onrender.com/api/line/webhook' },
    { key: 'whatsapp', name: 'WhatsApp (海外)', configured: false, webhookUrl: 'https://claw-backend-2026.onrender.com/api/whatsapp-cs/webhook' },
    { key: 'wechat', name: '微信客服 (大陆)', configured: false, webhookUrl: 'https://claw-backend-2026.onrender.com/api/wechat-cs/webhook' },
  ]);
  const [showLineConfig, setShowLineConfig] = useState(false);
  const [showWaConfig, setShowWaConfig] = useState(false);
  const [showWechatConfig, setShowWechatConfig] = useState(false);
  const [copied, setCopied] = useState('');

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 引导说明 */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200 p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <h4 className="font-semibold text-violet-900 mb-1">如何对接？</h4>
            <p className="text-violet-700 leading-relaxed">
              配置方法很简单：在 LINE / 微信公众平台创建应用 → 获取 API 密钥 → 填入下方表单 → 设置 Webhook 地址即可。<br />
              AI 会自动应答客户消息，你可以在「对话记录」中查看所有客服内容。
            </p>
          </div>
        </div>
      </div>

      {/* LINE 配置 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setShowLineConfig(!showLineConfig)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">LINE Messaging API</h3>
              <p className="text-sm text-gray-500">台湾市场客服对接 · LINE Official Account</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${platforms[0].configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {platforms[0].configured ? '已配置' : '待配置'}
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition ${showLineConfig ? 'rotate-180' : ''}`} />
          </div>
        </div>
        {showLineConfig && (
          <div className="border-t border-gray-100 p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Channel Access Token</label>
              <div className="flex gap-2 mt-1">
                <input type="password" placeholder="从 LINE Developers 获取..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Channel Secret</label>
              <input type="password" placeholder="从 LINE Developers 获取..."
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            
            {/* AI 设定 */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-4 border border-violet-200">
              <label className="text-sm font-semibold text-violet-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> AI 设定
              </label>
              <p className="text-xs text-violet-600 mt-1 mb-3">
                告诉AI你的店铺信息，客户咨询时AI会自动用这些信息回复。越详细越准。
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-violet-700">店铺名称</label>
                  <input type="text" placeholder="如：瑞丽翡翠行"
                    className="w-full mt-0.5 px-3 py-1.5 border border-violet-200 rounded text-sm bg-white" />
                </div>
                <div>
                  <label className="text-xs text-violet-700">主营品类</label>
                  <input type="text" placeholder="如：手镯、挂件、原石"
                    className="w-full mt-0.5 px-3 py-1.5 border border-violet-200 rounded text-sm bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-violet-700">价格区间</label>
                  <input type="text" placeholder="如：¥500-50000"
                    className="w-full mt-0.5 px-3 py-1.5 border border-violet-200 rounded text-sm bg-white" />
                </div>
                <div>
                  <label className="text-xs text-violet-700">回复风格</label>
                  <select className="w-full mt-0.5 px-3 py-1.5 border border-violet-200 rounded text-sm bg-white">
                    <option value="">默认（自然亲切）</option>
                    <option value="专业">专业严谨</option>
                    <option value="热情">热情活泼</option>
                    <option value="简洁">简洁高效</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-violet-700">额外说明（自由发挥）</label>
                <textarea rows={3} placeholder="如：&#10;• 我们在云南瑞丽姐告口岸有实体店&#10;• 支持视频看货、一物一拍&#10;• 顺丰包邮，7天无理由&#10;• 批发价格，比商场便宜50%以上"
                  className="w-full mt-0.5 px-3 py-2 border border-violet-200 rounded text-sm bg-white resize-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Webhook URL（复制到 LINE Developers）</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-700 break-all">
                  {platforms[0].webhookUrl}
                </code>
                <button onClick={() => copyToClipboard(platforms[0].webhookUrl)}
                  className="p-2 hover:bg-gray-100 rounded-lg shrink-0">
                  {copied === platforms[0].webhookUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">取消</button>
              <button className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">保存配置</button>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp 配置 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setShowWaConfig(!showWaConfig)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">WhatsApp Cloud API</h3>
              <p className="text-sm text-gray-500">海外市场客服对接 · Meta Business Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${platforms[1].configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {platforms[1].configured ? '已配置' : '待配置'}
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition ${showWaConfig ? 'rotate-180' : ''}`} />
          </div>
        </div>
        {showWaConfig && (
          <div className="border-t border-gray-100 p-5 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>💡 WhatsApp 配置步骤：</strong><br />
              1. 进入 <a href="https://developers.facebook.com/" target="_blank" className="underline">Meta Developers</a> 创建应用<br />
              2. 添加 WhatsApp 产品 → 获取 Phone Number ID 和 Access Token<br />
              3. 在 Webhook 设置中填入下方地址，Verify Token 填 <code className="bg-amber-100 px-1 rounded">claw_verify_2026</code>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone Number ID</label>
              <input type="text" placeholder="从 WhatsApp Business 设置中获取..."
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Access Token（永久令牌）</label>
              <input type="password" placeholder="从 Meta Developers 生成..."
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Webhook URL（复制到 Meta Developers）</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-700 break-all">
                  {platforms[1].webhookUrl}
                </code>
                <button onClick={() => copyToClipboard(platforms[1].webhookUrl)}
                  className="p-2 hover:bg-gray-100 rounded-lg shrink-0">
                  {copied === platforms[1].webhookUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Verify Token</label>
              <input type="text" defaultValue="claw_verify_2026" readOnly
                className="w-full mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600" />
              <p className="text-xs text-gray-400 mt-1">固定值，复制到 Meta Webhook 配置的 Verify Token 字段</p>
            </div>

            {/* AI 设定 */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-4 border border-violet-200">
              <label className="text-sm font-semibold text-violet-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> AI 设定
              </label>
              <p className="text-xs text-violet-600 mt-1 mb-3">
                告诉AI你的店铺信息，客户咨询时AI会自动用这些信息回复。越详细越准。
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="text-xs text-violet-700">店铺名称</label>
                  <input type="text" placeholder="如：瑞丽翡翠行" className="w-full mt-0.5 px-3 py-1.5 border border-violet-200 rounded text-sm bg-white" /></div>
                <div><label className="text-xs text-violet-700">主营品类</label>
                  <input type="text" placeholder="如：手镯、挂件、原石" className="w-full mt-0.5 px-3 py-1.5 border border-violet-200 rounded text-sm bg-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="text-xs text-violet-700">价格区间</label>
                  <input type="text" placeholder="如：¥500-50000" className="w-full mt-0.5 px-3 py-1.5 border border-violet-200 rounded text-sm bg-white" /></div>
                <div><label className="text-xs text-violet-700">回复风格</label>
                  <select className="w-full mt-0.5 px-3 py-1.5 border border-violet-200 rounded text-sm bg-white">
                    <option value="">默认（自然亲切）</option><option value="专业">专业严谨</option><option value="热情">热情活泼</option><option value="简洁">简洁高效</option></select></div>
              </div>
              <div><label className="text-xs text-violet-700">额外说明（自由发挥）</label>
                <textarea rows={3} placeholder="如：我们在瑞丽有实体店、支持视频看货、顺丰包邮...&#10;可以写任何想让AI知道的信息"
                  className="w-full mt-0.5 px-3 py-2 border border-violet-200 rounded text-sm bg-white resize-none" /></div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">取消</button>
              <button className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">保存配置</button>
            </div>
          </div>
        )}
      </div>

      {/* 微信客服配置 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setShowWechatConfig(!showWechatConfig)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">微信客服</h3>
              <p className="text-sm text-gray-500">大陆市场客服对接 · 微信公众号客服消息</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${platforms[2].configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {platforms[2].configured ? '已配置' : '待配置'}
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition ${showWechatConfig ? 'rotate-180' : ''}`} />
          </div>
        </div>
        {showWechatConfig && (
          <div className="border-t border-gray-100 p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">AppID</label>
                <input type="text" placeholder="微信公众号 AppID"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">AppSecret</label>
                <input type="password" placeholder="微信公众号 AppSecret"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Token（用于验证）</label>
              <input type="text" placeholder="自定义 Token，与微信后台一致"
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Webhook URL（复制到微信公众平台）</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-700 break-all">
                  {platforms[2].webhookUrl}
                </code>
                <button onClick={() => copyToClipboard(platforms[2].webhookUrl)}
                  className="p-2 hover:bg-gray-100 rounded-lg shrink-0">
                  {copied === platforms[2].webhookUrl ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* AI 设定 */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-4 border border-violet-200">
              <label className="text-sm font-semibold text-violet-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> AI 设定
              </label>
              <p className="text-xs text-violet-600 mt-1 mb-3">
                告诉AI你的店铺信息，客户咨询时AI会自动用这些信息回复。越详细越准。
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="text-xs text-violet-700">店铺名称</label>
                  <input type="text" placeholder="如：瑞丽翡翠行" className="w-full mt-0.5 px-3 py-1.5 border border-violet-200 rounded text-sm bg-white" /></div>
                <div><label className="text-xs text-violet-700">主营品类</label>
                  <input type="text" placeholder="如：手镯、挂件、原石" className="w-full mt-0.5 px-3 py-1.5 border border-violet-200 rounded text-sm bg-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div><label className="text-xs text-violet-700">价格区间</label>
                  <input type="text" placeholder="如：¥500-50000" className="w-full mt-0.5 px-3 py-1.5 border border-violet-200 rounded text-sm bg-white" /></div>
                <div><label className="text-xs text-violet-700">回复风格</label>
                  <select className="w-full mt-0.5 px-3 py-1.5 border border-violet-200 rounded text-sm bg-white">
                    <option value="">默认（自然亲切）</option><option value="专业">专业严谨</option><option value="热情">热情活泼</option><option value="简洁">简洁高效</option></select></div>
              </div>
              <div><label className="text-xs text-violet-700">额外说明（自由发挥）</label>
                <textarea rows={3} placeholder="如：我们在瑞丽有实体店、支持视频看货、顺丰包邮...&#10;可以写任何想让AI知道的信息"
                  className="w-full mt-0.5 px-3 py-2 border border-violet-200 rounded text-sm bg-white resize-none" /></div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">取消</button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">保存配置</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 辅助组件 ───

function PlatformBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = Math.round((count / total) * 100) || 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">{count} 会话</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function FlowStep({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center shrink-0">
      <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-violet-600" />
      </div>
      <span className="text-xs font-medium text-gray-700">{label}</span>
      <span className="text-xs text-gray-400">{desc}</span>
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

function Megaphone({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>;
}

function DollarSign({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
}
