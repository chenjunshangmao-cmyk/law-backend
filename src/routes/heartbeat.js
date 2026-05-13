/**
 * 心跳健康监控端点
 * 
 * 提供 /api/heartbeat 综合健康检查：
 *   1. 数据库连通性
 *   2. WhatsApp 落地页自检
 *   3. 支付系统状态
 *   4. 内存/运行时间
 * 
 * 配合自动化定时任务（每5分钟），异常时通过飞书 Webhook 告警
 */

import express from 'express';
import { pool, useMemoryMode, pgFailed, switchDatabase, getCurrentDbUrl } from '../config/database.js';
import pg from 'pg';

const router = express.Router();
const START_TIME = Date.now();

// 健康状态缓存（避免每次请求都查库）
let lastHealthCheck = null;
let lastCheckTime = 0;
const CACHE_TTL = 30000; // 30秒缓存

// ★ 直接测试PG连接（绕过smartPool），暴露真实的PG错误
async function testRawPG() {
  if (!process.env.DATABASE_URL) return { reachable: false, error: 'DATABASE_URL not set' };
  try {
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    const start = Date.now();
    await client.connect();
    await client.query('SELECT 1');
    const latency = Date.now() - start;
    await client.end();
    return { reachable: true, latencyMs: latency };
  } catch (err) {
    return { reachable: false, error: err.message, code: err.code };
  }
}

async function performHealthCheck() {
  const checks = {};
  let overall = 'healthy';

  // 1. 数据库连通性（含实际模式标识 + 原始PG测试）
  const mode = (typeof pool.getMode === 'function') ? pool.getMode() : 'json';
  const rawPG = await testRawPG();
  
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - start;
    checks.database = { 
      status: 'ok', latencyMs: latency, mode,
      pgDirect: rawPG.reachable,
      pgError: rawPG.error || null,
    };
    if (mode === 'json' || !rawPG.reachable) overall = 'degraded';
  } catch (err) {
    checks.database = { status: 'error', error: err.message, mode: 'error', pgDirect: rawPG.reachable, pgError: rawPG.error || null };
    overall = 'degraded';
  }

  // 2. WhatsApp 落地页自检（查 whatsapp_links 表存在且有数据）
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM whatsapp_links WHERE disabled = false');
    checks.whatsapp = {
      status: 'ok',
      activeLinks: parseInt(result.rows[0].count),
    };
  } catch (err) {
    checks.whatsapp = { status: 'error', error: err.message };
    overall = 'degraded';
  }

  // 3. 支付系统状态（检查 shouqianba 配置是否加载）
  try {
    const { loadTerminals } = await import('../config/shouqianba.js');
    const terminals = loadTerminals ? loadTerminals() : {};
    const terminalCount = Object.keys(terminals).length;
    checks.payment = {
      status: 'ok',
      terminals: terminalCount,
      defaultActive: !!terminals.defaultDeviceId,
    };
  } catch (err) {
    checks.payment = { status: 'error', error: err.message };
    overall = 'degraded';
  }

  // 4. 运行时间
  const uptimeMs = Date.now() - START_TIME;
  checks.uptime = {
    seconds: Math.floor(uptimeMs / 1000),
    human: formatUptime(uptimeMs),
  };

  // 5. 内存
  const mem = process.memoryUsage();
  checks.memory = {
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    rssMB: Math.round(mem.rss / 1024 / 1024),
  };

  return { overall, checks, checkedAt: new Date().toISOString() };
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}

// GET /api/heartbeat
router.get('/', async (req, res) => {
  // 使用缓存减少数据库压力
  const now = Date.now();
  if (lastHealthCheck && (now - lastCheckTime) < CACHE_TTL && !req.query.nocache) {
    return res.json(lastHealthCheck);
  }

  try {
    const result = await performHealthCheck();
    lastHealthCheck = result;
    lastCheckTime = now;

    const statusCode = result.overall === 'healthy' ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (err) {
    res.status(500).json({
      overall: 'error',
      error: err.message,
      checkedAt: new Date().toISOString(),
    });
  }
});

// ★ POST /api/heartbeat/set-db — 动态更新数据库连接（本地PG隧道地址）
// 用于本地机器更新隧道地址，无需重新部署
router.post('/set-db', async (req, res) => {
  try {
    const { url, secret } = req.body;
    if (secret !== (process.env.ADMIN_SECRET || 'claw-admin-2026')) {
      return res.status(403).json({ success: false, error: '鉴权失败' });
    }
    if (!url || !url.startsWith('postgres')) {
      return res.status(400).json({ success: false, error: '无效的数据库URL' });
    }
    const ok = switchDatabase(url);
    res.json({ success: ok, message: ok ? '数据库已切换' : '切换失败' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
