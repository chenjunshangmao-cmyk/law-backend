// 小红书扫码登录 + 发布图文
async function main() {
  try {
    // 1. 获取登录二维码
    const loginResp = await fetch('http://localhost:8089/api/xiaohongshu/login/qrcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'xiaohongshu-main' })
    });
    const loginData = await loginResp.json();
    console.log("小红书登录二维码:", JSON.stringify(loginData, null, 2).substring(0, 500));
    
    if (loginData.success && loginData.data.qrImage) {
      // 保存二维码图片
      const fs = await import('fs');
      const path = await import('path');
      const qrPath = path.join(process.cwd(), 'xhs_qrcode.png');
      const base64 = loginData.data.qrImage.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(qrPath, Buffer.from(base64, 'base64'));
      console.log(`\n📱 二维码已保存到: ${qrPath}`);
      console.log("请用小红书App扫码登录!");
    }
  } catch(e) {
    console.error("Error:", e.message);
  }
}
main();
