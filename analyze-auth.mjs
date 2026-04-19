import fs from 'fs';

const content = fs.readFileSync('frontend-bundle.js', 'utf8');

// Find S7 (token getter)
const s7Idx = content.indexOf('S7=');
if (s7Idx > 0) {
  console.log('=== S7 (token获取) ===');
  console.log(content.substring(s7Idx, s7Idx+500));
}

// Find b7 (user getter)
const b7Idx = content.indexOf('b7=');
if (b7Idx > 0) {
  console.log('\n=== b7 (用户信息) ===');
  console.log(content.substring(b7Idx, b7Idx+500));
}

// Find H7 (API base URL definition)
const h7Idx = content.indexOf('H7=');
if (h7Idx > 0) {
  console.log('\n=== H7 (API基础URL) ===');
  console.log(content.substring(h7Idx, h7Idx+500));
}

// Find login function to see where token comes from
const loginIdx = content.indexOf('claw_current_user');
if (loginIdx > 0) {
  console.log('\n=== claw_current_user 相关 ===');
  console.log(content.substring(Math.max(0, loginIdx-200), loginIdx+400));
}

// Find api.membership or createOrder function
const createOrderIdx = content.indexOf('createOrder');
if (createOrderIdx > 0) {
  console.log('\n=== createOrder 完整函数 ===');
  console.log(content.substring(createOrderIdx, createOrderIdx+800));
}
