# 杀掉相关 node 进程
$procs = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -match 'WorkBuddy' }
$procs | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2
Write-Host '旧进程已停止'

# 启动 launcher
Start-Process -FilePath 'node' -ArgumentList 'local-browser-launcher.js' -WorkingDirectory 'C:\Users\Administrator\WorkBuddy\Claw' -WindowStyle Normal -PassThru | Out-Null
Start-Sleep 3

# 启动前端代理
Start-Process -FilePath 'node' -ArgumentList 'local-frontend-proxy.cjs' -WorkingDirectory 'C:\Users\Administrator\WorkBuddy\Claw' -WindowStyle Normal -PassThru | Out-Null
Start-Sleep 3

# 验证
try {
    $r1 = Invoke-WebRequest -Uri 'http://localhost:3002/browser' -UseBasicParsing -TimeoutSec 5
    $t1 = $r1.Content -match '<title>' ? '✅' : '❌'
    Write-Host "$t1 内置浏览器页面 (3002): $($r1.StatusCode)"
} catch {
    Write-Host "❌ 内置浏览器页面: $($_.Exception.Message)"
}

try {
    $r2 = Invoke-WebRequest -Uri 'http://localhost:8787/' -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ 前端代理 (8787): $($r2.StatusCode)"
} catch {
    Write-Host "❌ 前端代理: $($_.Exception.Message)"
}

Write-Host ''
Write-Host '启动完成!'
