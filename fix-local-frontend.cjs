const fs = require('fs');
const http = require('http');
const path = require('path');

// 创建一个简单的本地服务器，代理 /api 请求到真实后端，并服务修复后的前端
const FRONTEND_PORT = 8080;
const BACKEND_URL = 'claw-backend-2026.onrender.com';

// 读取修复后的 bundle
const bundlePath = 'c:/Users/Administrator/WorkBuddy/Claw/frontend-bundle.js';
const bundleContent = fs.readFileSync(bundlePath, 'utf8');
console.log('Bundle size:', bundleContent.length, 'bytes');

// 创建代理服务器
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // 静态资源
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Claw</title></head>
<body><div id="root"></div>
<script src="/frontend-bundle.js"></script></body></html>`);
    return;
  }

  if (url === '/frontend-bundle.js') {
    res.writeHead(200, {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache'
    });
    res.end(bundleContent);
    return;
  }

  if (url === '/logo.svg') {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    res.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🦶</text></svg>');
    return;
  }

  // API 代理到后端
  const options = {
    hostname: BACKEND_URL,
    port: 443,
    path: url,
    method: req.method,
    headers: {
      ...req.headers,
      host: BACKEND_URL,
      origin: `http://localhost:${FRONTEND_PORT}`,
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, {
      ...proxyRes.headers,
      'Access-Control-Allow-Origin': '*'
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    res.writeHead(502);
    res.end('Backend error: ' + e.message);
  });

  req.pipe(proxyReq);
});

server.listen(FRONTEND_PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   Claw 本地前端服务器（修复版）               ║');
  console.log('╠═══════════════════════════════════════════════╣');
  console.log(`║  🌐 地址: http://localhost:${FRONTEND_PORT}          ║`);
  console.log('║  ✅ 内置浏览器: http://localhost:3002/browser  ║');
  console.log('║  📌 使用说明:                                 ║');
  console.log('║     1. 打开 http://localhost:8080            ║');
  console.log('║     2. 先双击「启动内置浏览器.bat」           ║');
  console.log('║     3. 点击「登录TikTok」                    ║');
  console.log('╚═══════════════════════════════════════════════╝');
});
