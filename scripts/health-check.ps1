# health-check.ps1
param([string]$url = "https://claw-app-2026.pages.dev/")
try {
    $wc = New-Object System.Net.WebClient
    $wc.Headers.Add("User-Agent", "ClawBot")
    $r = $wc.DownloadString($url)
    Write-Host "OK: $url"
} catch {
    Write-Host ("FAIL: $url - " + $_.Exception.Message)
    exit 1
}
