// 先杀掉已有的 Playwright chromium 进程
import { execSync } from 'child_process';
try {
  execSync('taskkill /F /IM chrome.exe /FI "WINDOWTITLE eq *ms-playwright*"', { stdio: 'pipe' });
} catch(e) {}
console.log("已清理旧进程");

// 重新生成小红书二维码
const resp = await fetch('http://localhost:8089/api/xiaohongshu/login/qrcode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ accountId: 'xiaohongshu-main' })
});
const data = await resp.json();
console.log("二维码生成:", data.success);

if (data.success && data.data && data.data.qrImage) {
  const fs = await import('fs');
  const qrPath = 'C:\\Users\\Administrator\\WorkBuddy\\Claw\\backend\\xhs_qrcode_v3.png';
  const base64 = data.data.qrImage.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(qrPath, Buffer.from(base64, 'base64'));
  console.log(`✅ 二维码已保存: ${qrPath}`);
}
