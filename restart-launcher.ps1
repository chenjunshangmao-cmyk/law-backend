# 杀掉占用 3002 端口的 node 进程
$proc = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -match 'WorkBuddy' }
$proc | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2
Write-Host '旧进程已停止'

# 启动新的 launcher
Start-Process -FilePath 'node' -ArgumentList 'c:/Users/Administrator/WorkBuddy/Claw/local-browser-launcher.js' -WorkingDirectory 'c:/Users/Administrator/WorkBuddy/Claw' -WindowStyle Normal
Start-Sleep 3

# 验证启动
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3002/api/health' -UseBasicParsing -TimeoutSec 5
    Write-Host '✅ Launcher 启动成功!'
    Write-Host '响应:' $r.Content
} catch {
    Write-Host '❌ Launcher 启动失败:' $_.Exception.Message
}
