/**
 * 代理管理 API
 * 客户自己配置代理，每个海外账号绑定独立代理
 */

import express from 'express';
import { getProxiesByUser, getProxyById, createProxy, updateProxy, deleteProxy } from '../services/dbService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/proxies
 * 获取用户所有代理
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const proxies = await getProxiesByUser(req.user.userId);
    res.json({ success: true, data: proxies });
  } catch (error) {
    console.error('获取代理列表失败:', error);
    res.status(500).json({ success: false, error: '获取代理列表失败' });
  }
});

/**
 * GET /api/proxies/:id
 * 获取单个代理详情（含密码明文，用于绑定时展示）
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const proxy = await getProxyById(req.params.id);
    if (!proxy) return res.status(404).json({ success: false, error: '代理不存在' });
    if (proxy.user_id !== req.user.userId) return res.status(403).json({ success: false, error: '无权访问' });
    res.json({ success: true, data: proxy });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取代理详情失败' });
  }
});

/**
 * POST /api/proxies
 * 添加代理
 * body: { name, protocol?, host, port, username?, password? }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, protocol, host, port, username, password } = req.body;

    if (!host || !port) {
      return res.status(400).json({ success: false, error: '缺少必填字段：host 和 port' });
    }

    if (!['http', 'https', 'socks5', 'socks4'].includes(protocol)) {
      return res.status(400).json({ success: false, error: '不支持的协议，支持：http / https / socks5 / socks4' });
    }

    const proxy = await createProxy({
      user_id: req.user.userId,
      name: name || `代理-${host}:${port}`,
      protocol: protocol || 'http',
      host,
      port: parseInt(port, 10),
      username: username || null,
      password: password || null,
    });

    res.status(201).json({ success: true, data: proxy });
  } catch (error) {
    console.error('添加代理失败:', error);
    res.status(500).json({ success: false, error: '添加代理失败' });
  }
});

/**
 * PUT /api/proxies/:id
 * 更新代理
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await getProxyById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: '代理不存在' });
    if (existing.user_id !== req.user.userId) return res.status(403).json({ success: false, error: '无权访问' });

    const { name, protocol, host, port, username, password, is_active } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (protocol !== undefined) updates.protocol = protocol;
    if (host !== undefined) updates.host = host;
    if (port !== undefined) updates.port = parseInt(port, 10);
    if (username !== undefined) updates.username = username || null;
    if (password !== undefined) updates.password = password || null;
    if (is_active !== undefined) updates.is_active = !!is_active;

    const updated = await updateProxy(req.params.id, updates);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('更新代理失败:', error);
    res.status(500).json({ success: false, error: '更新代理失败' });
  }
});

/**
 * DELETE /api/proxies/:id
 * 删除代理
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const existing = await getProxyById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: '代理不存在' });
    if (existing.user_id !== req.user.userId) return res.status(403).json({ success: false, error: '无权访问' });

    await deleteProxy(req.params.id);
    res.json({ success: true, message: '代理已删除' });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除代理失败' });
  }
});

export default router;
