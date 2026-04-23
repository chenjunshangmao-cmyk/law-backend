#!/usr/bin/env python3
"""
Claw项目简单共享服务器 - Python版本
无需安装依赖，使用Python内置HTTP服务器
"""

import http.server
import socketserver
import socket
import os
import webbrowser
from datetime import datetime

# 配置
PORT = 8080
SHARE_DIR = os.path.dirname(os.path.abspath(__file__))

# 获取本机IP
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

local_ip = get_local_ip()

# 自定义请求处理器
class ClawHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SHARE_DIR, **kwargs)
    
    def do_GET(self):
        # 如果是根路径，显示自定义页面
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            
            html = self.generate_index_html()
            self.wfile.write(html.encode('utf-8'))
        else:
            # 其他路径使用默认处理
            super().do_GET()
    
    def generate_index_html(self):
        """生成首页HTML"""
        files = []
        for item in os.listdir(SHARE_DIR):
            if not item.startswith('.'):  # 隐藏文件
                item_path = os.path.join(SHARE_DIR, item)
                is_dir = os.path.isdir(item_path)
                size = os.path.getsize(item_path) if not is_dir else '-'
                modified = datetime.fromtimestamp(os.path.getmtime(item_path)).strftime('%Y-%m-%d %H:%M')
                
                files.append({
                    'name': item,
                    'is_dir': is_dir,
                    'size': size,
                    'modified': modified,
                    'url': f'/{item}'
                })
        
        # 按目录优先排序
        files.sort(key=lambda x: (not x['is_dir'], x['name'].lower()))
        
        file_list_html = ''
        for file in files[:20]:  # 只显示前20个
            icon = '📁' if file['is_dir'] else '📄'
            size_display = f"{file['size']:,} B" if file['size'] != '-' else '目录'
            file_list_html += f'''
            <tr>
                <td>{icon} <a href="{file['url']}">{file['name']}</a></td>
                <td>{size_display}</td>
                <td>{file['modified']}</td>
            </tr>
            '''
        
        return f'''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claw项目共享 - Python服务器</title>
    <style>
        body {{
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        
        .header h1 {{
            margin: 0;
            font-size: 2.5em;
        }}
        
        .header p {{
            margin: 10px 0 0;
            opacity: 0.9;
        }}
        
        .content {{
            padding: 30px;
        }}
        
        .info-cards {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .card {{
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            border: 1px solid #e9ecef;
        }}
        
        .card h3 {{
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
        
        .url-box {{
            background: white;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            font-family: monospace;
            font-size: 1.1em;
            word-break: break-all;
        }}
        
        .file-table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }}
        
        .file-table th {{
            background: #f8f9fa;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
        }}
        
        .file-table td {{
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
        }}
        
        .file-table tr:hover {{
            background: #f8f9fa;
        }}
        
        .links {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 30px;
        }}
        
        .link-card {{
            display: block;
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            text-decoration: none;
            color: #333;
            border: 1px solid #e9ecef;
            transition: all 0.3s;
        }}
        
        .link-card:hover {{
            background: #667eea;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }}
        
        .footer {{
            text-align: center;
            padding: 20px;
            color: #666;
            border-top: 1px solid #e9ecef;
            background: #f8f9fa;
        }}
        
        @media (max-width: 600px) {{
            .content {{
                padding: 15px;
            }}
            
            .header h1 {{
                font-size: 1.8em;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🦀 Claw项目共享服务器</h1>
            <p>AI驱动的外贸电商平台 - Python HTTP服务器</p>
        </div>
        
        <div class="content">
            <div class="info-cards">
                <div class="card">
                    <h3>📡 访问信息</h3>
                    <p><strong>本机访问:</strong></p>
                    <div class="url-box">http://localhost:{PORT}</div>
                    
                    <p><strong>局域网访问:</strong></p>
                    <div class="url-box">http://{local_ip}:{PORT}</div>
                    
                    <p><strong>共享路径:</strong></p>
                    <div class="url-box">{SHARE_DIR}</div>
                </div>
                
                <div class="card">
                    <h3>📁 项目结构</h3>
                    <p>Claw项目包含以下主要目录:</p>
                    <ul>
                        <li><strong>frontend/</strong> - React前端项目</li>
                        <li><strong>backend/</strong> - Node.js后端API</li>
                        <li><strong>src/</strong> - 源代码文件</li>
                        <li><strong>data/</strong> - 数据文件</li>
                        <li><strong>deploy-package/</strong> - 部署文件</li>
                    </ul>
                </div>
            </div>
            
            <div class="card">
                <h3>🔗 快速链接</h3>
                <div class="links">
                    <a href="/frontend" class="link-card">
                        <strong>⚛️ 前端项目</strong><br>
                        React + TypeScript
                    </a>
                    
                    <a href="/backend" class="link-card">
                        <strong>🚀 后端API</strong><br>
                        Node.js + Express
                    </a>
                    
                    <a href="/src" class="link-card">
                        <strong>📝 源代码</strong><br>
                        核心业务逻辑
                    </a>
                    
                    <a href="/deploy-package" class="link-card">
                        <strong>📦 部署文件</strong><br>
                        生产环境文件
                    </a>
                </div>
            </div>
            
            <div class="card">
                <h3>📄 文件列表 (前20个)</h3>
                <table class="file-table">
                    <thead>
                        <tr>
                            <th>文件名</th>
                            <th>大小</th>
                            <th>修改时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {file_list_html}
                    </tbody>
                </table>
                <p style="margin-top: 10px; color: #666;">
                    共 {len(files)} 个文件/目录，点击文件名可浏览或下载
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p>服务器运行中 | 端口: {PORT} | 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>© 2026 Claw跨境智造平台 | 使用Python内置HTTP服务器</p>
        </div>
    </div>
</body>
</html>
        '''
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

# 启动服务器
def start_server():
    banner = f"""
============================================================
            Claw项目共享服务器 (Python) 已启动
============================================================
服务器: 0.0.0.0:{PORT}
局域网: http://{local_ip}:{PORT}
本机访问: http://localhost:{PORT}
共享路径: {SHARE_DIR}
------------------------------------------------------------
[访问方式]
- 文件浏览: http://{local_ip}:{PORT}
- 前端项目: http://{local_ip}:{PORT}/frontend
- 后端项目: http://{local_ip}:{PORT}/backend
- 源代码: http://{local_ip}:{PORT}/src
------------------------------------------------------------
[其他设备访问]
确保设备在同一局域网，使用上述地址访问
支持: 电脑、手机、平板、其他AI设备
============================================================
    """
    
    print(banner)
    print("提示: 按 Ctrl+C 停止服务器")
    print("-" * 60)
    
    # 尝试在浏览器中打开
    try:
        webbrowser.open(f'http://localhost:{PORT}')
    except:
        pass
    
    # 启动服务器
    with socketserver.TCPServer(("0.0.0.0", PORT), ClawHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 服务器已停止")
        except Exception as e:
            print(f"\n❌ 服务器错误: {e}")

if __name__ == "__main__":
    start_server()