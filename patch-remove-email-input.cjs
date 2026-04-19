const fs = require('fs');
const path = 'c:/Users/Administrator/WorkBuddy/Claw/frontend-bundle.js';
let c = fs.readFileSync(path, 'utf8');

// 当前状态: (0,$.jsx) 已被删掉，剩下 (`input`,{...}),
// 找到残留的 input 元素
const TARGET = '(`input`,{type:`email`,placeholder:`TikTok\u5356\u5bb6\u90ae\u7bb1`,value:T,onChange:e=>{E(e.target.value),M(``)},disabled:k}),';
const idx = c.indexOf(TARGET);
if (idx >= 0) {
  console.log('\u627e\u5230\u6b8b\u7559\u7684input\u5143\u7d20\uff0c\u4f4d\u7f6e:', idx);
  const newContent = c.slice(0, idx) + c.slice(idx + TARGET.length);
  fs.writeFileSync(path, newContent);
  console.log('\u2705 \u5df2\u5220\u9664\u6b8b\u7559\u7684input\u5143\u7d20\uff01');
} else {
  console.log('\u7b49\u4e00\u4e0b\uff0c\u67e5\u770b\u5f53\u524d\u5b9e\u9645\u5185\u5bb9...');
  const emailIdx = c.indexOf('TikTok\u5356\u5bb6\u90ae\u7bb1');
  if (emailIdx > 0) {
    console.log('\u524d\u540e\u5185\u5bb9:', c.substring(emailIdx - 100, emailIdx + 150));
    // 找到包含input的完整片段手动删除
    // 往前找到 ( 开始
    let start = emailIdx;
    while (start > 0 && c[start] !== '(') start--;
    // 往后找到 ), 结束
    let end = emailIdx;
    let depth = 0;
    while (end < c.length) {
      if (c[end] === '(') depth++;
      else if (c[end] === ')') {
        depth--;
        if (depth < 0) {
          end++;
          if (c[end] === ',') end++;
          break;
        }
      }
      end++;
    }
    console.log('start:', start, 'end:', end);
    console.log('\u8981\u5220\u9664:', c.substring(start, end));
    const newContent = c.slice(0, start) + c.slice(end);
    fs.writeFileSync(path, newContent);
    console.log('\u2705 \u5220\u9664\u6210\u529f\uff01');
  }
}
