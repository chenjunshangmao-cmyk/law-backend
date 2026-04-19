import { readFileSync } from 'fs';
const path = process.argv[2] || 'browser-states/tiktok-cnVuemVmZWljdWlAMTYzLmNvbQ.json';
const d = JSON.parse(readFileSync(path, 'utf8'));
const cookies = d.cookies || [];
const domains = [...new Set(cookies.map(c => c.domain))];
console.log('总 Cookies:', cookies.length);
console.log('Domains:', domains.slice(0,5));
// 显示非语言类 cookies
const authCookies = cookies.filter(c => !c.name.includes('lang') && !c.name.includes('i18n'));
console.log('认证类 Cookies:', authCookies.length);
authCookies.slice(0, 10).forEach(c => {
  const val = c.value.length > 40 ? c.value.substring(0, 40) + '...' : c.value;
  console.log(' -', c.name, ':', val);
});
// 计算 cookie 有效期
const now = Date.now() / 1000;
const validCookies = cookies.filter(c => c.expires > now);
console.log('未过期 Cookies:', validCookies.length);
