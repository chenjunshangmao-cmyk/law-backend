/**
 * Claw 浏览器自动化核心模块 v3.0 (Phase 1 修复版)
 * 根目录独立运行版本（同步自 src/services/browserAutomation.js）
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const STATE_DIR = './browser-states';
if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });

const PROXY_PORT = process.env.BROWSER_PROXY_PORT || '7890';

// ============================================================
// Playwright 浏览器自动安装（兜底机制）
// ============================================================

let browserInstallChecked = false;

async function ensureBrowserInstalled() {
  if (browserInstallChecked) return;
  browserInstallChecked = true;
  try {
    const executablePath = chromium.executablePath();
    if (fs.existsSync(executablePath)) {
      console.log('[Browser] Chromium 已安装:', executablePath);
      return;
    }
  } catch (e) {}
  if (isServerEnvironment()) {
    console.log('[Browser] ⚠️ Chromium 未找到，正在自动安装...');
    try {
      execSync('npx playwright install chromium', { stdio: 'inherit' });
      console.log('[Browser] ✅ Chromium 安装完成');
    } catch (err) {
      console.error('[Browser] ❌ Chromium 自动安装失败:', err.message);
    }
  }
}

function isServerEnvironment() {
  if (process.env.BROWSER_HEADLESS === 'true') return true;
  if (process.env.BROWSER_HEADLESS === 'false') return false;
  if (process.env.RENDER || process.env.NODE_ENV === 'production') return true;
  if (os.platform() !== 'win32' && !process.env.DISPLAY) return true;
  return false;
}

function getHeadless() {
  if (isServerEnvironment()) { console.log('[Browser] 服务器环境 → headless: true'); return true; }
  console.log('[Browser] 本地开发环境 → headless: false'); return false;
}

class BrowserAutomation {
  constructor(platform) { this.platform = platform; this.browser = null; this.context = null; }

  getLaunchOptions() {
    const headless = getHeadless();
    const args = ['--disable-blink-features=AutomationControlled', '--no-sandbox',
      '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process', '--disable-gpu', '--single-process'];
    if (!isServerEnvironment() && PROXY_PORT) args.push(`--proxy-server=http://127.0.0.1:${PROXY_PORT}`);
    return { headless, args, timeout: headless ? 30000 : 60000 };
  }

  getStealthContextOptions() {
    const uas = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
    ];
    return {
      viewport: { width: 1920, height: 1080 }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai',
      permissions: ['geolocation'], colorScheme: 'light', deviceScaleFactor: 1,
      extraHTTPHeaders: { 'Accept-Language': 'zh-CN,zh;q=0.9', 'Accept': 'text/html,application/xhtml+xml' },
      userAgent: uas[Math.floor(Math.random() * uas.length)],
    };
  }

  getSessionPath(email, accountId = null) {
    return path.join(STATE_DIR, accountId ? `${this.platform}-${email}-${accountId}.json` : `${this.platform}-${email}.json`);
  }
  hasSession(email, accountId = null) { return fs.existsSync(this.getSessionPath(email, accountId)); }

  async launchWithSession(email, accountId = null) {
    await ensureBrowserInstalled();
    const sp = this.getSessionPath(email, accountId);
    const opts = this.getLaunchOptions();
    this.browser = await chromium.launch(opts);
    this.context = await this.browser.newContext({ storageState: sp, ...this.getStealthContextOptions() });
    return { browser: this.browser, context: this.context };
  }

  async openForManualLogin(email, accountId = null) {
    await ensureBrowserInstalled();
    this.browser = await chromium.launch(this.getLaunchOptions());
    this.context = await this.browser.newContext(this.getStealthContextOptions());
    return { browser: this.browser, context: this.context };
  }

  async saveSession(email, accountId = null) {
    await this.context.storageState({ path: this.getSessionPath(email, accountId) });
  }

  async close() {
    if (this.browser) { try { await this.browser.close(); } catch(e) {} this.browser = null; this.context = null; }
  }

  async validateSession(email, accountId = null) {
    if (!this.hasSession(email, accountId)) return { valid: false, reason: 'session_not_found' };
    try {
      const { browser, context } = await this.launchWithSession(email, accountId);
      const page = await context.newPage();
      await page.goto(this.dashboardUrl || this.loginUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const url = page.url();
      await browser.close();
      return this.isLoginPage(url) ? { valid: false, reason: 'session_expired', url } : { valid: true, url };
    } catch (e) { await this.close(); return { valid: false, reason: 'validation_error', error: e.message }; }
  }
  isLoginPage(url) { return false; }
}

class TikTokShopAutomation extends BrowserAutomation {
  constructor() { super('tiktok'); this.loginUrl = 'https://seller-accounts.tiktok.com/account/login'; this.dashboardUrl = 'https://seller-accounts.tiktok.com/home'; this.productAddUrl = 'https://seller-accounts.tiktok.com/product/add'; }
  isLoginPage(url) { return url.includes('seller-accounts.tiktok.com/account/login') || url.includes('login.tiktok.com') || url.includes('account.tiktok.com'); }

  async openLoginPage(email, accountId = null) {
    const { browser, context } = await this.openForManualLogin(email, accountId);
    const page = await context.newPage();
    console.log(`📱 TikTok: ${this.loginUrl}`);
    try { await page.goto(this.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 }); console.log('✅ 页面已加载，请在浏览器中手动登录'); }
    catch (e) { console.log('⚠️ 页面加载超时，请手动操作'); }
    return new Promise((resolve) => {
      browser.on('disconnected', async () => {
        const sp = this.getSessionPath(email, accountId);
        if (fs.existsSync(sp)) resolve({ success: true, message: '登录成功，Session已保存', sessionPath: sp });
        else resolve({ success: false, error: '登录未完成或Session保存失败' });
      });
    });
  }

  async publishProduct({ email, accountId, title, description = '', price = 0, stock = 100, images = [] }) {
    if (!this.hasSession(email, accountId)) return { success: false, needLogin: true };
    const v = await this.validateSession(email, accountId);
    if (!v.valid) return { success: false, error: 'Session已过期', needLogin: true };
    let browser = null;
    try {
      const { browser: b, context } = await this.launchWithSession(email, accountId);
      browser = b;
      const page = await context.newPage();
      console.log('📦 打开添加产品页面...');
      await page.goto(this.productAddUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2000);
      console.log('✏️ 填写产品信息...');
      for (const [sel, val] of [['input[name="title"]', title], ['textarea[name="description"]', description], ['input[name="price"]', price.toString()], ['input[name="stock"]', stock.toString()]]) {
        const el = await page.$(sel); if (el) { await el.click({ clickCount: 3 }); await el.fill(val); console.log(`  ✓ 已填: ${sel}`); }
      }
      if (images.length > 0) { const inp = await page.$('input[type="file"][accept*="image"]'); if (inp) { await inp.setInputFiles(images); await page.waitForTimeout(3000); console.log('  ✓ 图片已上传'); } }
      console.log('🚀 提交发布...');
      for (const sel of ['button[type="submit"]', 'button:has-text("发布")', 'button:has-text("Publish")']) { const btn = await page.$(sel); if (btn && await btn.isVisible()) { await btn.click(); console.log(`  ✓ 点击: ${sel}`); break; } }
      await page.waitForTimeout(3000);
      await browser.close();
      return { success: true, message: '产品提交完成', productTitle: title };
    } catch (e) { if (browser) await browser.close().catch(() => {}); return { success: false, error: e.message }; }
  }

  async checkLogin(email, accountId = null) {
    const sp = this.getSessionPath(email, accountId);
    const exists = this.hasSession(email, accountId);
    let info = null;
    if (exists) try { const s = fs.statSync(sp); info = { size: s.size, modified: s.mtime.toISOString() }; } catch(e) {}
    return { loggedIn: exists, sessionPath: sp, sessionInfo: info };
  }
}

class YouTubeAutomation extends BrowserAutomation {
  constructor() { super('youtube'); this.loginUrl = 'https://studio.youtube.com/'; this.uploadUrl = 'https://studio.youtube.com/channel/upload'; this.dashboardUrl = 'https://studio.youtube.com/channel/dashboard'; }
  isLoginPage(url) { return url.includes('accounts.google.com'); }

  async openLoginPage(email, accountId = null) {
    const { browser, context } = await this.openForManualLogin(email, accountId);
    const page = await context.newPage();
    console.log(`📱 YouTube Studio: ${this.loginUrl}`);
    try { await page.goto(this.loginUrl, { waitUntil: 'networkidle', timeout: 120000 }); console.log('✅ 页面已加载，请在浏览器中手动登录'); }
    catch (e) { console.log('⚠️ 页面加载超时，请手动操作'); }
    return new Promise((resolve) => {
      browser.on('disconnected', async () => {
        const sp = this.getSessionPath(email, accountId);
        if (fs.existsSync(sp)) resolve({ success: true, message: '登录成功', sessionPath: sp });
        else resolve({ success: false, error: '登录未完成' });
      });
    });
  }

  async uploadVideo({ email, accountId, videoPath, title = '', description = '', thumbnail, privacy = 'public' }) {
    if (!this.hasSession(email, accountId)) return { success: false, needLogin: true };
    const v = await this.validateSession(email, accountId);
    if (!v.valid) return { success: false, error: 'Session已过期', needLogin: true };
    let browser = null;
    try {
      const { browser: b, context } = await this.launchWithSession(email, accountId);
      browser = b;
      const page = await context.newPage();
      console.log('🎬 打开上传页面...');
      await page.goto(this.uploadUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2000);
      const inp = await page.$('input[type="file"][accept*="video"]');
      if (!inp) { await browser.close(); return { success: false, error: '找不到视频上传控件' }; }
      await inp.setInputFiles(videoPath);
      console.log(`  ✓ 视频已选择: ${videoPath}`);
      await page.waitForTimeout(8000);
      const titleInput = await page.$('input[id="title-input"], input[id="title"], input[placeholder*="标题"]');
      if (titleInput) { await titleInput.click({ clickCount: 3 }); await titleInput.fill(title); console.log('  ✓ 标题已填写'); }
      const descInput = await page.$('textarea[id="description"]');
      if (descInput) { await descInput.fill(description); console.log('  ✓ 描述已填写'); }
      console.log('🚀 发布...');
      for (const sel of ['button:has-text("下一步")', 'button:has-text("Next")', 'button:has-text("发布")', 'button:has-text("Publish")']) { const btn = await page.$(sel); if (btn && await btn.isEnabled()) { await btn.click(); await page.waitForTimeout(2000); console.log(`  ✓ 点击: ${sel}`); break; } }
      await page.waitForTimeout(3000);
      await browser.close();
      return { success: true, message: '视频上传完成', videoTitle: title };
    } catch (e) { if (browser) await browser.close().catch(() => {}); return { success: false, error: e.message }; }
  }

  async checkLogin(email, accountId = null) {
    const sp = this.getSessionPath(email, accountId);
    const exists = this.hasSession(email, accountId);
    let info = null;
    if (exists) try { const s = fs.statSync(sp); info = { size: s.size, modified: s.mtime.toISOString() }; } catch(e) {}
    return { loggedIn: exists, sessionPath: sp, sessionInfo: info };
  }
}

async function main() {
  const [,, cmd, subcmd, ...args] = process.argv;

  if (cmd === 'system-status') {
    console.log('\n🖥️ 浏览器自动化系统状态');
    console.log('─'.repeat(50));
    console.log(`环境: ${isServerEnvironment() ? '服务器 (headless)' : '本地开发'}`);
    console.log(`headless: ${getHeadless()}`);
    console.log(`平台: ${os.platform()} | Node: ${process.version}`);
    console.log('\n📁 Session 文件:');
    if (fs.existsSync(STATE_DIR)) {
      const files = fs.readdirSync(STATE_DIR).filter(f => f.endsWith('.json'));
      for (const f of files) { const s = fs.statSync(path.join(STATE_DIR, f)); console.log(`  ${f} (${(s.size/1024).toFixed(1)} KB)`); }
    }
    console.log('\n用法:');
    console.log('  node browserAutomation.js tiktok login <email>');
    console.log('  node browserAutomation.js tiktok status <email>');
    console.log('  node browserAutomation.js tiktok publish <email> <标题> [价格]');
    console.log('  node browserAutomation.js youtube login <email>');
    console.log('  node browserAutomation.js youtube upload <email> <视频路径> <标题>');
    return;
  }

  if (cmd === 'tiktok') {
    const tiktok = new TikTokShopAutomation();
    const email = subcmd;
    if (!email) { console.log('用法: tiktok <login|status|publish> <email> [参数...]'); return; }
    if (subcmd === 'login') { const r = await tiktok.openLoginPage(email); console.log(r); }
    else if (subcmd === 'status') { const r = await tiktok.checkLogin(email); console.log(r); }
    else if (subcmd === 'publish') { const [title, price] = args; const r = await tiktok.publishProduct({ email, title: title || '产品', price: parseFloat(price) || 19.99 }); console.log(r); }
    await tiktok.close(); return;
  }

  if (cmd === 'youtube') {
    const youtube = new YouTubeAutomation();
    const email = subcmd;
    if (!email) { console.log('用法: youtube <login|status|upload> <email> [参数...]'); return; }
    if (subcmd === 'login') { const r = await youtube.openLoginPage(email); console.log(r); }
    else if (subcmd === 'status') { const r = await youtube.checkLogin(email); console.log(r); }
    else if (subcmd === 'upload') { const [vp, title] = args; const r = await youtube.uploadVideo({ email, videoPath: vp || 'video.mp4', title: title || '视频' }); console.log(r); }
    await youtube.close(); return;
  }

  console.log(`
🔧 Claw 浏览器自动化 CLI v3.0 (Phase 1 修复)

用法: node browserAutomation.js <命令> [参数]

命令:
  system-status               系统状态
  tiktok login <email>        TikTok 登录
  tiktok status <email>       TikTok 状态
  tiktok publish <email> <标题> [价格]  发布产品
  youtube login <email>        YouTube 登录
  youtube upload <email> <视频> <标题>  上传视频
  `);
}

main().catch(console.error);
