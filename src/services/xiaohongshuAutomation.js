/**
 * 小红书浏览器自动化模块
 * 支持：登录、发布图文、发布视频、店铺绑定
 * 通过 Playwright 操作小红书创作者中心 / 商家后台
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const STATE_DIR = './browser-states';

if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

/**
 * 小红书自动化类
 */
export class XiaohongshuAutomation {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * 存储文件名（支持多账号）
   */
  getStateFile(accountId) {
    const name = accountId ? `xiaohongshu_${accountId}` : 'xiaohongshu_default';
    return path.join(STATE_DIR, `${name}.json`);
  }

  /**
   * 检查是否有已保存的 session
   */
  hasSavedSession(accountId) {
    const stateFile = this.getStateFile(accountId);
    if (!fs.existsSync(stateFile)) return false;
    try {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
      return state.cookies && state.cookies.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 启动浏览器
   */
  async launch(headless = true) {
    this.browser = await chromium.launch({
      headless,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    return this.browser;
  }

  /**
   * 创建上下文（带 session 恢复）
   */
  async createContext(accountId, options = {}) {
    if (!this.browser) await this.launch(options.headless ?? true);

    const stateFile = this.getStateFile(accountId);
    const storageState = fs.existsSync(stateFile) ? stateFile : undefined;

    this.context = await this.browser.newContext({
      storageState,
      viewport: { width: 1440, height: 900 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      ...options,
    });

    this.page = await this.context.newPage();
    return { context: this.context, page: this.page };
  }

  /**
   * 保存 session
   */
  async saveSession(accountId) {
    if (!this.context) return;
    const stateFile = this.getStateFile(accountId);
    await this.context.storageState({ path: stateFile });
    console.log(`[小红书] Session 已保存: ${stateFile}`);
    return stateFile;
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  /**
   * 跳转到登录页
   */
  async gotoLogin() {
    await this.page.goto('https://creator.xiaohongshu.com/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
  }

  /**
   * 跳转到创作者中心
   */
  async gotoCreatorCenter() {
    await this.page.goto('https://creator.xiaohongshu.com/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
  }

  /**
   * 检查是否已登录
   */
  async checkLogin() {
    try {
      await this.page.goto('https://creator.xiaohongshu.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      // 如果跳转到 login 说明未登录
      const url = this.page.url();
      return !url.includes('/login');
    } catch {
      return false;
    }
  }

  /**
   * 获取登录二维码（供前端展示）
   */
  async getLoginQRCode() {
    await this.gotoLogin();
    // 等待二维码加载
    await this.page.waitForSelector('canvas, img[class*="qrcode"], [class*="QRCode"]', {
      timeout: 15000,
    }).catch(() => null);

    // 获取二维码图片
    const qrImg = await this.page.$('canvas, img[class*="qrcode"]');
    if (!qrImg) {
      // 可能是手机号/密码登录页，尝试切换到扫码
      const scanTab = await this.page.$('text=扫码登录');
      if (scanTab) {
        await scanTab.click();
        await this.page.waitForTimeout(2000);
      }
    }

    const qrScreenshot = await this.page.screenshot({
      type: 'png',
      fullPage: false,
    });

    return {
      screenshot: qrScreenshot.toString('base64'),
      loginUrl: this.page.url(),
    };
  }

  /**
   * 等待登录完成（检测页面跳转）
   */
  async waitForLogin(timeout = 120000) {
    console.log('[小红书] 等待扫码登录...');
    try {
      await this.page.waitForURL(
        (url) => !url.includes('/login'),
        { timeout }
      );
      console.log('[小红书] 登录成功!');
      return true;
    } catch {
      console.log('[小红书] 登录超时');
      return false;
    }
  }

  // =============================================================
  // 图文发布
  // =============================================================

  /**
   * 发布图文笔记
   */
  async publishNote({
    images,       // 图片路径数组或URL数组
    title,
    content,
    tags = [],
    location = '',
    isPrivate = false,
  }) {
    // 1. 进入发布页
    await this.page.goto('https://creator.xiaohongshu.com/publish/publish', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await this.page.waitForTimeout(2000);

    // 2. 上传图片
    const fileInput = await this.page.$('input[type="file"], [class*="upload"] input[type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(images);
      // 等待上传完成
      await this.page.waitForTimeout(3000);
      // 等待上传进度消失
      await this.page.waitForFunction(
        () => !document.querySelector('[class*="uploading"], [class*="progress"]'),
        { timeout: 60000 }
      ).catch(() => {});
    }

    // 3. 填写标题
    const titleInput = await this.page.$('[placeholder*="标题"], [placeholder*="title"], input[maxlength="20"]');
    if (titleInput) {
      await titleInput.click();
      await titleInput.fill(title);
    }

    // 4. 填写正文
    const contentEditor = await this.page.$('[placeholder*="正文"], [placeholder*="正文内容"], [contenteditable="true"]');
    if (contentEditor) {
      await contentEditor.click();
      await contentEditor.fill(content);
    }

    // 5. 添加标签
    if (tags.length > 0) {
      const tagInput = await this.page.$('[placeholder*="添加标签"], [placeholder*="话题"]');
      if (tagInput) {
        for (const tag of tags) {
          await tagInput.fill(tag);
          await this.page.waitForTimeout(500);
          // 选择第一个建议
          const suggestion = await this.page.$('[class*="suggestion"]:first-child, [class*="dropdown"]:first-child');
          if (suggestion) {
            await suggestion.click();
            await this.page.waitForTimeout(300);
          }
        }
      }
    }

    // 6. 添加位置（可选）
    if (location) {
      const locationBtn = await this.page.$('text=添加地点');
      if (locationBtn) {
        await locationBtn.click();
        await this.page.waitForTimeout(500);
        const locInput = await this.page.$('[placeholder*="搜索地点"]');
        if (locInput) {
          await locInput.fill(location);
          await this.page.waitForTimeout(1000);
          const firstLoc = await this.page.$('[class*="location-item"]:first-child');
          if (firstLoc) await firstLoc.click();
        }
      }
    }

    // 7. 隐私设置
    if (isPrivate) {
      const privacyBtn = await this.page.$('text=仅我可见');
      if (privacyBtn) await privacyBtn.click();
    }

    // 8. 点击发布
    const publishBtn = await this.page.$('button:has-text("发布"), [class*="publish-btn"]');
    if (!publishBtn) {
      throw new Error('找不到发布按钮');
    }

    await publishBtn.click();

    // 9. 等待发布完成
    await this.page.waitForFunction(
      () => {
        const text = document.body.innerText;
        return text.includes('发布成功') || text.includes('已发布') || text.includes('审核中');
      },
      { timeout: 30000 }
    ).catch(() => {});

    const resultUrl = this.page.url();
    return {
      success: true,
      url: resultUrl,
      publishedAt: new Date().toISOString(),
    };
  }

  // =============================================================
  // 视频发布
  // =============================================================

  /**
   * 发布视频笔记
   */
  async publishVideo({
    videoPath,    // 视频文件路径
    coverImage,   // 封面图片（可选）
    title,
    content,
    tags = [],
    location = '',
    isPrivate = false,
  }) {
    // 1. 进入发布页
    await this.page.goto('https://creator.xiaohongshu.com/publish/publish?type=video', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await this.page.waitForTimeout(2000);

    // 2. 上传视频
    const videoInput = await this.page.$('input[type="file"]');
    if (videoInput) {
      await videoInput.setInputFiles([videoPath]);
      // 等待上传和转码（视频可能需要更长时间）
      console.log('[小红书] 视频上传中，请等待...');
      await this.page.waitForTimeout(5000);
      await this.page.waitForFunction(
        () => !document.querySelector('[class*="uploading"], [class*="progress-bar"]'),
        { timeout: 300000 } // 5分钟等待
      ).catch(() => {});
    }

    // 3. 上传封面（可选）
    if (coverImage) {
      const coverInput = await this.page.$('[class*="cover"] input[type="file"]');
      if (coverInput) {
        await coverInput.setInputFiles([coverImage]);
        await this.page.waitForTimeout(2000);
      }
    }

    // 4. 填写标题
    const titleInput = await this.page.$('[placeholder*="标题"], [placeholder*="title"], input[maxlength="20"]');
    if (titleInput) {
      await titleInput.click();
      await titleInput.fill(title);
    }

    // 5. 填写正文
    const contentEditor = await this.page.$('[placeholder*="正文"], [placeholder*="正文内容"], [contenteditable="true"]');
    if (contentEditor) {
      await contentEditor.click();
      await contentEditor.fill(content);
    }

    // 6. 添加标签
    if (tags.length > 0) {
      const tagInput = await this.page.$('[placeholder*="添加标签"], [placeholder*="话题"]');
      if (tagInput) {
        for (const tag of tags) {
          await tagInput.fill(tag);
          await this.page.waitForTimeout(500);
          const suggestion = await this.page.$('[class*="suggestion"]:first-child');
          if (suggestion) {
            await suggestion.click();
            await this.page.waitForTimeout(300);
          }
        }
      }
    }

    // 7. 发布
    const publishBtn = await this.page.$('button:has-text("发布"), [class*="publish-btn"]');
    if (!publishBtn) throw new Error('找不到发布按钮');
    await publishBtn.click();

    // 8. 等待发布完成
    await this.page.waitForFunction(
      () => document.body.innerText.includes('发布成功') || document.body.innerText.includes('已发布'),
      { timeout: 30000 }
    ).catch(() => {});

    return {
      success: true,
      url: this.page.url(),
      publishedAt: new Date().toISOString(),
    };
  }

  // =============================================================
  // 店铺管理
  // =============================================================

  /**
   * 跳转到店铺管理页面
   */
  async gotoShopCenter() {
    // 小红书商家后台
    await this.page.goto('https://seller.xiaohongshu.com/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    }).catch(async () => {
      // 可能重定向到登录，尝试先登录创作者中心再跳转
      if (this.page.url().includes('/login')) {
        throw new Error('请先登录小红书账号');
      }
    });
  }

  /**
   * 获取店铺信息
   */
  async getShopInfo() {
    await this.gotoShopCenter();
    await this.page.waitForTimeout(2000);

    const shopInfo = await this.page.evaluate(() => {
      return {
        shopName: document.querySelector('[class*="shop-name"], [class*="store-name"]')?.textContent?.trim() || '',
        shopId: document.querySelector('[class*="shop-id"]')?.textContent?.trim() || '',
        followerCount: document.querySelector('[class*="follower"]')?.textContent?.trim() || '',
        url: window.location.href,
      };
    });

    return shopInfo;
  }

  /**
   * 检查 session 有效性
   */
  async validateSession(accountId) {
    try {
      await this.createContext(accountId, { headless: true });
      const loggedIn = await this.checkLogin();
      await this.close();
      return loggedIn;
    } catch {
      return false;
    }
  }
}

// 单例
let instance = null;

export const getXiaohongshuInstance = () => {
  if (!instance) {
    instance = new XiaohongshuAutomation();
  }
  return instance;
};
