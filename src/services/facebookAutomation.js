/**
 * Facebook 浏览器自动化发布服务 v1.1
 * - 自包含 Playwright 管理（参考 xiaohongshuAutomation 模式）
 * - 发布图片/视频到 个人主页 和 公共主页
 * - Session 持久化到 browser-states/ 目录
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const STATE_DIR = './browser-states';
if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

// 超时配置
const PAGE_LOAD_TIMEOUT = 15000;
const UPLOAD_TIMEOUT = 120000;

// headless 检测
function isServer() {
  return !!process.env.RENDER || !!process.env.RAILWAY || process.env.BROWSER_HEADLESS === 'true';
}

class FacebookAutomation {
  constructor() {
    this.sessions = new Map(); // accountId → { page, browser, context, status, pages: [] }
  }

  getStateFile(accountId) {
    return path.join(STATE_DIR, `facebook_${accountId}.json`);
  }

  // ============================================================
  // 浏览器管理
  // ============================================================

  async _getOrCreateSession(accountId) {
    let session = this.sessions.get(accountId);
    if (!session) {
      // 启动浏览器
      const headless = isServer();
      const browser = await chromium.launch({
        headless,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const stateFile = this.getStateFile(accountId);
      const storageState = fs.existsSync(stateFile) ? stateFile : undefined;

      const context = await browser.newContext({
        storageState,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai',
      });

      const page = await context.newPage();

      session = {
        browser,
        context,
        page,
        status: 'disconnected',
        pages: [],
      };
      this.sessions.set(accountId, session);
    }
    return session;
  }

  // ============================================================
  // 登录
  // ============================================================

  async login(accountId, email, password) {
    const session = await this._getOrCreateSession(accountId);
    const { page } = session;

    try {
      // 尝试从 session 恢复
      const stateFile = this.getStateFile(accountId);
      if (fs.existsSync(stateFile)) {
        await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2', timeout: PAGE_LOAD_TIMEOUT });
        const loggedIn = await this._checkLoggedIn(page);
        if (loggedIn) {
          session.status = 'active';
          await this._fetchPages(page, accountId);
          return { success: true, data: { message: 'Session 恢复登录成功' } };
        }
      }

      // 账号密码登录
      await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2', timeout: PAGE_LOAD_TIMEOUT });

      // 等登录表单
      const emailInput = await page.waitForSelector('input[name="email"], input[autocomplete="username"], input#email', { timeout: 10000 }).catch(() => null);
      if (!emailInput) throw new Error('未找到登录表单，可能已登录或页面异常');

      await emailInput.click();
      await emailInput.fill(email);
      await page.waitForTimeout(500);

      const passInput = await page.waitForSelector('input[name="pass"], input[type="password"]', { timeout: 5000 });
      await passInput.click();
      await passInput.fill(password);
      await page.waitForTimeout(300);

      const loginBtn = await page.$('button[name="login"], button[type="submit"]');
      if (loginBtn) await loginBtn.click();

      await page.waitForTimeout(5000);

      // 检查 2FA
      const twoFAInput = await page.$('input[name*="approvals_code"], input[autocomplete="one-time-code"], input#approvals_code');
      if (twoFAInput) {
        session.status = 'awaiting_2fa';
        return { success: false, error: '需要双重验证码', require2fa: true };
      }

      const loggedIn = await this._checkLoggedIn(page);
      if (!loggedIn) throw new Error('登录失败，请检查账号密码');

      // 保存 session
      await this._saveState(page, stateFile);
      session.status = 'active';
      await this._fetchPages(page, accountId);

      return { success: true, data: { message: 'Facebook 登录成功' } };
    } catch (error) {
      session.status = 'error';
      throw error;
    }
  }

  async submit2fa(accountId, code) {
    const session = this.sessions.get(accountId);
    if (!session?.page) throw new Error('请先启动登录');
    const { page } = session;

    try {
      const codeInput = await page.$('input[name*="approvals_code"], input[autocomplete="one-time-code"], input#approvals_code');
      if (codeInput) {
        await codeInput.fill(code);
        await page.waitForTimeout(500);

        const confirmBtn = await page.$('button:has-text("继续"), button:has-text("Continue"), button[type="submit"]');
        if (confirmBtn) await confirmBtn.click();
        await page.waitForTimeout(5000);
      }

      const loggedIn = await this._checkLoggedIn(page);
      if (!loggedIn) throw new Error('验证码无效');

      const stateFile = this.getStateFile(accountId);
      await this._saveState(page, stateFile);
      session.status = 'active';
      await this._fetchPages(page, accountId);

      return { success: true, data: { message: '双重验证通过' } };
    } catch (error) {
      throw error;
    }
  }

  // ============================================================
  // 状态 & 主页
  // ============================================================

  async _checkLoggedIn(page) {
    try {
      const url = page.url();
      if (url.includes('login') || url.includes('checkpoint')) return false;
      // 检查是否有 feed/动态
      const feed = await page.$('[role="feed"], [aria-label*="Stories"], [data-pagelet*="feed"]');
      if (feed) return true;
      // 检查 URL 是否在 facebook.com 主页
      if (url.match(/facebook\.com\/?(\?|$)/)) return true;
      // 不在登录页就算登录了
      return !url.includes('login');
    } catch {
      return false;
    }
  }

  async _fetchPages(page, accountId) {
    const session = this.sessions.get(accountId);
    if (!session) return;
    try {
      await page.goto('https://www.facebook.com/pages/?category=your_pages', {
        waitUntil: 'networkidle2', timeout: PAGE_LOAD_TIMEOUT,
      }).catch(() => {});
      await page.waitForTimeout(3000);

      const pages = await page.evaluate(() => {
        const items = [];
        const links = document.querySelectorAll('a[href*="facebook.com/"], span');
        const seen = new Set();
        links.forEach(el => {
          const name = el.textContent?.trim() || '';
          const href = el.closest('a')?.getAttribute('href') || '';
          if (name.length > 2 && name.length < 80 && !seen.has(name) &&
              !['首页','动态','视频','小组','市场','游戏'].includes(name)) {
            // 排除常见的 FB 导航文字
            const commonWords = ['首页','friends','groups','watch','marketplace','gaming','动态消息',
              'friend','group','watch','marketplace','gaming','menu','search','notification',
              'messenger','reels','shorts','video','photos','create','help','settings',
              'log out','find friends','welcome','create post','story','stories'];
            if (!commonWords.some(w => name.toLowerCase().includes(w.toLowerCase()))) {
              items.push({ id: href.split('?')[0], name });
              seen.add(name);
            }
          }
        });
        return items.slice(0, 15);
      });

      if (pages.length > 0) {
        session.pages = pages;
      }
    } catch (e) {
      console.warn('[Facebook] 获取主页列表失败:', e.message);
    }
  }

  async getStatus(accountId) {
    const session = this.sessions.get(accountId);
    if (!session) return { status: 'disconnected', pages: [] };
    if (session.page) {
      try {
        const loggedIn = await this._checkLoggedIn(session.page);
        session.status = loggedIn ? 'active' : 'expired';
      } catch {
        session.status = 'disconnected';
      }
    }
    return { status: session.status, pages: session.pages || [] };
  }

  async getPages(accountId) {
    const session = this.sessions.get(accountId);
    return { pages: session?.pages || [] };
  }

  // ============================================================
  // 发布到个人主页
  // ============================================================

  async publishToProfile(accountId, data) {
    const { text, imagePaths, videoPath } = data;
    const session = this.sessions.get(accountId);
    if (!session?.page) throw new Error('请先登录 Facebook');
    const page = session.page;

    try {
      await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2', timeout: PAGE_LOAD_TIMEOUT });
      await page.waitForTimeout(2000);

      // 点击发帖区域
      const composer = await page.$('[aria-label*="动态"], [aria-label*="发帖"], [role="button"]:has-text("在想什么")');
      if (composer) {
        await composer.click();
        await page.waitForTimeout(2000);
      } else {
        // 尝试其他发帖入口
        const altComposer = await page.$('div[role="button"]:has-text("帖子"), span:has-text("发帖")');
        if (altComposer) {
          await altComposer.click();
          await page.waitForTimeout(2000);
        }
      }

      // 输入文字
      if (text) {
        const textBox = await page.$('[contenteditable="true"][aria-label*="写"], [role="textbox"]');
        if (textBox) {
          await textBox.click();
          await page.waitForTimeout(300);
          await textBox.type(text, { delay: 20 });
        }
      }

      // 上传图片
      if (imagePaths?.length > 0) {
        await this._uploadImages(page, imagePaths);
      }

      // 上传视频
      if (videoPath) {
        await this._uploadVideo(page, videoPath);
      }

      // 点击发布
      await page.waitForTimeout(2000);
      const publishBtn = await page.$('div[aria-label*="发"][role="button"], button:has-text("发布"), button:has-text("发帖"), span:has-text("发布")');
      if (publishBtn) {
        await publishBtn.click();
        await page.waitForTimeout(4000);
        return { success: true, data: { message: '已发布到个人主页' } };
      }

      throw new Error('未找到发布按钮，请检查页面状态');
    } catch (error) {
      throw new Error(`个人主页发布失败: ${error.message}`);
    }
  }

  // ============================================================
  // 发布到公共主页
  // ============================================================

  async publishToPage(accountId, data) {
    const { pageId, pageName, text, imagePaths, videoPath } = data;
    const session = this.sessions.get(accountId);
    if (!session?.page) throw new Error('请先登录 Facebook');
    const page = session.page;

    if (!pageId && !pageName) throw new Error('请指定公共主页');

    try {
      // 导航到公共主页
      let targetUrl;
      if (pageId) {
        targetUrl = pageId.startsWith('http') ? pageId : `https://www.facebook.com${pageId.startsWith('/') ? pageId : '/' + pageId}`;
      } else {
        // 从保存的 pages 列表中找
        const knownPage = session.pages.find(p => p.name === pageName);
        if (knownPage?.id) {
          targetUrl = knownPage.id.startsWith('http') ? knownPage.id : `https://www.facebook.com${knownPage.id.startsWith('/') ? knownPage.id : '/' + knownPage.id}`;
        } else {
          targetUrl = `https://www.facebook.com/${encodeURIComponent(pageName)}`;
        }
      }

      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: PAGE_LOAD_TIMEOUT });
      await page.waitForTimeout(3000);

      // 点击发帖按钮
      const composer = await page.$('[role="button"]:has-text("发帖"), [role="button"]:has-text("写点"), [aria-label*="创建帖子"]');
      if (composer) {
        await composer.click();
        await page.waitForTimeout(2000);
      }

      // 输入文字
      if (text) {
        const textBox = await page.$('[contenteditable="true"][aria-label*="写"], [role="textbox"]');
        if (textBox) {
          await textBox.click();
          await page.waitForTimeout(300);
          await textBox.type(text, { delay: 20 });
        }
      }

      // 上传图片
      if (imagePaths?.length > 0) {
        await this._uploadImages(page, imagePaths);
      }

      // 上传视频
      if (videoPath) {
        await this._uploadVideo(page, videoPath);
      }

      // 点击发布
      await page.waitForTimeout(2000);
      const publishBtn = await page.$('div[aria-label*="发"][role="button"], button:has-text("发布"), button:has-text("发帖"), span:has-text("发布")');
      if (publishBtn) {
        await publishBtn.click();
        await page.waitForTimeout(4000);
        return { success: true, data: { message: `已发布到公共主页「${pageName || pageId}」` } };
      }

      throw new Error('未找到发布按钮');
    } catch (error) {
      throw new Error(`公共主页发布失败: ${error.message}`);
    }
  }

  // ============================================================
  // 文件上传辅助
  // ============================================================

  async _uploadImages(page, imagePaths) {
    if (!imagePaths?.length) return;
    // 点击添加图片按钮
    const addPhotoBtn = await page.$('div[aria-label*="照片"][role="button"], div[aria-label*="图片"][role="button"]');
    if (addPhotoBtn) {
      await addPhotoBtn.click();
      await page.waitForTimeout(1000);
    }
    const fileInput = await page.$('input[accept*="image"][type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(imagePaths);
      await page.waitForTimeout(UPLOAD_TIMEOUT / 3);
    }
  }

  async _uploadVideo(page, videoPath) {
    if (!videoPath || !fs.existsSync(videoPath)) throw new Error(`视频文件不存在: ${videoPath}`);
    const addVideoBtn = await page.$('div[aria-label*="视频"][role="button"]');
    if (addVideoBtn) {
      await addVideoBtn.click();
      await page.waitForTimeout(1000);
    }
    const fileInput = await page.$('input[accept*="video"][type="file"]');
    if (fileInput) {
      await fileInput.setInputFiles(videoPath);
      await page.waitForTimeout(UPLOAD_TIMEOUT);
    }
  }

  // ============================================================
  // Session 持久化
  // ============================================================

  async _saveState(page, stateFile) {
    try {
      const dir = path.dirname(stateFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const state = await page.context().storageState();
      fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
    } catch (e) {
      console.warn('[Facebook] 保存状态失败:', e.message);
    }
  }

  // ============================================================
  // 登出 & 清理
  // ============================================================

  async logout(accountId) {
    const session = this.sessions.get(accountId);
    if (session) {
      try {
        await session.page?.goto('https://www.facebook.com/logout.php', { timeout: 10000 }).catch(() => {});
      } catch {}
      try {
        await session.browser?.close();
      } catch {}
      this.sessions.delete(accountId);

      // 清理 session 文件
      const stateFile = this.getStateFile(accountId);
      try { fs.unlinkSync(stateFile); } catch {}
    }
    return { success: true };
  }
}

export default new FacebookAutomation();
