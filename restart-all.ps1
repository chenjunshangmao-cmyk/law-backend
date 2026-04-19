# 重启所有服务
$ErrorActionPreference = 'Continue'
$base = 'C:\Users\Administrator\WorkBuddy\Claw'

# 启动 launcher (端口 3002)
$p1 = Start-Process -FilePath 'node' -ArgumentList 'local-browser-launcher.js' -WorkingDirectory $base -WindowStyle Normal -PassThru
Write-Host "Launcher PID: $($p1.Id)"

# 启动前端代理 (端口 8787)
$p2 = Start-Process -FilePath 'node' -ArgumentList 'local-frontend-proxy.cjs' -WorkingDirectory $base -WindowStyle Normal -PassThru
Write-Host "Frontend Proxy PID: $($p2.Id)"

Start-Sleep 4

# 验证
$ok1 = $false; $ok2 = $false
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3002/browser' -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -eq 200 -and $r.Content -match '<title>') { $ok1 = $true }
} catch {}
try {
    $r2 = Invoke-WebRequest -Uri 'http://localhost:8787/' -UseBasicParsing -TimeoutSec 5
    if ($r2.StatusCode -eq 200) { $ok2 = $true }
} catch {}

if ($ok1) { Write-Host "✅ 内置浏览器 (3002/browser): 正常" } else { Write-Host "❌ 内置浏览器: 失败" }
if ($ok2) { Write-Host "✅ 前端代理 (8787): 正常" } else { Write-Host "❌ 前端代理: 失败" }

Write-Host ""
Write-Host "=== 启动完成 ==="
Write-Host "请访问: http://localhost:8787"
Write-Host "然后点击「登录TikTok」测试弹窗"
