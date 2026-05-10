/**
 * WhatsApp 中继引流模块
 * 
 * 功能：
 * 1. 用户创建 WhatsApp 跳转链接（绑定客户名称、WhatsApp号码、欢迎语）
 * 2. 公共跳转页面 /go?id=xxx → 展示页 → 跳转 WhatsApp
 * 3. 点击数据统计
 * 
 * ⚡ v2: 数据存储从本地文件迁移到 PostgreSQL，防止 Render 部署丢失
 */

import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ======== 会员链接限额 ========

const LINK_LIMITS = {
  free: 1,
  basic: 2,
  pro: 10,
  enterprise: 50,
  flagship: 100,
};

function getLinkLimit(user) {
  const type = (user.membership_type || user.plan || 'free').toLowerCase();
  return LINK_LIMITS[type] ?? 1;
}

// ======== 工具函数 ========

function generateId() {
  return 'wa_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

// 字段映射：数据库列名 → JS 驼峰名
const FIELD_MAP = {
  link_id: 'linkId',
  user_id: 'userId',
  client_name: 'clientName',
  phone: 'phone',
  msg: 'msg',
  page_title: 'pageTitle',
  company_name: 'companyName',
  description: 'description',
  button_text: 'buttonText',
  logo_url: 'logoUrl',
  bg_color: 'bgColor',
  accent_color: 'accentColor',
  auto_redirect_ms: 'autoRedirectMs',
  clicks: 'clicks',
  last_click_at: 'lastClickAt',
  disabled: 'disabled',
  expires_at: 'expiresAt',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
};

function dbToJs(row) {
  if (!row) return null;
  const obj = {};
  for (const [dbKey, jsKey] of Object.entries(FIELD_MAP)) {
    obj[jsKey] = row[dbKey];
  }
  // 时间戳转为毫秒
  if (obj.lastClickAt) obj.lastClickAt = new Date(obj.lastClickAt).getTime();
  if (obj.createdAt) obj.createdAt = new Date(obj.createdAt).getTime();
  if (obj.updatedAt) obj.updatedAt = new Date(obj.updatedAt).getTime();
  if (obj.expiresAt) obj.expiresAt = new Date(obj.expiresAt).getTime();
  return obj;
}

// ======== 公开接口：跳转页面（不需要登录） ========

/**
 * GET /go?id=xxx
 * 公共跳转页 - 展示品牌页后跳转 WhatsApp
 * 返回完整的 HTML 页面（TK 广告落地页）
 */
router.get('/', async (req, res) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).send(renderErrorPage('缺少链接ID'));
  }

  try {
    const result = await pool.query(
      'SELECT * FROM whatsapp_links WHERE link_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send(renderErrorPage('链接不存在或已停用'));
    }

    const link = dbToJs(result.rows[0]);

    if (link.disabled) {
      return res.status(404).send(renderErrorPage('链接不存在或已停用'));
    }

    // 检查链接是否过期（免费用户7天试用）
    if (link.expiresAt && link.expiresAt < Date.now()) {
      return res.status(410).send(renderErrorPage('链接已过期，请联系升级会员以继续使用'));
    }

    // 增加点击计数
    await pool.query(
      'UPDATE whatsapp_links SET clicks = clicks + 1, last_click_at = NOW() WHERE link_id = $1',
      [id]
    );

    // 覆盖全局 CSP：落地页需要内联样式和脚本
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data: https:;");

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
  } catch (error) {
    console.error('获取链接失败:', error);
    res.status(500).send(renderErrorPage('服务器错误'));
  }
});

// ======== 需要登录的管理接口 ========

/**
 * GET /api/whatsapp/links
 * 获取当前用户的所有 WhatsApp 链接
 */
router.get('/links', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM whatsapp_links WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json({ success: true, data: result.rows.map(dbToJs) });
  } catch (error) {
    console.error('获取链接列表失败:', error);
    res.status(500).json({ success: false, error: '获取链接列表失败' });
  }
});

/**
 * POST /api/whatsapp/links
 * 创建新的 WhatsApp 跳转链接
 */
router.post('/links', authenticateToken, async (req, res) => {
  try {
    const { clientName, phone, msg, pageTitle, companyName, description, buttonText } = req.body;

    if (!clientName || !phone) {
      return res.status(400).json({ success: false, error: '客户名称和手机号必填' });
    }

    // 会员限额检查（不计算已禁用或已过期的链接）
    const membershipType = (req.user.membership_type || req.user.plan || 'free').toLowerCase();
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM whatsapp_links WHERE user_id = $1 AND disabled = false AND (expires_at IS NULL OR expires_at > NOW())`,
      [req.userId]
    );
    const userLinkCount = parseInt(countResult.rows[0].count);
    const limit = getLinkLimit(req.user);
    if (userLinkCount >= limit) {
      return res.status(403).json({
        success: false,
        error: `您的${membershipType === 'free' ? '免费' : membershipType === 'basic' ? '基础版' : membershipType === 'pro' ? '专业版' : membershipType === 'enterprise' ? '企业版' : '旗舰版'}会员最多可创建 ${limit} 个链接`,
        code: 'LINK_LIMIT_REACHED',
        limit,
        current: userLinkCount,
      });
    }

    const linkId = generateId();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    // 免费用户：7天试用期过期
    const expiresAt = membershipType === 'free'
      ? `NOW() + INTERVAL '7 days'`
      : null;

    if (expiresAt) {
      await pool.query(
        `INSERT INTO whatsapp_links (link_id, user_id, client_name, phone, msg, page_title, company_name, description, button_text, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ${expiresAt})`,
        [
          linkId, req.userId, clientName, cleanPhone,
          msg || '',
          pageTitle || `${clientName} - 咨询客服`,
          companyName || 'CLAW 智能服务',
          description || '您好！欢迎咨询，点击下方按钮立即联系客服',
          buttonText || '立即咨询'
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO whatsapp_links (link_id, user_id, client_name, phone, msg, page_title, company_name, description, button_text)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          linkId, req.userId, clientName, cleanPhone,
          msg || '',
          pageTitle || `${clientName} - 咨询客服`,
          companyName || 'CLAW 智能服务',
          description || '您好！欢迎咨询，点击下方按钮立即联系客服',
          buttonText || '立即咨询'
        ]
      );
    }

    const baseUrl = process.env.API_BASE_URL || process.env.RENDER_EXTERNAL_URL || `https://${req.get('host')}`;

    res.json({
      success: true,
      data: {
        linkId,
        userId: req.userId,
        clientName,
        phone: cleanPhone,
        msg: msg || '',
        pageTitle: pageTitle || `${clientName} - 咨询客服`,
        url: `${baseUrl}/go?id=${linkId}`,
        fullUrl: `${baseUrl}/api/whatsapp/?id=${linkId}`
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
router.put('/links/:id', authenticateToken, async (req, res) => {
  try {
    // 先检查链接是否存在且属于该用户
    const check = await pool.query(
      'SELECT * FROM whatsapp_links WHERE link_id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: '链接不存在' });
    }

    const allowedDbFields = [
      'client_name', 'phone', 'msg', 'page_title', 'company_name',
      'description', 'button_text', 'logo_url', 'bg_color', 'accent_color',
      'auto_redirect_ms', 'disabled'
    ];

    const updates = [];
    const values = [];
    let idx = 1;

    for (const dbField of allowedDbFields) {
      const jsField = FIELD_MAP[dbField];
      if (req.body[jsField] !== undefined) {
        let val = req.body[jsField];
        if (dbField === 'phone') val = String(val).replace(/[^0-9]/g, '');
        updates.push(`${dbField} = $${idx}`);
        values.push(val);
        idx++;
      }
    }

    if (updates.length === 0) {
      return res.json({ success: true, message: '无需更新' });
    }

    updates.push('updated_at = NOW()');
    values.push(req.params.id);
    values.push(req.userId);

    await pool.query(
      `UPDATE whatsapp_links SET ${updates.join(', ')} WHERE link_id = $${idx} AND user_id = $${idx + 1}`,
      values
    );

    // 返回更新后的数据
    const updated = await pool.query('SELECT * FROM whatsapp_links WHERE link_id = $1', [req.params.id]);
    res.json({ success: true, data: dbToJs(updated.rows[0]), message: '更新成功' });
  } catch (error) {
    console.error('更新链接失败:', error);
    res.status(500).json({ success: false, error: '更新链接失败' });
  }
});

/**
 * DELETE /api/whatsapp/links/:id
 * 删除链接
 */
router.delete('/links/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM whatsapp_links WHERE link_id = $1 AND user_id = $2 RETURNING link_id',
      [req.params.id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: '链接不存在' });
    }

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
router.post('/links/:id/reset', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE whatsapp_links SET clicks = 0, last_click_at = NULL, updated_at = NOW() WHERE link_id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: '链接不存在' });
    }

    res.json({ success: true, data: dbToJs(result.rows[0]), message: '计数已重置' });
  } catch (error) {
    console.error('重置计数失败:', error);
    res.status(500).json({ success: false, error: '重置计数失败' });
  }
});

/**
 * GET /api/whatsapp/stats
 * 获取统计概览
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM whatsapp_links WHERE user_id = $1',
      [req.userId]
    );
    const links = result.rows.map(dbToJs);

    const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    const activeLinks = links.filter(l => !l.disabled).length;

    // 按日统计点击（最近7天）
    const dayMs = 86400000;
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const dayStr = new Date(Date.now() - i * dayMs).toISOString().split('T')[0];
      const dayResult = await pool.query(
        `SELECT COALESCE(SUM(clicks), 0) as day_clicks FROM whatsapp_links 
         WHERE user_id = $1 AND last_click_at::date = $2`,
        [req.userId, dayStr]
      );
      dailyStats.push({
        date: dayStr,
        clicks: parseInt(dayResult.rows[0].day_clicks),
      });
    }

    res.json({
      success: true,
      data: {
        totalLinks: links.length,
        activeLinks,
        totalClicks,
        linkLimit: getLinkLimit(req.user),
        membershipType: req.user.membership_type || req.user.plan || 'free',
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
