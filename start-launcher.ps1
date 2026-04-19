Start-Process -FilePath 'node' -ArgumentList 'local-browser-launcher.js' -WorkingDirectory 'C:\Users\Administrator\WorkBuddy\Claw' -WindowStyle Normal -PassThru | Out-Null
Start-Sleep 3
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3002/api/health' -UseBasicParsing -TimeoutSec 5
    Write-Host '✅ Launcher 已启动! 端口: 3002'
    Write-Host '响应:' $r.Content
} catch {
    Write-Host '❌ Launcher 启动失败:' $_.Exception.Message
}
