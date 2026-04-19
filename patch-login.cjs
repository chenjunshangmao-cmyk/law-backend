const fs = require('fs');
const path = 'c:/Users/Administrator/WorkBuddy/Claw/frontend-bundle.js';
let c = fs.readFileSync(path, 'utf8');

// 找到起点和终点
const idx = c.indexOf('claw://login');
if (idx < 0) { console.log('ERROR: claw://login not found'); process.exit(1); }

const funcStart = c.lastIndexOf('ne=async()=>{', idx);
// 找终点：}catch(e){let t=e.message||...A(!1)}} 之后
// 终点特征：},A(!1)}} 后面跟着 ,re=
const endMarker = c.indexOf(',re=async()', funcStart);
if (endMarker < 0) { console.log('ERROR: end marker not found'); process.exit(1); }

console.log('funcStart:', funcStart, '  endMarker:', endMarker);
console.log('Old function length:', endMarker - funcStart);
console.log('Old start snippet:', c.slice(funcStart, funcStart + 80));
console.log('Old end snippet:', c.slice(endMarker - 50, endMarker + 20));

// 新的极简版
const NEW_FUNC = "ne=async()=>{A(!0),U(`🎵 正在启动 TikTok 登录页...`,`info`);try{let e=await fetch(`http://localhost:3002/api/quick-login`,{method:`POST`,headers:{\"Content-Type\":`application/json`},body:JSON.stringify({platform:`tiktok`})});let t=await e.json();t.success?(O(!0),U(`✅ TikTok 登录页已打开！请在弹出的 Chrome 中完成登录。`,`success`)):U(`❌ `+(t.error||`启动失败`),`error`)}catch(e){U(`❌ 本地启动器未运行，请先双击「启动内置浏览器.bat」重试`,`error`)}finally{A(!1)}}";

// 替换
const newContent = c.slice(0, funcStart) + NEW_FUNC + c.slice(endMarker);
fs.writeFileSync(path, newContent);
console.log('✅ 替换成功！新函数长度:', NEW_FUNC.length, '原函数长度:', endMarker - funcStart);
