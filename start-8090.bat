@echo off
echo 启动Claw后端服务（端口8090）...
cd /d "C:\Users\Administrator\WorkBuddy\Claw\backend"
set PORT=8090
node src/index.db.js
pause