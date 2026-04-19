import https from 'https';
import fs from 'fs';

const content = fs.readFileSync('frontend-bundle.js', 'utf8');

// Find C7 function (authentication headers)
const c7Idx = content.indexOf('C7=');
if (c7Idx > 0) {
  console.log('=== C7 (认证头) ===');
  console.log(content.substring(c7Idx, c7Idx+400));
}

// Find U7 (API base URL)
const u7Idx = content.indexOf('U7=');
if (u7Idx > 0) {
  console.log('\n=== U7 (API基础URL) ===');
  console.log(content.substring(u7Idx, u7Idx+200));
}

// Find token storage/localStorage
const tokenIdx = content.indexOf('localStorage');
if (tokenIdx > 0) {
  console.log('\n=== localStorage token 相关 ===');
  console.log(content.substring(Math.max(0, tokenIdx-100), tokenIdx+400));
}

// Find token variable names
const tokenNames = content.match(/(?:token|jwt|auth)[A-Za-z0-9]{0,20}=/g);
console.log('\n=== token相关变量 ===');
if (tokenNames) console.log([...new Set(tokenNames)]);
