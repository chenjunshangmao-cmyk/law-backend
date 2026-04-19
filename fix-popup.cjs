const fs = require('fs');
const path = 'c:/Users/Administrator/WorkBuddy/Claw/frontend-bundle.js';
let content = fs.readFileSync(path, 'utf8');

// 替换 file:// URL 为 localhost HTTP URL
const oldPath = 'C:\\\\Users\\\\Administrator\\\\WorkBuddy\\\\Claw\\\\embedded-browser\\\\index.html';
const newPath = 'http://localhost:3002/browser';

if (content.includes(oldPath)) {
  content = content.split(oldPath).join(newPath);
  fs.writeFileSync(path, content, 'utf8');
  console.log('✅ 已替换 file:// 路径为 http://localhost:3002/browser');
  console.log('   旧路径:', oldPath);
  console.log('   新路径:', newPath);
} else if (content.includes('localhost:3002')) {
  console.log('✅ 已经是最新的 HTTP URL，无需修改');
} else {
  console.log('⚠️ 未找到目标路径，内容可能是:', content.slice(content.indexOf('embedded-browser')-50, content.indexOf('embedded-browser')+100));
}
