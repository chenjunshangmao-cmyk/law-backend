#!/usr/bin/env node
/**
 * Claw 平台真实账号验证脚本 v2
 * 直接运行 Playwright 浏览器自动化，无需启动 Express 服务器
 *
 * 用法:
 *   node scripts/verify-platforms.js tiktok   # 验证 TikTok 登录
 *   node scripts/verify-platforms.js youtube  # 验证 YouTube 登录
 *   node scripts/verify-platforms.js ozon     # 验证 OZON 登录
 *   node scripts/verify-platforms.js all     # 全部验证
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SESSIONS_DIR = path.join(PROJECT_ROOT, 'browser-states');

// ============================================================
// 配置区 - 填写你的真实账号信息
// ============================================================
const ACCOUNT_CONFIG = {
  tiktok: {
    email: 'runzefeicui@163.com',
    // 代理格式: http://ip:port，留空则直连
    // 国内访问 TikTok 需要代理，如: http://127.0.0.1:7890
    proxy: process.env.PLAYWRIGHT_PROXY_URL || null,
    loginUrl: 'https://seller.tiktok.com',
    dashboardCheck: url => url.includes('dashboard') || url.includes('home'),
    name: 'TikTok Seller Center',
  },
  youtube: {
    email: '', // TODO: 填入 YouTube 账号邮箱
    proxy: null,
    loginUrl: 'https://studio.youtube.com/upload',
    dashboardCheck: url => url.includes('studio.youtube.com') && !url.includes('accounts.google.com'),
    name: 'YouTube Studio',
  },
  ozon: {
    email: '', // TODO: 填入 OZON 账号邮箱
    proxy: null,
    loginUrl: 'https://seller.ozon.ru',
    dashboardCheck: url => url.includes('seller.ozon.ru/app'),
    name: 'OZON Seller',
  },
};

// ============================================================
// 工具函数
// ============================================================

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getSessionPath(platform, email) {
  const encoded = Buffer.from(email).toString('base64url');
  return path.join(SESSIONS_DIR, `${platform}-${encoded}.json`);
}

function getProxyOptions(proxy) {
  if (!proxy) return {};
  return {
    proxy: { server: proxy },
  };
}

async function injectStealth(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', {
      get: () => [
        { name: 'Chrome PDF Plugin' },
        { name: 'Chrome PDF Viewer' },
        { name: 'Native Client' },
      ],
    });
    Object.defineProperty(navigator, 'languages', { get: () => ['zh-CN', 'zh', 'en-US', 'en'] });
    if (!window.navigator.chrome) window.navigator.chrome = { app: {}, runtime: {} };
  });
}

function printBanner(platform, email, loginUrl) {
  console.log('\n' + '='.repeat(60));
  console.log(`📱 ${ACCOUNT_CONFIG[platform].name} 真实账号验证`);
  console.log('='.repeat(60));
  console.log(`👤 账号: ${email}`);
  console.log(`🌐 登录: ${loginUrl}`);
  console.log(`⏰ 超时: 180秒（请在此时间内完成登录）`);
  console.log('');
}

// ============================================================
// 通用平台验证函数
// ============================================================

async function verifyPlatform(platform) {
  const cfg = ACCOUNT_CONFIG[platform];

  if (!cfg.email) {
    console.log(`⚠️  ${platform.toUpperCase()}: 请在 scripts/verify-platforms.js 中配置 email`);
    return { platform, success: false, error: '未配置账号' };
  }

  printBanner(platform, cfg.email, cfg.loginUrl);

  const sessionPath = getSessionPath(platform, cfg.email);
  ensureDir(SESSIONS_DIR);

  let browser;
  try {
    // 启动浏览器
    const launchOptions = {
      headless: false,
      ...getProxyOptions(cfg.proxy),
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
      ],
    };

    if (cfg.proxy) {
      console.log(`🌐 使用代理: ${cfg.proxy}`);
    } else {
      console.log('📡 直连模式');
    }

    browser = await chromium.launch(launchOptions);

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: platform === 'ozon' ? 'ru-RU' : 'zh-CN',
    });

    const page = await context.newPage();
    await injectStealth(page);

    // 打开登录页面
    console.log('🌐 正在打开登录页面...');
    await page.goto(cfg.loginUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    console.log('✅ 浏览器已启动！请在窗口中完成以下操作：');
    console.log('   1. 输入账号密码登录（如果需要）');
    console.log('   2. 完成验证码/短信验证（如果需要）');
    console.log('   3. 登录成功后，保持浏览器窗口打开');
    console.log('   4. 脚本会自动检测登录成功并保存 Session');
    console.log('');

    // 等待登录成功（URL 变为仪表盘）或用户关闭窗口
    let resolved = false;

    // 方式1: 等待 URL 变化
    try {
      await page.waitForFunction(
        (check) => check(window.location.href),
        cfg.dashboardCheck,
        { timeout: 180000 }
      );
      console.log('🎉 检测到登录成功（URL 变化）！');
      resolved = true;
    } catch {
      // 超时，继续检查
    }

    // 方式2: 如果仍在登录，检查 cookies 是否已设置
    if (!resolved) {
      const currentUrl = page.url();
      const cookies = await context.cookies();
      const tiktokCookies = cookies.filter(c => c.name.includes('seller_') || c.name.includes('session'));
      const youtubeCookies = cookies.filter(c => c.name.includes('SID') || c.name.includes('HSID'));
      const ozonCookies = cookies.filter(c => c.name.includes('ozon_') || c.name.includes('session'));

      const hasValidCookies =
        (platform === 'tiktok' && tiktokCookies.length > 0) ||
        (platform === 'youtube' && youtubeCookies.length > 0) ||
        (platform === 'ozon' && ozonCookies.length > 0) ||
        (cookies.length > 3);

      if (hasValidCookies || cfg.dashboardCheck(currentUrl)) {
        console.log('🎉 检测到登录成功（Cookies 检测）！');
        resolved = true;
      }
    }

    // 保存 Session
    if (resolved) {
      console.log('💾 正在保存 Session...');
      await context.storageState({ path: sessionPath });

      const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
      const cookieCount = sessionData.cookies?.length || 0;
      const lsCount = sessionData.origins?.reduce((acc, o) => acc + (o.localStorage?.length || 0), 0) || 0;

      console.log(`✅ Session 保存成功！`);
      console.log(`📁 路径: ${sessionPath}`);
      console.log(`🍪 Cookies: ${cookieCount} 个`);
      console.log(`💾 LocalStorage: ${lsCount} 条`);
    } else {
      console.log('⚠️  未检测到明确登录成功，尝试保存当前状态...');
      try {
        await context.storageState({ path: sessionPath });
      } catch (e) {
        console.log(`⚠️  保存失败: ${e.message}`);
      }
    }

    await browser.close();

    if (resolved) {
      return {
        platform,
        success: true,
        email: cfg.email,
        sessionPath,
        cookieCount: 0,
        message: '登录成功，Session 已保存',
      };
    } else {
      return {
        platform,
        success: false,
        error: '超时或未检测到登录成功（Session 可能已部分保存）',
        sessionPath: fs.existsSync(sessionPath) ? sessionPath : null,
      };
    }

  } catch (error) {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
    return { platform, success: false, error: error.message };
  }
}

// ============================================================
// 主入口
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'all';

  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     Claw 平台真实账号验证工具 v2.0                ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`⏰ 时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log(`🎯 目标: ${target.toUpperCase()}`);

  const platforms = target === 'all'
    ? ['tiktok', 'youtube', 'ozon']
    : [target];

  ensureDir(SESSIONS_DIR);

  const results = [];
  for (const p of platforms) {
    const r = await verifyPlatform(p);
    results.push(r);
  }

  // 汇总报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 验证结果汇总');
  console.log('='.repeat(60));

  for (const r of results) {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.platform.toUpperCase()}: ${r.success ? '成功' : '失败 - ' + r.error}`);
    if (r.success) {
      console.log(`   账号: ${r.email}`);
      console.log(`   Session: ${r.sessionPath}`);
    }
  }

  const ok = results.filter(r => r.success).length;
  console.log(`\n🎯 完成: ${ok}/${results.length} 个平台验证成功`);
  process.exit(ok === results.length ? 0 : 1);
}

main().catch(err => {
  console.error('❌ 脚本异常:', err.message);
  process.exit(1);
});
