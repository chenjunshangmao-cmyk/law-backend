/**
 * WhatsApp 中继引流模块
 * 
 * 功能：
 * 1. 用户创建 WhatsApp 跳转链接（绑定客户名称、WhatsApp号码、欢迎语）
 * 2. 公共跳转页面 /go?id=xxx → 展示页 → 跳转 WhatsApp
 * 3. 点击数据统计
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const WHATSAPP_FILE = path.join(DATA_DIR, 'whatsapp-links.json');

// 确保数据文件存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(WHATSAPP_FILE)) {
  fs.writeFileSync(WHATSAPP_FILE, JSON.stringify([], null, 2));
}

const router = express.Router();

// ======== 工具函数 ========

function generateId() {
  return 'wa_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

function readLinks() {
  try {
    return JSON.parse(fs.readFileSync(WHATSAPP_FILE, 'utf8'));
  } catch { return []; }
}

function saveLinks(links) {
  fs.writeFileSync(WHATSAPP_FILE, JSON.stringify(links, null, 2));
}

// ======== 公开接口：跳转页面（不需要登录） ========

/**
 * GET /go?id=xxx
 * 公共跳转页 - 展示品牌页后跳转 WhatsApp
 * 返回完整的 HTML 页面（TK 广告落地页）
 */
router.get('/', (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).send(renderErrorPage('缺少链接ID'));
  }

  const links = readLinks();
  const link = links.find(l => l.linkId === id);

  if (!link || link.disabled) {
    return res.status(404).send(renderErrorPage('链接不存在或已停用'));
  }

  // 增加点击计数
  link.clicks = (link.clicks || 0) + 1;
  link.lastClickAt = Date.now();
  saveLinks(links);

  // 渲染中间页
  const waUrl = `https://wa.me/${link.phone}${link.msg ? '?text=' + encodeURIComponent(link.msg) : ''}`;
  res.send(renderLandingPage({
    title: link.pageTitle || '咨询客服',
    logo: link.logoUrl || '',
    companyName: link.companyName || 'CLAW',
    description: link.description || '点击下方按钮，立即咨询',
    buttonText: link.buttonText || '立即咨询',
    waUrl,
    bgColor: link.bgColor || '#f5f7fa',
    accentColor: link.accentColor || '#25D366',
    autoRedirectMs: link.autoRedirectMs || 3000,
  }));
});

// ======== 需要登录的管理接口 ========

/**
 * GET /api/whatsapp/links
 * 获取当前用户的所有 WhatsApp 链接
 */
router.get('/links', authenticateToken, (req, res) => {
  try {
    const links = readLinks().filter(l => l.userId === req.user.userId);
    res.json({ success: true, data: links });
  } catch (error) {
    console.error('获取链接列表失败:', error);
    res.status(500).json({ success: false, error: '获取链接列表失败' });
  }
});

/**
 * POST /api/whatsapp/links
 * 创建新的 WhatsApp 跳转链接
 */
router.post('/links', authenticateToken, (req, res) => {
  try {
    const { clientName, phone, msg, pageTitle, companyName, description, buttonText } = req.body;

    if (!clientName || !phone) {
      return res.status(400).json({ success: false, error: '客户名称和手机号必填' });
    }

    const linkId = generateId();
    const newLink = {
      linkId,
      userId: req.user.userId,
      clientName,
      phone: phone.replace(/[^0-9]/g, ''), // 只保留数字
      msg: msg || '',
      pageTitle: pageTitle || `${clientName} - 咨询客服`,
      companyName: companyName || 'CLAW 智能服务',
      description: description || '您好！欢迎咨询，点击下方按钮立即联系客服',
      buttonText: buttonText || '立即咨询',
      logoUrl: '',
      bgColor: '#f5f7fa',
      accentColor: '#25D366',
      autoRedirectMs: 3000,
      clicks: 0,
      lastClickAt: null,
      disabled: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const links = readLinks();
    links.push(newLink);
    saveLinks(links);

    res.json({
      success: true,
      data: {
        ...newLink,
        // 直接返回可用链接
        url: `${req.protocol}://${req.get('host')}/go?id=${linkId}`,
        fullUrl: `${req.protocol}://${req.get('host')}/api/whatsapp/?id=${linkId}`
      },
      message: '链接创建成功'
    });
  } catch (error) {
    console.error('创建链接失败:', error);
    res.status(500).json({ success: false, error: '创建链接失败' });
  }
});

/**
 * PUT /api/whatsapp/links/:id
 * 更新链接配置
 */
router.put('/links/:id', authenticateToken, (req, res) => {
  try {
    const links = readLinks();
    const index = links.findIndex(l => l.linkId === req.params.id && l.userId === req.user.userId);

    if (index === -1) {
      return res.status(404).json({ success: false, error: '链接不存在' });
    }

    const allowedFields = [
      'clientName', 'phone', 'msg', 'pageTitle', 'companyName',
      'description', 'buttonText', 'logoUrl', 'bgColor', 'accentColor',
      'autoRedirectMs', 'disabled'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'phone') {
          links[index][field] = req.body[field].replace(/[^0-9]/g, '');
        } else {
          links[index][field] = req.body[field];
        }
      }
    }
    links[index].updatedAt = Date.now();
    saveLinks(links);

    res.json({ success: true, data: links[index], message: '更新成功' });
  } catch (error) {
    console.error('更新链接失败:', error);
    res.status(500).json({ success: false, error: '更新链接失败' });
  }
});

/**
 * DELETE /api/whatsapp/links/:id
 * 删除链接
 */
router.delete('/links/:id', authenticateToken, (req, res) => {
  try {
    const links = readLinks();
    const filtered = links.filter(l => !(l.linkId === req.params.id && l.userId === req.user.userId));

    if (filtered.length === links.length) {
      return res.status(404).json({ success: false, error: '链接不存在' });
    }

    saveLinks(filtered);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除链接失败:', error);
    res.status(500).json({ success: false, error: '删除链接失败' });
  }
});

/**
 * POST /api/whatsapp/links/:id/reset
 * 重置点击计数
 */
router.post('/links/:id/reset', authenticateToken, (req, res) => {
  try {
    const links = readLinks();
    const link = links.find(l => l.linkId === req.params.id && l.userId === req.user.userId);

    if (!link) {
      return res.status(404).json({ success: false, error: '链接不存在' });
    }

    link.clicks = 0;
    link.lastClickAt = null;
    link.updatedAt = Date.now();
    saveLinks(links);

    res.json({ success: true, data: link, message: '计数已重置' });
  } catch (error) {
    console.error('重置计数失败:', error);
    res.status(500).json({ success: false, error: '重置计数失败' });
  }
});

/**
 * GET /api/whatsapp/stats
 * 获取统计概览
 */
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const links = readLinks().filter(l => l.userId === req.user.userId);
    const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    const activeLinks = links.filter(l => !l.disabled).length;

    // 按日统计点击（最近7天）
    const now = Date.now();
    const dayMs = 86400000;
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now - i * dayMs);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + dayMs);
      
      const dayClicks = links.reduce((sum, l) => {
        if (l.lastClickAt && l.lastClickAt >= dayStart.getTime() && l.lastClickAt < dayEnd.getTime()) {
          return sum + (l.clicks || 0);
        }
        return sum;
      }, 0);

      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        clicks: dayClicks,
      });
    }

    res.json({
      success: true,
      data: {
        totalLinks: links.length,
        activeLinks,
        totalClicks,
        dailyStats,
      }
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ success: false, error: '获取统计失败' });
  }
});

// ======== 渲染函数 ========

function renderLandingPage(config) {
  const {
    title, logo, companyName, description,
    buttonText, waUrl, bgColor, accentColor,
    autoRedirectMs
  } = config;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background: ${bgColor};
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.08);
      padding: 40px 30px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      animation: fadeIn 0.6s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .logo {
      width: 80px;
      height: 80px;
      border-radius: 18px;
      background: linear-gradient(135deg, ${accentColor}, ${adjustColor(accentColor, -30)});
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 36px;
      color: #fff;
      ${logo ? `background-image: url(${escapeHtml(logo)}); background-size: cover;` : ''}
    }
    h1 {
      font-size: 22px;
      color: #1a1a2e;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .company {
      font-size: 14px;
      color: #888;
      margin-bottom: 16px;
    }
    p.desc {
      font-size: 15px;
      color: #555;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 16px 36px;
      background: ${accentColor};
      color: #fff;
      border: none;
      border-radius: 50px;
      font-size: 17px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 16px rgba(37, 211, 102, 0.3);
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(37, 211, 102, 0.4);
    }
    .btn svg {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
    }
    .auto-hint {
      margin-top: 20px;
      font-size: 13px;
      color: #aaa;
    }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #ccc;
    }
    @media (max-width: 480px) {
      .card { padding: 30px 20px; }
      .btn { width: 100%; justify-content: center; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">💬</div>
    <h1>${escapeHtml(companyName)}</h1>
    <p class="company">${escapeHtml(title)}</p>
    <p class="desc">${escapeHtml(description)}</p>
    <a href="${escapeHtml(waUrl)}" class="btn" target="_blank" rel="noopener noreferrer" id="waBtn">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      ${escapeHtml(buttonText)}
    </a>
    <p class="auto-hint">⏳ 页面将在 ${Math.round(autoRedirectMs/1000)} 秒后自动跳转...</p>
    <div class="footer">Powered by CLAW</div>
  </div>
  <script>
    // 自动跳转
    setTimeout(function() {
      window.location.href = '${escapeHtml(waUrl)}';
    }, ${autoRedirectMs});

    // 点击跳转
    document.getElementById('waBtn').addEventListener('click', function(e) {
      // 正常跳转，不做拦截
    });
  </script>
</body>
</html>`;
}

function renderErrorPage(message) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>链接无效</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f5f7fa; }
  .box { text-align: center; padding: 40px; }
  h1 { font-size: 48px; margin: 0 0 10px; } p { color: #888; }
</style>
</head>
<body>
  <div class="box">
    <h1>🔗</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function adjustColor(hex, amount) {
  // 简单颜色调整
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  let r = Math.max(0, Math.min(255, parseInt(hex.substring(0,2), 16) + amount));
  let g = Math.max(0, Math.min(255, parseInt(hex.substring(2,4), 16) + amount));
  let b = Math.max(0, Math.min(255, parseInt(hex.substring(4,6), 16) + amount));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

export default router;
