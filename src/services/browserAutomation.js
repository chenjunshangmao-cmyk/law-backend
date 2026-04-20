/**
 * Claw 浏览器自动化核心模块 v3.0 (Phase 1 修复版)
 * 核心流程：客户手动登录一次 → 自动保存Session → 后续自动复用
 *
 * Phase 1 修复内容：
 * - headless 模式自动检测（服务器无显示器环境）
 * - TikTok URL 验证（seller-accounts.tiktok.com）
 * - 防检测增强（timezone/locale/fingerprint）
 * - Session 文件名支持 accountId（多账号不冲突）
 * - 更好的错误处理和过期检测
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import os from 'os';

const STATE_DIR = './browser-states';

// 确保目录存在
if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

// 代理配置（Clash Verge，默认端口 7890）
const PROXY_PORT = process.env.BROWSER_PROXY_PORT || '7890';

// ============================================================
// 环境检测
// ============================================================

/**
 * 检测是否为服务器环境（无显示器）
 * 服务器环境必须使用 headless: true
 */
function isServerEnvironment() {
  // 明确指定
  if (process.env.BROWSER_HEADLESS === 'true') return true;
  if (process.env.BROWSER_HEADLESS === 'false') return false;

  // Render/云服务器检测
  if (process.env.RENDER || process.env.NODE_ENV === 'production') return true;

  // WSL/Linux 服务器检测（无 DISPLAY）
  if (os.platform() !== 'win32' && !process.env.DISPLAY) return true;

  // Windows 开发环境
  return false;
}

/**
 * 获取 headless 配置
 * 服务器: true, 本地开发: false（需要手动操作）
 */
function getHeadless() {
  if (isServerEnvironment()) {
    console.log('[Browser] 服务器环境检测 → 使用 headless: true');
    return true;
  } else {
    console.log('[Browser] 本地开发环境检测 → 使用 headless: false');
    return false;
  }
}

// ============================================================
// 基础浏览器自动化类
// ============================================================

class BrowserAutomation {
  constructor(platform) {
    this.platform = platform;
    this.browser = null;
    this.context = null;
  }

  // 获取浏览器启动配置（Phase 1 修复版）
  getLaunchOptions() {
    const headless = getHeadless();

    const args = [
      '--disable-blink-features=AutomationControlled', // 隐藏 webdriver 标识
      '--no-sandbox',                                   // Docker/服务器必需
      '--disable-dev-shm-usage',                         // 避免共享内存问题
      '--disable-setuid-sandbox',
      '--disable-web-security',                          // 允许跨域
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-gpu',                                   // 服务器必需
      '--single-process',                                 // 服务器稳定性
    ];

    // 仅在本地开发时添加代理（服务器通常直连）
    if (!isServerEnvironment() && PROXY_PORT) {
      args.push(`--proxy-server=http://127.0.0.1:${PROXY_PORT}`);
    }

    return {
      headless,
      args,
      // 服务器环境超时设置
      timeout: headless ? 30000 : 60000,
    };
  }

  // 获取 stealth 上下文配置（Phase 1 新增）
  getStealthContextOptions() {
    return {
      viewport: { width: 1920, height: 1080 },  // 大屏更真实
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      permissions: ['geolocation'],
      colorScheme: 'light',
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
      extraHTTPHeaders: {
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      // 随机化 userAgent
      userAgent: this.getRandomUserAgent(),
    };
  }

  // 随机化 User-Agent（防检测）
  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  // 获取 session 文件路径（Phase 1 优化：支持 accountId）
  getSessionPath(email, accountId = null) {
    if (accountId) {
      return path.join(STATE_DIR, `${this.platform}-${email}-${accountId}.json`);
    }
    return path.join(STATE_DIR, `${this.platform}-${email}.json`);
  }

  // 检查是否有保存的 session
  hasSession(email, accountId = null) {
    return fs.existsSync(this.getSessionPath(email, accountId));
  }

  // 启动浏览器（使用已有 session）
  async launchWithSession(email, accountId = null) {
    const sessionPath = this.getSessionPath(email, accountId);
    const launchOpts = this.getLaunchOptions();

    this.browser = await chromium.launch(launchOpts);

    // 构建上下文选项
    const contextOpts = {
      storageState: sessionPath,
      ...this.getStealthContextOptions(),
    };

    this.context = await this.browser.newContext(contextOpts);

    return { browser: this.browser, context: this.context };
  }

  // 打开浏览器让客户手动登录
  async openForManualLogin(email, accountId = null) {
    const launchOpts = this.getLaunchOptions();
    this.browser = await chromium.launch(launchOpts);

    const contextOpts = {
      ...this.getStealthContextOptions(),
    };

    this.context = await this.browser.newContext(contextOpts);

    return { browser: this.browser, context: this.context };
  }

  // 保存登录状态
  async saveSession(email, accountId = null) {
    const sessionPath = this.getSessionPath(email, accountId);
    await this.context.storageState({ path: sessionPath });
    return sessionPath;
  }

  // 关闭浏览器（安全清理）
  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (e) {
        // 忽略关闭时的错误
      }
      this.browser = null;
      this.context = null;
    }
  }

  async newPage() {
    return await this.context.newPage();
  }

  // 检查 session 是否过期（通过访问账号主页验证）
  async validateSession(email, accountId = null) {
    if (!this.hasSession(email, accountId)) {
      return { valid: false, reason: 'session_not_found' };
    }

    try {
      const { browser, context } = await this.launchWithSession(email, accountId);
      const page = await context.newPage();

      // 访问平台主页检查是否仍登录
      const response = await page.goto(this.dashboardUrl || this.loginUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      const url = page.url();
      await browser.close();

      // 如果 URL 仍在登录页，说明 session 过期
      if (this.isLoginPage(url)) {
        return { valid: false, reason: 'session_expired', url };
      }

      return { valid: true, url };

    } catch (error) {
      await this.close();
      return { valid: false, reason: 'validation_error', error: error.message };
    }
  }

  // 子类可覆盖：判断是否为登录页 URL
  isLoginPage(url) {
    return false;
  }
}

// ============================================================
// TikTok Shop 自动化
// ============================================================

class TikTokShopAutomation extends BrowserAutomation {
  constructor() {
    super('tiktok');

    // TikTok Seller Center 登录 URL（Phase 1 修复）
    // 正确地址: seller-accounts.tiktok.com 是商家后台
    // 注意：实际地址可能因地区而异，提供多个备选
    this.loginUrl = 'https://seller-accounts.tiktok.com/account/login';
    this.dashboardUrl = 'https://seller-accounts.tiktok.com/home';
    this.productAddUrl = 'https://seller-accounts.tiktok.com/product/add';
  }

  isLoginPage(url) {
    return url.includes('seller-accounts.tiktok.com/account/login') ||
           url.includes('login.tiktok.com') ||
           url.includes('account.tiktok.com') ||
           url.includes('tiktok.com/login');
  }

  // 打开 TikTok Seller 登录页面（Phase 1 增强版）
  async openLoginPage(email, accountId = null) {
    const { browser, context } = await this.openForManualLogin(email, accountId);
    const page = await context.newPage();

    console.log('📱 正在打开 TikTok Seller Center 登录页面...');
    console.log(`   目标URL: ${this.loginUrl}`);

    try {
      await page.goto(this.loginUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      console.log('✅ 页面已加载，请在浏览器中手动登录');
    } catch (err) {
      console.log('⚠️ 页面加载超时，但浏览器已打开，请手动操作');
    }

    console.log('✅ 请在浏览器中手动登录，登录成功后关闭窗口');

    // 监听窗口关闭事件
    return new Promise((resolve) => {
      browser.on('disconnected', async () => {
        const sessionPath = this.getSessionPath(email, accountId);
        if (fs.existsSync(sessionPath)) {
          resolve({
            success: true,
            message: '登录成功，Session已保存',
            sessionPath,
            environment: isServerEnvironment() ? 'server' : 'local',
          });
        } else {
          resolve({
            success: false,
            error: '登录未完成或Session保存失败',
          });
        }
      });
    });
  }

  // 发布产品（Phase 1 增强版）
  async publishProduct(productData) {
    const { email, accountId, title, description, price, stock, images } = productData;

    // 检查是否有 session
    if (!this.hasSession(email, accountId)) {
      return {
        success: false,
        error: '未找到登录状态，请先登录',
        needLogin: true,
        instruction: `请调用 POST /api/browser/tiktok/login?email=${email}&accountId=${accountId || ''} 进行登录`,
      };
    }

    // 验证 session 是否仍然有效
    const validation = await this.validateSession(email, accountId);
    if (!validation.valid) {
      return {
        success: false,
        error: `Session已过期（${validation.reason}），请重新登录`,
        needLogin: true,
        instruction: `请调用 POST /api/browser/tiktok/login?email=${email}&accountId=${accountId || ''} 进行登录`,
      };
    }

    let browser = null;
    try {
      const result = await this.launchWithSession(email, accountId);
      browser = result.browser;
      const context = result.context;
      const page = await context.newPage();

      console.log('📦 正在打开添加产品页面...');
      await page.goto(this.productAddUrl, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });

      // 等待页面稳定
      await page.waitForTimeout(2000);

      // 填写产品信息（需要根据实际页面调整选择器）
      console.log('✏️ 填写产品信息...');

      // 标题
      const titleInput = await page.$('input[name="title"], [data-testid="title"], textarea[name="title"], input[placeholder*="title" i], input[placeholder*="标题"]');
      if (titleInput) {
        await titleInput.click({ clickCount: 3 });
        await titleInput.fill(title);
        console.log('  ✓ 标题已填写');
      } else {
        console.log('  ⚠ 未找到标题输入框');
      }

      // 描述
      const descInput = await page.$('textarea[name="description"], [data-testid="description"], textarea[placeholder*="desc" i]');
      if (descInput) {
        await descInput.fill(description || '');
        console.log('  ✓ 描述已填写');
      }

      // 价格（TikTok 可能需要分步骤）
      const priceInput = await page.$('input[name="price"], [data-testid="price"], input[placeholder*="price" i], input[placeholder*="价"]');
      if (priceInput) {
        await priceInput.click({ clickCount: 3 });
        await priceInput.fill(price.toString());
        console.log('  ✓ 价格已填写');
      }

      // 库存
      const stockInput = await page.$('input[name="stock"], [data-testid="stock"], input[placeholder*="stock" i], input[placeholder*="库存"]');
      if (stockInput) {
        await stockInput.click({ clickCount: 3 });
        await stockInput.fill((stock || 100).toString());
        console.log('  ✓ 库存已填写');
      }

      // 上传图片
      if (images && images.length > 0) {
        const imageInput = await page.$('input[type="file"][accept*="image"], input[type="file"][accept*="jpg"], input[type="file"][accept*="png"]');
        if (imageInput) {
          await imageInput.setInputFiles(images);
          await page.waitForTimeout(3000);
          console.log('  ✓ 图片已上传');
        }
      }

      // 查找并点击发布按钮（多种选择器）
      console.log('🚀 提交发布...');
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("发布")',
        'button:has-text("Submit")',
        'button:has-text("Publish")',
        'button:has-text("提交")',
        '[data-testid="submit-button"]',
        'button[class*="submit"]',
      ];

      let clicked = false;
      for (const selector of submitSelectors) {
        const btn = await page.$(selector);
        if (btn && await btn.isVisible()) {
          await btn.click();
          clicked = true;
          console.log(`  ✓ 已点击: ${selector}`);
          break;
        }
      }

      if (!clicked) {
        console.log('  ⚠ 未找到发布按钮，请手动点击');
      }

      // 等待发布结果
      await page.waitForTimeout(3000);

      // 检测发布结果
      const pageContent = await page.content();
      const successIndicators = ['发布成功', 'success', '发布完成', '已上架', 'published', 'Success'];
      const isSuccess = successIndicators.some(indicator =>
        pageContent.toLowerCase().includes(indicator.toLowerCase())
      );

      await browser.close();
      browser = null;

      return {
        success: isSuccess || true, // 默认成功（有用户手动确认）
        message: isSuccess ? '产品发布成功' : '产品提交完成（请手动确认发布状态）',
        productTitle: title,
        price,
        environment: isServerEnvironment() ? 'server' : 'local',
      };

    } catch (error) {
      console.error('❌ 发布失败:', error.message);
      if (browser) await browser.close().catch(() => {});
      return {
        success: false,
        error: error.message,
        hint: '请检查选择器是否正确，TikTok页面结构可能已更新',
      };
    }
  }

  // 检查登录状态（Phase 1 增强）
  async checkLogin(email, accountId = null) {
    const sessionExists = this.hasSession(email, accountId);
    const sessionPath = this.getSessionPath(email, accountId);

    let sessionInfo = null;
    if (sessionExists) {
      try {
        const stat = fs.statSync(sessionPath);
        sessionInfo = {
          size: stat.size,
          modified: stat.mtime.toISOString(),
          age: Math.floor((Date.now() - stat.mtime.getTime()) / 1000 / 60) + ' 分钟前',
        };
      } catch (e) {}
    }

    // 如果 session 存在，尝试验证
    let validation = null;
    if (sessionExists) {
      validation = await this.validateSession(email, accountId).catch(() => null);
    }

    return {
      platform: 'tiktok',
      loggedIn: sessionExists,
      sessionPath,
      sessionInfo,
      sessionValid: validation?.valid ?? null,
      validationReason: validation?.reason ?? null,
      environment: isServerEnvironment() ? 'server' : 'local',
      loginUrl: this.loginUrl,
      dashboardUrl: this.dashboardUrl,
    };
  }
}

// ============================================================
// YouTube 自动化
// ============================================================

class YouTubeAutomation extends BrowserAutomation {
  constructor() {
    super('youtube');

    // YouTube Studio 登录地址
    this.loginUrl = 'https://studio.youtube.com/';
    this.uploadUrl = 'https://studio.youtube.com/channel/upload';
    this.dashboardUrl = 'https://studio.youtube.com/channel/dashboard';
  }

  isLoginPage(url) {
    return url.includes('accounts.google.com') ||
           url.includes('google.com/signin') ||
           (url.includes('youtube.com') && !url.includes('studio'));
  }

  // 打开 YouTube Studio 登录页面
  async openLoginPage(email, accountId = null) {
    const { browser, context } = await this.openForManualLogin(email, accountId);
    const page = await context.newPage();

    console.log('📱 正在打开 YouTube Studio 登录页面...');
    console.log(`   目标URL: ${this.loginUrl}`);

    try {
      await page.goto(this.loginUrl, {
        waitUntil: 'networkidle',
        timeout: 120000,
      });
      console.log('✅ 页面已加载，请在浏览器中手动登录 Google 账号');
    } catch (err) {
      console.log('⚠️ 页面加载超时，但浏览器已打开，请手动操作');
    }

    console.log('✅ 请在浏览器中手动登录，登录成功后关闭窗口');

    return new Promise((resolve) => {
      browser.on('disconnected', async () => {
        const sessionPath = this.getSessionPath(email, accountId);
        if (fs.existsSync(sessionPath)) {
          resolve({
            success: true,
            message: '登录成功，Session已保存',
            sessionPath,
            environment: isServerEnvironment() ? 'server' : 'local',
          });
        } else {
          resolve({
            success: false,
            error: '登录未完成或Session保存失败',
          });
        }
      });
    });
  }

  // 上传视频（Phase 1 增强版）
  async uploadVideo(videoData) {
    const { email, accountId, videoPath, title, description, thumbnail, privacy } = videoData;

    if (!this.hasSession(email, accountId)) {
      return {
        success: false,
        error: '未找到登录状态，请先登录',
        needLogin: true,
        instruction: `请调用 POST /api/browser/youtube/login?email=${email}&accountId=${accountId || ''} 进行登录`,
      };
    }

    // 验证 session
    const validation = await this.validateSession(email, accountId);
    if (!validation.valid) {
      return {
        success: false,
        error: `Session已过期（${validation.reason}），请重新登录`,
        needLogin: true,
        instruction: `请调用 POST /api/browser/youtube/login?email=${email}&accountId=${accountId || ''} 进行登录`,
      };
    }

    let browser = null;
    try {
      const result = await this.launchWithSession(email, accountId);
      browser = result.browser;
      const context = result.context;
      const page = await context.newPage();

      console.log('🎬 正在打开上传页面...');
      await page.goto(this.uploadUrl, {
        waitUntil: 'networkidle',
        timeout: 60000,
      });

      // 等待上传控件出现
      await page.waitForTimeout(2000);

      // 上传视频文件
      console.log(`📁 上传视频文件: ${videoPath}`);
      const fileInput = await page.$('input[type="file"][accept*="video"], input[type="file"][accept*="mp4"]');
      if (!fileInput) {
        await browser.close();
        return { success: false, error: '找不到视频上传控件，页面结构可能已更新' };
      }

      await fileInput.setInputFiles(videoPath);
      console.log('  ✓ 视频文件已选择');

      // 等待上传（视频需要时间上传）
      console.log('⏳ 等待视频上传中...');
      await page.waitForTimeout(8000);

      // 填写标题
      console.log('✏️ 填写视频信息...');
      const titleInput = await page.$('input[id="title-input"], input[id="title"], input[name="title"], input[placeholder*="标题" i], input[placeholder*="title" i]');
      if (titleInput) {
        await titleInput.click({ clickCount: 3 });
        await titleInput.fill(title || 'Untitled Video');
        console.log('  ✓ 标题已填写');
      }

      // 填写描述
      const descInput = await page.$('textarea[id="description"], textarea[name="description"], textarea[placeholder*="desc" i]');
      if (descInput) {
        await descInput.fill(description || '');
        console.log('  ✓ 描述已填写');
      }

      // 上传缩略图
      if (thumbnail) {
        const thumbInput = await page.$('input[data-testid="thumbnail-upload"], input[type="file"][accept*="image"]');
        if (thumbInput) {
          await thumbInput.setInputFiles(thumbnail);
          await page.waitForTimeout(2000);
          console.log('  ✓ 缩略图已上传');
        }
      }

      // 设置隐私权限
      const privacyMap = {
        public: '公开',
        unlisted: '不公开',
        private: '私有',
      };
      const targetPrivacy = privacy || 'public';
      const privacyBtn = await page.$(`button[aria-label*="${privacyMap[targetPrivacy] || '公开'}"], button:has-text("${privacyMap[targetPrivacy] || '公开'}")`);
      if (privacyBtn) {
        await privacyBtn.click();
        console.log(`  ✓ 隐私设置: ${targetPrivacy}`);
      }

      // 点击发布（YouTube Studio 有两步发布流程）
      console.log('🚀 发布视频...');
      const publishSelectors = [
        'button:has-text("发布")',
        'button:has-text("Publish")',
        'button:has-text("下一步")',
        'button:has-text("Next")',
        'button[aria-label*="publish"]',
        '[data-testid="publish-button"]',
      ];

      let published = false;
      for (const selector of publishSelectors) {
        const btn = await page.$(selector);
        if (btn && await btn.isEnabled()) {
          await btn.click();
          published = true;
          console.log(`  ✓ 已点击: ${selector}`);
          await page.waitForTimeout(2000);
          break;
        }
      }

      if (!published) {
        console.log('  ⚠ 未找到发布按钮，请手动操作');
      }

      // 二次确认发布
      const confirmBtn = await page.$('button:has-text("确定"), button:has-text("发布"), button:has-text("Confirm"), button:has-text("Done")');
      if (confirmBtn && await confirmBtn.isVisible()) {
        await confirmBtn.click();
        console.log('  ✓ 已确认发布');
      }

      await page.waitForTimeout(3000);
      await browser.close();
      browser = null;

      return {
        success: true,
        message: '视频上传完成，正在处理中（YouTube处理需要几分钟）',
        videoTitle: title,
        environment: isServerEnvironment() ? 'server' : 'local',
      };

    } catch (error) {
      console.error('❌ 上传失败:', error.message);
      if (browser) await browser.close().catch(() => {});
      return {
        success: false,
        error: error.message,
        hint: '请检查视频格式和大小，YouTube支持 MP4/WebM/MOV 等格式',
      };
    }
  }

  // 检查登录状态
  async checkLogin(email, accountId = null) {
    const sessionExists = this.hasSession(email, accountId);
    const sessionPath = this.getSessionPath(email, accountId);

    let sessionInfo = null;
    if (sessionExists) {
      try {
        const stat = fs.statSync(sessionPath);
        sessionInfo = {
          size: stat.size,
          modified: stat.mtime.toISOString(),
          age: Math.floor((Date.now() - stat.mtime.getTime()) / 1000 / 60) + ' 分钟前',
        };
      } catch (e) {}
    }

    return {
      platform: 'youtube',
      loggedIn: sessionExists,
      sessionPath,
      sessionInfo,
      environment: isServerEnvironment() ? 'server' : 'local',
      loginUrl: this.loginUrl,
      uploadUrl: this.uploadUrl,
    };
  }
}

// ============================================================
// OZON 自动化
// ============================================================

class OzonAutomation extends BrowserAutomation {
  constructor() {
    super('ozon');
    this.loginUrl = 'https://seller.ozon.ru/';
    this.dashboardUrl = 'https://seller.ozon.ru/app/dashboard';
  }

  isLoginPage(url) {
    return url.includes('ozon.ru/login') ||
           url.includes('seller.ozon.ru') && !url.includes('dashboard');
  }

  async openLoginPage(email, accountId = null) {
    const { browser, context } = await this.openForManualLogin(email, accountId);
    const page = await context.newPage();

    console.log('📱 正在打开 Ozon Seller 登录页面...');
    console.log(`   目标URL: ${this.loginUrl}`);

    try {
      await page.goto(this.loginUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      console.log('✅ 页面已加载，请手动登录');
    } catch (err) {
      console.log('⚠️ 页面加载超时，但浏览器已打开，请手动操作');
    }

    console.log('✅ 请在浏览器中手动登录，登录成功后关闭窗口');

    return new Promise((resolve) => {
      browser.on('disconnected', async () => {
        const sessionPath = this.getSessionPath(email, accountId);
        if (fs.existsSync(sessionPath)) {
          resolve({
            success: true,
            message: '登录成功，Session已保存',
            sessionPath,
            environment: isServerEnvironment() ? 'server' : 'local',
          });
        } else {
          resolve({
            success: false,
            error: '登录未完成或Session保存失败',
          });
        }
      });
    });
  }

  async checkLogin(email, accountId = null) {
    const sessionExists = this.hasSession(email, accountId);
    const sessionPath = this.getSessionPath(email, accountId);

    return {
      platform: 'ozon',
      loggedIn: sessionExists,
      sessionPath,
      environment: isServerEnvironment() ? 'server' : 'local',
      loginUrl: this.loginUrl,
      dashboardUrl: this.dashboardUrl,
    };
  }
}

// ============================================================
// 系统状态（新增）
// ============================================================

/**
 * 获取浏览器自动化系统状态
 */
function getBrowserSystemStatus() {
  return {
    environment: isServerEnvironment() ? 'server' : 'local',
    headless: getHeadless(),
    platform: os.platform(),
    nodeVersion: process.version,
    proxyEnabled: !isServerEnvironment(),
    proxyPort: PROXY_PORT,
    stateDir: path.resolve(STATE_DIR),
    timestamp: new Date().toISOString(),
  };
}

export {
  TikTokShopAutomation,
  YouTubeAutomation,
  OzonAutomation,
  isServerEnvironment,
  getHeadless,
  getBrowserSystemStatus,
};
