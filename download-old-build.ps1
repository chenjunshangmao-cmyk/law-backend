# Try to get Cloudflare Pages deployment file list
$token = $env:CF_API_TOKEN

# Try without token first - list public files
try {
    $r = Invoke-WebRequest -Uri 'https://e5549ccf.claw-app-2026.pages.dev/' -Method GET -TimeoutSec 15
    Write-Host "Status: $($r.StatusCode)"
    Write-Host "Content length: $($r.Content.Length)"
} catch {
    Write-Host "Direct fetch failed: $($_.Exception.Message)"
}

# Try Cloudflare API
if ($token) {
    try {
        $api = Invoke-WebRequest -Uri 'https://api.cloudflare.com/client/v4/pages/projects/claw-app-2026/deployments/e5549ccf' `
            -Headers @{'Authorization'="Bearer $token"; 'Content-Type'='application/json'} `
            -Method GET -TimeoutSec 15 | ConvertFrom-Json
        if ($api.success) {
            Write-Host "Files count: $($api.result.files.Count)"
            $api.result.files | ForEach-Object { Write-Host $_.filename }
        } else {
            Write-Host "API error: $($api.errors)"
        }
    } catch {
        Write-Host "API failed: $($_.Exception.Message)"
    }
} else {
    Write-Host "No CF_API_TOKEN env var set"
}
