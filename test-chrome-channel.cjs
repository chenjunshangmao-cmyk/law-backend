const { chromium } = require('playwright');

(async () => {
  console.log('测试 channel=chrome...');
  try {
    const browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
      args: ['--no-sandbox']
    });
    console.log('✅ Chrome 启动成功！');
    const page = await browser.newPage();
    await page.goto('https://www.tiktok.com', { timeout: 15000 });
    console.log('✅ TikTok 页面加载成功！');
    const title = await page.title();
    console.log('页面标题:', title);
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.log('❌ 失败:', e.message.slice(0, 300));
    process.exit(1);
  }
})();
