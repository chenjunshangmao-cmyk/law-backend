/**
 * Claw 浏览器自动化测试脚本 v2.0
 * 测试范围：
 *   1. YouTube 登录 → Session 保存验证
 *   2. TikTok 登录 → Session 保存验证（需代理）
 *   3. YouTube/TikTok Status 检查
 *   4. platformAccounts API 测试（账号+浏览器状态统一视图）
 *   5. 浏览器关闭
 *
 * 运行方式（直接执行，需先安装 playwright）：
 *   npm install playwright
 *   node tests/browser.test.js
 *
 * 带代理运行（TikTok 国内访问）：
 *   PLAYWRIGHT_PROXY_URL=http://127.0.0.1:6789 node tests/browser.test.js
 *
 * 通过 API 测试（后端运行中）：
 *   curl http://localhost:9000/api/platform-accounts/dashboard
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { TikTokShopAutomation, YouTubeAutomation } from '../src/services/browserAutomation.js';

const STATE_DIR = './browser-states';
const TEST_EMAIL_YT = 'test-youtube@browser-automation.com';
const TEST_EMAIL_TT = 'test-tiktok@browser-automation.com';

// ──────────────────────────────────────────────
// 辅助函数
// ──────────────────────────────────────────────

function log(title, msg, ok = true) {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} [${title}] ${msg}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(`断言失败: ${message}`);
}

// ──────────────────────────────────────────────
// Test 1: YouTube Session 保存验证（核心测试）
// ──────────────────────────────────────────────
async function testYouTubeSessionSave() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 1: YouTube Session 保存验证');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const youtube = new YouTubeAutomation();
  const sessionPath = youtube.getSessionPath(TEST_EMAIL_YT);

  // 清理旧 session
  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath);
    log('清理', `旧 Session 已删除: ${sessionPath}`);
  }

  // 检查初始状态：未登录
  const statusBefore = await youtube.checkLogin(TEST_EMAIL_YT);
  assert(!statusBefore.loggedIn, 'Test 1a: 初始状态应为未登录');
  log('检查', `初始状态: 未登录 ✓`);

  // 打开登录页面（用户手动登录）
  console.log('\n⚠️  请在弹出的浏览器中登录 Google 账号，');
  console.log('   登录成功后关闭浏览器窗口...\n');

  const loginPromise = youtube.openLoginPage(TEST_EMAIL_YT);

  // 等待用户登录（最多 5 分钟超时）
  const loginResult = await Promise.race([
    loginPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('登录超时（5分钟）')), 5 * 60 * 1000))
  ]);

  // 验证登录结果
  if (loginResult.success) {
    log('登录', `登录成功 ✓`);

    // 验证 session 文件存在且非空
    assert(fs.existsSync(sessionPath), 'Test 1b: Session 文件应存在');
    const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert(sessionData.cookies && sessionData.cookies.length > 0, 'Test 1c: Session 应包含 cookies');
    log('验证', `Session 包含 ${sessionData.cookies.length} 个 cookies ✓`);
  } else {
    log('登录', `登录未完成: ${loginResult.error}`, false);
  }

  await youtube.close();
  return loginResult;
}

// ──────────────────────────────────────────────
// Test 2: YouTube Status 检查
// ──────────────────────────────────────────────
async function testYouTubeStatus() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 2: YouTube Status 检查');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const youtube = new YouTubeAutomation();
  const status = await youtube.checkLogin(TEST_EMAIL_YT);

  console.log(`  平台: YouTube`);
  console.log(`  已登录: ${status.loggedIn}`);
  console.log(`  登录类型: ${status.loginType}`);
  console.log(`  有 Session: ${status.hasSession}`);
  console.log(`  有 Token: ${status.hasToken}`);
  if (status.error) console.log(`  错误: ${status.error}`);

  log('Status', JSON.stringify(status, null, 2).replace(/\n/g, '\n       '));

  await youtube.close();
  return status;
}

// ──────────────────────────────────────────────
// Test 3: TikTok Session 保存验证（需配置代理）
// ──────────────────────────────────────────────
async function testTikTokSessionSave() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 3: TikTok Session 保存验证');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tiktok = new TikTokShopAutomation();
  const sessionPath = tiktok.getSessionPath(TEST_EMAIL_TT);

  // 清理旧 session
  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath);
    log('清理', `旧 Session 已删除: ${sessionPath}`);
  }

  // 检查初始状态
  const statusBefore = await tiktok.checkLogin(TEST_EMAIL_TT);
  assert(!statusBefore.loggedIn, 'Test 3a: 初始状态应为未登录');
  log('检查', `初始状态: 未登录 ✓`);

  // 打开登录页面
  console.log('\n⚠️  请在弹出的浏览器中登录 TikTok 账号，');
  console.log('   登录成功后关闭浏览器窗口...\n');

  const loginPromise = tiktok.openLoginPage(TEST_EMAIL_TT);

  const loginResult = await Promise.race([
    loginPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('登录超时（5分钟）')), 5 * 60 * 1000))
  ]);

  if (loginResult.success) {
    log('登录', `登录成功 ✓`);

    assert(fs.existsSync(sessionPath), 'Test 3b: Session 文件应存在');
    const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    assert(sessionData.cookies && sessionData.cookies.length > 0, 'Test 3c: Session 应包含 cookies');
    log('验证', `Session 包含 ${sessionData.cookies.length} 个 cookies ✓`);
  } else {
    log('登录', `登录未完成: ${loginResult.error}`, false);
  }

  await tiktok.close();
  return loginResult;
}

// ──────────────────────────────────────────────
// Test 4: TikTok Status 检查
// ──────────────────────────────────────────────
async function testTikTokStatus() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 4: TikTok Status 检查');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tiktok = new TikTokShopAutomation();
  const status = await tiktok.checkLogin(TEST_EMAIL_TT);

  console.log(`  平台: TikTok`);
  console.log(`  已登录: ${status.loggedIn}`);
  console.log(`  登录类型: ${status.loginType}`);
  console.log(`  有 Session: ${status.hasSession}`);
  console.log(`  有 Token: ${status.hasToken}`);
  if (status.error) console.log(`  错误: ${status.error}`);

  log('Status', JSON.stringify(status, null, 2).replace(/\n/g, '\n       '));

  await tiktok.close();
  return status;
}

// ──────────────────────────────────────────────
// Test 5: Logout 登出功能
// ──────────────────────────────────────────────
async function testLogout() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 5: Logout 登出功能');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const youtube = new YouTubeAutomation();
  const sessionPath = youtube.getSessionPath(TEST_EMAIL_YT);

  // 先确保有 session
  if (!fs.existsSync(sessionPath)) {
    console.log('  ⚠️  无 Session 文件，跳过 logout 测试');
    await youtube.close();
    return;
  }

  // 登出
  const result = await youtube.logout(TEST_EMAIL_YT);

  assert(result.success, 'Test 5a: logout 应返回 success');
  assert(!fs.existsSync(sessionPath), 'Test 5b: logout 后 Session 应已删除');
  log('登出', `Session 已清理 ✓`);
  log('登出', JSON.stringify(result));
}

// ──────────────────────────────────────────────
// Test 6: API 接口健康检查（后端运行时）
// ──────────────────────────────────────────────
async function testAPIDashboard() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Test 6: platform-accounts API 健康检查');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const API_BASE = process.env.API_BASE || 'http://localhost:9000/api';

  try {
    // 测试 dashboard 端点（无需认证）
    const dashboardRes = await fetch(`${API_BASE}/platform-accounts/dashboard`, {
      headers: { 'Authorization': `Bearer ${process.env.TEST_TOKEN || 'test'}` }
    });
    const dashboard = await dashboardRes.json();
    log('Dashboard API', `${dashboard.success ? '✓' : '✗'} ${JSON.stringify(dashboard)}`);
  } catch (err) {
    console.log('  ⚠️  API 不可用（后端未启动）:', err.message);
    console.log('  💡 启动后端后测试: node src/index.db.js');
  }
}

// ──────────────────────────────────────────────
// 主测试入口
// ──────────────────────────────────────────────
async function runAllTests() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Claw 浏览器自动化测试 v2.0             ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  代理配置: ${process.env.PLAYWRIGHT_PROXY_URL || '直连（无代理）'}`);
  console.log(`║  状态目录: ${path.resolve(STATE_DIR)}`);
  console.log(`║  测试时间: ${new Date().toLocaleString('zh-CN')}`);
  console.log('╚══════════════════════════════════════════╝');

  const results = [];

  try {
    // Step 1: YouTube 登录测试（核心）
    try {
      const ytLogin = await testYouTubeSessionSave();
      results.push({ name: 'YouTube 登录', ...ytLogin });
    } catch (err) {
      log('错误', `YouTube 登录测试失败: ${err.message}`, false);
      results.push({ name: 'YouTube 登录', success: false, error: err.message });
    }

    // Step 2: YouTube Status
    try {
      const ytStatus = await testYouTubeStatus();
      results.push({ name: 'YouTube Status', success: true, status: ytStatus });
    } catch (err) {
      log('错误', `YouTube Status 失败: ${err.message}`, false);
    }

    // Step 3: TikTok 登录测试（需要真实 TikTok 账号）
    // 如果没有 TikTok 账号可跳过
    const skipTikTok = process.env.SKIP_TIKTOK === '1';
    if (!skipTikTok) {
      try {
        const ttLogin = await testTikTokSessionSave();
        results.push({ name: 'TikTok 登录', ...ttLogin });
      } catch (err) {
        log('错误', `TikTok 登录测试失败: ${err.message}`, false);
        results.push({ name: 'TikTok 登录', success: false, error: err.message });
      }

      // Step 4: TikTok Status
      try {
        const ttStatus = await testTikTokStatus();
        results.push({ name: 'TikTok Status', success: true, status: ttStatus });
      } catch (err) {
        log('错误', `TikTok Status 失败: ${err.message}`, false);
      }
    } else {
      console.log('\n⏭️  TikTok 测试已跳过（SKIP_TIKTOK=1）');
    }

    // Step 5: Logout
    try {
      await testLogout();
    } catch (err) {
      log('错误', `Logout 测试失败: ${err.message}`, false);
    }

    // Step 6: API 检查
    await testAPIDashboard();

  } catch (err) {
    console.error('\n❌ 测试框架错误:', err.message);
  }

  // ──── 测试报告 ────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 测试结果汇总');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    const type = r.status ? `(已登录: ${r.status.loginType})` : '';
    console.log(`  ${icon} ${r.name} ${type}`);
    if (r.error) console.log(`     └─ ${r.error}`);
  });

  console.log(`\n  通过: ${passed} / ${results.length}`);
  console.log(`  失败: ${failed} / ${results.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (failed === 0) {
    console.log('🎉 全部测试通过！');
  } else {
    console.log('⚠️  部分测试失败，请检查错误信息');
  }
}

// 运行测试
runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
