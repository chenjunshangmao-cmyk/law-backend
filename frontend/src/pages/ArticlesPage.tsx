/**
 * ArticlesPage.tsx — 外贸干货文章列表 v1.0
 * 
 * 功能：分类筛选、搜索、分页、AI生成文章、SEO友好
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Eye, Clock, PenLine, Share2, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  cover_image: string | null;
  category: string;
  tags: string[];
  author: string;
  view_count: number;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
}

export default function ArticlesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // AI生成
  const [showGenerator, setShowGenerator] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genCategory, setGenCategory] = useState('cross-border');
  const [genStyle, setGenStyle] = useState('professional');
  const [genKeywords, setGenKeywords] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(search && { search }),
        status: 'published',
      });
      const res = await fetch(`${API_BASE}/api/articles?${params}`);
      const data = await res.json();
      if (data.success) {
        setArticles(data.data.articles);
        setTotalPages(data.data.totalPages);
      }
    } catch (e) {}
    setLoading(false);
  };

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/articles/categories`);
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (e) {}
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { setPage(1); }, [selectedCategory, search]);
  useEffect(() => { loadArticles(); }, [page, selectedCategory, search]);

  const handleGenerate = async () => {
    if (!genTopic.trim()) return;
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/articles/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          topic: genTopic.trim(),
          category: genCategory,
          keywords: genKeywords.split(/[,，]/).map(k => k.trim()).filter(Boolean),
          style: genStyle,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGenResult(data.data);
        // 自动发布
        await fetch(`${API_BASE}/api/articles/${data.data.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: 'published' }),
        });
        loadArticles();
      }
    } catch (e) {}
    setGenerating(false);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const handleCardShare = (e: React.MouseEvent, article: Article) => {
    e.stopPropagation(); // 防止触发卡片点击跳转
    const url = `${window.location.origin}/articles/${article.slug}`;
    if (/Mobi|Android|iPhone/i.test(navigator.userAgent) && navigator.share) {
      navigator.share({ title: article.title, url }).catch(() => {});
      return;
    }
    // 桌面端复制链接
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(article.slug);
      setTimeout(() => setShareToast(null), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setShareToast(article.slug);
      setTimeout(() => setShareToast(null), 2000);
    });
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto', minHeight: '100vh' }}>
      {/* 头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            📰 外贸干货
          </h1>
          <p style={{ color: '#8892b0', fontSize: 14, marginTop: 6 }}>
            跨境电商运营实战经验，AI帮你少走弯路
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowGenerator(!showGenerator); setGenResult(null); }}
            style={{
              padding: '10px 24px', borderRadius: 10,
              border: 'none',
              background: showGenerator ? '#374151' : 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Sparkles size={18} /> {showGenerator ? '关闭' : 'AI 写文章'}
          </button>
        )}
      </div>

      {/* AI 生成面板（管理员） */}
      {showGenerator && isAdmin && (
        <div style={{
          background: 'linear-gradient(135deg, #1a1a3e, #2d1b4e)', borderRadius: 16,
          padding: 24, marginBottom: 24, border: '1px solid #3d3d6e',
        }}>
          <h3 style={{ margin: '0 0 16px', color: '#aaaacc' }}>🤖 AI 生成外贸干货文章</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ color: '#8892b0', fontSize: 13, display: 'block', marginBottom: 4 }}>文章主题</label>
              <input
                value={genTopic}
                onChange={e => setGenTopic(e.target.value)}
                placeholder="例: TikTok Shop 新手如何7天出首单"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid #3d3d6e',
                  color: '#e0e0e0', fontSize: 14, boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ color: '#8892b0', fontSize: 13, display: 'block', marginBottom: 4 }}>文章分类</label>
              <select value={genCategory} onChange={e => setGenCategory(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid #3d3d6e',
                  color: '#e0e0e0', fontSize: 14,
                }}>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ color: '#8892b0', fontSize: 13, display: 'block', marginBottom: 4 }}>写作风格</label>
              <select value={genStyle} onChange={e => setGenStyle(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid #3d3d6e',
                  color: '#e0e0e0', fontSize: 14,
                }}>
                <option value="professional">📊 专业分析风</option>
                <option value="casual">💬 轻松分享风</option>
                <option value="tutorial">📖 教程实操风</option>
              </select>
            </div>
            <div>
              <label style={{ color: '#8892b0', fontSize: 13, display: 'block', marginBottom: 4 }}>SEO关键词（逗号分隔）</label>
              <input
                value={genKeywords}
                onChange={e => setGenKeywords(e.target.value)}
                placeholder="跨境, TikTok, 选品"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid #3d3d6e',
                  color: '#e0e0e0', fontSize: 14, boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !genTopic.trim()}
            style={{
              marginTop: 16, padding: '12px 32px', borderRadius: 10,
              border: 'none',
              background: generating ? '#555' : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', fontWeight: 600, cursor: generating ? 'wait' : 'pointer',
              fontSize: 15,
            }}
          >
            {generating ? '⏳ AI正在撰写中...' : '✨ 生成并发布'}
          </button>
          {genResult && (
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(16,185,129,0.1)', borderRadius: 8, color: '#10b981' }}>
              ✅ 文章已生成: <strong style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate(`/articles/${genResult.slug}`)}>{genResult.title}</strong>
            </div>
          )}
        </div>
      )}

      {/* 分类筛选 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '8px 18px', borderRadius: 20, border: 'none',
            background: selectedCategory === 'all' ? '#667eea' : 'rgba(255,255,255,0.05)',
            color: selectedCategory === 'all' ? '#fff' : '#8892b0',
            cursor: 'pointer', fontWeight: 500, fontSize: 14,
          }}
        >全部</button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            style={{
              padding: '8px 18px', borderRadius: 20, border: 'none',
              background: selectedCategory === c.id ? c.color : 'rgba(255,255,255,0.05)',
              color: selectedCategory === c.id ? '#fff' : '#8892b0',
              cursor: 'pointer', fontWeight: 500, fontSize: 14,
            }}
          >{c.icon} {c.name}</button>
        ))}
      </div>

      {/* 搜索 */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: '#667eea' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索外贸干货..."
          style={{
            width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid #2d2d4e',
            color: '#e0e0e0', fontSize: 15, boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 文章列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#667eea' }}>⏳ 加载中...</div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#8892b0' }}>
          <PenLine size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p>还没文章，AI正在学习外贸知识...</p>
          {isAdmin && <p style={{ fontSize: 13 }}>点右上角「AI写文章」开始</p>}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {articles.map(article => {
              const cat = categories.find(c => c.id === article.category);
              return (
                <article
                  key={article.id}
                  onClick={() => navigate(`/articles/${article.slug}`)}
                  style={{
                    background: 'rgba(255,255,255,0.02)', borderRadius: 16,
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer', overflow: 'hidden',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(102,126,234,0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* 封面 */}
                  <div style={{
                    height: 180, background: `linear-gradient(135deg, ${cat?.color || '#667eea'}22, ${cat?.color || '#667eea'}08)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 48,
                  }}>
                    {cat?.icon || '📄'}
                  </div>

                  {/* 内容 */}
                  <div style={{ padding: '16px 20px 20px' }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      {cat && (
                        <span style={{
                          padding: '2px 10px', borderRadius: 10, fontSize: 12,
                          background: `${cat.color}22`, color: cat.color, fontWeight: 500,
                        }}>
                          {cat.name}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.4, color: '#e0e0e0' }}>
                      {article.title}
                    </h3>
                    <p style={{ fontSize: 13, color: '#8892b0', lineHeight: 1.5, margin: '0 0 14px' }}>
                      {article.summary?.substring(0, 100)}...
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#667eea' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> {formatDate(article.created_at)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={12} /> {article.view_count}
                        </span>
                        <button
                          onClick={(e) => handleCardShare(e, article)}
                          title="转发分享"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            background: shareToast === article.slug ? 'rgba(16,185,129,0.15)' : 'rgba(102,126,234,0.1)',
                            border: 'none', borderRadius: 6,
                            padding: '3px 10px',
                            color: shareToast === article.slug ? '#10b981' : '#667eea',
                            cursor: 'pointer', fontSize: 11, fontWeight: 500,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => {
                            if (shareToast !== article.slug) e.currentTarget.style.background = 'rgba(102,126,234,0.2)';
                          }}
                          onMouseLeave={e => {
                            if (shareToast !== article.slug) e.currentTarget.style.background = 'rgba(102,126,234,0.1)';
                          }}
                        >
                          {shareToast === article.slug ? (
                            <><Check size={12} /> 已复制</>
                          ) : (
                            <><Share2 size={12} /> 转发</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    background: page === i + 1 ? '#667eea' : 'rgba(255,255,255,0.05)',
                    color: page === i + 1 ? '#fff' : '#8892b0',
                    cursor: 'pointer', fontWeight: 500,
                  }}
                >{i + 1}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
