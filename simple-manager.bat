@echo off
chcp 65001 >nul
echo ========================================
echo Claw服务器简单管理工具
echo ========================================
echo.

if "%1"=="" goto menu

if "%1"=="start" goto start_server
if "%1"=="stop" goto stop_server
if "%1"=="status" goto status
if "%1"=="restart" goto restart
if "%1"=="monitor" goto monitor
if "%1"=="help" goto help

echo 未知命令: %1
goto end

:menu
echo 请选择操作:
echo 1. 启动服务器
echo 2. 停止服务器
echo 3. 查看状态
echo 4. 重启服务器
echo 5. 监控模式
echo 6. 帮助
echo 7. 退出
echo.
set /p choice=请输入数字(1-7): 

if "%choice%"=="1" goto start_server
if "%choice%"=="2" goto stop_server
if "%choice%"=="3" goto status
if "%choice%"=="4" goto restart
if "%choice%"=="5" goto monitor
if "%choice%"=="6" goto help
if "%choice%"=="7" goto end
echo 无效选择
goto menu

:start_server
echo 正在启动Claw服务器...
tasklist | findstr python.exe >nul
if %errorlevel% equ 0 (
    echo ⚠️  Python进程已存在
    set /p confirm=是否继续启动? (y/n): 
    if /i not "%confirm%"=="y" goto end
)

netstat -ano | findstr :8082 >nul
if %errorlevel% equ 0 (
    echo ❌ 端口8082已被占用
    echo 占用进程信息:
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8082 ^| findstr LISTENING') do (
        echo PID: %%a
        tasklist /FI "PID eq %%a" 2>nul
    )
    goto end
)

start /min python ultra-simple-share.py
timeout /t 3 /nobreak >nul

netstat -ano | findstr :8082 >nul
if %errorlevel% equ 0 (
    echo ✅ 服务器启动成功!
    echo 🌐 访问地址: http://localhost:8082
) else (
    echo ❌ 服务器启动失败
)
goto end

:stop_server
echo 正在停止Claw服务器...
tasklist | findstr python.exe >nul
if %errorlevel% neq 0 (
    echo ⚠️  未找到运行的Python进程
    goto end
)

taskkill /f /im python.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 已停止所有Python进程
) else (
    echo ❌ 停止进程失败
)
goto end

:status
echo 服务器状态检查...
echo.

echo [进程状态]
tasklist | findstr python.exe >nul
if %errorlevel% equ 0 (
    echo ✅ Python进程运行中
    for /f "tokens=2" %%a in ('tasklist ^| findstr python.exe') do (
        echo   PID: %%a
    )
) else (
    echo ❌ 未找到Python进程
)

echo.
echo [端口状态]
netstat -ano | findstr :8082 >nul
if %errorlevel% equ 0 (
    echo ✅ 端口8082监听中
    echo   连接信息:
    netstat -ano | findstr :8082
) else (
    echo ❌ 端口8082未监听
)

echo.
echo [访问测试]
curl --version >nul 2>&1
if %errorlevel% equ 0 (
    curl -s -o nul -w "%%{http_code}" http://localhost:8082 > status.txt
    set /p http_code=<status.txt
    del status.txt
    if "%http_code%"=="200" (
        echo ✅ 本地访问正常 (HTTP %http_code%)
    ) else (
        echo ❌ 本地访问失败 (HTTP %http_code%)
    )
) else (
    echo ⚠️  无法测试访问 (curl未安装)
)

echo.
echo [系统信息]
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
    set ip=%%a
    goto :got_ip
)
:got_ip
set ip=%ip: =%
echo   本机IP: %ip%
echo   访问地址: http://%ip%:8082

goto end

:restart
echo 重启服务器...
call :stop_server
timeout /t 2 /nobreak >nul
call :start_server
goto end

:monitor
echo 启动监控模式...
echo 按 Ctrl+C 退出监控
echo.

:monitor_loop
setlocal enabledelayedexpansion
for /f "tokens=2 delims=:" %%a in ('time /t') do set current_time=%%a
set current_time=!current_time: =!

echo [!current_time!] 检查服务器状态...

netstat -ano | findstr :8082 >nul
if %errorlevel% equ 0 (
    echo   ✅ 服务器运行正常
) else (
    echo   ❌ 服务器异常，尝试重启...
    start /min python ultra-simple-share.py
)

timeout /t 30 /nobreak >nul
goto monitor_loop

:help
echo.
echo 使用方法:
echo   simple-manager.bat [命令]
echo.
echo 可用命令:
echo   start    启动服务器
echo   stop     停止服务器
echo   status   查看状态
echo   restart  重启服务器
echo   monitor  监控模式
echo   help     显示帮助
echo.
echo 示例:
echo   simple-manager.bat start
echo   simple-manager.bat status
echo   simple-manager.bat monitor
echo.
echo 如果没有参数，会显示菜单界面。
goto end

:end
echo.
echo ========================================
if "%1"=="" pause
exit /b 0