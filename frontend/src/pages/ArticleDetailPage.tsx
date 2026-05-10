/**
 * ArticleDetailPage.tsx — 文章详情页 v1.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Eye, ArrowLeft, Share2, ExternalLink } from 'lucide-react';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  view_count: number;
  created_at: string;
  seo_title: string;
  seo_desc: string;
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const loadArticle = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/articles/${slug}`);
        const data = await res.json();
        if (data.success) {
          setArticle(data.data.article);
          setRelated(data.data.related || []);
          document.title = data.data.article.seo_title || data.data.article.title;
        }
      } catch (e) {}
      setLoading(false);
    };
    loadArticle();
  }, [slug]);

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  // Markdown 转 HTML（简易版）
  const renderMarkdown = (md: string) => {
    let html = md
      .replace(/^### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^## (.*$)/gm, '<h3>$1</h3>')
      .replace(/^# (.*$)/gm, '<h2>$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/> (.*$)/gm, '<blockquote>$1</blockquote>');
    return html;
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: article?.title, url });
    } else {
      navigator.clipboard.writeText(url);
      alert('链接已复制！');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, color: '#667eea' }}>
        ⏳ 加载中...
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: '#8892b0' }}>
        文章不存在或已被删除
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 860, margin: '0 auto', minHeight: '100vh' }}>
      {/* 返回 */}
      <button
        onClick={() => navigate('/articles')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', color: '#667eea',
          cursor: 'pointer', fontSize: 14, marginBottom: 24,
        }}
      >
        <ArrowLeft size={16} /> 返回文章列表
      </button>

      {/* 文章头部 */}
      <div style={{ marginBottom: 32 }}>
        {/* 分类标签 */}
        <div style={{ marginBottom: 12 }}>
          <span style={{
            padding: '4px 14px', borderRadius: 12, fontSize: 13,
            background: 'rgba(102,126,234,0.15)', color: '#667eea',
            fontWeight: 500,
          }}>
            {article.category}
          </span>
        </div>

        <h1 style={{
          fontSize: 30, fontWeight: 700, lineHeight: 1.35,
          margin: '0 0 14px', color: '#e8e8f0',
        }}>
          {article.title}
        </h1>

        <p style={{ fontSize: 15, color: '#8892b0', lineHeight: 1.6, marginBottom: 16 }}>
          {article.summary}
        </p>

        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#667eea', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={14} /> {formatDate(article.created_at)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Eye size={14} /> {article.view_count} 阅读
          </span>
          <span>· {article.author}</span>
          <button onClick={handleShare}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', color: '#667eea',
              cursor: 'pointer', fontSize: 13, marginLeft: 'auto',
            }}>
            <Share2 size={14} /> 分享
          </button>
        </div>
      </div>

      {/* 分割线 */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, #667eea, transparent)', marginBottom: 32 }} />

      {/* 文章正文 */}
      <div
        style={{
          fontSize: 16, lineHeight: 1.9, color: '#c0c0d0',
        }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content) }}
      />

      {/* 标签 */}
      {article.tags && article.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {article.tags.map(tag => (
            <span key={tag} style={{
              padding: '4px 14px', borderRadius: 16,
              background: 'rgba(255,255,255,0.04)', color: '#8892b0',
              fontSize: 13,
            }}>#{tag}</span>
          ))}
        </div>
      )}

      {/* CTA — 引流按钮 */}
      <div style={{
        marginTop: 48, padding: 28, borderRadius: 16,
        background: 'linear-gradient(135deg, #1a1a3e, #2d1b4e)',
        border: '1px solid #3d3d6e', textAlign: 'center',
      }}>
        <h3 style={{ margin: '0 0 8px', color: '#e0e0e0' }}>🚀 想让AI帮你搞定跨境电商？</h3>
        <p style={{ color: '#8892b0', fontSize: 14, marginBottom: 16 }}>
          Claw提供AI选品、AI客服、AI数字人直播等一站式工具
        </p>
        <button
          onClick={() => navigate('/membership')}
          style={{
            padding: '12px 32px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 15,
          }}>
          了解会员套餐 <ExternalLink size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
        </button>
      </div>

      {/* 相关文章 */}
      {related.length > 0 && (
        <div style={{ marginTop: 48 }}>
          <h3 style={{ color: '#e0e0e0', marginBottom: 16 }}>📖 相关文章</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {related.map(r => (
              <div
                key={r.id}
                onClick={() => navigate(`/articles/${r.slug}`)}
                style={{
                  padding: '16px 20px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(102,126,234,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; }}
              >
                <h4 style={{ margin: '0 0 6px', color: '#e0e0e0', fontSize: 15 }}>{r.title}</h4>
                <p style={{ margin: 0, color: '#8892b0', fontSize: 13 }}>
                  {r.summary?.substring(0, 80)}...
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
