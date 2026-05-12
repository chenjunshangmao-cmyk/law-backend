import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Eye, Send, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

interface Novel {
  id: number;
  title: string;
  description: string;
  genre: string;
  total_chapters: number;
  status: string;
  outline: any;
  created_at: string;
}

interface Chapter {
  id: number;
  chapter_no: number;
  title: string;
  status: string;
  word_count: number;
  created_at: string;
}

interface NovelStats {
  planning: number;
  writing: number;
  review: number;
  published: number;
  failed: number;
}

export default function NovelFactoryPage() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selected, setSelected] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [stats, setStats] = useState<NovelStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', genre: '都市', total_chapters: 300 });
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { loadNovels(); }, []);

  const loadNovels = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/novels');
      if (res?.novels) setNovels(res.novels);
    } catch (e: any) {
      setMsg({ type: 'error', text: '加载失败: ' + e.message });
    }
    setLoading(false);
  };

  const openNovel = async (novel: Novel) => {
    setSelected(novel);
    try {
      const res = await api.get(`/api/novels/${novel.id}`);
      if (res?.novel) setSelected(res.novel);
      if (res?.stats) setStats(res.stats);
      const chRes = await api.get(`/api/novels/${novel.id}/chapters?limit=300`);
      if (chRes?.chapters) setChapters(chRes.chapters);
    } catch (e: any) {
      setMsg({ type: 'error', text: '加载详情失败' });
    }
  };

  const createNovel = async () => {
    if (!form.title.trim()) { setMsg({ type: 'error', text: '书名必填' }); return; }
    setLoading(true);
    try {
      const res = await api.post('/api/novels', form);
      if (res?.novel) {
        setNovels([res.novel, ...novels]);
        setShowCreate(false);
        setForm({ title: '', description: '', genre: '都市', total_chapters: 300 });
        setMsg({ type: 'success', text: `《${res.novel.title}》创建成功！` });
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: '创建失败: ' + e.message });
    }
    setLoading(false);
  };

  const requestOutline = async (novel: Novel) => {
    setMsg({ type: 'success', text: '已请求 Nova 策划大纲...（需要 Nova 那边配合）' });
    // TODO: 调 Nova 接口，让 Nova 策划大纲
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case 'planning': return <Clock className="w-4 h-4 text-gray-400" />;
      case 'outlined': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'writing': return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'published': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const statusText = (s: string) => {
    const map: Record<string, string> = {
      planning: '策划中', outlined: '大纲已就绪', writing: '写作中',
      review: '审核中', published: '已发布', failed: '发布失败'
    };
    return map[s] || s;
  };

  const genreColors: Record<string, string> = {
    都市: 'bg-blue-100 text-blue-700',
    玄幻: 'bg-purple-100 text-purple-700',
    修仙: 'bg-green-100 text-green-700',
    系统: 'bg-orange-100 text-orange-700',
    言情: 'bg-pink-100 text-pink-700',
    悬疑: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              Nova 小说工场
            </h1>
            <p className="text-gray-500 mt-1">AI 写小说 → 自动发番茄，全程无人值守</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" /> 新建小说
          </button>
        </div>

        {/* 消息 */}
        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
            <button className="float-right" onClick={() => setMsg(null)}>✕</button>
          </div>
        )}

        {/* 创建表单弹窗 */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">新建小说</h2>
              <div className="space-y-3">
                <input
                  placeholder="书名 *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 border rounded-lg"
                />
                <textarea
                  placeholder="一句话简介" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 border rounded-lg" rows={2}
                />
                <select value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} className="w-full p-2.5 border rounded-lg">
                  <option>都市</option><option>玄幻</option><option>修仙</option><option>系统</option><option>言情</option><option>悬疑</option>
                </select>
                <input
                  type="number" min={30} max={3000}
                  placeholder="总章节数" value={form.total_chapters} onChange={e => setForm({ ...form, total_chapters: parseInt(e.target.value) || 300 })}
                  className="w-full p-2.5 border rounded-lg"
                />
                <button onClick={createNovel} disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? '创建中...' : '创建'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 小说列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border p-4">
              <h2 className="font-semibold text-gray-700 mb-3">小说列表</h2>
              {loading && novels.length === 0 && <p className="text-gray-400 text-sm">加载中...</p>}
              {!loading && novels.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>还没有小说</p>
                  <p className="text-xs">点击右上角新建</p>
                </div>
              )}
              <div className="space-y-2">
                {novels.map(n => (
                  <div
                    key={n.id}
                    onClick={() => openNovel(n)}
                    className={`p-3 rounded-xl cursor-pointer border transition ${selected?.id === n.id ? 'border-indigo-300 bg-indigo-50' : 'border-transparent hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {n.total_chapters}章 · {n.description?.slice(0, 20) || '无简介'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${genreColors[n.genre] || 'bg-gray-100'}`}>
                          {n.genre}
                        </span>
                        {statusIcon(n.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 详情 */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-400">
                <BookOpen className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p className="text-lg">选择一部小说查看详情</p>
                <p className="text-sm mt-1">或者新建一部小说开始 AI 写作</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 小说信息卡片 */}
                <div className="bg-white rounded-2xl shadow-sm border p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selected.title}</h2>
                      <p className="text-gray-500 mt-1">{selected.description || '暂无简介'}</p>
                      <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${genreColors[selected.genre] || 'bg-gray-100'}`}>
                          {selected.genre}
                        </span>
                        <span>共 {selected.total_chapters} 章</span>
                        <span>状态: {statusText(selected.status)}</span>
                      </div>
                    </div>
                    {selected.status === 'planning' && (
                      <button onClick={() => requestOutline(selected)}
                        className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        请求大纲
                      </button>
                    )}
                  </div>

                  {/* 统计 */}
                  {stats && (
                    <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-700">{stats.writing + stats.review + stats.published}</p>
                        <p className="text-xs text-gray-400">已写</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                        <p className="text-xs text-gray-400">已发布</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">{stats.writing}</p>
                        <p className="text-xs text-gray-400">写作中</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{selected.total_chapters - (stats.writing + stats.review + stats.published)}</p>
                        <p className="text-xs text-gray-400">待写</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 章节列表 */}
                <div className="bg-white rounded-2xl shadow-sm border p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">章节列表</h3>
                  {chapters.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      还没有章节。先让 Nova 策划大纲吧！
                    </div>
                  )}
                  <div className="divide-y max-h-96 overflow-y-auto">
                    {chapters.map(ch => (
                      <div key={ch.id} className="py-2.5 flex items-center justify-between hover:bg-gray-50 px-2 rounded">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm w-8">#{ch.chapter_no}</span>
                          <span className="text-gray-700">{ch.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{ch.word_count > 0 ? `${Math.round(ch.word_count / 100) / 10}千字` : '-'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            ch.status === 'published' ? 'bg-green-100 text-green-700' :
                            ch.status === 'writing' ? 'bg-yellow-100 text-yellow-700' :
                            ch.status === 'review' ? 'bg-blue-100 text-blue-700' :
                            ch.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {statusText(ch.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
