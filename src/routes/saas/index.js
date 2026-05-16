/**
 * SaaSBuilder 路由模块 - 多站点管理系统
 * 整合进 Claw 后端（端口 8089），统一管理
 * 
 * 超级管理员：admin@saas.com / admin888
 * API 前缀：/api/saas/
 */
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data/saas');
const SITES_FILE = path.join(DATA_DIR, 'sites.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const JWT_SECRET = process.env.JWT_SECRET || 'claw-default-secret-key-for-development-only-32chars';

// 确保数据目录和文件存在
[DATA_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
[SITES_FILE, USERS_FILE, PRODUCTS_FILE].forEach(f => { if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify([])); });

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch(e) { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// 内置超级管理员
const BUILTIN_USERS = {
  'admin@saas.com': { id: 'super-admin-001', name: '超级管理员', role: 'super_admin', builtinPassword: 'admin888' }
};

function findUser(email) {
  if (BUILTIN_USERS[email]) return { ...BUILTIN_USERS[email], email };
  return readJSON(USERS_FILE).find(u => u.email === email) || null;
}

function saveUser(user) {
  const users = readJSON(USERS_FILE);
  const idx = users.findIndex(u => u.email === user.email);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  writeJSON(USERS_FILE, users);
}

const router = Router();

// ==================== 认证中间件 ====================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '登录已过期' });
  }
}

// ==================== 认证 ====================
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: '邮箱和密码不能为空' });
    let user = findUser(email);
    if (!user) return res.status(401).json({ error: '用户不存在' });
    if (user.hashedPassword) {
      if (!(await bcrypt.compare(password, user.hashedPassword)))
        return res.status(401).json({ error: '密码错误' });
    } else if (user.builtinPassword) {
      if (user.builtinPassword !== password)
        return res.status(401).json({ error: '密码错误' });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, siteId: user.siteId || null },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, role: user.role, siteId: user.siteId || null } });
  } catch (e) {
    res.status(500).json({ error: '登录失败: ' + e.message });
  }
});

// ==================== 站点管理（超级管理员） ====================
router.get('/admin/sites', authMiddleware, (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: '无权限' });
  res.json({ success: true, data: readJSON(SITES_FILE) });
});

router.post('/admin/sites', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: '无权限' });
    const { domain, template, companyName, plan, ownerEmail, ownerPassword } = req.body;
    if (!domain || !template || !companyName) return res.status(400).json({ error: '缺少必填字段' });

    const sites = readJSON(SITES_FILE);
    if (sites.find(s => s.domain === domain))
      return res.status(400).json({ error: '该域名已存在' });

    const site = {
      id: 'site_' + Date.now(),
      domain,
      template: template || 'corporate',
      companyName,
      plan: plan || 'standard',
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      ownerEmail: ownerEmail || '',
      config: {
        heroTagline: companyName + ' - 专业服务',
        heroDesc: '我们致力于为客户提供优质的解决方案',
        contactPhone: '',
        contactEmail: '',
        contactAddress: ''
      }
    };

    sites.push(site);
    writeJSON(SITES_FILE, sites);

    if (ownerEmail && ownerPassword) {
      const hashedPassword = await bcrypt.hash(ownerPassword, 12);
      saveUser({
        id: 'user_' + Date.now(),
        email: ownerEmail,
        name: companyName + '管理员',
        role: 'site_admin',
        siteId: site.id,
        hashedPassword,
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json({ success: true, data: site });
  } catch (e) {
    res.status(500).json({ error: '创建站点失败: ' + e.message });
  }
});

router.put('/admin/sites/:id/status', authMiddleware, (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: '无权限' });
  const { status } = req.body;
  const sites = readJSON(SITES_FILE);
  const site = sites.find(s => s.id === req.params.id);
  if (!site) return res.status(404).json({ error: '站点不存在' });
  site.status = status || site.status;
  site.updatedAt = new Date().toISOString();
  writeJSON(SITES_FILE, sites);
  res.json({ success: true, data: site });
});

router.put('/admin/sites/:id/renew', authMiddleware, (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: '无权限' });
  const { months } = req.body;
  const sites = readJSON(SITES_FILE);
  const site = sites.find(s => s.id === req.params.id);
  if (!site) return res.status(404).json({ error: '站点不存在' });
  const currentExpiry = new Date(site.expiresAt).getTime();
  const now = Date.now();
  const base = currentExpiry > now ? currentExpiry : now;
  site.expiresAt = new Date(base + (months || 12) * 30 * 24 * 60 * 60 * 1000).toISOString();
  site.status = 'active';
  site.updatedAt = new Date().toISOString();
  writeJSON(SITES_FILE, sites);
  res.json({ success: true, data: site });
});

// ==================== 站点内容管理（站点管理员） ====================
router.get('/site/config', authMiddleware, (req, res) => {
  const sites = readJSON(SITES_FILE);
  const site = sites.find(s => s.id === req.user.siteId);
  if (!site) return res.status(404).json({ error: '站点不存在' });
  res.json({ success: true, data: site.config });
});

router.put('/site/config', authMiddleware, (req, res) => {
  const sites = readJSON(SITES_FILE);
  const site = sites.find(s => s.id === req.user.siteId);
  if (!site) return res.status(404).json({ error: '站点不存在' });
  if (new Date(site.expiresAt).getTime() < Date.now() && site.status === 'expired')
    return res.status(403).json({ error: '站点已到期' });
  site.config = { ...site.config, ...req.body.config };
  site.updatedAt = new Date().toISOString();
  writeJSON(SITES_FILE, sites);
  res.json({ success: true, message: '保存成功' });
});

// ==================== 商品管理 ====================
router.get('/site/products', (req, res) => {
  // 公共接口
  res.json({ success: true, data: readJSON(PRODUCTS_FILE) });
});

router.post('/site/products', authMiddleware, (req, res) => {
  const { name, price, desc, image } = req.body;
  const products = readJSON(PRODUCTS_FILE);
  products.push({
    id: 'prod_' + Date.now(),
    siteId: req.user.siteId,
    name, price, desc, image,
    created_at: new Date().toISOString()
  });
  writeJSON(PRODUCTS_FILE, products);
  res.status(201).json({ success: true });
});

// ==================== 公开站点信息 ====================
router.get('/site/:domain', (req, res) => {
  const sites = readJSON(SITES_FILE);
  const site = sites.find(s => s.domain === req.params.domain);
  if (!site) return res.status(404).json({ error: '站点不存在' });
  if (site.status === 'expired') return res.status(403).json({ error: '站点已到期', expired: true });
  res.json({ success: true, data: { companyName: site.companyName, template: site.template, config: site.config } });
});

export default router;
