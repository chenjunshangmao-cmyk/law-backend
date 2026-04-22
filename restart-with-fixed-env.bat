@echo off
echo 停止当前后端服务...
taskkill /F /PID 31104 2>nul
timeout /t 2 /nobreak >nul

echo 复制修复的环境配置文件...
copy .env.fixed .env /Y >nul

echo 启动后端服务...
start node src/index.db.js

echo 等待服务启动...
timeout /t 5 /nobreak >nul

echo 测试服务状态...
curl http://localhost:8089/api/health
echo.

echo 测试Google OAuth配置...
curl -I http://localhost:8089/api/auth/google
echo.

echo 服务已重启，使用修复的环境配置。