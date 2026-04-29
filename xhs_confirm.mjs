// 扫码后立即确认登录
async function main() {
  try {
    console.log("正在确认小红书登录...");
    const resp = await fetch('http://localhost:8089/api/xiaohongshu/login/wait', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'xiaohongshu-main', timeout: 60000 })
    });
    const data = await resp.json();
    console.log("登录结果:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error("错误:", e.message);
  }
}
main();
