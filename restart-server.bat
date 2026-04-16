@echo off
echo 正在重新启动Claw后端服务器...
echo.

REM 停止所有运行在8089端口的进程
echo 停止现有进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr 8089 ^| findstr LISTENING') do (
    echo 发现进程ID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo 启动新服务器...
cd /d "C:\Users\Administrator\WorkBuddy\Claw\backend"
node src/index.db.js

pause