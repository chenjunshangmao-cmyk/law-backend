@echo off
echo ========================================
echo Claw服务器配置脚本
echo 将电脑配置为专用服务器
echo ========================================
echo.

echo 1. 检查管理员权限...
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 请以管理员身份运行此脚本
    pause
    exit /b 1
)
echo ✅ 管理员权限确认
echo.

echo 2. 配置防火墙规则...
echo 允许服务器端口: 8082, 8089, 8090
powershell -Command "New-NetFirewallRule -DisplayName 'Claw HTTP Server' -Direction Inbound -LocalPort 8082 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue"
powershell -Command "New-NetFirewallRule -DisplayName 'Claw Backend API' -Direction Inbound -LocalPort 8089 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue"
powershell -Command "New-NetFirewallRule -DisplayName 'Claw Payment Test' -Direction Inbound -LocalPort 8090 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue"
echo ✅ 防火墙规则已配置
echo.

echo 3. 创建系统服务...
echo 创建Claw共享服务器服务...
sc create ClawShareServer binPath= "cmd /c start /min python \"%~dp0ultra-simple-share.py\"" DisplayName= "Claw共享服务器" start= auto
if %ERRORLEVEL% EQU 0 (
    echo ✅ 系统服务创建成功
    echo 启动服务...
    sc start ClawShareServer
) else (
    echo ⚠️  系统服务创建失败，使用计划任务
)
echo.

echo 4. 创建计划任务（备用）...
schtasks /create /tn "ClawServerStartup" /tr "python \"%~dp0ultra-simple-share.py\"" /sc onstart /ru SYSTEM /rl HIGHEST /f
echo ✅ 计划任务创建成功
echo.

echo 5. 优化电源设置...
powercfg -change -standby-timeout-ac 0
powercfg -change -hibernate-timeout-ac 0
powercfg -change -monitor-timeout-ac 0
powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c  # 高性能模式
echo ✅ 电源优化完成（不休眠、不关闭显示器）
echo.

echo 6. 网络优化...
netsh int tcp set global autotuninglevel=normal
netsh int tcp set global chimney=enabled
netsh int tcp set global rss=enabled
echo ✅ 网络优化完成
echo.

echo 7. 创建服务器状态监控...
echo @echo off > "%~dp0server-monitor.bat"
echo echo [%date% %time%] 服务器运行状态 >> "%~dp0server-status.log"
echo netstat -ano ^| findstr :8082 >> "%~dp0server-monitor.bat"
echo if errorlevel 1 ( >> "%~dp0server-monitor.bat"
echo     echo ❌ 服务器未运行，正在重启... >> "%~dp0server-monitor.bat"
echo     start /min python "%~dp0ultra-simple-share.py" >> "%~dp0server-monitor.bat"
echo ) else ( >> "%~dp0server-monitor.bat"
echo     echo ✅ 服务器运行正常 >> "%~dp0server-monitor.bat"
echo ) >> "%~dp0server-monitor.bat"
echo ✅ 监控脚本创建完成
echo.

echo 8. 创建管理快捷方式...
echo 创建桌面快捷方式...
set SCRIPT="%~dp0server-manager.vbs"
echo Set WshShell = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo WshShell.Run "cmd /c title Claw服务器管理 ^& color 0A ^& echo Claw服务器管理控制台 ^& echo ============================= ^& echo 1. 启动共享服务器 ^& echo 2. 停止共享服务器 ^& echo 3. 查看服务器状态 ^& echo 4. 查看访问日志 ^& echo 5. 退出 ^& set /p choice=请选择操作: ^& if %%choice%%==1 start python \"%~dp0ultra-simple-share.py\" ^& if %%choice%%==2 taskkill /f /im python.exe ^& if %%choice%%==3 netstat -ano ^| findstr :8082 ^& if %%choice%%==4 type \"%~dp0server-status.log\"", 0 >> %SCRIPT%

powershell -Command "$s=(New-Object -COM WScript.Shell).CreateShortcut('%USERPROFILE%\Desktop\Claw服务器管理.lnk');$s.TargetPath='wscript.exe';$s.Arguments='%SCRIPT%';$s.Save()"
echo ✅ 管理快捷方式已创建到桌面
echo.

echo 9. 配置远程访问（可选）...
echo 启用远程桌面...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 0 /f
netsh advfirewall firewall set rule group="远程桌面" new enable=Yes
echo ⚠️  远程桌面已启用，请设置强密码
echo.

echo 10. 创建服务器信息文件...
echo # Claw服务器配置信息 > "%~dp0SERVER-INFO.md"
echo. >> "%~dp0SERVER-INFO.md"
echo ## 服务器基本信息 >> "%~dp0SERVER-INFO.md"
echo - **主机名**: %COMPUTERNAME% >> "%~dp0SERVER-INFO.md"
echo - **IP地址**: 192.168.3.173 >> "%~dp0SERVER-INFO.md"
echo - **操作系统**: Windows >> "%~dp0SERVER-INFO.md"
echo. >> "%~dp0SERVER-INFO.md"
echo ## 服务端口 >> "%~dp0SERVER-INFO.md"
echo - **共享服务器**: 8082 >> "%~dp0SERVER-INFO.md"
echo - **后端API**: 8089 >> "%~dp0SERVER-INFO.md"
echo - **支付测试**: 8090 >> "%~dp0SERVER-INFO.md"
echo. >> "%~dp0SERVER-INFO.md"
echo ## 访问地址 >> "%~dp0SERVER-INFO.md"
echo - **局域网访问**: http://192.168.3.173:8082 >> "%~dp0SERVER-INFO.md"
echo - **项目首页**: http://192.168.3.173:8082/ >> "%~dp0SERVER-INFO.md"
echo - **前端项目**: http://192.168.3.173:8082/frontend/ >> "%~dp0SERVER-INFO.md"
echo - **后端API**: http://192.168.3.173:8082/backend/ >> "%~dp0SERVER-INFO.md"
echo. >> "%~dp0SERVER-INFO.md"
echo ## 管理命令 >> "%~dp0SERVER-INFO.md"
echo ```bash >> "%~dp0SERVER-INFO.md"
echo # 启动共享服务器 >> "%~dp0SERVER-INFO.md"
echo python ultra-simple-share.py >> "%~dp0SERVER-INFO.md"
echo. >> "%~dp0SERVER-INFO.md"
echo # 查看服务器状态 >> "%~dp0SERVER-INFO.md"
echo netstat -ano | findstr :8082 >> "%~dp0SERVER-INFO.md"
echo. >> "%~dp0SERVER-INFO.md"
echo # 停止服务器 >> "%~dp0SERVER-INFO.md"
echo taskkill /f /im python.exe >> "%~dp0SERVER-INFO.md"
echo ``` >> "%~dp0SERVER-INFO.md"
echo ✅ 服务器信息文档创建完成
echo.

echo ========================================
echo 🎉 服务器配置完成！
echo ========================================
echo.
echo 📋 配置摘要：
echo - ✅ 防火墙规则已配置
echo - ✅ 开机自启动已设置
echo - ✅ 电源优化完成
echo - ✅ 网络优化完成
echo - ✅ 监控脚本已创建
echo - ✅ 管理快捷方式在桌面
echo - ✅ 远程桌面已启用
echo - ✅ 服务器文档已创建
echo.
echo 🌐 访问地址：http://192.168.3.173:8082
echo 📁 项目路径：%~dp0
echo 🖥️ 管理工具：桌面上的"Claw服务器管理"
echo.
echo ⚠️  重要提醒：
echo 1. 建议设置静态IP地址
echo 2. 设置强密码保护远程桌面
echo 3. 定期检查服务器状态
echo 4. 备份重要数据
echo.
echo 按任意键退出...
pause >nul