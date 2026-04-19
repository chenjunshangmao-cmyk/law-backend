/**
 * Claw 内置浏览器启动器
 * 功能：启动本地HTTP服务 + Playwright浏览器，管理TikTok Shop登录
 * 端口：3001
 * 使用方法：node local-browser-launcher.js
 */

import { chromium } from 'playwright';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_DIR = path.join(__dirname, 'browser-states');
const PORT = 3002;

// 确保目录存在
if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

// 存储当前浏览器实例
let currentBrowser = null;
let currentContext = null;
let wsClients = new Set();

// 平台配置
const PLATFORMS = {
  tiktok: {
    name: 'TikTok Shop',
    loginUrl: 'https://seller-accounts.tiktok.com/account/login',
    dashboardUrl: 'https://seller-accounts.tiktok.com/',
    sessionFile: (email) => path.join(STATE_DIR, `tiktok-${email}.json`),
    statusFile: path.join(STATE_DIR, 'tiktok-status.json'),
  },
  ozon: {
    name: 'OZON',
    loginUrl: 'https://seller.ozon.ru/',
    dashboardUrl: 'https://seller.ozon.ru/',
    sessionFile: (email) => path.join(STATE_DIR, `ozon-${email}.json`),
    statusFile: path.join(STATE_DIR, 'ozon-status.json'),
  }
};

// 获取平台登录状态
function getPlatformStatus(platform) {
  const cfg = PLATFORMS[platform];
  if (!cfg) return null;
  
  // 检查是否有任何保存的session
  try {
    if (!fs.existsSync(STATE_DIR)) return { loggedIn: false, emails: [] };
    const files = fs.readdirSync(STATE_DIR).filter(f => f.startsWith(`${platform}-`) && f.endsWith('.json'));
    const emails = files.map(f => f.replace(`${platform}-`, '').replace('.json', ''));
    
    // 读取保存的账号信息
    let activeEmail = null;
    if (fs.existsSync(cfg.statusFile)) {
      const status = JSON.parse(fs.readFileSync(cfg.statusFile, 'utf8'));
      activeEmail = status.activeEmail;
    }
    
    return { 
      loggedIn: emails.length > 0, 
      emails,
      activeEmail,
      sessionDir: STATE_DIR
    };
  } catch (e) {
    return { loggedIn: false, emails: [], error: e.message };
  }
}

// WebSocket广播
function broadcast(data) {
  const msg = JSON.stringify(data);
  wsClients.forEach(ws => {
    try { ws.send(msg); } catch (e) { wsClients.delete(ws); }
  });
}

// 创建Express应用
const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', port: PORT, platforms: Object.keys(PLATFORMS) });
});

// 获取所有平台状态
app.get('/api/status', (req, res) => {
  const result = {};
  for (const [key, cfg] of Object.entries(PLATFORMS)) {
    result[key] = { name: cfg.name, ...getPlatformStatus(key) };
  }
  res.json({ success: true, data: result });
});

// ============================================================
// 一键登录：POST /api/quick-login  (无需邮箱，直接弹Chrome)
// ============================================================
app.post('/api/quick-login', async (req, res) => {
  const platform = (req.body.platform || 'tiktok').toLowerCase();
  const cfg = PLATFORMS[platform];
  if (!cfg) return res.json({ success: false, error: '不支持的平台: ' + platform });

  try {
    if (currentBrowser) {
      await currentBrowser.close().catch(() => {});
      currentBrowser = null;
      currentContext = null;
    }

    const launchOpts = {
      channel: 'chrome',
      headless: false,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--start-maximized']
    };

    currentBrowser = await chromium.launch(launchOpts);
    currentContext = await currentBrowser.newContext({
      viewport: { width: 1400, height: 900 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
    });

    const page = await currentContext.newPage();
    await page.goto(cfg.loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    broadcast({ type: 'login_opened', platform, mode: 'quick_login', url: cfg.loginUrl });
    res.json({ success: true, message: `${cfg.name} 登录页已打开，请扫码或账号登录` });

    // 关闭时自动保存 session（用时间戳作为 key）
    const sessionKey = `${platform}-${Date.now()}`;
    const sessionPath = path.join(STATE_DIR, `${sessionKey}.json`);
    currentBrowser.on('disconnected', async () => {
      if (currentContext) {
        try {
          await currentContext.storageState({ path: sessionPath });
          // 同时写一个 active 文件记录最新 session
          fs.writeFileSync(cfg.statusFile, JSON.stringify({
            activeEmail: sessionKey, savedAt: new Date().toISOString()
          }));
          broadcast({ type: 'session_saved', platform, path: sessionPath });
          console.log(`✅ Session已保存: ${sessionPath}`);
        } catch (e) {
          console.error('Session保存失败:', e.message);
        }
      }
      currentBrowser = null;
      currentContext = null;
      broadcast({ type: 'browser_closed', platform });
    });

  } catch (error) {
    console.error('一键登录失败:', error);
    res.json({ success: false, error: error.message });
  }
});

// 打开指定平台登录页
app.post('/api/login', async (req, res) => {
  const { platform, email } = req.body;
  const cfg = PLATFORMS[platform];
  
  if (!cfg) return res.json({ success: false, error: '不支持的平台: ' + platform });
  if (!email) return res.json({ success: false, error: '请提供邮箱参数: email' });
  
  try {
    // 如果已有浏览器，先关闭
    if (currentBrowser) {
      await currentBrowser.close().catch(() => {});
      currentBrowser = null;
      currentContext = null;
    }
    
    // 保存当前登录账号
    const statusFile = cfg.statusFile;
    fs.writeFileSync(statusFile, JSON.stringify({ activeEmail: email, updatedAt: new Date().toISOString() }));
    
    // 启动浏览器
    const sessionPath = cfg.sessionFile(email);
// 启动浏览器配置：使用系统 Chrome，继承 Cookie + 代理 + 登录状态
const launchOpts = {
  channel: 'chrome',  // 使用已安装的 Chrome，继承系统代理和登录状态
  headless: false,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--start-maximized',
  ]
};
    
    if (fs.existsSync(sessionPath)) {
      // 有保存的session，加载它
      currentBrowser = await chromium.launch(launchOpts);
      currentContext = await currentBrowser.newContext({
        storageState: sessionPath,
        viewport: { width: 1400, height: 900 }
      });
      
      const page = await currentContext.newPage();
      await page.goto(cfg.dashboardUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      
      broadcast({ type: 'login_opened', platform, email, mode: 'existing_session' });
      res.json({ success: true, mode: 'existing_session', message: `已用保存的Session打开 ${cfg.name}，如果需要重新登录请先退出账号` });
      
    } else {
      // 没有session，打开登录页
      currentBrowser = await chromium.launch(launchOpts);
      currentContext = await currentBrowser.newContext({
        viewport: { width: 1400, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
      });
      
      const page = await currentContext.newPage();
      await page.goto(cfg.loginUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      broadcast({ type: 'login_opened', platform, email, mode: 'new_login', url: cfg.loginUrl });
      res.json({ success: true, mode: 'new_login', message: `请在打开的浏览器中完成${cfg.name}登录` });
    }
    
    // 监听浏览器关闭
    currentBrowser.on('disconnected', async () => {
      // 浏览器关闭时保存session
      if (currentContext && email) {
        try {
          const sessionPath = cfg.sessionFile(email);
          await currentContext.storageState({ path: sessionPath });
          broadcast({ type: 'session_saved', platform, email, path: sessionPath });
          console.log(`✅ Session已保存: ${sessionPath}`);
        } catch (e) {
          console.error('Session保存失败:', e.message);
        }
      }
      currentBrowser = null;
      currentContext = null;
      broadcast({ type: 'browser_closed', platform });
    });
    
  } catch (error) {
    console.error('打开浏览器失败:', error);
    res.json({ success: false, error: error.message });
  }
});

// 保存当前登录状态（手动触发）
app.post('/api/save-session', async (req, res) => {
  const { platform, email } = req.body;
  const cfg = PLATFORMS[platform];
  
  if (!cfg || !email) return res.json({ success: false, error: '缺少参数' });
  if (!currentContext) return res.json({ success: false, error: '浏览器未打开' });
  
  try {
    const sessionPath = cfg.sessionFile(email);
    await currentContext.storageState({ path: sessionPath });
    fs.writeFileSync(cfg.statusFile, JSON.stringify({ activeEmail: email, savedAt: new Date().toISOString() }));
    broadcast({ type: 'session_saved', platform, email, path: sessionPath });
    res.json({ success: true, path: sessionPath });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 关闭浏览器
app.post('/api/close', async (req, res) => {
  if (currentBrowser) {
    await currentBrowser.close().catch(() => {});
    currentBrowser = null;
    currentContext = null;
  }
  res.json({ success: true });
});

// 删除session
app.delete('/api/session', async (req, res) => {
  const { platform, email } = req.body;
  const cfg = PLATFORMS[platform];
  if (!cfg || !email) return res.json({ success: false, error: '缺少参数' });
  
  try {
    const sessionPath = cfg.sessionFile(email);
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
    }
    // 清除activeEmail
    if (fs.existsSync(cfg.statusFile)) {
      const s = JSON.parse(fs.readFileSync(cfg.statusFile, 'utf8'));
      if (s.activeEmail === email) {
        fs.writeFileSync(cfg.statusFile, JSON.stringify({ activeEmail: null, updatedAt: new Date().toISOString() }));
      }
    }
    broadcast({ type: 'session_deleted', platform, email });
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// 提供 embedded-browser/index.html 作为内置浏览器页面
app.use('/browser', express.static(path.join(__dirname, 'embedded-browser')));

// 便捷入口：/browser?platform=tiktok&email=xxx
app.get('/browser', (req, res) => {
  const { platform, email } = req.query;
  const filePath = path.join(__dirname, 'embedded-browser', 'index.html');
  if (fs.existsSync(filePath)) {
    let html = fs.readFileSync(filePath, 'utf8');
    if (platform) {
      html = html.replace(/selectPlatform\('[a-z]+'\)/, `selectPlatform('${platform}')`);
    }
    if (email) {
      html = html.replace(/value=""(\s+id="emailInput")?/, `value="${email}"$1`);
    }
    res.type('html').send(html);
  } else {
    res.status(404).json({ error: 'embedded-browser/index.html not found' });
  }
});

// 启动HTTP服务器
const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     Claw 内置浏览器启动器                      ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  🌐 控制面板: http://localhost:${PORT}            ║`);
  console.log('║  📋 状态API:  GET /api/status                 ║');
  console.log('║  🔐 登录:     POST /api/login                 ║');
  console.log('║  💾 保存:     POST /api/save-session           ║');
  console.log('║  ❌ 关闭:     POST /api/close                  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log('支持的平台:', Object.entries(PLATFORMS).map(([k,v]) => `${k}(${v.name})`).join(', '));
  console.log('');
  
  // 自动打开控制面板
  (async () => {
    const { default: open } = await import('open').catch(() => ({ default: null }));
    if (open) {
      open(`http://localhost:${PORT}`).catch(() => {});
    }
  })();
});

// WebSocket服务器
const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  wsClients.add(ws);
  ws.on('close', () => wsClients.delete(ws));
  ws.on('error', () => wsClients.delete(ws));
  
  // 发送当前状态
  const result = {};
  for (const [key] of Object.entries(PLATFORMS)) {
    result[key] = getPlatformStatus(key);
  }
  ws.send(JSON.stringify({ type: 'init', data: result }));
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭...');
  if (currentBrowser) await currentBrowser.close().catch(() => {});
  server.close();
  process.exit(0);
});
