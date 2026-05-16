/**
 * PublishPage - 社媒发布中心
 * 统一管理 TikTok Shop / TikTok Web / YouTube 三平台发布
 * 支持 4 种发布模式 + 多账号切换
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Play, Plus, Trash2, RefreshCw, CheckCircle, XCircle, Clock,
  AlertCircle, Upload, Video, Zap, Sparkles, ChevronDown,
  Globe, Eye, EyeOff, Lock, Image, DollarSign, Package,
  Tag, Layers, Settings, Users, ExternalLink, Copy, Loader2,
  Youtube, ShoppingBag, Monitor, Shield, Store, Link, BookOpen,
  Music, Camera, Tv, Radio, Smartphone, Film, MessageSquare
} from 'lucide-react';
import { api } from '../services/api';

// ============================================================
// 类型定义
// ============================================================
type Platform = 'tiktok_shop' | 'tiktok_web' | 'youtube' | 'ozon' | 'xiaohongshu' | 'douyin' | 'kuaishou' | 'bilibili' | 'baijiahao' | 'shipinhao' | 'tiktok_global';
type PublishMode = 'manual' | 'semiauto' | 'fullauto' | 'oauth';
type AccountStatus = 'logged_in' | 'not_logged_in' | 'checking' | 'expired';
type XiaohongshuType = 'note' | 'video' | 'product';

interface Account {
  id: string;
  platform: Platform;
  name: string;
  email: string;
  status: AccountStatus;
  sessionValid?: boolean;
  lastLogin?: string;
  channelTitle?: string;
}

interface PublishForm {
  // 通用
  title: string;
  description: string;
  price: string;
  cost: string;
  tags: string;
  images: File[];
  // TK Shop 专属
  stock: string;
  category: string;
  weight: string;
  shipping: string;
  // TK Web / YouTube 专属
  videoPath: string;
  topics: string;
  duration: string;
  thumbnail: File | null;
  // YouTube 专属
  privacy: 'public' | 'unlisted' | 'private';
  autoCaptions: boolean;
  // OZON 专属
  shopLink: string;
  ozonCategory: string;
}

interface PublishTask {
  id: string;
  platform: Platform;
  title: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  createdAt: string;
  result?: string;
  error?: string;
}

interface SystemStatus {
  environment: string;
  headless: boolean;
  playwright: boolean;
}

// ============================================================
// 样式常量
// ============================================================
const PLATFORM_CONFIG = {
  tiktok_shop: {
    label: 'TikTok Shop',
    sublabel: '店铺商品发布',
    icon: ShoppingBag,
    color: '#FF0050',
    gradient: 'linear-gradient(135deg, #FF0050 0%, #00F2EA 100%)',
    modes: ['manual', 'semiauto', 'fullauto'] as PublishMode[],
    status: 'ready' as const,
  },
  tiktok_web: {
    label: 'TikTok Web',
    sublabel: '个人账号视频发布',
    icon: Monitor,
    color: '#FF0050',
    gradient: 'linear-gradient(135deg, #FF0050 0%, #7000FF 100%)',
    modes: ['manual', 'semiauto', 'fullauto'] as PublishMode[],
    status: 'ready' as const,
  },
  youtube: {
    label: 'YouTube',
    sublabel: '视频上传发布',
    icon: Youtube,
    color: '#FF0000',
    gradient: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
    modes: ['manual', 'oauth'] as PublishMode[],
    status: 'ready' as const,
  },
  ozon: {
    label: 'OZON',
    sublabel: '俄罗斯电商平台',
    icon: Store,
    color: '#005BFF',
    gradient: 'linear-gradient(135deg, #005BFF 0%, #0094FF 100%)',
    modes: ['manual', 'semiauto'] as PublishMode[],
    status: 'ready' as const,
  },
  xiaohongshu: {
    label: '小红书',
    sublabel: '图文/视频笔记',
    icon: BookOpen,
    color: '#E60023',
    gradient: 'linear-gradient(135deg, #E60023 0%, #FF6B6B 100%)',
    modes: ['manual', 'semiauto'] as PublishMode[],
    status: 'ready' as const,
  },
  // 新增：social-auto-upload 平台
  douyin: {
    label: '抖音',
    sublabel: '短视频/图文发布',
    icon: Music,
    color: '#000000',
    gradient: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
    modes: ['manual'] as PublishMode[],
    status: 'sau' as const,
  },
  kuaishou: {
    label: '快手',
    sublabel: '短视频/图文发布',
    icon: Camera,
    color: '#FF6B00',
    gradient: 'linear-gradient(135deg, #FF6B00 0%, #FF9500 100%)',
    modes: ['manual'] as PublishMode[],
    status: 'sau' as const,
  },
  bilibili: {
    label: 'B站',
    sublabel: '视频投稿发布',
    icon: Tv,
    color: '#00A1D6',
    gradient: 'linear-gradient(135deg, #00A1D6 0%, #00D6FF 100%)',
    modes: ['manual'] as PublishMode[],
    status: 'sau' as const,
  },
  baijiahao: {
    label: '百家号',
    sublabel: '视频发布',
    icon: Radio,
    color: '#D32F2F',
    gradient: 'linear-gradient(135deg, #D32F2F 0%, #FF5252 100%)',
    modes: ['manual'] as PublishMode[],
    status: 'sau' as const,
  },
  shipinhao: {
    label: '视频号',
    sublabel: '微信视频发布',
    icon: Smartphone,
    color: '#07C160',
    gradient: 'linear-gradient(135deg, #07C160 0%, #00E676 100%)',
    modes: ['manual'] as PublishMode[],
    status: 'sau' as const,
  },
  tiktok_global: {
    label: 'TikTok',
    sublabel: '国际版视频发布',
    icon: Film,
    color: '#FF0050',
    gradient: 'linear-gradient(135deg, #FF0050 0%, #E00040 100%)',
    modes: ['manual'] as PublishMode[],
    status: 'sau' as const,
  },
};

const MODE_CONFIG = {
  manual: {
    label: '手动发布',
    icon: Settings,
    desc: '填写表单内容，浏览器自动执行发布',
    color: '#6366F1',
  },
  semiauto: {
    label: '半自动',
    icon: Zap,
    desc: 'AI 生成内容 → 人工确认 → 自动发布',
    color: '#F59E0B',
  },
  fullauto: {
    label: '全自动',
    icon: Sparkles,
    desc: '选品→AI→定价→发布，全链路无人值守',
    color: '#22C55E',
  },
  oauth: {
    label: 'Google Cloud OAuth',
    icon: Shield,
    desc: '绑定 Google 账号，授权 YouTube 操作权限',
    color: '#4285F4',
  },
};

const CATEGORIES = ['服装', '鞋类', '箱包', '配饰', '家居', '美妆', '母婴', '玩具', '户外', '3C电子', '食品', '其他'];
const PRIVACY_OPTIONS = [
  { value: 'public', label: '公开', icon: Globe },
  { value: 'unlisted', label: '不公开', icon: Eye },
  { value: 'private', label: '私密', icon: EyeOff },
];

// ============================================================
// 子组件：状态徽章
// ============================================================
function StatusBadge({ status }: { status: AccountStatus }) {
  const cfg: Record<AccountStatus, { color: string; bg: string; icon: React.ReactNode; text: string }> = {
    logged_in: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: <CheckCircle size={12} />, text: '已登录' },
    not_logged_in: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: <XCircle size={12} />, text: '未登录' },
    checking: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: <Loader2 size={12} className="spin" />, text: '验证中' },
    expired: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: <AlertCircle size={12} />, text: '已过期' },
  };
  const c = cfg[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 10,
      fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color,
    }}>
      {c.icon} {c.text}
    </span>
  );
}

// ============================================================
// 子组件：平台切换卡片
// ============================================================
function PlatformCard({
  platform, active, onClick
}: {
  platform: Platform;
  active: boolean;
  onClick: () => void;
}) {
  const cfg = PLATFORM_CONFIG[platform];
  const Icon = cfg.icon;
  const isSau = cfg.status === 'sau';
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 6, padding: '12px 20px',
        background: active ? cfg.gradient : 'transparent',
        border: `2px solid ${active ? 'transparent' : '#e2e8f0'}`,
        borderRadius: 12,
        cursor: 'pointer', minWidth: 110,
        transition: 'all 0.2s ease',
        boxShadow: active ? '0 4px 20px ' + cfg.color + '40' : 'none',
        position: 'relative',
      }}
    >
      {isSau && !active && (
        <span style={{
          position: 'absolute', top: -6, right: -6,
          fontSize: 8, padding: '1px 5px', borderRadius: 6,
          background: '#6366F1', color: '#fff', fontWeight: 700,
        }}>
          SAU
        </span>
      )}
      <Icon size={22} color={active ? '#fff' : '#64748b'} />
      <span style={{
        fontSize: 13, fontWeight: 700,
        color: active ? '#fff' : '#64748b',
      }}>{cfg.label}</span>
      <span style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.7)' : '#555' }}>
        {cfg.sublabel}
      </span>
    </button>
  );
}

// ============================================================
// 子组件：账号卡片
// ============================================================
function AccountCard({
  account, active, onSelect, onDelete, onRefresh
}: {
  account: Account;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const cfg = PLATFORM_CONFIG[account.platform];
  const Icon = cfg.icon;
  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: active ? `${cfg.color}18` : '#1A1D27',
        border: `2px solid ${active ? cfg.color : '#e2e8f0'}`,
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <Icon size={18} color={active ? cfg.color : '#64748b'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: active ? '#1e293b' : '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {account.name}
        </div>
        <div style={{ fontSize: 11, color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {account.email}
        </div>
      </div>
      <StatusBadge status={account.status} />
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={e => { e.stopPropagation(); onRefresh(); }}
          title="刷新状态"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 2, display: 'flex' }}
        >
          <RefreshCw size={13} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          title="删除账号"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', padding: 2, display: 'flex' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 子组件：模式标签
// ============================================================
function ModeTab({ mode, active, onClick }: { mode: PublishMode; active: boolean; onClick: () => void }) {
  const cfg = MODE_CONFIG[mode];
  const Icon = cfg.icon;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 16px',
        background: active ? cfg.color : 'transparent',
        border: `1.5px solid ${active ? cfg.color : '#e2e8f0'}`,
        borderRadius: 8,
        cursor: 'pointer', color: active ? '#fff' : '#64748b',
        fontSize: 13, fontWeight: 600,
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={14} />
      {cfg.label}
    </button>
  );
}

// ============================================================
// 子组件：表单字段
// ============================================================
function FormField({ label, children, required, style }: { label: string; children: React.ReactNode; required?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', style = {} }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      style={{
        width: '100%', padding: '10px 12px',
        background: '#f8fafc', border: '1.5px solid #e2e8f0',
        borderRadius: 8, color: '#1e293b', fontSize: 13,
        outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
        ...style,
      }}
      onFocus={e => e.target.style.borderColor = '#6366F1'}
      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%', padding: '10px 12px',
        background: '#f8fafc', border: '1.5px solid #e2e8f0',
        borderRadius: 8, color: '#1e293b', fontSize: 13,
        outline: 'none', resize: 'vertical', boxSizing: 'border-box',
        fontFamily: 'inherit',
      }}
      onFocus={e => e.target.style.borderColor = '#6366F1'}
      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
    />
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        width: '100%', padding: '10px 12px',
        background: '#f8fafc', border: '1.5px solid #e2e8f0',
        borderRadius: 8, color: '#1e293b', fontSize: 13,
        outline: 'none', boxSizing: 'border-box',
        cursor: 'pointer',
      }}
    >
      {options.map((o: any) => (
        <option key={o.value} value={o.value} style={{ background: '#1A1D27' }}>{o.label}</option>
      ))}
    </select>
  );
}

// ============================================================
// 主页面
// ============================================================
export default function PublishPage() {
  // 平台 & 模式
  const [platform, setPlatform] = useState<Platform>('tiktok_shop');
  const [mode, setMode] = useState<PublishMode>('manual');
  const [xiaohongshuType, setXiaohongshuType] = useState<XiaohongshuType>('note');

  // 账号
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', platform: '' as Platform });
  const [addingAccount, setAddingAccount] = useState(false);

  // 系统状态
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  // 发布表单
  const [form, setForm] = useState<PublishForm>({
    title: '', description: '', price: '', cost: '', tags: '',
    images: [], stock: '100', category: '服装', weight: '', shipping: '',
    videoPath: '', topics: '', duration: '', thumbnail: null,
    privacy: 'public', autoCaptions: false,
    shopLink: '', ozonCategory: '服装',
  });
  const [previews, setPreviews] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 发布历史
  const [tasks, setTasks] = useState<PublishTask[]>([]);

  // 加载系统状态
  const loadSystemStatus = useCallback(async () => {
    try {
      const res = await api.browser?.systemStatus?.();
      setSystemStatus(res?.data?.system || null);
    } catch {
      // 后端未实现时静默
    }
  }, []);

  // 加载账号
  const loadAccounts = useCallback(async () => {
    try {
      const res = await api.accounts.list();
      const data = Array.isArray(res) ? res : (res?.data || []);
      const mapped: Account[] = data
        .filter((a: any) => ['tiktok', 'tiktok_shop', 'tiktok_web', 'youtube', 'ozon', 'xiaohongshu', 'douyin', 'kuaishou', 'bilibili', 'baijiahao', 'shipinhao', 'tiktok_global'].includes(a.platform))
        .map((a: any) => {
          // 统一 platform 映射：数据库存 tiktok → UI 显示 tiktok_shop
          let normalizedPlatform = a.platform;
          if (a.platform === 'tiktok') normalizedPlatform = 'tiktok_shop';
          
          return {
            id: a.id,
            platform: normalizedPlatform,
            name: a.name || a.username || a.email || '未命名账号',
            email: a.email || a.username || '',
            status: a.status === 'active' || a.status === 'connected' ? 'logged_in' : 'not_logged_in',
            sessionValid: a.sessionValid,
            lastLogin: a.lastLogin,
            channelTitle: a.channelTitle,
          };
        });
      setAccounts(mapped);
      // 自动选第一个
      if (mapped.length > 0 && !activeAccount) {
        setActiveAccount(mapped[0]);
      }
    } catch {
      setAccounts([]);
    }
  }, [activeAccount]);

  // 检查单个账号状态
  const checkAccount = useCallback(async (account: Account) => {
    setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, status: 'checking' as AccountStatus } : a));
    try {
      let loggedIn = false;
      if (account.platform === 'youtube') {
        const res = await api.browser?.youtube?.status?.(account.email, account.id);
        loggedIn = res?.data?.loggedIn;
      } else if (account.platform === 'ozon') {
        const res = await api.browser?.ozon?.status?.(account.email, account.id);
        loggedIn = res?.data?.loggedIn;
      } else if (account.platform === 'xiaohongshu') {
        const res = await api.xiaohongshu?.status?.();
        loggedIn = res?.data?.loggedIn || false;
      } else {
        const res = await api.browser?.tiktok?.status?.(account.email, account.id);
        loggedIn = res?.data?.loggedIn;
      }
      setAccounts(prev => prev.map(a => a.id === account.id ? {
        ...a,
        status: loggedIn ? 'logged_in' : 'not_logged_in' as AccountStatus,
      } : a));
    } catch {
      setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, status: 'not_logged_in' as AccountStatus } : a));
    }
  }, []);

  // 初始化
  useEffect(() => {
    loadSystemStatus();
    loadAccounts();

    // 从利润计算器读取自动填入的价格
    try {
      const stored = sessionStorage.getItem('claw_publish_price');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.price) {
          setForm(f => ({ ...f, price: String(data.price) }));
          // 显示提示
          setPublishMsg({ type: 'info', text: `💰 已从计算器自动填入售价: ${data.currency || 'USD'} ${data.price}（${data.tier || ''}）` });
          // 用完就删，避免重复提示
          sessionStorage.removeItem('claw_publish_price');
        }
      }
    } catch (e) {
      // ignore
    }
  }, [loadSystemStatus, loadAccounts]);

  // 平台切换时重置模式
  const handlePlatformChange = (p: Platform) => {
    setPlatform(p);
    setXiaohongshuType('note');
    setActiveAccount(null);
    const cfg = PLATFORM_CONFIG[p];
    if (!cfg.modes.includes(mode)) {
      setMode(cfg.modes[0]);
    }
  };

  // 添加账号
  const handleAddAccount = async () => {
    if (!addForm.name || !addForm.email) return;
    setAddingAccount(true);
    try {
      await api.accounts.create({
        platform,
        name: addForm.name,
        username: addForm.email,
      });
      setAddForm({ name: '', email: '', platform });
      setShowAddAccount(false);
      await loadAccounts();
      setPublishMsg({ type: 'success', text: '账号添加成功！请刷新浏览器登录状态' });
    } catch (e: any) {
      setPublishMsg({ type: 'error', text: e.message || '添加失败' });
    } finally {
      setAddingAccount(false);
    }
  };

  // 删除账号
  const handleDeleteAccount = async (account: Account) => {
    try {
      await api.accounts.delete(account.id);
      setAccounts(prev => prev.filter(a => a.id !== account.id));
      if (activeAccount?.id === account.id) setActiveAccount(null);
    } catch (e: any) {
      setPublishMsg({ type: 'error', text: e.message || '删除失败' });
    }
  };

  // 图片上传预览
  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setForm(f => ({ ...f, images: [...f.images, ...newFiles] }));
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  // AI 生成文案 - 优先调用 Dify 工作流，降级使用旧 API
  const handleGenerate = async () => {
    if (!form.title && !form.description) {
      setPublishMsg({ type: 'error', text: '请先填写产品名称或描述' }); return;
    }
    setGenerating(true);
    setPublishMsg(null);
    try {
      // 优先使用 Dify 工作流
      const difyResult = await api.dify?.generate?.({
        platform: platform === 'xiaohongshu' ? 'xiaohongshu' : 'tiktok',
        productName: form.title || form.description,
        imageUrls: previews.length > 0 ? previews : undefined,
      });

      if (difyResult?.data) {
        const d = difyResult.data;
        setForm(f => ({
          ...f,
          title: d.title || f.title,
          description: d.description || d.xiaohongshu_copy || f.description,
          tags: Array.isArray(d.hashtags) ? d.hashtags.join(' ') : (d.tags || f.tags),
          price: d.price_usd ? String(d.price_usd) : f.price,
        }));
        setPublishMsg({ type: 'success', text: '✨ Dify 工作流文案生成成功！' });
        return;
      }

      // 降级：使用旧版 generate API
      const result = await api.generate?.text?.({
        prompt: `为以下产品生成英文标题和描述，用于跨境电商上架：${form.title} ${form.description}。类别：${form.category}`,
        type: 'product_description',
        language: 'en',
      });
      if (result?.data) {
        setForm(f => ({
          ...f,
          title: result.data.title || f.title,
          description: result.data.description || f.description,
          tags: result.data.tags || f.tags,
        }));
        setPublishMsg({ type: 'success', text: '✨ AI 文案生成成功！' });
      }
    } catch (e: any) {
      setPublishMsg({ type: 'error', text: e.message || '生成失败，请稍后重试' });
    } finally {
      setGenerating(false);
    }
  };

  // 发布
  const handlePublish = async () => {
    if (!activeAccount) {
      setPublishMsg({ type: 'error', text: '请先选择发布账号' }); return;
    }
    if (!form.title) {
      setPublishMsg({ type: 'error', text: '请填写标题' }); return;
    }
    setPublishing(true);
    setPublishMsg(null);

    const task: PublishTask = {
      id: `task_${Date.now()}`,
      platform,
      title: form.title,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [task, ...prev]);

    try {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'running' } : t));

      // 根据平台调用对应API
      if (platform === 'youtube') {
        const res = await api.browser.youtube.upload({
          email: activeAccount.email,
          videoPath: form.videoPath,
          title: form.title,
          description: form.description,
          privacy: form.privacy,
          accountId: activeAccount.id,
        });
        setTasks(prev => prev.map(t => t.id === task.id ? {
          ...t, status: 'success', result: res?.data?.url || '上传成功'
        } : t));
        setPublishMsg({ type: 'success', text: '🎉 YouTube 视频上传成功！' });
      } else if (platform === 'ozon') {
        const res = await api.browser.ozon.publish({
          email: activeAccount.email,
          title: form.title,
          description: form.description,
          price: form.price ? parseFloat(form.price) : undefined,
          stock: form.stock ? parseInt(form.stock) : 100,
          category: form.ozonCategory,
          shopLink: form.shopLink,
          accountId: activeAccount.id,
        });
        setTasks(prev => prev.map(t => t.id === task.id ? {
          ...t, status: 'success', result: res?.data?.url || '发布成功'
        } : t));
        setPublishMsg({ type: 'success', text: '🎉 OZON 商品发布成功！' });
      } else if (platform === 'xiaohongshu') {
        // 小红书
        let res;
        if (xiaohongshuType === 'note') {
          res = await api.xiaohongshu?.publishNote?.({
            accountId: activeAccount.id,
            title: form.title,
            content: form.description,
            images: form.images,
            tags: form.tags ? form.tags.split(/[,，\s]+/).filter((t: string) => t.trim()) : [],
          });
          setPublishMsg({ type: 'success', text: '🎉 小红书图文发布成功！' });
        } else if (xiaohongshuType === 'video') {
          res = await api.xiaohongshu?.publishVideo?.({
            accountId: activeAccount.id,
            title: form.title,
            content: form.description,
            videoBase64: form.videoPath,
          });
          setPublishMsg({ type: 'success', text: '🎉 小红书视频发布成功！' });
        } else {
          res = await api.xiaohongshu?.publishNote?.({
            accountId: activeAccount.id,
            title: form.title || '产品推荐',
            content: form.description || form.shopLink || '推荐好物',
            images: [],
            tags: ['好物推荐', '产品分享'],
          });
          setPublishMsg({ type: 'success', text: '🎉 小红书链接发布成功！' });
        }
        setTasks(prev => prev.map(t => t.id === task.id ? {
          ...t, status: 'success', result: '发布成功'
        } : t));
      } else if (['douyin', 'kuaishou', 'bilibili', 'baijiahao', 'shipinhao', 'tiktok_global'].includes(platform)) {
        // social-auto-upload 平台：通过 publishQueue 创建任务，由 AI 调用 sau CLI 执行
        // 创建 publishQueue 任务
        // 对于 SAU 平台，如果选了视频则传 videoPath
        const publishPayload: any = {
          platform,
          title: form.title,
          content: form.description,
          tags: form.tags ? form.tags.split(/[,，\s]+/).filter((t: string) => t.trim()) : [],
          images: previews,
        };
        // 如果有视频路径传入
        if (form.videoPath) {
          publishPayload.videoPath = form.videoPath;
        }
        const taskRes = await api.publishQueue?.create?.(publishPayload);
        setTasks(prev => prev.map(t => t.id === task.id ? {
          ...t, status: 'running', result: taskRes?.data?.taskId || '任务已创建'
        } : t));
        setPublishMsg({ type: 'info', text: '📤 发布任务已提交，AI 客服将调用 sau CLI 自动执行' });
      } else {
        // TikTok Shop / Web
        const res = await api.browser.tiktok.publish({
          email: activeAccount.email,
          title: form.title,
          description: form.description,
          price: form.price ? parseFloat(form.price) : undefined,
          stock: form.stock ? parseInt(form.stock) : 100,
          accountId: activeAccount.id,
        });
        setTasks(prev => prev.map(t => t.id === task.id ? {
          ...t, status: 'success', result: res?.data?.url || '发布成功'
        } : t));
        setPublishMsg({ type: 'success', text: '🎉 发布成功！' });
      }
    } catch (e: any) {
      setTasks(prev => prev.map(t => t.id === task.id ? {
        ...t, status: 'failed', error: e.message
      } : t));
      setPublishMsg({ type: 'error', text: e.message || '发布失败，请检查账号状态' });
    } finally {
      setPublishing(false);
    }
  };

  // Google OAuth 授权
  const handleGoogleOAuth = async () => {
    const width = 600, height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const authWindow = window.open(
      `https://claw-backend-2026.onrender.com/api/auth/youtube`,
      'youtube_oauth',
      `width=${width},height=${height},left=${left},top=${top},popup=1`
    );
    if (authWindow) {
      const timer = setInterval(() => {
        try {
          if (authWindow.closed) {
            clearInterval(timer);
            loadAccounts();
          }
        } catch {}
      }, 500);
    }
  };

  const platformAccounts = accounts.filter(a => a.platform === platform);
  const cfg = PLATFORM_CONFIG[platform];

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: '#f8fafc', color: '#1e293b' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        * { box-sizing: border-box; }
      `}</style>

      {/* 页面标题 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
            🚀 社媒发布中心
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            多平台 · 多账号 · 多模式 · 一站式发布
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {systemStatus && (
            <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
              <span style={{
                padding: '4px 10px', borderRadius: 8,
                background: systemStatus.playwright ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: systemStatus.playwright ? '#22C55E' : '#EF4444',
              }}>
                Playwright {systemStatus.playwright ? '✅' : '❌'}
              </span>
              <span style={{ color: '#555', padding: '4px 8px' }}>
                {systemStatus.headless ? '🖥️ 无头' : '🪟 可视'}模式
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 平台切换 */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
        padding: '16px 20px',
        background: '#1A1D27', borderRadius: 14, border: '1px solid #e2e8f0'
      }}>
        {(['tiktok_shop', 'tiktok_web', 'youtube', 'ozon', 'xiaohongshu', 'douyin', 'kuaishou', 'bilibili', 'baijiahao', 'shipinhao', 'tiktok_global'] as Platform[]).map(p => (
          <PlatformCard
            key={p}
            platform={p}
            active={platform === p}
            onClick={() => handlePlatformChange(p)}
          />
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => { setShowAddAccount(true); setAddForm({ name: '', email: '', platform }); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px',
            background: 'rgba(99,102,241,0.15)', border: '1.5px solid #6366F1',
            borderRadius: 10, color: '#818CF8', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', alignSelf: 'center',
          }}
        >
          <Plus size={15} /> 添加账号
        </button>
      </div>

      {/* 主内容区：账号 + 表单 */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* 左侧：账号管理 */}
        <div style={{
          background: '#1A1D27', borderRadius: 14, border: '1px solid #e2e8f0',
          padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
          height: 'fit-content', position: 'sticky', top: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} color={cfg.color} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>账号管理</span>
            </div>
            <span style={{ fontSize: 11, color: '#555', background: '#e2e8f0', padding: '2px 8px', borderRadius: 6 }}>
              {platformAccounts.length} 个账号
            </span>
          </div>

          {platformAccounts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '32px 16px', color: '#555', fontSize: 13,
              border: '1.5px dashed #e2e8f0', borderRadius: 10,
            }}>
              <Users size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
              暂无{cfg.label}账号<br />
              <span style={{ fontSize: 11 }}>点击右上角添加</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {platformAccounts.map(acc => (
                <AccountCard
                  key={acc.id}
                  account={acc}
                  active={activeAccount?.id === acc.id}
                  onSelect={() => setActiveAccount(acc)}
                  onDelete={() => handleDeleteAccount(acc)}
                  onRefresh={() => checkAccount(acc)}
                />
              ))}
            </div>
          )}

          {/* 快速登录提示 */}
          <div style={{
            padding: 10, borderRadius: 8, background: '#f8fafc',
            fontSize: 11, color: '#555', lineHeight: 1.6,
          }}>
            💡 提示：添加账号后，请前往账号设置页面完成浏览器登录授权
          </div>
        </div>

        {/* 右侧：发布表单 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 模式选择标签 */}
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
            padding: '12px 16px',
            background: '#1A1D27', borderRadius: 12, border: '1px solid #e2e8f0',
          }}>
            {PLATFORM_CONFIG[platform].modes.map(m => (
              <ModeTab
                key={m}
                mode={m}
                active={mode === m}
                onClick={() => setMode(m)}
              />
            ))}
          </div>

          {/* Google Cloud OAuth 模式 */}
          {mode === 'oauth' && platform === 'youtube' && (
            <div style={{
              padding: 32, background: '#1A1D27', borderRadius: 14,
              border: '1px solid #4285F4', textAlign: 'center',
            }}>
              <Shield size={48} color="#4285F4" style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#1e293b' }}>Google Cloud OAuth 授权</h3>
              <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
                点击下方按钮，跳转到 Google 授权页面<br />
                授权 Claw 操作您的 YouTube 频道（上传视频、管理内容）
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleGoogleOAuth}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 28px',
                    background: '#4285F4', border: 'none', borderRadius: 10,
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Shield size={16} /> 授权 Google 账号
                </button>
                <button
                  onClick={loadAccounts}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 20px',
                    background: 'transparent', border: '1.5px solid #e2e8f0', borderRadius: 10,
                    color: '#64748b', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={14} /> 刷新授权状态
                </button>
              </div>
              <div style={{ marginTop: 20, fontSize: 11, color: '#555' }}>
                已授权账号：{platformAccounts.filter(a => a.status === 'logged_in').length} / {platformAccounts.length}
              </div>
            </div>
          )}

          {/* 正常发布表单 */}
          {mode !== 'oauth' && (
            <div style={{
              padding: 24, background: '#1A1D27', borderRadius: 14,
              border: '1px solid #e2e8f0',
            }}>
              {/* 当前账号信息 */}
              {activeAccount ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', marginBottom: 20,
                  background: cfg.color + '15', border: '1px solid ' + cfg.color + '40',
                  borderRadius: 10,
                }}>
                  <Icon1 platform={activeAccount.platform} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                      {activeAccount.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{activeAccount.email}</div>
                  </div>
                  <StatusBadge status={activeAccount.status} />
                </div>
              ) : (
                <div style={{
                  padding: '14px', marginBottom: 20, textAlign: 'center',
                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 10, color: '#F59E0B', fontSize: 13,
                }}>
                  ⚠️ 请先在左侧选择一个发布账号
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* 标题 */}
                <FormField label="标题" required>
                  <Input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder={platform === 'youtube' ? 'YouTube 视频标题' : '商品标题'}
                  />
                </FormField>

                {/* 价格 + 利润计算（非YouTube；小红书仅在「发布链接」模式显示） */}
                {platform !== 'youtube' && (platform !== 'xiaohongshu' || xiaohongshuType === 'product') && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
                      <FormField label="售价 (USD)" required>
                        <div style={{ position: 'relative' }}>
                          <DollarSign size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                          <input
                            value={form.price}
                            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                            placeholder="0.00"
                            type="number"
                            style={{
                              width: '100%', padding: '10px 12px 10px 28px',
                              background: '#f8fafc', border: '1.5px solid #e2e8f0',
                              borderRadius: 8, color: '#1e293b', fontSize: 13,
                              outline: 'none', boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      </FormField>

                      <FormField label="成本 (USD)">
                        <Input
                          value={form.cost}
                          onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                          placeholder="0.00"
                          type="number"
                        />
                      </FormField>
                    </div>

                    {/* 利润档位自动计算 - 填入成本后自动算出价格 */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>
                      📊 选择利润档位自动算价
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        { label: '30% 薄利', rate: 30, color: '#059669', tip: '冲量引流' },
                        { label: '50% 标准', rate: 50, color: '#6366f1', tip: '稳健盈利' },
                        { label: '70% 高利', rate: 70, color: '#f59e0b', tip: '高利润' },
                        { label: '90% 暴利', rate: 90, color: '#dc2626', tip: '品牌溢价' },
                      ].map(tier => {
                        const c = parseFloat(form.cost);
                        const price = c > 0 ? (c / (1 - tier.rate / 100)).toFixed(2) : '—';
                        return (
                          <button
                            key={tier.rate}
                            onClick={() => {
                              if (c > 0) {
                                setForm(f => ({ ...f, price }));
                              }
                            }}
                            disabled={!c || c <= 0}
                            title={c > 0 ? `${tier.tip}: 成本 $${c.toFixed(2)} → 售价 $${price}` : '请先填入成本'}
                            style={{
                              flex: '1 1 100px', padding: '10px 8px', borderRadius: 10,
                              background: form.price === price && c > 0 ? `${tier.color}15` : '#fff',
                              border: `2px solid ${form.price === price && c > 0 ? tier.color : '#e5e7eb'}`,
                              cursor: c > 0 ? 'pointer' : 'not-allowed', opacity: c > 0 ? 1 : 0.4,
                              textAlign: 'center', transition: 'all 0.15s',
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 700, color: tier.color }}>{tier.label}</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginTop: 2 }}>
                              ${price !== '—' ? price : '—'}
                            </div>
                            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{tier.tip}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 隐私设置 (YouTube) */}
                {platform === 'youtube' && (
                  <FormField label="可见性">
                    <div style={{ display: 'flex', gap: 8 }}>
                      {PRIVACY_OPTIONS.map(opt => {
                        const OptIcon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setForm(f => ({ ...f, privacy: opt.value as any }))}
                            style={{
                              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                              padding: '8px 6px',
                              background: form.privacy === opt.value ? '#EF444420' : 'transparent',
                              border: '1.5px solid ' + (form.privacy === opt.value ? '#EF4444' : '#e2e8f0'),
                              borderRadius: 8, color: form.privacy === opt.value ? '#EF4444' : '#64748b',
                              fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            <OptIcon size={13} />{opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                )}

                {/* 分类 */}
                {platform !== 'youtube' && platform !== 'xiaohongshu' && (
                  <FormField label="商品分类">
                    <Select
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      options={CATEGORIES.map(c => ({ value: c, label: c }))}
                    />
                  </FormField>
                )}

                {/* 库存 (TK Shop) */}
                {platform === 'tiktok_shop' && (
                  <FormField label="库存数量">
                    <Input
                      value={form.stock}
                      onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                      placeholder="100"
                      type="number"
                    />
                  </FormField>
                )}

                {/* OZON 库存 */}
                {platform === 'ozon' && (
                  <FormField label="库存数量">
                    <Input
                      value={form.stock}
                      onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                      placeholder="100"
                      type="number"
                    />
                  </FormField>
                )}

                {/* OZON 上传链接 */}
                {platform === 'ozon' && (
                  <FormField label="1688/供应商商品链接">
                    <div style={{ position: 'relative' }}>
                      <Link size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                      <input
                        value={form.shopLink}
                        onChange={e => setForm(f => ({ ...f, shopLink: e.target.value }))}
                        placeholder="https://detail.1688.com/..."
                        style={{
                          width: '100%', padding: '10px 12px 10px 30px',
                          background: '#f8fafc', border: '1.5px solid #e2e8f0',
                          borderRadius: 8, color: '#1e293b', fontSize: 13,
                          outline: 'none', boxSizing: 'border-box' as const,
                        }}
                      />
                    </div>
                  </FormField>
                )}

                {/* 标签 */}
                {platform !== 'youtube' && (
                  <FormField label="标签 (逗号分隔)">
                    <Input
                      value={form.tags}
                      onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                      placeholder="tiktok, trending, fashion"
                    />
                  </FormField>
                )}

                {/* 话题标签 (TK Web / YouTube) */}
                {(platform === 'tiktok_web' || platform === 'youtube') && (
                  <FormField label="话题标签 (逗号分隔)">
                    <Input
                      value={form.topics}
                      onChange={e => setForm(f => ({ ...f, topics: e.target.value }))}
                      placeholder="#fyp #viral #trending"
                    />
                  </FormField>
                )}
              </div>

              {/* 小红书发布类型切换 */}
              {platform === 'xiaohongshu' && (
                <div>
                  <FormField label="发布类型">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setXiaohongshuType('note')}
                        style={{
                          flex: 1, padding: '10px 8px', borderRadius: 8,
                          background: xiaohongshuType === 'note' ? '#E6002340' : '#fff',
                          border: `2px solid ${xiaohongshuType === 'note' ? '#E60023' : '#e2e8f0'}`,
                          color: xiaohongshuType === 'note' ? '#E60023' : '#64748b',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        📝 发布图文
                      </button>
                      <button
                        type="button"
                        onClick={() => setXiaohongshuType('video')}
                        style={{
                          flex: 1, padding: '10px 8px', borderRadius: 8,
                          background: xiaohongshuType === 'video' ? '#E6002340' : '#fff',
                          border: `2px solid ${xiaohongshuType === 'video' ? '#E60023' : '#e2e8f0'}`,
                          color: xiaohongshuType === 'video' ? '#E60023' : '#64748b',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        🎬 发布视频
                      </button>
                      <button
                        type="button"
                        onClick={() => setXiaohongshuType('product')}
                        style={{
                          flex: 1, padding: '10px 8px', borderRadius: 8,
                          background: xiaohongshuType === 'product' ? '#E6002340' : '#fff',
                          border: `2px solid ${xiaohongshuType === 'product' ? '#E60023' : '#e2e8f0'}`,
                          color: xiaohongshuType === 'product' ? '#E60023' : '#64748b',
                          fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        🔗 发布链接
                      </button>
                    </div>
                  </FormField>
                </div>
              )}

              {/* 小红书「发布链接」：产品链接字段 */}
              {platform === 'xiaohongshu' && xiaohongshuType === 'product' && (
                <FormField label="产品链接" required style={{ marginTop: 16 }}>
                  <div style={{ position: 'relative' }}>
                    <Link size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
                    <input
                      value={form.shopLink}
                      onChange={e => setForm(f => ({ ...f, shopLink: e.target.value }))}
                      placeholder="粘贴产品链接（淘宝 / 京东 / 拼多多等）"
                      style={{
                        width: '100%', padding: '10px 12px 10px 30px',
                        background: '#f8fafc', border: '1.5px solid #e2e8f0',
                        borderRadius: 8, color: '#1e293b', fontSize: 13,
                        outline: 'none', boxSizing: 'border-box' as const,
                      }}
                      onFocus={e => e.target.style.borderColor = '#E60023'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </FormField>
              )}

              {/* 描述 */}
              <FormField label="描述 / 简介" style={{ marginTop: 16 }}>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={
                    platform === 'youtube'
                      ? '视频描述（支持多段落，可包含链接）'
                      : '商品描述，支持英文，将用于 TikTok 发布'
                  }
                  rows={4}
                />
              </FormField>

              {/* 图片 / 视频上传 */}
              <div style={{ marginTop: 16 }}>
                <FormField label={platform === 'youtube' ? '视频文件' : '商品图片'}>
                  {platform === 'youtube' ? (
                    <Input
                      value={form.videoPath}
                      onChange={e => setForm(f => ({ ...f, videoPath: e.target.value }))}
                      placeholder="视频文件路径，例如 C:\Videos\product.mp4"
                    />
                  ) : (
                    <div
                      onClick={() => document.getElementById('img-upload')?.click()}
                      style={{
                        padding: '24px', textAlign: 'center',
                        background: '#f8fafc', border: '2px dashed #e2e8f0',
                        borderRadius: 10, cursor: 'pointer', color: '#555',
                        fontSize: 13,
                      }}
                    >
                      <Upload size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                      点击上传图片（可多选）
                      <input
                        id="img-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={e => handleImageFiles(e.target.files)}
                      />
                    </div>
                  )}
                </FormField>

                {/* 图片预览 */}
                {previews.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {previews.map((src, i) => (
                      <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                        <img src={src} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                        <button
                          onClick={() => {
                            setPreviews(p => p.filter((_, idx) => idx !== i));
                            setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
                          }}
                          style={{
                            position: 'absolute', top: -6, right: -6,
                            width: 20, height: 20, borderRadius: '50%',
                            background: '#EF4444', border: 'none', color: '#fff',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12,
                          }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '12px', background: 'rgba(99,102,241,0.15)',
                    border: '1.5px solid #6366F1', borderRadius: 10,
                    color: '#818CF8', fontSize: 13, fontWeight: 700,
                    cursor: generating ? 'not-allowed' : 'pointer',
                    opacity: generating ? 0.6 : 1,
                  }}
                >
                  {generating ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                  {generating ? 'AI 生成中...' : '✨ AI 生成文案'}
                </button>

                <button
                  onClick={handlePublish}
                  disabled={publishing || !activeAccount}
                  style={{
                    flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px',
                    background: activeAccount ? cfg.gradient : '#e2e8f0',
                    border: 'none', borderRadius: 10,
                    color: '#fff', fontSize: 14, fontWeight: 800,
                    cursor: (publishing || !activeAccount) ? 'not-allowed' : 'pointer',
                    opacity: (publishing || !activeAccount) ? 0.6 : 1,
                    boxShadow: activeAccount ? '0 4px 20px ' + cfg.color + '40' : 'none',
                  }}
                >
                  {publishing ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
                  {publishing ? '发布中...' : platform === 'xiaohongshu'
                    ? xiaohongshuType === 'note' ? '▶ 发布图文到小红书'
                    : xiaohongshuType === 'video' ? '▶ 发布视频到小红书'
                    : '▶ 发布链接到小红书'
                    : `▶ 发布到 ${cfg.label}`}
                </button>
              </div>

              {/* 消息提示 */}
              {publishMsg && (
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 8,
                  background: publishMsg.type === 'success' ? 'rgba(34,197,94,0.12)' :
                             publishMsg.type === 'error' ? 'rgba(239,68,68,0.12)' :
                             'rgba(99,102,241,0.12)',
                  color: publishMsg.type === 'success' ? '#22C55E' :
                         publishMsg.type === 'error' ? '#EF4444' : '#818CF8',
                  fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {publishMsg.type === 'success' ? <CheckCircle size={14} /> :
                   publishMsg.type === 'error' ? <XCircle size={14} /> :
                   <AlertCircle size={14} />}
                  {publishMsg.text}
                </div>
              )}
            </div>
          )}

          {/* 发布历史 */}
          {tasks.length > 0 && (
            <div style={{
              padding: 16, background: '#1A1D27', borderRadius: 14,
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>
                📋 发布历史
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.map(task => (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px',
                    background: '#f8fafc', borderRadius: 8,
                  }}>
                    <PlatformIcon platform={task.platform} size={14} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: 10, color: '#555' }}>
                        {new Date(task.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <TaskStatus status={task.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 添加账号弹窗 */}
      {showAddAccount && (
        <div
          onClick={() => setShowAddAccount(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1A1D27', border: '1px solid #e2e8f0',
              borderRadius: 16, padding: 28, width: 400,
            }}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: 18, color: '#1e293b' }}>
              添加 {PLATFORM_CONFIG[platform].label} 账号
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FormField label="账号名称" required>
                <Input
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="例如：我的TK小店"
                />
              </FormField>
              <FormField label="账号邮箱 / 用户名" required>
                <Input
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </FormField>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowAddAccount(false)}
                style={{
                  flex: 1, padding: '10px', background: 'transparent',
                  border: '1.5px solid #e2e8f0', borderRadius: 10,
                  color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >取消</button>
              <button
                onClick={handleAddAccount}
                disabled={addingAccount || !addForm.name || !addForm.email}
                style={{
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px',
                  background: addingAccount ? '#e2e8f0' : cfg.gradient,
                  border: 'none', borderRadius: 10,
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: (addingAccount || !addForm.name || !addForm.email) ? 'not-allowed' : 'pointer',
                  opacity: (addingAccount || !addForm.name || !addForm.email) ? 0.6 : 1,
                }}
              >
                {addingAccount ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                {addingAccount ? '添加中...' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 小工具组件
// ============================================================
function PlatformIcon({ platform, size = 16 }: { platform: Platform; size?: number }) {
  const cfg = PLATFORM_CONFIG[platform];
  const Icon = cfg.icon;
  return <Icon size={size} color={cfg.color} />;
}

function Icon1({ platform }: { platform: Platform }) {
  const cfg = PLATFORM_CONFIG[platform];
  const Icon = cfg.icon;
  return <Icon size={20} color={cfg.color} />;
}

function TaskStatus({ status }: { status: string }) {
  const cfg: Record<string, { color: string; bg: string; text: string }> = {
    pending: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', text: '等待中' },
    running: { color: '#6366F1', bg: 'rgba(99,102,241,0.12)', text: '进行中' },
    success: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)', text: '成功' },
    failed: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', text: '失败' },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 10,
      fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color,
    }}>{c.text}</span>
  );
}
