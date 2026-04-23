$baseUrl = "https://e5549ccf.claw-app-2026.pages.dev"
$outDir = "c:\Users\Administrator\WorkBuddy\Claw\complete-deploy"
$failed = @()
$ok = @()

# Ensure output dir
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory $outDir | Out-Null }

function Download-File($url, $localPath) {
    $dir = Split-Path $localPath -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory $dir -Force | Out-Null }
    try {
        $r = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 30 -MaximumRetryCount 2 -RetryIntervalSec 1
        # decode if Cloudflare returns encoded
        if ($r.Content -match '^桦临汇\x08\x08[\s\S]+') {
            [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($r.Content.Substring(10))) | Set-Content $localPath -Encoding UTF8 -NoNewline
        } else {
            Set-Content -Path $localPath -Value $r.Content -Encoding UTF8 -NoNewline
        }
        Write-Host "[OK] $url -> $localPath"
        $script:ok += $url
    } catch {
        Write-Host "[FAIL] $url : $($_.Exception.Message)"
        $script:failed += $url
    }
}

# Step 1: Get index.html to find asset references
Write-Host "Fetching index.html..."
$html = (Invoke-WebRequest -Uri "$baseUrl/" -Method GET -TimeoutSec 30).Content
$html | Out-File "$outDir\index.html" -Encoding UTF8
$script:ok += "$baseUrl/"

# Step 2: Extract all JS and CSS refs from HTML
$jsFiles = [regex]::Matches($html, 'src=["'"'"']([^"'"'"']+\.js)["'"'"']') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
$cssFiles = [regex]::Matches($html, 'href=["'"'"']([^"'"'"']+\.css)["'"'"']') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique

# Step 3: Download assets from index.html paths
$allUrls = @()
foreach ($f in $jsFiles) {
    if ($f -notmatch '^https?://') { $allUrls += "$baseUrl$f" } else { $allUrls += $f }
}
foreach ($f in $cssFiles) {
    if ($f -notmatch '^https?://') { $allUrls += "$baseUrl$f" } else { $allUrls += $f }
}
$allUrls = $allUrls | Select-Object -Unique

Write-Host "Downloading $($allUrls.Count) assets..."
foreach ($url in $allUrls) {
    $relPath = $url -replace [regex]::Escape($baseUrl + '/'), ''
    $localPath = Join-Path $outDir $relPath
    Download-File $url $localPath
}

# Step 4: Also try the assets/ folder
$assetFiles = @(
    "assets/app.js", "assets/app.css", "assets/app-styles.css",
    "assets/index-BmCeXBoo.js", "assets/chat-widget.js",
    "assets/platform-nav.js", "assets/building-2-lVXkzonG.js",
    "assets/circle-x-BLvES6cf.js", "assets/external-link-CG7Kg4mT.js",
    "assets/refresh-cw-BhxJ_MTF.js", "assets/shield-NsWRgIpi.js",
    "assets/shopping-bag-qJtKXq5V.js", "assets/trash-2-siSrgMXK.js",
    "assets/upload-orpDW_tJ.js", "assets/users-BeUwJ-7w.js",
    "assets/video-Dd4YZ7pM.js", "assets/video-XrUIltFi.js",
    "assets/zap-C7wl6_UV.js"
)

foreach ($f in $assetFiles) {
    $url = "$baseUrl/$f"
    $localPath = Join-Path $outDir $f
    if (-not (Test-Path $localPath)) {
        Download-File $url $localPath
    }
}

Write-Host ""
Write-Host "=== Done ==="
Write-Host "OK: $($ok.Count)"
Write-Host "Failed: $($failed.Count)"
if ($failed.Count -gt 0) { Write-Host "Failed files:"; $failed | ForEach-Object { Write-Host "  $_" } }
