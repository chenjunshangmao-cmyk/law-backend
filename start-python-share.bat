@echo off
echo ========================================
echo Claw项目Python共享服务器
echo ========================================
echo.

echo 1. 检查Python环境...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 未检测到Python，请先安装Python 3.x
    pause
    exit /b 1
)
echo ✅ Python已安装
python --version
echo.

echo 2. 检查端口占用...
netstat -ano | findstr :8080 >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  端口8080已被占用
    echo 正在查找占用进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
        echo 进程PID: %%a
        tasklist /FI "PID eq %%a" 2>nul
    )
    echo.
    set /p choice="是否终止占用进程？(y/n): "
    if /i "%choice%"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8080 ^| findstr LISTENING') do (
            taskkill /F /PID %%a >nul 2>&1
            echo ✅ 已终止进程: %%a
        )
        timeout /t 2 /nobreak >nul
    ) else (
        echo ❌ 端口被占用，无法启动服务器
        pause
        exit /b 1
    )
) else (
    echo ✅ 端口8080可用
)
echo.

echo 3. 获取本机IP地址...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set ip=%%a
    goto :got_ip
)
:got_ip
set ip=%ip: =%
echo ✅ 本机IP: %ip%
echo.

echo 4. 启动Python共享服务器...
echo 📡 服务器正在启动...
echo 📁 共享路径: %~dp0
echo 🌐 本机访问: http://localhost:8080
echo 🌐 局域网访问: http://%ip%:8080
echo 📱 局域网内其他设备可通过上述地址访问
echo.

echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

python "%~dp0simple-share.py"