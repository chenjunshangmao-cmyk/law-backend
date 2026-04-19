# Claw 后端快速部署脚本
# 用法：修改完代码后运行此脚本，无需推仓库

Write-Host "🔄 重启 Claw 后端服务..." -ForegroundColor Cyan

# 尝试用 pm2 重启
$pm2Exists = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Exists) {
    Write-Host "  → 使用 PM2 重启" -ForegroundColor Gray
    pm2 restart claw-backend
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 重启成功" -ForegroundColor Green
        exit 0
    }
}

# 备用方案：直接重启进程
Write-Host "  → PM2 不可用，尝试直接重启进程" -ForegroundColor Gray

# 停止旧进程
$process = Get-Process | Where-Object { $_.Id -eq 19516 -or $_.MainWindowTitle -like "*node*" }
if ($process) {
    Write-Host "  → 停止旧进程 (PID: $($process.Id))" -ForegroundColor Gray
    Stop-Process -Id $process.Id -Force
    Start-Sleep -Seconds 2
}

# 启动新进程
$backendPath = "C:\Users\Administrator\WorkBuddy\Claw\backend"
if (Test-Path $backendPath) {
    Write-Host "  → 启动新进程" -ForegroundColor Gray
    Start-Process npm -ArgumentList "start" -WorkingDirectory $backendPath
    Write-Host "✅ 后端已启动" -ForegroundColor Green
    Write-Host "📍 服务地址：http://localhost:8089" -ForegroundColor Gray
} else {
    Write-Host "❌ 后端路径不存在：$backendPath" -ForegroundColor Red
    exit 1
}
