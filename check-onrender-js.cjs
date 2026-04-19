const fs = require('fs');
const js = fs.readFileSync('claw-deploy/assets/main.0126e647.js', 'utf8');
console.log('JS size:', js.length);

// 找相对路径 /api/ 调用
const relMatches = js.match(/\/api\/[a-zA-Z0-9_\-\/]+/g) || [];
console.log('Relative /api/ paths (first 10):', [...new Set(relMatches)].slice(0, 10));

// 找 fetch 调用
const fetchMatches = js.match(/fetch\(['"`][^'"`]+['"`]/g) || [];
console.log('fetch calls (first 10):', fetchMatches.slice(0, 10));

// 找 backend URL 字符串
const urlMatches = js.match(/https?:\/\/[a-z0-9.\-]+[^\s'"`;)]*/gi) || [];
const uniqueUrls = [...new Set(urlMatches)].filter(u => u.length < 200);
console.log('All embedded URLs:', uniqueUrls.slice(0, 10));
