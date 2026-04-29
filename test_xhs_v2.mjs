// 重新生成小红书二维码
async function main() {
  try {
    console.log("生成小红书登录二维码...");
    const resp = await fetch('http://localhost:8089/api/xiaohongshu/login/qrcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'xiaohongshu-main' })
    });
    const data = await resp.json();
    
    if (data.success && data.data && data.data.qrImage) {
      const fs = await import('fs');
      const qrPath = 'C:\\Users\\Administrator\\WorkBuddy\\Claw\\backend\\xhs_qrcode_v2.png';
      const base64 = data.data.qrImage.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(qrPath, Buffer.from(base64, 'base64'));
      console.log(`✅ 新二维码已保存: ${qrPath}`);
      console.log("📱 请用小红书App扫码!");
    } else {
      console.log("二维码生成结果:", JSON.stringify(data, null, 2));
    }
  } catch(e) {
    console.error("错误:", e.message);
  }
}
main();
