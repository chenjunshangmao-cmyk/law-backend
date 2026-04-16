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
        '--disable-dev-shm-usage',
        `--proxy-server=http://127.0.0.1:${PROXY_PORT}`
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
  }

  // 打开TikTok Seller登录页面，让客户手动登录
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

  // 发布产品（使用已保存的session）
  async publishProduct(productData) {
    const { email, title, description, price, stock, images } = productData;

    // 检查是否有session
    if (!this.hasSession(email)) {
      return {
        success: false,
        error: '未找到登录状态，请先登录',
        needLogin: true,
        instruction: `请调用 POST /api/browser/tiktok/login?email=${email} 进行登录`
      };
    }

    try {
      const { browser, context } = await this.launchWithSession(email);
      const page = await context.newPage();

      console.log('📦 正在打开添加产品页面...');
      await page.goto('https://seller-accounts.tiktok.com/product/add', {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      // 填写产品信息（需要根据实际页面调整选择器）
      console.log('✏️ 填写产品信息...');
      
      // 标题
      const titleInput = await page.$('input[name="title"], [data-testid="title"], textarea[name="title"]');
      if (titleInput) await titleInput.fill(title);

      // 描述
      const descInput = await page.$('textarea[name="description"], [data-testid="description"]');
      if (descInput) await descInput.fill(description);

      // 价格
      const priceInput = await page.$('input[name="price"], [data-testid="price"]');
      if (priceInput) await priceInput.fill(price.toString());

      // 库存
      const stockInput = await page.$('input[name="stock"], [data-testid="stock"]');
      if (stockInput) await stockInput.fill((stock || 100).toString());

      // 上传图片
      if (images && images.length > 0) {
        const imageInput = await page.$('input[type="file"][accept*="image"]');
        if (imageInput) {
          await imageInput.setInputFiles(images);
          await page.waitForTimeout(2000);
        }
      }

      // 点击发布
      console.log('🚀 提交发布...');
      const submitBtn = await page.$('button[type="submit"], button:has-text("发布"), button:has-text("Submit"), button:has-text("Publish")');
      if (submitBtn) await submitBtn.click();

      // 等待发布成功
      await page.waitForTimeout(3000);

      await browser.close();

      return {
        success: true,
        message: '产品发布成功'
      };

    } catch (error) {
      console.error('❌ 发布失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 检查登录状态
  async checkLogin(email) {
    return {
      loggedIn: this.hasSession(email),
      sessionPath: this.getSessionPath(email)
    };
  }
}

class YouTubeAutomation extends BrowserAutomation {
  constructor() {
    super('youtube');
    this.loginUrl = 'https://studio.youtube.com/';
  }

  // 打开YouTube Studio登录页面
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

  // 上传视频
  async uploadVideo(videoData) {
    const { email, videoPath, title, description, thumbnail } = videoData;

    if (!this.hasSession(email)) {
      return {
        success: false,
        error: '未找到登录状态，请先登录',
        needLogin: true,
        instruction: `请调用 POST /api/browser/youtube/login?email=${email} 进行登录`
      };
    }

    try {
      const { browser, context } = await this.launchWithSession(email);
      const page = await context.newPage();

      console.log('🎬 正在打开上传页面...');
      await page.goto('https://studio.youtube.com/channel/upload', {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      // 上传视频文件
      console.log('📁 上传视频文件...');
      const fileInput = await page.$('input[type="file"][accept*="video"]');
      if (fileInput) {
        await fileInput.setInputFiles(videoPath);
      } else {
        return { success: false, error: '找不到文件上传控件' };
      }

      // 等待上传完成
      await page.waitForTimeout(5000);

      // 填写标题
      console.log('✏️ 填写视频信息...');
      const titleInput = await page.$('input[id="title"], input[name="title"]');
      if (titleInput) await titleInput.fill(title);

      // 填写描述
      const descInput = await page.$('textarea[id="description"], textarea[name="description"]');
      if (descInput) await descInput.fill(description || '');

      // 上传缩略图
      if (thumbnail) {
        const thumbInput = await page.$('input[data-testid="thumbnail-upload"]');
        if (thumbInput) await thumbInput.setInputFiles(thumbnail);
      }

      // 设置为公开
      const publicRadio = await page.$('input[type="radio"][value="public"]');
      if (publicRadio) await publicRadio.click();

      // 点击发布
      console.log('🚀 发布视频...');
      const publishBtn = await page.$('button:has-text("发布"), button:has-text("Publish")');
      if (publishBtn) await publishBtn.click();

      await page.waitForTimeout(3000);
      await browser.close();

      return {
        success: true,
        message: '视频发布成功'
      };

    } catch (error) {
      console.error('❌ 上传失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkLogin(email) {
    return {
      loggedIn: this.hasSession(email),
      sessionPath: this.getSessionPath(email)
    };
  }
}

class OzonAutomation extends BrowserAutomation {
  constructor() {
    super('ozon');
    this.loginUrl = 'https://seller.ozon.ru/';
    this.dashboardUrl = 'https://seller.ozon.ru/app/dashboard';
  }

  // 打开Ozon Seller登录页面
  async openLoginPage(email) {
    const { browser, context } = await this.openForManualLogin(email);
    const page = await context.newPage();

    console.log('📱 正在打开 Ozon Seller 登录页面...');

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

  // 检查登录状态
  async checkLogin(email) {
    return {
      loggedIn: this.hasSession(email),
      sessionPath: this.getSessionPath(email)
    };
  }
}

export { TikTokShopAutomation, YouTubeAutomation, OzonAutomation };
