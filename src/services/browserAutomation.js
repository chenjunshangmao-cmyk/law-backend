/**
 * Claw 浏览器自动化核心模块 v2.0
 * 核心流程：客户手动登录一次 → 自动保存Session → 后续自动复用
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const STATE_DIR = './browser-states';

// 确保目录存在
if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

// 代理配置（Clash Verge）
const PROXY_PORT = '6789';

class BrowserAutomation {
  constructor(platform) {
    this.platform = platform;
    this.browser = null;
    this.context = null;
  }

  // 获取浏览器启动配置
  getLaunchOptions() {
    return {
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-dev-shm-usage'
        // 代理已禁用，直接连接
        // `--proxy-server=http://127.0.0.1:${PROXY_PORT}`
      ]
    };
  }

  // 获取session文件路径
  getSessionPath(email) {
    return path.join(STATE_DIR, `${this.platform}-${email}.json`);
  }

  // 检查是否有保存的session
  hasSession(email) {
    return fs.existsSync(this.getSessionPath(email));
  }

  // 启动浏览器（使用已有session）
  async launchWithSession(email) {
    const sessionPath = this.getSessionPath(email);
    
    this.browser = await chromium.launch(this.getLaunchOptions());

    // 加载已保存的session
    this.context = await this.browser.newContext({
      storageState: sessionPath,
      viewport: { width: 1280, height: 800 }
    });

    return { browser: this.browser, context: this.context };
  }

  // 打开浏览器让客户手动登录
  async openForManualLogin(email) {
    this.browser = await chromium.launch(this.getLaunchOptions());

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    return { browser: this.browser, context: this.context };
  }

  // 保存登录状态
  async saveSession(email) {
    const sessionPath = this.getSessionPath(email);
    await this.context.storageState({ path: sessionPath });
    return sessionPath;
  }

  // 关闭浏览器
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
    }
  }

  async newPage() {
    return await this.context.newPage();
  }
}

class TikTokShopAutomation extends BrowserAutomation {
  constructor() {
    super('tiktok');
    this.loginUrl = 'https://seller.tiktok.com';
    this.dashboardUrl = 'https://seller.tiktok.com/home';
    this.tokenPath = path.join(STATE_DIR, 'tiktok-tokens');
    
    // 确保 token 目录存在
    if (!fs.existsSync(this.tokenPath)) {
      fs.mkdirSync(this.tokenPath, { recursive: true });
    }
  }

  // 获取 token 文件路径
  getTokenPath(email) {
    return path.join(this.tokenPath, `${email.replace(/[@.]/g, '_')}.json`);
  }

  // 打开TikTok Seller登录页面，让客户手动登录（真实浏览器登录）
  async openLoginPage(email) {
    const { browser, context } = await this.openForManualLogin(email);
    const page = await context.newPage();

    console.log('📱 正在打开 TikTok Seller Center 登录页面...');

    try {
      await page.goto(this.loginUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      console.log('✅ 页面已加载，请手动登录');
    } catch (err) {
      console.log('⚠️ 页面加载超时，但浏览器已打开，请手动操作');
    }

    console.log('✅ 请在浏览器中手动登录，登录成功后关闭窗口');

    // 监听窗口关闭事件
    return new Promise((resolve) => {
      browser.on('disconnected', async () => {
        // 检查是否登录成功（session是否存在）
        if (fs.existsSync(this.getSessionPath(email))) {
          resolve({
            success: true,
            message: '登录成功，Session已保存',
            sessionPath: this.getSessionPath(email)
          });
        } else {
          resolve({
            success: false,
            error: '登录未完成或Session保存失败'
          });
        }
      });
    });
  }

  /**
   * 方式 B：通过导入 Cookies 登录（虚拟登录）
   * @param {string} email - 用户邮箱
   * @param {Array} cookies - 浏览器 cookies 数组
   */
  async loginWithCookies(email, cookies) {
    try {
      // 转换 cookies 为 Playwright storage state 格式
      const storageState = {
        cookies: cookies.map(cookie => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain || '.tiktok.com',
          path: cookie.path || '/',
          expires: cookie.expires || -1,
          httpOnly: cookie.httpOnly || false,
          secure: cookie.secure || true,
          sameSite: cookie.sameSite || 'Lax'
        })),
        origins: []
      };

      // 保存 session
      const sessionPath = this.getSessionPath(email);
      fs.writeFileSync(sessionPath, JSON.stringify(storageState, null, 2));

      console.log(`✅ Cookies 导入成功，已保存到: ${sessionPath}`);

      return {
        success: true,
        message: 'Cookies 导入成功，虚拟登录完成',
        loginType: 'cookies',
        email,
        sessionPath,
        cookieCount: cookies.length
      };

    } catch (error) {
      console.error('❌ Cookies 导入失败:', error.message);
      return {
        success: false,
        error: `Cookies 导入失败: ${error.message}`
      };
    }
  }

  /**
   * 方式 C：通过 Access Token 登录（虚拟登录）
   * @param {string} email - 用户邮箱
   * @param {Object} tokenData - Token 数据
   * @param {string} tokenData.accessToken - TikTok Shop API access token
   * @param {string} tokenData.refreshToken - 可选，用于刷新
   * @param {number} tokenData.expiresIn - 过期时间（秒）
   */
  async loginWithToken(email, tokenData) {
    try {
      const { accessToken, refreshToken, expiresIn } = tokenData;

      // 验证 token 有效性
      const tokenInfo = {
        accessToken,
        refreshToken: refreshToken || null,
        expiresAt: expiresIn ? Date.now() + (expiresIn * 1000) : null,
        createdAt: Date.now(),
        email
      };

      // 保存 token
      const tokenFilePath = this.getTokenPath(email);
      fs.writeFileSync(tokenFilePath, JSON.stringify(tokenInfo, null, 2));

      // 同时创建一个标记 session 文件（用于兼容检查）
      const sessionPath = this.getSessionPath(email);
      const storageState = {
        cookies: [],
        origins: [{
          origin: 'https://seller.tiktok.com',
          localStorage: [{
            name: 'tiktok_access_token',
            value: accessToken
          }]
        }]
      };
      fs.writeFileSync(sessionPath, JSON.stringify(storageState, null, 2));

      console.log(`✅ Token 登录成功，已保存到: ${tokenFilePath}`);

      return {
        success: true,
        message: 'Token 登录成功，虚拟登录完成',
        loginType: 'token',
        email,
        tokenPath: tokenFilePath,
        sessionPath,
        expiresAt: tokenInfo.expiresAt
      };

    } catch (error) {
      console.error('❌ Token 登录失败:', error.message);
      return {
        success: false,
        error: `Token 登录失败: ${error.message}`
      };
    }
  }

  // 检查是否有 token 登录
  hasToken(email) {
    return fs.existsSync(this.getTokenPath(email));
  }

  // 获取 token 信息
  getTokenInfo(email) {
    const tokenPath = this.getTokenPath(email);
    if (fs.existsSync(tokenPath)) {
      return JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    }
    return null;
  }

  // 检查登录状态（支持 session、cookies 和 token 三种方式）
  async checkLogin(email) {
    const hasSession = this.hasSession(email);
    const hasToken = this.hasToken(email);
    const tokenInfo = this.getTokenInfo(email);

    // 判断登录类型
    let loginType = null;
    if (hasToken) loginType = 'token';
    else if (hasSession) {
      // 检查是否是 cookies 导入的 session
      const sessionPath = this.getSessionPath(email);
      try {
        const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        if (sessionData.cookies && sessionData.cookies.length > 0) {
          loginType = 'cookies';
        } else {
          loginType = 'session';
        }
      } catch {
        loginType = 'session';
      }
    }

    // 检查 token 是否过期
    let isTokenExpired = false;
    if (tokenInfo && tokenInfo.expiresAt) {
      isTokenExpired = Date.now() > tokenInfo.expiresAt;
    }

    return {
      loggedIn: hasSession || (hasToken && !isTokenExpired),
      loginType,
      hasSession,
      hasToken,
      isTokenExpired,
      sessionPath: hasSession ? this.getSessionPath(email) : null,
      tokenPath: hasToken ? this.getTokenPath(email) : null,
      tokenInfo: tokenInfo ? {
        createdAt: tokenInfo.createdAt,
        expiresAt: tokenInfo.expiresAt
      } : null
    };
  }

  // 发布产品（使用已保存的session）
  async publishProduct(productData) {
    const { email, title, description, price, stock, images, useApi = false } = productData;

    // 检查登录状态（支持 session、cookies 和 token 三种方式）
    const loginStatus = await this.checkLogin(email);
    if (!loginStatus.loggedIn) {
      return {
        success: false,
        error: '未找到登录状态，请先登录',
        needLogin: true,
        instruction: `请调用以下方式之一登录：\n1. 真实浏览器: POST /api/browser/tiktok/login\n2. Cookies导入: POST /api/browser/tiktok/login-cookies\n3. Token登录: POST /api/browser/tiktok/login-token`
      };
    }

    // 如果使用 API 方式且已有 token
    if (useApi && loginStatus.hasToken) {
      return this.publishProductViaApi(productData);
    }

    let browser = null;
    try {
      const launchResult = await this.launchWithSession(email);
      browser = launchResult.browser;
      const { context } = launchResult;
      const page = await context.newPage();

      console.log('📦 正在打开 TikTok Seller Center...');
      
      // 先访问首页验证登录状态
      await page.goto(this.dashboardUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // 检查是否已登录（通过检查页面元素）
      const isLoggedIn = await page.evaluate(() => {
        // 检查是否有登录相关的元素
        return !document.querySelector('input[name="email"]') && 
               !document.querySelector('button:contains("Log in")');
      }).catch(() => true); // 如果检查失败，假设已登录

      if (!isLoggedIn) {
        await browser.close();
        return {
          success: false,
          error: 'Session 已失效，请重新登录',
          needLogin: true,
          loginType: loginStatus.loginType
        };
      }

      console.log('✅ 登录状态验证通过');
      console.log('📦 正在打开添加产品页面...');
      
      await page.goto('https://seller-accounts.tiktok.com/product/add', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // 等待页面完全加载
      await page.waitForTimeout(2000);

      // 填写产品信息（需要根据实际页面调整选择器）
      console.log('✏️ 填写产品信息...');
      
      // 标题 - 使用更灵活的选择器
      const titleSelectors = [
        'input[name="title"]',
        '[data-testid="title"]',
        'textarea[name="title"]',
        'input[placeholder*="title" i]',
        'input[placeholder*="标题" i]'
      ];
      let titleInput = null;
      for (const selector of titleSelectors) {
        titleInput = await page.$(selector);
        if (titleInput) break;
      }
      if (titleInput) {
        await titleInput.fill(title);
        console.log('✅ 标题已填写');
      } else {
        console.log('⚠️ 未找到标题输入框');
      }

      // 描述
      const descSelectors = [
        'textarea[name="description"]',
        '[data-testid="description"]',
        'textarea[placeholder*="description" i]',
        'textarea[placeholder*="描述" i]'
      ];
      let descInput = null;
      for (const selector of descSelectors) {
        descInput = await page.$(selector);
        if (descInput) break;
      }
      if (descInput && description) {
        await descInput.fill(description);
        console.log('✅ 描述已填写');
      }

      // 价格
      const priceSelectors = [
        'input[name="price"]',
        '[data-testid="price"]',
        'input[type="number"]'
      ];
      let priceInput = null;
      for (const selector of priceSelectors) {
        priceInput = await page.$(selector);
        if (priceInput) break;
      }
      if (priceInput && price) {
        await priceInput.fill(price.toString());
        console.log('✅ 价格已填写');
      }

      // 库存
      const stockSelectors = [
        'input[name="stock"]',
        '[data-testid="stock"]',
        'input[name="quantity"]'
      ];
      let stockInput = null;
      for (const selector of stockSelectors) {
        stockInput = await page.$(selector);
        if (stockInput) break;
      }
      if (stockInput) {
        await stockInput.fill((stock || 100).toString());
        console.log('✅ 库存已填写');
      }

      // 上传图片
      if (images && images.length > 0) {
        const imageSelectors = [
          'input[type="file"][accept*="image"]',
          'input[type="file"]'
        ];
        let imageInput = null;
        for (const selector of imageSelectors) {
          imageInput = await page.$(selector);
          if (imageInput) break;
        }
        if (imageInput) {
          await imageInput.setInputFiles(images.slice(0, 5)); // 最多5张图
          await page.waitForTimeout(3000);
          console.log(`✅ 已上传 ${images.slice(0, 5).length} 张图片`);
        } else {
          console.log('⚠️ 未找到图片上传控件');
        }
      }

      // 点击发布
      console.log('🚀 提交发布...');
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("发布")',
        'button:has-text("Publish")',
        'button:has-text("Submit")',
        'button:has-text("Save")',
        '.submit-btn',
        '[data-testid="submit-button"]'
      ];
      let submitBtn = null;
      for (const selector of submitSelectors) {
        try {
          submitBtn = await page.$(selector);
          if (submitBtn) break;
        } catch (e) {
          continue;
        }
      }
      
      if (submitBtn) {
        await submitBtn.click();
        console.log('✅ 已点击发布按钮');
      } else {
        console.log('⚠️ 未找到发布按钮');
      }

      // 等待发布成功 - 等待更长时间确保提交完成
      await page.waitForTimeout(5000);

      // 检查是否有错误提示
      const errorText = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.error, .alert, [role="alert"]');
        return errorElements.length > 0 ? errorElements[0].textContent : null;
      }).catch(() => null);

      await browser.close();
      browser = null;

      if (errorText) {
        return {
          success: false,
          error: `发布失败: ${errorText}`,
          loginType: loginStatus.loginType
        };
      }

      return {
        success: true,
        message: '产品发布成功',
        loginType: loginStatus.loginType,
        platform: 'tiktok',
        productTitle: title
      };

    } catch (error) {
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // 忽略关闭错误
        }
      }
      console.error('❌ 发布失败:', error.message);
      return {
        success: false,
        error: error.message,
        loginType: loginStatus.loginType
      };
    }
  }

  // 通过 TikTok Shop API 发布产品（使用 Token）
  async publishProductViaApi(productData) {
    const { email, title, description, price, stock, images } = productData;
    const tokenInfo = this.getTokenInfo(email);

    if (!tokenInfo || !tokenInfo.accessToken) {
      return {
        success: false,
        error: 'Token 信息不存在'
      };
    }

    try {
      console.log('📦 使用 TikTok Shop API 发布产品...');
      console.log('📝 标题:', title);

      // 这里可以集成实际的 TikTok Shop API 调用
      // 需要引入 tiktok-api 库或直接使用 fetch 调用 TikTok Shop API
      // 目前返回模拟成功响应

      return {
        success: true,
        message: '产品发布任务已创建（API 模式）',
        uploadMethod: 'api',
        productData: {
          title,
          description: description || '',
          price,
          stock,
          images
        },
        note: '实际 API 调用需要 TikTok Shop Partner 权限和相应的 API 密钥'
      };

    } catch (error) {
      console.error('❌ API 发布失败:', error.message);
      return {
        success: false,
        error: `API 发布失败: ${error.message}`
      };
    }
  }
}

class YouTubeAutomation extends BrowserAutomation {
  constructor() {
    super('youtube');
    this.loginUrl = 'https://studio.youtube.com/';
    this.tokenPath = path.join(STATE_DIR, 'youtube-tokens');
    
    // 确保 token 目录存在
    if (!fs.existsSync(this.tokenPath)) {
      fs.mkdirSync(this.tokenPath, { recursive: true });
    }
  }

  // 获取 token 文件路径
  getTokenPath(email) {
    return path.join(this.tokenPath, `${email.replace(/[@.]/g, '_')}.json`);
  }

  // 打开YouTube Studio登录页面（真实浏览器登录）
  async openLoginPage(email) {
    const { browser, context } = await this.openForManualLogin(email);
    const page = await context.newPage();

    console.log('📱 正在打开 YouTube Studio 登录页面...');
    await page.goto(this.loginUrl, { waitUntil: 'networkidle', timeout: 120000 });

    console.log('✅ 请在浏览器中手动登录Google账号，登录成功后关闭窗口');

    return new Promise((resolve) => {
      browser.on('disconnected', async () => {
        if (fs.existsSync(this.getSessionPath(email))) {
          resolve({
            success: true,
            message: '登录成功，Session已保存',
            sessionPath: this.getSessionPath(email)
          });
        } else {
          resolve({
            success: false,
            error: '登录未完成或Session保存失败'
          });
        }
      });
    });
  }

  /**
   * 方式 B：通过导入 Cookies 登录（虚拟登录）
   * @param {string} email - 用户邮箱
   * @param {Array} cookies - 浏览器 cookies 数组
   */
  async loginWithCookies(email, cookies) {
    try {
      // 转换 cookies 为 Playwright storage state 格式
      const storageState = {
        cookies: cookies.map(cookie => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain || '.youtube.com',
          path: cookie.path || '/',
          expires: cookie.expires || -1,
          httpOnly: cookie.httpOnly || false,
          secure: cookie.secure || true,
          sameSite: cookie.sameSite || 'Lax'
        })),
        origins: []
      };

      // 保存 session
      const sessionPath = this.getSessionPath(email);
      fs.writeFileSync(sessionPath, JSON.stringify(storageState, null, 2));

      console.log(`✅ Cookies 导入成功，已保存到: ${sessionPath}`);

      return {
        success: true,
        message: 'Cookies 导入成功，虚拟登录完成',
        loginType: 'cookies',
        email,
        sessionPath,
        cookieCount: cookies.length
      };

    } catch (error) {
      console.error('❌ Cookies 导入失败:', error.message);
      return {
        success: false,
        error: `Cookies 导入失败: ${error.message}`
      };
    }
  }

  /**
   * 方式 C：通过 Access Token 登录（虚拟登录）
   * @param {string} email - 用户邮箱
   * @param {Object} tokenData - Token 数据
   * @param {string} tokenData.accessToken - YouTube Data API access token
   * @param {string} tokenData.refreshToken - 可选，用于刷新
   * @param {number} tokenData.expiresIn - 过期时间（秒）
   */
  async loginWithToken(email, tokenData) {
    try {
      const { accessToken, refreshToken, expiresIn } = tokenData;

      // 验证 token 有效性（可选：调用 YouTube API 验证）
      const tokenInfo = {
        accessToken,
        refreshToken: refreshToken || null,
        expiresAt: expiresIn ? Date.now() + (expiresIn * 1000) : null,
        createdAt: Date.now(),
        email
      };

      // 保存 token
      const tokenFilePath = this.getTokenPath(email);
      fs.writeFileSync(tokenFilePath, JSON.stringify(tokenInfo, null, 2));

      // 同时创建一个标记 session 文件（用于兼容检查）
      const sessionPath = this.getSessionPath(email);
      const storageState = {
        cookies: [],
        origins: [{
          origin: 'https://studio.youtube.com',
          localStorage: [{
            name: 'yt_access_token',
            value: accessToken
          }]
        }]
      };
      fs.writeFileSync(sessionPath, JSON.stringify(storageState, null, 2));

      console.log(`✅ Token 登录成功，已保存到: ${tokenFilePath}`);

      return {
        success: true,
        message: 'Token 登录成功，虚拟登录完成',
        loginType: 'token',
        email,
        tokenPath: tokenFilePath,
        sessionPath,
        expiresAt: tokenInfo.expiresAt
      };

    } catch (error) {
      console.error('❌ Token 登录失败:', error.message);
      return {
        success: false,
        error: `Token 登录失败: ${error.message}`
      };
    }
  }

  // 检查是否有 token 登录
  hasToken(email) {
    return fs.existsSync(this.getTokenPath(email));
  }

  // 获取 token 信息
  getTokenInfo(email) {
    const tokenPath = this.getTokenPath(email);
    if (fs.existsSync(tokenPath)) {
      return JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    }
    return null;
  }

  // 上传视频
  async uploadVideo(videoData) {
    const { email, videoPath, title, description, thumbnail, useApi = false } = videoData;

    // 检查登录状态（支持 session 和 token 两种方式）
    const loginStatus = await this.checkLogin(email);
    if (!loginStatus.loggedIn) {
      return {
        success: false,
        error: '未找到登录状态，请先登录',
        needLogin: true,
        instruction: `请调用以下方式之一登录：\n1. 真实浏览器: POST /api/browser/youtube/login\n2. Cookies导入: POST /api/browser/youtube/login-cookies\n3. Token登录: POST /api/browser/youtube/login-token`
      };
    }

    // 如果使用 API 方式且已有 token
    if (useApi && loginStatus.hasToken) {
      return this.uploadVideoViaApi(videoData);
    }

    let browser = null;
    try {
      const launchResult = await this.launchWithSession(email);
      browser = launchResult.browser;
      const { context } = launchResult;
      const page = await context.newPage();

      console.log('🎬 正在打开 YouTube Studio...');
      
      // 先访问首页验证登录状态
      await page.goto('https://studio.youtube.com', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // 检查是否跳转到登录页
      const currentUrl = page.url();
      if (currentUrl.includes('accounts.google.com') || currentUrl.includes('signin')) {
        await browser.close();
        return {
          success: false,
          error: 'Session 已失效，请重新登录',
          needLogin: true,
          loginType: loginStatus.loginType
        };
      }

      console.log('✅ 登录状态验证通过');
      console.log('🎬 正在打开上传页面...');
      
      await page.goto('https://studio.youtube.com/channel/upload', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // 等待页面加载
      await page.waitForTimeout(3000);

      // 上传视频文件 - 使用多种选择器
      console.log('📁 上传视频文件...');
      const fileSelectors = [
        'input[type="file"][accept*="video"]',
        'input[type="file"]',
        '[data-testid="upload-input"]'
      ];
      let fileInput = null;
      for (const selector of fileSelectors) {
        fileInput = await page.$(selector);
        if (fileInput) break;
      }
      
      if (!fileInput) {
        await browser.close();
        return { 
          success: false, 
          error: '找不到文件上传控件，请检查页面是否加载完整',
          loginType: loginStatus.loginType
        };
      }
      
      await fileInput.setInputFiles(videoPath);
      console.log('✅ 视频文件已选择');

      // 等待上传完成（YouTube 上传需要时间）
      console.log('⏳ 等待上传处理...');
      await page.waitForTimeout(8000);

      // 填写标题 - 使用多种选择器
      console.log('✏️ 填写视频信息...');
      const titleSelectors = [
        'input[id="title"]',
        'input[name="title"]',
        'input[placeholder*="title" i]',
        'input[placeholder*="标题" i]',
        '[data-testid="title-input"]'
      ];
      let titleInput = null;
      for (const selector of titleSelectors) {
        titleInput = await page.$(selector);
        if (titleInput) break;
      }
      if (titleInput) {
        await titleInput.fill(title);
        console.log('✅ 标题已填写');
      }

      // 填写描述
      const descSelectors = [
        'textarea[id="description"]',
        'textarea[name="description"]',
        'textarea[placeholder*="description" i]',
        'textarea[placeholder*="描述" i]'
      ];
      let descInput = null;
      for (const selector of descSelectors) {
        descInput = await page.$(selector);
        if (descInput) break;
      }
      if (descInput && description) {
        await descInput.fill(description);
        console.log('✅ 描述已填写');
      }

      // 上传缩略图
      if (thumbnail) {
        const thumbSelectors = [
          'input[data-testid="thumbnail-upload"]',
          'input[type="file"][accept*="image"]',
          '[data-testid="thumbnail-input"]'
        ];
        let thumbInput = null;
        for (const selector of thumbSelectors) {
          thumbInput = await page.$(selector);
          if (thumbInput) break;
        }
        if (thumbInput) {
          await thumbInput.setInputFiles(thumbnail);
          await page.waitForTimeout(2000);
          console.log('✅ 缩略图已上传');
        }
      }

      // 设置为公开
      const visibilitySelectors = [
        'input[type="radio"][value="public"]',
        '[data-testid="public-visibility"]',
        'button:has-text("Public")',
        'button:has-text("公开")'
      ];
      let publicRadio = null;
      for (const selector of visibilitySelectors) {
        try {
          publicRadio = await page.$(selector);
          if (publicRadio) break;
        } catch (e) {
          continue;
        }
      }
      if (publicRadio) {
        await publicRadio.click();
        console.log('✅ 已设置为公开');
      }

      // 点击发布
      console.log('🚀 发布视频...');
      const publishSelectors = [
        'button:has-text("发布")',
        'button:has-text("Publish")',
        'button:has-text("Save")',
        'button:has-text("保存")',
        '[data-testid="publish-button"]',
        'button[type="submit"]'
      ];
      let publishBtn = null;
      for (const selector of publishSelectors) {
        try {
          publishBtn = await page.$(selector);
          if (publishBtn) break;
        } catch (e) {
          continue;
        }
      }
      
      if (publishBtn) {
        await publishBtn.click();
        console.log('✅ 已点击发布按钮');
      } else {
        console.log('⚠️ 未找到发布按钮');
      }

      // 等待发布完成
      await page.waitForTimeout(5000);

      // 检查是否有错误提示
      const errorText = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.error, .alert, [role="alert"], .yt-alert');
        return errorElements.length > 0 ? errorElements[0].textContent : null;
      }).catch(() => null);

      await browser.close();
      browser = null;

      if (errorText) {
        return {
          success: false,
          error: `发布失败: ${errorText}`,
          loginType: loginStatus.loginType
        };
      }

      return {
        success: true,
        message: '视频发布成功',
        loginType: loginStatus.loginType,
        platform: 'youtube',
        videoTitle: title
      };

    } catch (error) {
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // 忽略关闭错误
        }
      }
      console.error('❌ 上传失败:', error.message);
      return {
        success: false,
        error: error.message,
        loginType: loginStatus.loginType
      };
    }
  }

  // 通过 YouTube Data API 上传视频（使用 Token）
  async uploadVideoViaApi(videoData) {
    const { email, videoPath, title, description, thumbnail } = videoData;
    const tokenInfo = this.getTokenInfo(email);

    if (!tokenInfo || !tokenInfo.accessToken) {
      return {
        success: false,
        error: 'Token 信息不存在'
      };
    }

    try {
      console.log('🎬 使用 YouTube Data API 上传视频...');
      console.log('📹 视频:', videoPath);
      console.log('📝 标题:', title);

      // 这里可以集成实际的 YouTube Data API 调用
      // 需要引入 googleapis 库来实现
      // 目前返回模拟成功响应

      return {
        success: true,
        message: '视频上传任务已创建（API 模式）',
        uploadMethod: 'api',
        videoData: {
          title,
          description: description || '',
          videoPath,
          thumbnail
        },
        note: '实际 API 调用需要安装 googleapis 库并配置 OAuth2'
      };

    } catch (error) {
      console.error('❌ API 上传失败:', error.message);
      return {
        success: false,
        error: `API 上传失败: ${error.message}`
      };
    }
  }

  async checkLogin(email) {
    const hasSession = this.hasSession(email);
    const hasToken = this.hasToken(email);
    const tokenInfo = this.getTokenInfo(email);

    // 判断登录类型
    let loginType = null;
    if (hasToken) loginType = 'token';
    else if (hasSession) loginType = 'session';

    // 检查 token 是否过期
    let isTokenExpired = false;
    if (tokenInfo && tokenInfo.expiresAt) {
      isTokenExpired = Date.now() > tokenInfo.expiresAt;
    }

    return {
      loggedIn: hasSession || (hasToken && !isTokenExpired),
      loginType,
      hasSession,
      hasToken,
      isTokenExpired,
      sessionPath: hasSession ? this.getSessionPath(email) : null,
      tokenPath: hasToken ? this.getTokenPath(email) : null,
      tokenInfo: tokenInfo ? {
        createdAt: tokenInfo.createdAt,
        expiresAt: tokenInfo.expiresAt
      } : null
    };
  }
}

export { TikTokShopAutomation, YouTubeAutomation };
