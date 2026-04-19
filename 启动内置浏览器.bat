@echo off
title Claw 内置浏览器
cd /d "%~dp0"
echo ========================================
echo   Claw 内置浏览器启动器
echo ========================================
echo.
REM 端口: 3002
node local-browser-launcher.js
pause
