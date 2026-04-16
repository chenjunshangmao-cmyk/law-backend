@echo off
echo ===============================
echo Claw网站会员登录问题修复验证
echo ===============================
echo.

echo 1. 重启服务器...
cd /d "C:\Users\Administrator\WorkBuddy\Claw\backend"
echo 停止现有进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr 8089 ^| findstr LISTENING') do (
    echo 发现进程ID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo 启动新服务器...
start /B node src/index.db.js

echo 等待服务器启动...
ping -n 3 127.0.0.1 >nul

echo.
echo 2. 测试登录功能...
echo.

REM 测试预定义用户登录
echo 测试预定义用户登录:
powershell -Command "$body = @{email = 'test@claw.com'; password = 'anypassword'} | ConvertTo-Json; $result = Invoke-RestMethod -Method Post -Uri 'http://localhost:8089/api/auth/login' -Body $body -ContentType 'application/json'; Write-Host '✅ 登录成功! 令牌: ' $result.data.token.substring(0,30) '...'; Write-Host '   用户: ' $result.data.user.name ' (' $result.data.user.role ')'"

echo.
echo 3. 测试注册新用户:
echo.

REM 测试注册新用户
echo 测试注册新用户:
powershell -Command "$body = @{email = 'newuser@claw.com'; password = 'password123'; name = '新用户'} | ConvertTo-Json; $result = Invoke-RestMethod -Method Post -Uri 'http://localhost:8089/api/auth/register' -Body $body -ContentType 'application/json'; Write-Host '✅ 注册成功! 令牌: ' $result.data.token.substring(0,30) '...'; Write-Host '   用户ID: ' $result.data.user.id"

echo.
echo 4. 健康检查:
echo.

REM 健康检查
powershell -Command "$result = Invoke-RestMethod -Method Get -Uri 'http://localhost:8089/api/health'; Write-Host '✅ 健康检查通过: ' $result.status ' (运行时间: ' $result.uptime '秒)'"

echo.
echo ===============================
echo 修复验证完成！
echo ===============================
echo.
echo 可用测试账号：
echo 1. test@claw.com / anypassword
echo 2. admin@claw.com / anypassword  
echo 3. user@claw.com / anypassword
echo.
echo 现在可以使用前端进行登录测试了！
pause