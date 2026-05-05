/**
 * 小红书浏览器自动化模块
 * 支持：登录、发布图文、发布视频、店铺绑定
 * 通过 Playwright 操作小红书创作者中心 / 商家后台
 * 
 * v2.1 — 反检测增强：人类行为模拟 + 随机延迟 + 自然输入
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const STATE_DIR = './browser-states';

if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

// ======== 人类行为模拟引擎 ========

/** 随机延迟 (ms) */
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 随机等待 */
async function humanDelay(page, min = 500, max = 3000) {
  const ms = rand(min, max);
  await page.waitForTimeout(ms);
}

/** 模拟人类逐字输入 */
async function humanType(page, selector, text, opts = {}) {
  const el = await page.$(selector);
  if (!el) return false;
  await el.click();
  await humanDelay(page, 300, 800);

  // 先清空
  await el.fill('');
  await humanDelay(page, 100, 300);

  // 逐字输入，含随机停顿和回删
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    await page.keyboard.type(char, { delay: rand(30, 150) });
    // 偶尔停顿（模拟思考）
    if (Math.random() < 0.08) {
      await humanDelay(page, 500, 2000);
    }
    // 极偶尔打错再删掉（逼真）
    if (Math.random() < 0.02) {
      await page.keyboard.press('Backspace');
      await humanDelay(page, 100, 300);
      await page.keyboard.type(char, { delay: rand(30, 100) });
    }
  }
  return true;
}

/** 滚动页面（模拟阅读） */
async function humanScroll(page) {
  for (let i = 0; i < rand(1, 3); i++) {
    await page.mouse.wheel(0, rand(200, 600));
    await humanDelay(page, 500, 2000);
  }
  // 偶尔滚回顶部
  if (Math.random() < 0.3) {
    await page.mouse.wheel(0, -rand(100, 300));
    await humanDelay(page, 300, 1000);
  }
}

/** 上次发布时间（防批量发布） */
const _lastPublishTime = {};

function checkRateLimit(accountId) {
  const now = Date.now();
  const last = _lastPublishTime[accountId] || 0;
  const minGap = 3 * 60 * 1000; // 最小3分钟间隔
  if (now - last < minGap) {
    const waitSec = Math.ceil((minGap - (now - last)) / 1000);
    throw new Error(`发布太频繁，请等待 ${waitSec} 秒后再试（防封号）`);
  }
  _lastPublishTime[accountId] = now;
}

// ======== 小红书自动化类 ========

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
        // 反检测增强
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security',
        '--disable-features=BlockInsecurePrivateNetworkRequests',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-default-apps',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-zygote',
        '--disable-ipc-flooding-protection',
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

    // 随机化视口（真人设备尺寸多样）
    const viewports = [
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1920, height: 1080 },
    ];
    const vp = viewports[rand(0, viewports.length - 1)];

    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ];
    const ua = userAgents[rand(0, userAgents.length - 1)];

    this.context = await this.browser.newContext({
      storageState,
      viewport: vp,
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai',
      userAgent: ua,
      // 反检测
      geolocation: { latitude: 31.2 + Math.random(), longitude: 121.4 + Math.random() },
      permissions: [], // 不自动授权任何权限
      ...options,
    });

    this.page = await this.context.newPage();

    // 注入反检测脚本（隐藏 webdriver 特征）
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en'] });
      // 伪造 chrome 对象
      window.chrome = { runtime: {} };
    });

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
   * 优化：尽量截取二维码区域而非整个页面
   */
  async getLoginQRCode() {
    await this.gotoLogin();

    // 尝试找到二维码相关元素并等待
    await this.page.waitForTimeout(2000);

    // 尝试切换到扫码登录 tab（有些版本默认显示密码登录）
    const scanTabSelectors = [
      'text=扫码登录',
      '[class*="qrcode-tab"]',
      '[class*="scan-tab"]',
      'div:has-text("扫码登录")',
    ];
    for (const sel of scanTabSelectors) {
      try {
        const el = await this.page.$(sel);
        if (el) {
          await el.click();
          await this.page.waitForTimeout(1500);
          break;
        }
      } catch { /* 继续尝试下一个 */ }
    }

    // 等待二维码元素加载
    const qrSelectors = [
      'canvas',
      'img[class*="qrcode"]',
      'img[class*="QRCode"]',
      'img[class*="qr-code"]',
      '[class*="qrcode"] img',
      '[class*="qr-code"] img',
      '[class*="login-code"] img',
      'iframe',
    ];

    let qrElement = null;
    for (const sel of qrSelectors) {
      try {
        qrElement = await this.page.waitForSelector(sel, { timeout: 5000 });
        if (qrElement) break;
      } catch { /* 继续尝试 */ }
    }

    let screenshot;
    if (qrElement && !(await qrElement.evaluate(el => el.tagName === 'IFRAME'))) {
      // 找到二维码元素 → 只截取该区域
      try {
        const box = await qrElement.boundingBox();
        if (box && box.width > 50 && box.height > 50) {
          // 加一点 padding
          const padding = 20;
          screenshot = await this.page.screenshot({
            type: 'png',
            clip: {
              x: Math.max(0, box.x - padding),
              y: Math.max(0, box.y - padding),
              width: box.width + padding * 2,
              height: box.height + padding * 2,
            },
          });
        }
      } catch { /* 截取区域失败，回退到全页截图 */ }
    }

    if (!screenshot) {
      // 回退：截取整个页面（但要确保二维码可见）
      screenshot = await this.page.screenshot({ type: 'png', fullPage: false });
    }

    return {
      screenshot: screenshot.toString('base64'),
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
    accountId = 'default',
    semiAuto = false,   // ✅ 半自动模式：填完内容不点发布，留给人手动点
  }) {
    // 频率限制
    checkRateLimit(accountId);

    // 1. 进入发布页（模拟自然浏览）
    await this.page.goto('https://creator.xiaohongshu.com/publish/publish', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await humanDelay(this.page, 2000, 5000);
    await humanScroll(this.page);
    await humanDelay(this.page, 500, 2000);

    // 2. 上传图片（模拟点击上传区域）
    const uploadArea = await this.page.$('[class*="upload"], [class*="Upload"], .upload-wrapper, input[type="file"]');
    if (uploadArea) {
      // 先模拟鼠标移到上传区域
      const box = await uploadArea.boundingBox();
      if (box) {
        await this.page.mouse.move(
          box.x + rand(10, box.width - 10),
          box.y + rand(10, box.height - 10),
          { steps: rand(3, 8) }
        );
        await humanDelay(this.page, 200, 600);
      }

      const fileInput = await this.page.$('input[type="file"]');
      if (fileInput) {
        await fileInput.setInputFiles(images);
        await this.page.waitForFunction(
          () => !document.querySelector('[class*="uploading"], [class*="progress"]'),
          { timeout: 90000 }
        ).catch(() => {});
        await humanDelay(this.page, 2000, 4000); // 图片加载需要时间
      }
    }

    // 3. 填写标题（逐字输入）
    const titleInput = await this.page.$(
      '[placeholder*="标题"]:not([placeholder*="正文"]), input[maxlength="20"], [data-placeholder*="标题"]'
    );
    if (titleInput) {
      // 先滚动到标题区域
      await titleInput.scrollIntoViewIfNeeded();
      await humanDelay(this.page, 300, 800);
      await humanType(this.page, 
        '[placeholder*="标题"]:not([placeholder*="正文"]), input[maxlength="20"], [data-placeholder*="标题"]',
        title
      );
      await humanDelay(this.page, 1000, 3000);
    }

    // 4. 填写正文（逐字输入，更慢一点模拟思考）
    const contentSelectors = [
      '[placeholder*="正文"]',
      '[contenteditable="true"]',
      '.ql-editor',
      '[data-placeholder*="正文"]',
    ];
    let contentEditor = null;
    for (const sel of contentSelectors) {
      contentEditor = await this.page.$(sel);
      if (contentEditor) break;
    }
    if (contentEditor) {
      await contentEditor.scrollIntoViewIfNeeded();
      await humanDelay(this.page, 500, 1500);
      await contentEditor.click();
      await humanDelay(this.page, 300, 800);
      // 正文用键盘逐字输入（更自然）
      for (let i = 0; i < content.length; i++) {
        await this.page.keyboard.type(content[i], { delay: rand(20, 120) });
        // 每30-50字停顿一下（模拟思考）
        if (i > 0 && i % rand(30, 50) === 0) {
          await humanDelay(this.page, 1000, 4000);
        }
      }
      await humanDelay(this.page, 1000, 3000);
    }

    // 5. 添加标签（每次只加一个，中间停顿）
    if (tags.length > 0) {
      const tagInput = await this.page.$('[placeholder*="标签"], [placeholder*="话题"], input[maxlength]');
      if (tagInput) {
        for (const tag of tags.slice(0, 5)) { // 最多5个标签
          await tagInput.scrollIntoViewIfNeeded();
          await humanDelay(this.page, 500, 1500);
          await tagInput.click();
          await humanDelay(this.page, 200, 500);
          // 逐字输入标签
          for (const ch of tag.replace('#', '')) {
            await this.page.keyboard.type(ch, { delay: rand(20, 80) });
          }
          await humanDelay(this.page, 500, 1500);
          // 选第一个建议
          const suggestion = await this.page.$('[class*="suggestion"]:first-child, [class*="dropdown"]:first-child, [class*="topic-item"]');
          if (suggestion) {
            await suggestion.click();
            await humanDelay(this.page, 300, 800);
          }
        }
      }
    }

    // 6. 再次滚动（模拟检查）
    await humanScroll(this.page);
    await humanDelay(this.page, 1000, 3000);

    // 6.5 半自动模式：填完内容即停止，等用户手动点发布
    if (semiAuto) {
      console.log('[小红书-半自动] 内容已填充完毕，等待用户手动点击发布按钮');
      return {
        success: true,
        semiAuto: true,
        message: '内容已自动填充，请手动点击【发布】按钮',
        note: '浏览器窗口保持打开，请在 5 分钟内手动点击发布',
      };
    }

    // 7. 发布（找到按钮，慢慢移动过去）
    const publishBtn = await this.page.$(
      'button:has-text("发布"):not(:has-text("定时")), [class*="publish-btn"], .submit-btn'
    );
    if (!publishBtn) {
      throw new Error('找不到发布按钮');
    }

    // 模拟鼠标慢慢移到发布按钮
    const btnBox = await publishBtn.boundingBox();
    if (btnBox) {
      // 从远处移过去
      await this.page.mouse.move(
        rand(100, btnBox.x - 50),
        rand(100, btnBox.y - 20),
        { steps: rand(5, 12) }
      );
      await humanDelay(this.page, 300, 1000);
      await this.page.mouse.move(
        btnBox.x + rand(10, btnBox.width - 10),
        btnBox.y + rand(5, btnBox.height - 5),
        { steps: rand(3, 6) }
      );
      await humanDelay(this.page, 300, 800);
    }

    await publishBtn.click();
    await humanDelay(this.page, 1000, 3000);

    // 9. 等待发布成功
    await this.page.waitForFunction(
      () => {
        const body = document.body.innerText;
        return body.includes('发布成功') || body.includes('已发布') || body.includes('笔记发布成功');
      },
      { timeout: 30000 }
    ).catch(() => {
      // 也可能不显示成功提示
    });

    return { success: true, publishedAt: new Date().toISOString() };
  }
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
    semiAuto = false,   // ✅ 半自动模式：填完内容不点发布
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

    // 6. 添加标签（视频也支持标签）
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

    // 6.5 半自动模式：填完内容即停止，等用户手动点发布
    if (semiAuto) {
      console.log('[小红书-半自动] 视频内容已填充完毕，等待用户手动点击发布按钮');
      return {
        success: true,
        semiAuto: true,
        message: '内容已自动填充，请手动点击【发布】按钮',
        note: '浏览器窗口保持打开，请在 5 分钟内手动点击发布',
      };
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
