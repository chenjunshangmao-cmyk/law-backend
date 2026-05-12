/**
 * Facebook 浏览器自动化发布服务
 * - 发布图片/视频到 个人主页 和 公共主页
 * - 基于 browserAutomation 的浏览器管理
 * - 参考 xiaohongshuAutomation 的登录态保持模式
 */

import * as browserAutomation from './browserAutomation.js';
import fs from 'fs';
import path from 'path';

// 超时配置
const PAGE_LOAD_TIMEOUT = 15000;
const UPLOAD_TIMEOUT = 120000;

class FacebookAutomation {
  constructor() {
    this.sessions = new Map(); // accountId → { page, cookiePath, status, pages: [] }
  }

  /**
   * 获取或创建浏览器页面实例
   */
  async getPage(accountId) {
    let session = this.sessions.get(accountId);
    if (!session) {
      session = {
        page: null,
        status: 'disconnected',
        pages: [], // 管理的公共主页列表
        cookiePath: path.join(browserAutomation.cookieDir || __dirname, `facebook_${accountId}.json`),
      };
      this.sessions.set(accountId, session);
    }
    return session;
  }

  /**
   * 打开 Facebook 并登录
   * @param {string} accountId - 账号标识
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   */
  async login(accountId, email, password) {
    const session = await this.getPage(accountId);
    
    try {
      // 获取或创建浏览器页面
      let { page, browser } = await browserAutomation.getPage(`facebook_${accountId}`, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      session.page = page;

      // 尝试从文件加载 cookies
      const cookiesLoaded = await this._loadCookies(page, session.cookiePath);
      if (cookiesLoaded) {
        await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2', timeout: PAGE_LOAD_TIMEOUT });
        const isLoggedIn = await this._checkLoggedIn(page);
        if (isLoggedIn) {
          session.status = 'active';
          await this._fetchPages(page, accountId);
          return { success: true, data: { message: 'Cookie 登录成功' } };
        }
      }

      // Cookie 无效，走账号密码登录
      await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2', timeout: PAGE_LOAD_TIMEOUT });
      
      await page.waitForSelector('input[name="email"]', { timeout: 10000 }).catch(() => {});
      
      const emailSelector = 'input[name="email"], input[autocomplete="username"], input[id*="email"]';
      const passSelector = 'input[name="pass"], input[type="password"]';
      
      const emailInput = await page.waitForSelector(emailSelector, { timeout: 10000 });
      if (!emailInput) throw new Error('未找到邮箱输入框');
      await emailInput.click();
      await emailInput.fill(email);
      await page.waitForTimeout(500);

      const passInput = await page.waitForSelector(passSelector, { timeout: 5000 });
      if (!passInput) throw new Error('未找到密码输入框');
      await passInput.click();
      await passInput.fill(password);
      await page.waitForTimeout(300);

      const loginButton = await page.$('button[name="login"], button[type="submit"], button:has-text("登录"), button:has-text("Log In")');
      if (loginButton) {
        await loginButton.click();
      }

      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(3000);

      // 二次验证检测
      const hasApprovalCode = await page.$('input[name*="approvals_code"], input[autocomplete="one-time-code"]');
      if (hasApprovalCode) {
        session.status = 'awaiting_2fa';
        return { success: false, error: '需要双重验证码，请输入后继续', require2fa: true };
      }

      const isLoggedIn = await this._checkLoggedIn(page);
      if (!isLoggedIn) {
        throw new Error('登录失败，请检查账号密码');
      }

      await this._saveCookies(page, session.cookiePath);
      session.status = 'active';
      await this._fetchPages(page, accountId);

      return { success: true, data: { message: 'Facebook 登录成功' } };

    } catch (error) {
      session.status = 'error';
      throw error;
    }
  }

  /**
   * 输入双重验证码继续登录
   */
  async submit2fa(accountId, code) {
    const session = this.sessions.get(accountId);
    if (!session || !session.page) throw new Error('请先启动登录');
    const page = session.page;

    try {
      const codeInput = await page.$('input[name*="approvals_code"], input[autocomplete="one-time-code"]');
      if (codeInput) {
        await codeInput.fill(code);
        await page.waitForTimeout(500);

        const confirmBtn = await page.$('button:has-text("继续"), button:has-text("Continue"), button[type="submit"]');
        if (confirmBtn) await confirmBtn.click();

        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(2000);
      }

      const isLoggedIn = await this._checkLoggedIn(page);
      if (!isLoggedIn) throw new Error('验证码无效或登录失败');

      await this._saveCookies(page, session.cookiePath);
      session.status = 'active';
      await this._fetchPages(page, accountId);

      return { success: true, data: { message: '双重验证通过' } };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 检查是否已登录
   */
  async _checkLoggedIn(page) {
    try {
      const url = page.url();
      if (url.includes('facebook.com/')) {
        const feedPresent = await page.$('[role="feed"], [aria-label*="动态"], [aria-label*="Stories"], [data-pagelet*="feed"]');
        const profileIcon = await page.$('a[aria-label*="profile"], a[aria-label*="个人主页"], svg[aria-label="你的主页"]');
        if (feedPresent || profileIcon) return true;
      }
      if (url.includes('login') || url.includes('checkpoint')) return false;
      const logoutBtn = await page.$('a[href*="logout.php"], a[href*="login/help"]');
      if (logoutBtn) return false;
      if (url.includes('facebook.com')) return true;
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 获取管理的公共主页列表
   */
  async _fetchPages(page, accountId) {
    const session = this.sessions.get(accountId);
    if (!session) return;
    
    try {
      await page.goto('https://www.facebook.com/pages/?category=your_pages&ref=bookmarks', {
        waitUntil: 'networkidle2',
        timeout: PAGE_LOAD_TIMEOUT,
      }).catch(() => {});
      await page.waitForTimeout(3000);

      const pages = await page.evaluate(() => {
        const items = [];
        const pageLinks = document.querySelectorAll('a[href*="/profile.php"], a[href*="/pages/"]');
        pageLinks.forEach(el => {
          const href = el.getAttribute('href') || '';
          if (href.includes('/profile.php') || href.includes('__tn__')) {
            const name = el.textContent?.trim() || '';
            if (name && name.length > 1) {
              items.push({ id: href.split('?')[0], name });
            }
          }
        });
        return items;
      });

      if (pages.length > 0) {
        session.pages = pages;
      }
    } catch (e) {
      console.warn('[Facebook] 获取公共主页列表失败:', e.message);
    }
  }

  /**
   * 获取账号状态
   */
  async getStatus(accountId) {
    const session = this.sessions.get(accountId);
    if (!session) {
      return { status: 'disconnected', pages: [] };
    }
    
    if (session.page) {
      try {
        const isLoggedIn = await this._checkLoggedIn(session.page);
        session.status = isLoggedIn ? 'active' : 'expired';
      } catch {
        session.status = 'disconnected';
      }
    }

    return {
      status: session.status,
      pages: session.pages || [],
    };
  }

  /**
   * 获取公共主页列表
   */
  async getPages(accountId) {
    const session = this.sessions.get(accountId);
    if (!session) return { pages: [] };
    return { pages: session.pages || [] };
  }

  // ============================================================
  // 发布功能
  // ============================================================

  /**
   * 发布图片/视频到个人主页
   */
  async publishToProfile(accountId, data) {
    const { text, imagePaths, videoPath } = data;
    const session = this.sessions.get(accountId);
    if (!session || !session.page) throw new Error('请先登录 Facebook');
    const page = session.page;

    try {
      await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2', timeout: PAGE_LOAD_TIMEOUT });
      await page.waitForTimeout(2000);

      // 点击"发帖"区域
      const composer = await page.$('[aria-label*="动态" i], [aria-label*="发帖" i], [role="button"]:has-text("在想什么"), [data-pagelet*="composer"]');
      
      if (!composer) {
        const createPostBtn = await page.$('a[href*="/composer"], div[role="button"]:has-text("帖子"), span:has-text("发帖")');
        if (createPostBtn) {
          await createPostBtn.click();
          await page.waitForTimeout(2000);
        }
      } else {
        await composer.click();
        await page.waitForTimeout(2000);
      }

      // 输入文字内容
      if (text) {
        const textSelector = '[role="textbox"][aria-label*="写点什么"], [role="textbox"][aria-label*="发帖"], [contenteditable="true"][aria-label*="写"]';
        const textBox = await page.$(textSelector);
        if (textBox) {
          await textBox.click();
          await page.waitForTimeout(300);
          await textBox.type(text, { delay: 20 });
        } else {
          const editableDiv = await page.$('div[contenteditable="true"]');
          if (editableDiv) {
            await editableDiv.click();
            await page.waitForTimeout(300);
            await editableDiv.type(text, { delay: 20 });
          }
        }
      }

      // 上传图片
      if (imagePaths && imagePaths.length > 0) {
        await this._uploadImages(page, imagePaths);
      }

      // 上传视频
      if (videoPath) {
        await this._uploadVideo(page, videoPath);
      }

      // 点击发布
      await page.waitForTimeout(1000);
      const publishBtn = await page.$('div[aria-label*="发" i][role="button"], button:has-text("发布"), button:has-text("发帖"), button:has-text("分享"), span:has-text("发布")');
      if (publishBtn) {
        await publishBtn.click();
        await page.waitForTimeout(3000);
        return { success: true, data: { message: '已发布到个人主页' } };
      }

      await page.waitForTimeout(5000);
      const retryBtn = await page.$('div[aria-label*="发" i][role="button"], button:has-text("发布"), button:has-text("发帖")');
      if (retryBtn) {
        await retryBtn.click();
        await page.waitForTimeout(3000);
        return { success: true, data: { message: '已发布到个人主页' } };
      }

      throw new Error('未找到发布按钮');

    } catch (error) {
      throw new Error(`个人主页发布失败: ${error.message}`);
    }
  }

  /**
   * 发布图片/视频到公共主页
   */
  async publishToPage(accountId, data) {
    const { pageId, pageName, text, imagePaths, videoPath } = data;
    const session = this.sessions.get(accountId);
    if (!session || !session.page) throw new Error('请先登录 Facebook');
    const page = session.page;

    if (!pageId && !pageName) throw new Error('请指定公共主页');

    try {
      let targetUrl;
      if (pageId) {
        targetUrl = pageId.startsWith('http') ? pageId : `https://www.facebook.com${pageId.startsWith('/') ? pageId : '/' + pageId}`;
      } else {
        targetUrl = `https://www.facebook.com/${encodeURIComponent(pageName)}`;
      }

      await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: PAGE_LOAD_TIMEOUT });
      await page.waitForTimeout(3000);

      // 切换到用主页身份发帖
      const switchIdentityBtn = await page.$('[aria-label*="切换" i], span:has-text("以"), div:has-text("以")');
      if (switchIdentityBtn) {
        await switchIdentityBtn.click();
        await page.waitForTimeout(1000);
        const pageOption = await page.$(`span:has-text("${pageName}"), div:has-text("${pageName}")`);
        if (pageOption) {
          await pageOption.click();
          await page.waitForTimeout(1000);
        }
      }

      const composer = await page.$('[role="button"]:has-text("发帖"), [role="button"]:has-text("写点"), [data-pagelet*="composer"]');
      if (composer) {
        await composer.click();
        await page.waitForTimeout(2000);
      }

      if (text) {
        const textBox = await page.$('[contenteditable="true"][aria-label*="写"], [role="textbox"]');
        if (textBox) {
          await textBox.click();
          await page.waitForTimeout(300);
          await textBox.type(text, { delay: 20 });
        }
      }

      if (imagePaths && imagePaths.length > 0) {
        await this._uploadImages(page, imagePaths);
      }

      if (videoPath) {
        await this._uploadVideo(page, videoPath);
      }

      await page.waitForTimeout(2000);
      const publishBtn = await page.$('div[aria-label*="发" i][role="button"], button:has-text("发布"), button:has-text("发帖")');
      if (publishBtn) {
        await publishBtn.click();
        await page.waitForTimeout(3000);
        return { success: true, data: { message: `已发布到公共主页「${pageName}」` } };
      }

      throw new Error('未找到发布按钮');

    } catch (error) {
      throw new Error(`公共主页发布失败: ${error.message}`);
    }
  }

  async _uploadImages(page, imagePaths) {
    if (!imagePaths || imagePaths.length === 0) return;
    const addMediaBtn = await page.$('div[aria-label*="照片" i][role="button"], div[aria-label*="图片" i][role="button"], input[accept*="image"]');
    if (addMediaBtn) {
      await addMediaBtn.click();
      await page.waitForTimeout(1000);
    }
    const fileInput = await page.$('input[accept*="image"][type="file"], input[accept*="image"][multiple]');
    if (fileInput) {
      await fileInput.uploadFile(...imagePaths);
      await page.waitForTimeout(UPLOAD_TIMEOUT / 4);
    }
  }

  async _uploadVideo(page, videoPath) {
    if (!videoPath) return;
    if (!fs.existsSync(videoPath)) throw new Error(`视频文件不存在: ${videoPath}`);
    const addVideoBtn = await page.$('div[aria-label*="视频" i][role="button"], input[accept*="video"]');
    if (addVideoBtn) {
      await addVideoBtn.click();
      await page.waitForTimeout(1000);
    }
    const fileInput = await page.$('input[accept*="video"][type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(videoPath);
      await page.waitForTimeout(UPLOAD_TIMEOUT);
    }
  }

  // ============================================================
  // Cookie 管理
  // ============================================================

  async _saveCookies(page, cookiePath) {
    try {
      const cookies = await page.cookies();
      const dir = path.dirname(cookiePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));
    } catch (e) {
      console.warn('[Facebook] 保存 Cookie 失败:', e.message);
    }
  }

  async _loadCookies(page, cookiePath) {
    try {
      if (!fs.existsSync(cookiePath)) return false;
      const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
      if (!Array.isArray(cookies) || cookies.length === 0) return false;
      await page.setCookie(...cookies);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 退出登录
   */
  async logout(accountId) {
    const session = this.sessions.get(accountId);
    if (session?.page) {
      try {
        await session.page.goto('https://www.facebook.com/logout.php', { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      } catch {}
      try {
        await browserAutomation.closePage(`facebook_${accountId}`);
      } catch {}
    }
    this.sessions.delete(accountId);
    return { success: true };
  }
}

export default new FacebookAutomation();
