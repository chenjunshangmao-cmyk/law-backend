// Claw项目局域网共享服务器
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080; // 使用8080端口
const SHARE_PATH = __dirname; // 共享当前目录（Claw文件夹）

// 中间件
app.use(cors());
app.use(express.json());

// 获取本机IP地址
function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过内部和IPv6地址
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getLocalIP();

// 静态文件服务 - 共享整个Claw文件夹
app.use('/claw', express.static(SHARE_PATH));

// 首页 - 显示共享信息
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claw项目共享服务器</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            padding: 40px;
            max-width: 800px;
            width: 100%;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: white;
            font-size: 36px;
            font-weight: bold;
        }
        
        h1 {
            color: #333;
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .subtitle {
            color: #666;
            font-size: 18px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .info-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 24px;
            border: 1px solid #e9ecef;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .card-title {
            color: #333;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .card-content {
            color: #666;
            line-height: 1.6;
        }
        
        .url-box {
            background: #f8f9fa;
            border: 2px dashed #dee2e6;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        
        .url {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            color: #333;
            word-break: break-all;
            margin-bottom: 10px;
        }
        
        .copy-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        
        .copy-btn:hover {
            opacity: 0.9;
        }
        
        .links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 30px;
        }
        
        .link-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            text-decoration: none;
            color: #333;
            border: 1px solid #e9ecef;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .link-card:hover {
            background: #e9ecef;
            transform: translateY(-2px);
        }
        
        .link-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
        }
        
        .link-content h3 {
            font-size: 16px;
            margin-bottom: 4px;
        }
        
        .link-content p {
            font-size: 14px;
            color: #666;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #666;
            font-size: 14px;
        }
        
        .qr-code {
            margin: 20px auto;
            width: 150px;
            height: 150px;
            background: #f8f9fa;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: #666;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 20px;
            }
            
            h1 {
                font-size: 24px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🦀</div>
            <h1>Claw项目共享服务器</h1>
            <p class="subtitle">AI驱动的外贸电商平台 - 局域网共享</p>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <div class="card-title">📡 访问地址</div>
                <div class="card-content">
                    <p>在局域网内，其他AI可以通过以下地址访问：</p>
                    <div class="url-box">
                        <div class="url" id="url">http://${localIP}:${PORT}</div>
                        <button class="copy-btn" onclick="copyUrl()">复制地址</button>
                    </div>
                </div>
            </div>
            
            <div class="info-card">
                <div class="card-title">📁 共享内容</div>
                <div class="card-content">
                    <p><strong>Claw项目完整文件夹</strong>包含：</p>
                    <ul style="margin-top: 10px; padding-left: 20px;">
                        <li>前端代码 (React + TypeScript)</li>
                        <li>后端API (Node.js + Express)</li>
                        <li>数据库配置</li>
                        <li>AI客服系统</li>
                        <li>支付系统</li>
                        <li>业务文档</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="links">
            <a href="/claw" class="link-card" target="_blank">
                <div class="link-icon">📂</div>
                <div class="link-content">
                    <h3>文件浏览器</h3>
                    <p>浏览Claw项目所有文件</p>
                </div>
            </a>
            
            <a href="/claw/frontend" class="link-card" target="_blank">
                <div class="link-icon">⚛️</div>
                <div class="link-content">
                    <h3>前端项目</h3>
                    <p>React前端源代码</p>
                </div>
            </a>
            
            <a href="/claw/backend" class="link-card" target="_blank">
                <div class="link-icon">🚀</div>
                <div class="link-content">
                    <h3>后端API</h3>
                    <p>Node.js后端服务</p>
                </div>
            </a>
            
            <a href="http://${localIP}:${PORT}/claw/frontend/index.html" class="link-card" target="_blank">
                <div class="link-icon">🌐</div>
                <div class="link-content">
                    <h3>网站预览</h3>
                    <p>直接访问网站首页</p>
                </div>
            </a>
        </div>
        
        <div class="qr-code" id="qrCode">
            二维码区域<br>
            (扫描访问)
        </div>
        
        <div class="footer">
            <p>服务器运行中 | 端口: ${PORT} | 共享路径: ${SHARE_PATH}</p>
            <p>© 2026 Claw跨境智造平台 | 仅供内部使用</p>
        </div>
    </div>
    
    <script>
        function copyUrl() {
            const url = document.getElementById('url').textContent;
            navigator.clipboard.writeText(url).then(() => {
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '已复制!';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 2000);
            });
        }
        
        // 生成二维码
        function generateQRCode() {
            const url = document.getElementById('url').textContent;
            const qrCodeDiv = document.getElementById('qrCode');
            
            // 使用QRCode.js生成二维码
            const qrcode = new QRCode(qrCodeDiv, {
                text: url,
                width: 128,
                height: 128,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
        
        // 加载QRCode.js库
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
        script.onload = generateQRCode;
        document.head.appendChild(script);
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

// 文件列表API
app.get('/api/files', (req, res) => {
  try {
    const files = [];
    
    function scanDir(dir, basePath = '') {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        const stat = fs.statSync(fullPath);
        
        files.push({
          name: item,
          path: relativePath,
          type: stat.isDirectory() ? 'directory' : 'file',
          size: stat.size,
          modified: stat.mtime,
          url: `/claw/${relativePath.replace(/\\/g, '/')}`
        });
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDir(fullPath, relativePath);
        }
      });
    }
    
    scanDir(SHARE_PATH);
    
    res.json({
      success: true,
      data: {
        total: files.length,
        files: files.slice(0, 100) // 限制返回数量
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 文件下载API
app.get('/api/download/:filePath(*)', (req, res) => {
  try {
    const filePath = path.join(SHARE_PATH, req.params.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }
    
    res.download(filePath);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║               Claw项目共享服务器 已启动                          ║
╠══════════════════════════════════════════════════════════════════╣
║  服务器: 0.0.0.0:${PORT}                                         ║
║  局域网: http://${localIP}:${PORT}                               ║
║  本机访问: http://localhost:${PORT}                              ║
║  共享路径: ${SHARE_PATH}                                         ║
╠══════════════════════════════════════════════════════════════════╣
║  [🌐 访问方式]                                                    ║
║  ├─ 文件浏览: http://${localIP}:${PORT}/claw                     ║
║  ├─ 前端项目: http://${localIP}:${PORT}/claw/frontend            ║
║  ├─ 后端项目: http://${localIP}:${PORT}/claw/backend             ║
║  └─ API接口: http://${localIP}:${PORT}/api/files                 ║
╠══════════════════════════════════════════════════════════════════╣
║  [📱 其他设备访问]                                                ║
║  确保设备在同一局域网，使用上述地址访问                           ║
║  支持: 电脑、手机、平板、其他AI设备                              ║
╚══════════════════════════════════════════════════════════════════╝
  `);
  
  console.log('📢 提示: 按 Ctrl+C 停止服务器');
});