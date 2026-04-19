/**
 * Claw 本地前端服务器（使用修复后的 bundle）
 * 将 http://localhost:8080 作为本地测试地址
 * API 请求自动代理到真实后端
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8787;
const BACKEND = 'claw-backend-2026.onrender.com';

// 读取修复后的 bundle
const BUNDLE_PATH = path.join(__dirname, 'frontend-bundle.js');
let bundle = fs.readFileSync(BUNDLE_PATH, 'utf8');

// 注入 local-browser-launcher 的 API 地址（端口 3002）
const INJECT_HOST = 'localhost';
const INJECT_PORT = '3002';
bundle = bundle.replace(
  /https?:\/\/claw-backend[^'"]*\/api/g,
  (match) => {
    // 如果是本地环境，保留远程后端；否则保持原样
    return match;
  }
);

const HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Claw - 本地开发版</title>
<style>
body { font-family: sans-serif; padding: 20px; background: #f5f5f5; }
.banner { background: linear-gradient(135deg,#667eea,#764ba2); color: white; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; }
.banner h2 { margin: 0 0 5px 0; }
.banner p { margin: 0; opacity: 0.9; font-size: 14px; }
iframe { width: 100%; height: calc(100vh - 120px); border: none; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
</style>
</head>
<body>
<div class="banner">
  <h2>🦶 Claw 本地测试版</h2>
  <p>内置浏览器已修复 | API 代理到 ${BACKEND} | 端口: ${PORT}</p>
</div>
<iframe src="embedded-browser-page.html"></iframe>
<script src="/frontend-bundle.js"></script>
</body>
</html>`;

const EMBEDDED_PAGE = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>内置浏览器</title>
<style>
body { font-family: sans-serif; margin: 0; background: #f0f4ff; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
.box { background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
h2 { color: #333; margin-bottom: 10px; }
p { color: #666; margin-bottom: 20px; font-size: 14px; }
.btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg,#667eea,#764ba2);
  color: white; text-decoration: none; border-radius: 8px; font-weight: bold; }
.btn:hover { opacity: 0.9; }
</style>
</head><body>
<div class="box">
  <h2>🔐 店铺账号登录</h2>
  <p>点击下方按钮启动内置浏览器<br>（TikTok Shop / OZON）</p>
  <a class="btn" href="http://localhost:${INJECT_PORT}/browser" target="_blank">
    🚀 打开登录页面
  </a>
</div>
</body></html>`;

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
    return;
  }

  if (url === '/frontend-bundle.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' });
    res.end(bundle);
    return;
  }

  if (url === '/embedded-browser-page.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(EMBEDDED_PAGE);
    return;
  }

  // API 代理到后端
  const options = {
    hostname: BACKEND,
    port: 443,
    path: url,
    method: req.method,
    headers: {
      host: BACKEND,
      origin: `http://localhost:${PORT}`,
      referer: `http://localhost:${PORT}/`,
      ...req.headers,
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    const corsHeaders = {
      ...proxyRes.headers,
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'access-control-allow-headers': 'Content-Type,Authorization',
    };
    res.writeHead(proxyRes.statusCode, corsHeaders);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Backend error: ' + e.message);
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║    Claw 本地前端服务器（修复弹窗版）           ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  🌐 地址: http://localhost:${PORT}                   ║`);
  console.log('║  🔐 内置浏览器: http://localhost:3002/browser  ║');
  console.log('║                                                  ║');
  console.log('║  使用步骤:                                      ║');
  console.log('║  1. 先双击「启动内置浏览器.bat」               ║');
  console.log('║  2. 打开 http://localhost:8080                 ║');
  console.log('║  3. 点击「登录TikTok」→ 弹窗不再被拦截!       ║');
  console.log('╚══════════════════════════════════════════════════╝');
});
