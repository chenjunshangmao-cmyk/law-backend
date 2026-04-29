// 测试 YouTube 登录 - 加大超时
// 直接调 API，不要用 AbortController，让后端慢慢启动
async function main() {
  try {
    console.log("正在调 YouTube 登录（等待浏览器启动，最多60秒）...");
    
    const resp = await fetch('http://localhost:8089/api/browser/youtube/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'chenjunshangmao@gmail.com',
        accountId: 'youtube-chenjun'
      })
    });
    
    const data = await resp.json();
    console.log("YouTube登录响应:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error("错误:", e.message);
  }
}
main();
