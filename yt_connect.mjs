// 通过已启动的 playwright chromium 连接并打开 YouTube
import { chromium } from 'playwright';

async function main() {
  try {
    console.log("正在连接到已运行的 Chromium...");
    const browser = await chromium.connectOverCDP('ws://127.0.0.1:9222/devtools/browser/cb1a510e-f572-4717-9827-63dcbc38000a');
    console.log("连接成功!");
    
    // 创建一个新上下文（不用已有的 cookie）
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    
    // 打开 YouTube Studio
    console.log("正在打开 YouTube Studio...");
    await page.goto('https://studio.youtube.com/', { waitUntil: 'networkidle', timeout: 60000 });
    
    // 检查是否已登录
    const url = page.url();
    console.log("当前URL:", url);
    
    if (url.includes('accounts.google.com') || url.includes('SignIn')) {
      console.log("需要登录，请手动登录...");
      // 截图当前页面
      await page.screenshot({ path: 'yt_login_page.png', fullPage: true });
      console.log("登录页面已截图: yt_login_page.png");
    } else {
      console.log("已经登录 YouTube Studio!");
    }
    
    // 等待一会儿看看
    await new Promise(r => setTimeout(r, 5000));
    
    // 再截图
    await page.screenshot({ path: 'yt_after.png', fullPage: true });
    console.log("截图保存: yt_after.png");
    
    // 保存 session
    await context.storageState({ path: 'browser-states/youtube-chenjunshangmao@gmail.com-youtube-chenjun.json' });
    console.log("Session 已保存!");
    
    await browser.close();
    console.log("完成!");
  } catch(e) {
    console.error("错误:", e.message);
  }
}

main();
