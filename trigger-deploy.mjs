import https from 'https';
import { readFileSync } from 'fs';

// 尝试从 deploy-backend.ps1 读取 Render API Key
let apiKey = '';
let serviceId = '';
try {
  const content = readFileSync('c:/Users/Administrator/WorkBuddy/Claw/deploy-backend.ps1', 'utf8');
  const keyMatch = content.match(/RENDER_API_KEY[=:]\s*['"]([^'"]+)['"]/i);
  const svcMatch = content.match(/RENDER_SERVICE_ID[=:]\s*['"]([^'"]+)['"]/i);
  if (keyMatch) apiKey = keyMatch[1];
  if (svcMatch) serviceId = svcMatch[1];
} catch (e) {}

console.log('API Key:', apiKey ? '找到' : '未找到');
console.log('Service ID:', serviceId || '未找到');

if (!apiKey || !serviceId) {
  console.log('需要 Render API Key 才能触发部署');
  console.log('请从 https://dashboard.render.com 点击服务 → Settings → API Key');
  process.exit(1);
}

// 通过 Render API 触发部署
const body = JSON.stringify({ clearCache: true });

const req = https.request({
  hostname: 'api.render.com',
  port: 443,
  path: `/v1/services/${serviceId}/deploys`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    console.log('部署触发状态:', res.statusCode);
    console.log('响应:', d.slice(0, 500));
  });
});

req.on('error', e => console.log('错误:', e.message));
req.write(body);
req.end();
