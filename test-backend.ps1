# Test Render backend
$ErrorActionPreference = "Stop"
try {
    $r = Invoke-WebRequest -Uri "https://claw-backend-2026.onrender.com/api/auth/test" -TimeoutSec 15 -UseBasicParsing
    Write-Host "Status: $($r.StatusCode)"
    Write-Host "Content: $($r.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
