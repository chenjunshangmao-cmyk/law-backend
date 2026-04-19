# 启动Claw后端服务器
$env:DATABASE_URL = "postgres://claw_db_user:zpCB2JNdscawi5cD0cyHA5BeqW2o8UPP@dpg-d7dlk6hkh4rs739s00b0-a.virginia-postgres.render.com/claw_db"
$env:NODE_ENV = "production"
$env:PORT = "8089"

Write-Host "启动Claw后端服务器..." -ForegroundColor Green
Write-Host "数据库URL: $env:DATABASE_URL" -ForegroundColor Yellow
Write-Host "端口: $env:PORT" -ForegroundColor Yellow

# 检查端口是否被占用
$portInUse = Get-NetTCPConnection -LocalPort $env:PORT -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "端口 $env:PORT 已被占用，尝试停止占用进程..." -ForegroundColor Red
    $processId = $portInUse.OwningProcess
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# 启动服务器
node src/index.db.js