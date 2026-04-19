@echo off
title Claw 本地前端测试版
cd /d "%~dp0"
echo ========================================
echo   Claw 本地前端测试版（含弹窗修复）
echo ========================================
echo.
echo 1. 启动内置浏览器服务 (端口 3002)...
start "Claw-Launcher" cmd /c "node local-browser-launcher.js"
timeout /t 3 /nobreak >nul
echo    ✅ 内置浏览器已启动
echo.
echo 2. 启动前端代理 (端口 8080)...
start "Claw-Frontend" cmd /c "node local-frontend-proxy.cjs"
timeout /t 2 /nobreak >nul
echo    ✅ 前端服务已启动
echo.
echo ========================================
echo.
echo  打开浏览器访问: http://localhost:8787
echo  然后点击「登录TikTok」测试弹窗
echo.
echo  提示: 如果之前有弹窗被拦截，需要在浏览器里允许弹窗
echo.
pause
