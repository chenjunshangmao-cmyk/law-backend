// 测试小红书扫码登录
async function testXHSLogin() {
  try {
    const resp = await fetch('http://localhost:8089/api/xiaohongshu/login/qrcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: 'xiaohongshu-main' })
    });
    const data = await resp.json();
    console.log("小红书响应:", JSON.stringify(data, null, 2).substring(0, 300));
    
    if (data.success && data.data && data.data.qrImage) {
      const fs = await import('fs');
      const path = await import('path');
      const qrPath = 'C:\\Users\\Administrator\\WorkBuddy\\Claw\\backend\\xhs_qrcode.png';
      const base64 = data.data.qrImage.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(qrPath, Buffer.from(base64, 'base64'));
      console.log(`\n✅ 二维码已保存: ${qrPath}`);
    }
  } catch(e) {
    console.error("错误:", e.message);
  }
}
testXHSLogin();
