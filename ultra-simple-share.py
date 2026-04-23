#!/usr/bin/env python3
"""
超简单Claw项目共享服务器
使用Python内置HTTP服务器，无额外依赖
"""

import http.server
import socketserver
import socket
import os
import sys

# 配置
PORT = 8082  # 使用8082端口
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

# 启动服务器
def start_simple_server():
    local_ip = get_local_ip()
    
    print("=" * 60)
    print("Claw项目简单共享服务器")
    print("=" * 60)
    print(f"共享路径: {SHARE_DIR}")
    print(f"本机访问: http://localhost:{PORT}")
    print(f"局域网访问: http://{local_ip}:{PORT}")
    print(f"前端项目: http://{local_ip}:{PORT}/frontend")
    print(f"后端项目: http://{local_ip}:{PORT}/backend")
    print("=" * 60)
    print("提示: 按 Ctrl+C 停止服务器")
    print("=" * 60)
    
    # 切换到共享目录
    os.chdir(SHARE_DIR)
    
    # 启动HTTP服务器
    handler = http.server.SimpleHTTPRequestHandler
    
    # 允许目录列表
    handler.extensions_map.update({
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.md': 'text/markdown',
        '.txt': 'text/plain',
    })
    
    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), handler) as httpd:
            print(f"服务器已启动，正在监听端口 {PORT}...")
            httpd.serve_forever()
    except OSError as e:
        if "10048" in str(e):
            print(f"错误: 端口 {PORT} 已被占用")
            print("请尝试:")
            print(f"1. 终止占用端口 {PORT} 的进程")
            print(f"2. 修改脚本中的 PORT 变量为其他端口（如 8082）")
            print(f"3. 运行: netstat -ano | findstr :{PORT} 查看占用进程")
        else:
            print(f"服务器启动失败: {e}")
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except Exception as e:
        print(f"服务器错误: {e}")

if __name__ == "__main__":
    start_simple_server()