for($i=0; $i -lt 18; $i++) {
  Start-Sleep 10
  try {
    $r = Invoke-WebRequest -Uri 'https://claw-backend-2026.onrender.com/api/health' -UseBasicParsing -TimeoutSec 5
    if ($r.Content -match 'healthy') {
      Write-Host "部署完成 (第$($i+1)次检查)"
      break
    } else {
      Write-Host "第$($i+1)次检查..."
    }
  } catch {
    Write-Host "第$($i+1)次: 等待中"
  }
}
