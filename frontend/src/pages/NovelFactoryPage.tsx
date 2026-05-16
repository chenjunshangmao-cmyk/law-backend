/**
 * NovelFactoryPage - 小说工场（大改版）
 * 功能：大纲生成 → AI批量写章节 → 目录选章 → 发布
 * 防AI检测：风格选项、真人语气
 */
import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Sparkles, Send, CheckCircle, Clock, AlertCircle, Eye, FileText, Globe, Settings, RefreshCw } from 'lucide-react';
import { authFetch } from '../services/api';

// ======================== 风格选项 ========================
const STYLES = [
  { id: 'default', label: '默认风格', desc: '常规叙述' },
  { id: 'funny', label: '😂 搞笑风趣', desc: '加入幽默段子、神转折' },
  { id: 'suspense', label: '🔍 悬疑紧张', desc: '悬念设置、反转情节' },
  { id: 'tearjerker', label: '😢 催泪感人', desc: '泪点、遗憾、亲情友情' },
  { id: 'passionate', label: '🔥 热血燃爆', desc: '战斗、爆发、逆袭' },
  { id: 'lifehack', label: '🏠 生活细节', desc: '日常烟火气、接地气' },
];

export default function NovelFactoryPage() {
  const [step, setStep] = useState<'create' | 'outline' | 'chapters'>('create');
  // 小说信息
  const [form, setForm] = useState({ title: '', genre: '都市', description: '', totalChapters: 300 });
  const [style, setStyle] = useState('default');
  const [outline, setOutline] = useState('');
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [viewingChapter, setViewingChapter] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ======================== 加载已生成章节 ========================
  useEffect(() => {
    authFetch('/api/novel-engine/chapters').then(r => {
      if (r.success) setChapters(r.data.chapters);
    }).catch(() => {});
  }, []);

  // ======================== 生成大纲 ========================
  async function generateOutline() {
    if (!form.title.trim()) { setMsg({ type: 'error', text: '请输入书名' }); return; }
    setLoading(true);
    try {
      const res = await authFetch('/api/novel-engine/outline', {
        method: 'POST',
        body: JSON.stringify({ ...form, style })
      });
      if (res.success) {
        setOutline(res.data.outline);
        setStep('outline');
        setMsg({ type: 'success', text: '大纲生成成功！' });
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: '大纲生成失败: ' + e.message });
    }
    setLoading(false);
  }

  // ======================== 批量生成章节 ========================
  async function generateChapters(startFrom = 1, count = 5) {
    setGenerating(true);
    setProgress(`正在生成第${startFrom}~${startFrom + count - 1}章...`);
    try {
      const res = await authFetch('/api/novel-engine/generate-chapters', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          genre: form.genre,
          chapterStart: startFrom,
          chapterCount: count,
          outline,
          style
        })
      });
      if (res.success) {
        // 刷新章节列表
        const chRes = await authFetch('/api/novel-engine/chapters');
        if (chRes.success) setChapters(chRes.data.chapters);
        setStep('chapters');
        setMsg({ type: 'success', text: `第${startFrom}~${startFrom + count - 1}章生成完成！` });
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: '生成失败: ' + e.message });
    }
    setGenerating(false);
    setProgress('');
  }

  // ======================== 查看章节详情 ========================
  async function viewChapter(id: string) {
    try {
      const res = await authFetch(`/api/novel-engine/chapter/${id}`);
      if (res.success) setViewingChapter(res.data);
    } catch { /* ignore */ }
  }

  // ======================== 发布章节 ========================
  async function publishChapter(id: string) {
    try {
      const res = await authFetch(`/api/novel-engine/publish`, {
        method: 'POST', body: JSON.stringify({ chapterId: id })
      });
      if (res.success) {
        setMsg({ type: 'success', text: res.data.title + ' 已标记发布！' });
        const chRes = await authFetch('/api/novel-engine/chapters');
        if (chRes.success) setChapters(chRes.data.chapters);
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: '发布失败: ' + e.message });
    }
  }

  // ======================== 开始新小说 ========================
  function startNew() {
    setForm({ title: '', genre: '都市', description: '', totalChapters: 300 });
    setOutline('');
    setStep('create');
    setViewingChapter(null);
  }

  // ======================== 统计 ========================
  const draftCount = chapters.filter(c => c.status === 'draft').length;
  const publishedCount = chapters.filter(c => c.status === 'published').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* ========== 顶部 ========== */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-indigo-600" />
              AI 小说工场
            </h1>
            <p className="text-gray-500 text-xs md:text-sm mt-1">AI批量写小说 · 防AI检测 · 一键发番茄</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">草稿 {draftCount}</span>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">已发 {publishedCount}</span>
            <button onClick={startNew} className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              ✏️ 新建
            </button>
          </div>
        </div>

        {/* 消息 */}
        {msg && (
          <div className={`mb-3 p-3 rounded-lg text-sm flex justify-between items-center ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.text}
            <button onClick={() => setMsg(null)} className="ml-2">✕</button>
          </div>
        )}

        {/* 生成进度 */}
        {generating && (
          <div className="mb-3 p-4 bg-purple-50 border border-purple-200 rounded-xl text-center">
            <RefreshCw className="w-5 h-5 inline animate-spin text-purple-600 mr-2" />
            <span className="text-purple-700 font-medium">{progress}</span>
            <p className="text-xs text-purple-500 mt-1">AI正在写作中，约需30-60秒...</p>
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div className="mb-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-center text-indigo-600">
            正在生成大纲...约15-30秒
          </div>
        )}

        {/* ========== 第一步：创建/新建弹窗 ========== */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">✍️ 创建新小说</h2>
              <div className="space-y-3">
                <input placeholder="书名 *" value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full p-2.5 border rounded-lg text-sm" />
                <textarea placeholder="一句话简介（可选）" value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full p-2.5 border rounded-lg text-sm" rows={2} />
                <select value={form.genre} onChange={e => setForm({...form, genre: e.target.value})}
                  className="w-full p-2.5 border rounded-lg text-sm">
                  {['都市','玄幻','修仙','系统','言情','悬疑','历史','科幻'].map(g => <option key={g}>{g}</option>)}
                </select>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">总章节数</label>
                  <input type="number" min={30} max={3000} value={form.totalChapters}
                    onChange={e => setForm({...form, totalChapters: parseInt(e.target.value) || 300})}
                    className="w-full p-2.5 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">风格选择（防AI检测）</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLES.map(s => (
                      <button key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`p-2 rounded-lg border text-xs text-left transition ${style === s.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="font-medium">{s.label}</div>
                        <div className="text-gray-400 mt-0.5">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={generateOutline} disabled={loading || !form.title}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium">
                  {loading ? '⏳ 生成大纲中...' : '🚀 生成大纲'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== 主布局 ========== */}
        {step === 'create' && !showCreate && (
          <div className="bg-white rounded-2xl p-12 text-center border shadow-sm">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">开始写小说</h2>
            <p className="text-gray-400 mb-4">AI 批量写作 · 防AI检测 · 一键发布到番茄</p>
            <button onClick={() => setShowCreate(true)}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition font-medium">
              ✏️ 新建小说
            </button>
          </div>
        )}

        {/* ========== 第二步：大纲页 ========== */}
        {step === 'outline' && outline && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 左侧：大纲 */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl p-5 border shadow-sm">
                <h2 className="font-bold text-gray-800 mb-3 text-lg">
                  📖 《{form.title}》大纲
                  <span className="text-xs font-normal text-gray-400 ml-2">{form.genre} · {form.totalChapters}章</span>
                </h2>
                <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                  {outline}
                </div>
                <div className="mt-4 pt-3 border-t flex gap-2">
                  <button onClick={() => setShowCreate(true)} 
                    className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50">← 重新设置</button>
                  <button onClick={() => generateChapters(1, 5)} disabled={generating}
                    className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    🔥 生成前5章
                  </button>
                  <button onClick={() => generateChapters(1, 10)} disabled={generating}
                    className="text-sm px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                    🚀 生成前10章
                  </button>
                </div>
              </div>
            </div>

            {/* 右侧：已生成章节列表 */}
            <ChapterSidebar chapters={chapters} onView={viewChapter} onPublish={publishChapter} onGenerate={generateChapters} generating={generating} />
          </div>
        )}

        {/* ========== 第三步：章节目录页 ========== */}
        {step === 'chapters' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {/* 生成操作 */}
              <div className="bg-white rounded-2xl p-4 border shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-800">📚 《{form.title}》章节管理</h2>
                  <div className="flex items-center gap-2">
                    <select value={style} onChange={e => setStyle(e.target.value)}
                      className="text-xs p-1.5 border rounded-lg">
                      {STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    <button onClick={() => generateChapters(chapters.length + 1, 5)} disabled={generating}
                      className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                      + 续写5章
                    </button>
                    <button onClick={() => generateChapters(chapters.length + 1, 10)} disabled={generating}
                      className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                      + 续写10章
                    </button>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="bg-gray-100 rounded-full h-2 mb-3">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${form.totalChapters > 0 ? (chapters.length / form.totalChapters * 100) : 0}%` }} />
                </div>
                <div className="text-xs text-gray-400 mb-3">
                  已写 {chapters.length} / {form.totalChapters} 章 · 草稿 {draftCount} · 已发布 {publishedCount}
                </div>

                {/* 章节列表 */}
                {chapters.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">还没有生成章节</p>
                    <p className="text-xs mt-1">先设置大纲后，点击批量生成</p>
                  </div>
                ) : (
                  <div className="divide-y max-h-[500px] overflow-y-auto border rounded-xl">
                    {chapters.map(ch => (
                      <div key={ch.id}
                        className="flex items-center justify-between p-2.5 hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => viewChapter(ch.id)}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-gray-400 text-xs font-mono w-8">#{ch.chapterNo}</span>
                          <span className="text-sm font-medium truncate">{ch.title}</span>
                          <span className="text-xs text-gray-400">
                            {ch.wordCount > 0 ? `${Math.round(ch.wordCount / 100) / 10}千字` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            ch.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>{ch.status === 'published' ? '已发' : '草稿'}</span>
                          <button onClick={e => { e.stopPropagation(); viewChapter(ch.id); }}
                            className="p-1 hover:bg-gray-100 rounded">
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                          {ch.status === 'draft' && (
                            <button onClick={e => { e.stopPropagation(); publishChapter(ch.id); }}
                              className="p-1 hover:bg-green-50 rounded" title="发布到番茄">
                              <Send className="w-3.5 h-3.5 text-green-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：章节预览 */}
            <div>
              {viewingChapter ? (
                <div className="bg-white rounded-2xl p-5 border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 text-sm">
                      第{viewingChapter.chapterNo}章 · {viewingChapter.title}
                    </h3>
                    <button onClick={() => setViewingChapter(null)} className="text-xs text-gray-400">✕</button>
                  </div>
                  <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto">
                    {viewingChapter.content || '加载中...'}
                  </div>
                  <div className="mt-3 pt-3 border-t flex gap-2">
                    {viewingChapter.status === 'draft' && (
                      <button onClick={() => publishChapter(viewingChapter.id)}
                        className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        📤 发布到番茄
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 text-center border shadow-sm">
                  <Eye className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs text-gray-400">点击章节查看完整内容</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== 浮动新建按钮 ========== */}
        {step !== 'create' && (
          <div className="fixed bottom-6 right-6 space-y-2">
            <button onClick={() => generateChapters(chapters.length + 1, 5)} disabled={generating}
              className="block w-full text-sm px-4 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50">
              {generating ? '⏳ 写作中...' : '+ 续写5章'}
            </button>
            <button onClick={() => setShowCreate(true)}
              className="block w-full text-sm px-4 py-2.5 bg-white text-gray-700 rounded-xl shadow-lg border hover:bg-gray-50">
              ✏️ 新建小说
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ======================== 右侧章节列表（小版） ========================
function ChapterSidebar({ chapters, onView, onPublish, onGenerate, generating }: any) {
  const draft = chapters.filter((c: any) => c.status === 'draft').length;

  return (
    <div className="bg-white rounded-2xl p-4 border shadow-sm">
      <h3 className="font-bold text-sm text-gray-700 mb-3">
        📑 已生成章节（{chapters.length}）
      </h3>
      {chapters.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">暂无章节</p>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {chapters.map((ch: any) => (
            <div key={ch.id}
              className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => onView(ch.id)}>
              <span className="text-gray-500">#{ch.chapterNo}</span>
              <span className="flex-1 ml-1.5 truncate">{ch.title}</span>
              <span className={`px-1.5 py-0.5 rounded-sm text-[10px] ${ch.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {ch.status === 'published' ? '已发' : '稿'}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 pt-3 border-t">
        <div className="text-xs text-gray-400 mb-2">
          草稿: {draft} · 已发布: {chapters.filter((c: any) => c.status === 'published').length}
        </div>
        <button onClick={() => onGenerate(chapters.length + 1, 5)} disabled={generating}
          className="w-full text-xs py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {generating ? '⏳' : '+ 续写5章'}
        </button>
      </div>
    </div>
  );
}
