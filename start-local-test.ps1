Start-Process -FilePath 'node' -ArgumentList 'local-frontend-proxy.cjs' -WorkingDirectory 'C:\Users\Administrator\WorkBuddy\Claw' -WindowStyle Normal -PassThru | Out-Null
Start-Sleep 3
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8787/' -UseBasicParsing -TimeoutSec 5
    Write-Host '✅ 前端代理已启动! 端口: 8787'
    Write-Host '标题:' $r.Content.Substring(0, [Math]::Min(100, $r.Content.Length))
} catch {
    Write-Host '❌ 前端代理启动失败:' $_.Exception.Message
}
