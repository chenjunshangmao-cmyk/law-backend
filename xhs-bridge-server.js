/**
 * 小红书 MCP 桥接 — 独立 HTTP 服务
 * 端口 8091，直接包装本地 xiaohongshu-mcp (端口 18060)
 * CORS 全开，供 Cloudflare Pages 前端 + Render 后端调用
 * 
 * 启动: node xhs-bridge-server.js
 * 后台: node xhs-bridge-server.js &
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const PORT = 8091;
const MCP_HOST = 'localhost';
const MCP_PORT = 18060;

// ================================================================
// MCP JSON-RPC 客户端
// ================================================================
class McpClient {
  constructor() {
    this.sessionId = null;
  }

  async _rpc(method, params = {}) {
    const body = JSON.stringify({ jsonrpc: '2.0', method, id: Date.now(), params });
    const headers = {
      Accept: 'application/json, text/event-stream',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    };
    if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;

    return new Promise((resolve, reject) => {
      const req = http.request(
        { hostname: MCP_HOST, port: MCP_PORT, path: '/mcp', method: 'POST', headers },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            if (res.headers['mcp-session-id']) this.sessionId = res.headers['mcp-session-id'];
            try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); }
          });
        }
      );
      req.on('error', reject);
      req.setTimeout(120000, () => { req.destroy(); reject(new Error('MCP timeout')); });
      req.write(body);
      req.end();
    });
  }

  async init() {
    const r = await this._rpc('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'xhs-bridge', version: '2.0.0' },
    });
    if (r.result) await this._rpc('notifications/initialized', {});
    return this.sessionId;
  }

  async callTool(name, args = {}) {
    const r = await this._rpc('tools/call', { name, arguments: args });
    if (r.error) throw new Error(r.error.message);
    if (r.result?.content) {
      const text = r.result.content.filter(c => c.type === 'text').map(c => c.text).join('\n');
      const images = r.result.content.filter(c => c.type === 'image').map(c => ({ mimeType: c.mimeType, data: c.data }));
      return { text, images, isError: r.result.isError || false };
    }
    return r.result;
  }
}

// ================================================================
// 工具函数：将 base64 图片保存为临时文件，返回文件路径
// MCP publish_content 需要的是本地文件路径，而非 base64
// ================================================================
const TMP_DIR = path.join(os.tmpdir(), 'xhs-bridge');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

function base64ToFile(base64Str) {
  // 支持 data:image/png;base64,xxx 或纯 base64
  let mime = 'image/png';
  let data = base64Str;
  const match = base64Str.match(/^data:(image\/\w+);base64,(.+)$/);
  if (match) {
    mime = match[1];
    data = match[2];
  }
  const ext = mime.split('/')[1] || 'png';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filepath = path.join(TMP_DIR, filename);
  fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
  console.log(`[XHS-Bridge] 图片保存: ${filepath} (${(data.length * 0.75 / 1024).toFixed(1)}KB)`);
  return filepath;
}

function cleanupFiles(filepaths) {
  for (const fp of filepaths) {
    try { fs.unlinkSync(fp); } catch {}
  }
}

// ================================================================
// Session 管理 (accountId → McpClient) + 验证码检测
// ================================================================
const sessions = new Map();
const CAPTCHA_QUEUE_DIR = path.join(os.homedir(), 'WorkBuddy', 'Claw');
const CAPTCHA_QUEUE_FILE = path.join(CAPTCHA_QUEUE_DIR, '.xhs_captcha_queue.json');
if (!fs.existsSync(CAPTCHA_QUEUE_DIR)) fs.mkdirSync(CAPTCHA_QUEUE_DIR, { recursive: true });

/** 写入验证码队列文件，AI 团队监控此文件 */
function writeCaptchaQueue(accountId, timestamp) {
  try {
    let queue = [];
    if (fs.existsSync(CAPTCHA_QUEUE_FILE)) {
      try { queue = JSON.parse(fs.readFileSync(CAPTCHA_QUEUE_FILE, 'utf-8')); } catch {}
    }
    if (!Array.isArray(queue)) queue = [];
    // 去重
    queue = queue.filter(item => item.accountId !== accountId);
    queue.push({ accountId, timestamp, status: 'pending', notified: false });
    fs.writeFileSync(CAPTCHA_QUEUE_FILE, JSON.stringify(queue, null, 2));
    console.log(`[XHS-Bridge] 🔔 验证码队列: 账号=${accountId} 需要填验证码`);
  } catch (e) {
    console.error('[XHS-Bridge] 写验证码队列失败:', e.message);
  }
}

/** 标记验证码已完成 */
function markCaptchaResolved(accountId) {
  try {
    if (!fs.existsSync(CAPTCHA_QUEUE_FILE)) return;
    let queue = JSON.parse(fs.readFileSync(CAPTCHA_QUEUE_FILE, 'utf-8'));
    if (!Array.isArray(queue)) return;
    const item = queue.find(i => i.accountId === accountId);
    if (item) {
      item.status = 'resolved';
      item.resolvedAt = new Date().toISOString();
      fs.writeFileSync(CAPTCHA_QUEUE_FILE, JSON.stringify(queue, null, 2));
    }
  } catch {}
}

async function getClient(accountId = 'default') {
  let entry = sessions.get(accountId);
  if (!entry) {
    entry = { client: new McpClient(), loggedIn: false, captchaNeeded: false, captchaTimer: null, lastStatusCheck: 0, pendingLogin: false };
    sessions.set(accountId, entry);
  }
  if (!entry.client.sessionId) {
    await entry.client.init();
    sessions.set(accountId, entry);
  }
  return entry;
}

// 防抖：同一账号 8 秒内不重复调 MCP check_login_status
const STATUS_DEBOUNCE_MS = 8000;

// ================================================================
// HTTP 服务
// ================================================================
function parseBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch { resolve({}); }
    });
  });
}

function parseQuery(url) {
  const idx = url.indexOf('?');
  if (idx === -1) return {};
  return Object.fromEntries(new URLSearchParams(url.slice(idx)));
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  sendJson(res, status, { success: false, error: message });
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const url = req.url;
  const method = req.method;

  try {
    // ============================================================
    // GET /health
    // ============================================================
    if (url === '/health' || url === '/') {
      return sendJson(res, 200, { status: 'ok', service: 'xhs-mcp-bridge', sessions: sessions.size });
    }

    // ============================================================
    // POST /login/logout
    // ============================================================
    if (url === '/login/logout' && method === 'POST') {
      const body = await parseBody(req);
      const accountId = body.accountId || 'default';
      console.log(`[XHS-Bridge] 🔓 登出请求: ${accountId}`);
      try {
        // 用 default 的 client 调用 delete_cookies（所有 account 共享同一浏览器）
        const entry = sessions.get('default') || await getClient('default');
        const result = await entry.client.callTool('delete_cookies', {});
        // 清除所有 session 的登录状态
        for (const [id, e] of sessions) {
          e.loggedIn = false;
          e.captchaNeeded = false;
          e.pendingLogin = false;
          if (e.captchaTimer) { clearInterval(e.captchaTimer); e.captchaTimer = null; }
        }
        console.log(`[XHS-Bridge] ✅ 已登出，清除所有session`);
        return sendJson(res, 200, { success: true, data: { message: '已登出', detail: result.text } });
      } catch (e) {
        return sendError(res, 500, `登出失败: ${e.message}`);
      }
    }

    // ============================================================
    // POST /login/qrcode
    // ============================================================
    if (url === '/login/qrcode' && method === 'POST') {
      const body = await parseBody(req);
      const accountId = body.accountId || 'default';
      const entry = await getClient(accountId);
      const result = await entry.client.callTool('get_login_qrcode', {});
      const png = result.images?.find(i => i.mimeType === 'image/png');
      
      // 如果返回"已登录"，说明浏览器已有登录态
      if (result.text?.includes('已登录') || result.text?.includes('已处于登录状态')) {
        // 如果是 default 账号，标记为已登录（正常状态）
        // 如果是其他账号，需要先登出再重新获取二维码
        if (accountId !== 'default' && body.forceNew === true) {
          // 强制刷新模式：自动登出 → 重新获取二维码
          console.log(`[XHS-Bridge] 🔄 账号 ${accountId} 请求强制刷新，先登出...`);
          try {
            await entry.client.callTool('delete_cookies', {});
            for (const [id, e] of sessions) { e.loggedIn = false; }
            // 重新获取二维码
            const result2 = await entry.client.callTool('get_login_qrcode', {});
            const png2 = result2.images?.find(i => i.mimeType === 'image/png');
            entry.loggedIn = false;
            entry.captchaNeeded = false;
            entry.pendingLogin = true;  // 等待扫码
            // 不再启动桥接端定时器，避免 MCP check_login_status 反复导航浏览器
            // 前端 pollLoginStatus 会主动轮询 /login/status
            return sendJson(res, 200, {
              success: true,
              data: {
                qrImage: png2 ? `data:image/png;base64,${png2.data}` : null,
                tip: result2.text || '请扫码登录新账号',
                captchaNeeded: false,
                switched: true,  // 标记为切换模式
              },
            });
          } catch (e) {
            return sendError(res, 500, `强制刷新失败: ${e.message}`);
          }
        }
        
        // 非强制刷新：返回"已登录"状态（保持兼容）
        entry.loggedIn = true;
        entry.captchaNeeded = false;
        return sendJson(res, 200, {
          success: true,
          data: {
            qrImage: png ? `data:image/png;base64,${png.data}` : null,
            tip: result.text,
            captchaNeeded: false,
            alreadyLoggedIn: true,  // 标记已是登录态
          },
        });
      } else {
        entry.loggedIn = false;
        entry.captchaNeeded = false;
        entry.pendingLogin = true;  // 二维码已生成，等待扫码登录
        // 不再启动桥接端定时器，前端 pollLoginStatus 主动轮询 /login/status
      }
      
      return sendJson(res, 200, {
        success: true,
        data: { 
          qrImage: png ? `data:image/png;base64,${png.data}` : null, 
          tip: result.text,
          captchaNeeded: entry.captchaNeeded,
        },
      });
    }

    // ============================================================
    // GET /login/status?accountId=xxx
    // ============================================================
    if (url.startsWith('/login/status') && method === 'GET') {
      const q = parseQuery(url);
      const accountId = q.accountId || 'default';
      const entry = sessions.get(accountId);
      if (!entry) return sendJson(res, 200, { success: true, data: { loggedIn: false, captchaNeeded: false } });
      
      // 如果已经确认登录，直接返回缓存（不再调用 MCP，避免导航浏览器）
      if (entry.loggedIn) {
        return sendJson(res, 200, {
          success: true,
          data: { loggedIn: true, captchaNeeded: false, detail: '(cached-confirmed)' }
        });
      }
      
      // 如果不是等待登录状态（pendingLogin=false），返回缓存
      if (!entry.pendingLogin) {
        return sendJson(res, 200, {
          success: true,
          data: {
            loggedIn: entry.loggedIn,
            captchaNeeded: entry.captchaNeeded,
            detail: '(cached)'
          }
        });
      }
      
      // 防抖：8秒内不重复调用 MCP（check_login_status 会造成浏览器导航）
      const now = Date.now();
      if (entry.lastStatusCheck && (now - entry.lastStatusCheck) < STATUS_DEBOUNCE_MS) {
        return sendJson(res, 200, { 
          success: true, 
          data: { 
            loggedIn: entry.loggedIn, 
            captchaNeeded: entry.captchaNeeded,
            detail: '(cached)',
            cached: true,
          } 
        });
      }
      entry.lastStatusCheck = now;
      
      try {
        const result = await entry.client.callTool('check_login_status', {});
        const loggedIn = !result.text?.includes('未登录');
        if (loggedIn) {
          entry.loggedIn = true;
          entry.pendingLogin = false;  // 登录成功，不再需要轮询
          entry.captchaNeeded = false;
          markCaptchaResolved(accountId);
        }
        return sendJson(res, 200, { 
          success: true, 
          data: { 
            loggedIn, 
            captchaNeeded: entry.captchaNeeded,
            detail: result.text 
          } 
        });
      } catch {
        return sendJson(res, 200, { success: true, data: { loggedIn: entry?.loggedIn || false, captchaNeeded: entry?.captchaNeeded || false } });
      }
    }

    // ============================================================
    // GET /login/captcha-status?accountId=xxx
    // ============================================================
    if (url.startsWith('/login/captcha-status') && method === 'GET') {
      const q = parseQuery(url);
      const accountId = q.accountId || 'default';
      const entry = sessions.get(accountId);
      return sendJson(res, 200, {
        success: true,
        data: {
          captchaNeeded: entry?.captchaNeeded || false,
          loggedIn: entry?.loggedIn || false,
        }
      });
    }

    // ============================================================
    // GET /captcha-queue  — AI 团队读取验证码队列
    // ============================================================
    if (url === '/captcha-queue' && method === 'GET') {
      try {
        if (fs.existsSync(CAPTCHA_QUEUE_FILE)) {
          const queue = JSON.parse(fs.readFileSync(CAPTCHA_QUEUE_FILE, 'utf-8'));
          return sendJson(res, 200, { success: true, data: queue });
        }
        return sendJson(res, 200, { success: true, data: [] });
      } catch {
        return sendJson(res, 200, { success: true, data: [] });
      }
    }

    // ============================================================
    // POST /publish
    // ============================================================
    if (url === '/publish' && method === 'POST') {
      const body = await parseBody(req);
      const accountId = body.accountId || 'default';
      const entry = await getClient(accountId);
      if (!entry.loggedIn) {
        return sendJson(res, 401, { success: false, error: '请先登录小红书', code: 'NEED_LOGIN' });
      }
      // 将 base64 图片保存为临时文件，MCP 需要的是本地文件路径
      const imageFiles = [];
      try {
        for (const img of (body.images || [])) {
          imageFiles.push(base64ToFile(img));
        }
        const result = await entry.client.callTool('publish_content', {
          title: body.title,
          content: body.content,
          images: imageFiles,  // 传文件路径，不是 base64
          tags: body.tags || [],
        });
        if (result.isError) {
          return sendJson(res, 500, { success: false, error: result.text });
        }
        return sendJson(res, 200, { success: true, data: { message: result.text } });
      } finally {
        // 清理临时文件
        cleanupFiles(imageFiles);
      }
    }

    // ============================================================
    // POST /publish/video
    // ============================================================
    if (url === '/publish/video' && method === 'POST') {
      const body = await parseBody(req);
      const accountId = body.accountId || 'default';
      const entry = await getClient(accountId);
      if (!entry.loggedIn) {
        return sendJson(res, 401, { success: false, error: '请先登录小红书', code: 'NEED_LOGIN' });
      }
      const result = await entry.client.callTool('publish_with_video', {
        title: body.title,
        content: body.content,
        video_path: body.videoPath || '',
        cover_path: body.coverPath || '',
        tags: body.tags || [],
      });
      if (result.isError) {
        return sendJson(res, 500, { success: false, error: result.text });
      }
      return sendJson(res, 200, { success: true, data: { message: result.text } });
    }

    // ============================================================
    // GET /feeds?accountId=xxx
    // ============================================================
    if (url.startsWith('/feeds') && method === 'GET') {
      const q = parseQuery(url);
      const accountId = q.accountId || 'default';
      const entry = await getClient(accountId);
      const result = await entry.client.callTool('list_feeds', {});
      return sendJson(res, 200, { success: true, data: result });
    }

    // 404
    sendJson(res, 404, { error: 'Not Found' });
  } catch (e) {
    console.error('[XHS-Bridge] Error:', e.message);
    sendError(res, 500, e.message);
  }
});

server.listen(PORT, () => {
  console.log(`[XHS-Bridge] 小红书 MCP 桥接服务已启动 → http://localhost:${PORT}`);
  console.log('[XHS-Bridge] 端点:');
  console.log(`  POST /login/qrcode     → 获取登录二维码`);
  console.log(`  GET  /login/status     → 检查登录状态`);
  console.log(`  POST /publish          → 发布图文`);
  console.log(`  POST /publish/video    → 发布视频`);
  console.log(`  GET  /feeds            → 笔记列表`);
  console.log(`  GET  /health           → 服务状态`);
});
