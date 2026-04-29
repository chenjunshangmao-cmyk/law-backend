// 测试 basic 连接
import { chromium } from 'playwright';

async function main() {
  try {
    console.log("正在连接...");
    const browser = await chromium.connectOverCDP('ws://127.0.0.1:9222/devtools/browser/cb1a510e-f572-4717-9827-63dcbc38000a');
    console.log("连接成功!");
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // 先测百度
    console.log("正在打开百度...");
    try {
      await page.goto('https://www.baidu.com', { timeout: 15000 });
      console.log("百度打开成功:", page.url());
      const title = await page.title();
      console.log("标题:", title);
    } catch(e) {
      console.log("百度失败:", e.message);
    }
    
    // 测 google.com
    console.log("\n正在打开 google.com...");
    try {
      await page.goto('https://www.google.com', { timeout: 15000 });
      console.log("Google打开成功:", page.url());
    } catch(e) {
      console.log("Google失败:", e.message);
    }
    
    await browser.close();
    console.log("完成");
  } catch(e) {
    console.error("连接错误:", e.message);
  }
}

main();
