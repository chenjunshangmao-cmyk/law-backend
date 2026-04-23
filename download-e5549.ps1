$baseUrl = "https://e5549ccf.claw-app-2026.pages.dev"
$outDir = "c:\Users\Administrator\WorkBuddy\Claw\complete-deploy"
$failed = 0; $ok = 0

# Ensure output dirs
New-Item -ItemType Directory -Path "$outDir\assets" -Force | Out-Null

# 1. Download index.html
Write-Host "[1] Downloading index.html..."
$html = curl.exe -s -L "$baseUrl/"
$html | Out-File "$outDir\index.html" -Encoding UTF8
$ok++
Write-Host "  [OK] index.html ($($html.Length) bytes)"

# 2. Extract asset refs from app.js and app.css
Write-Host "[2] Downloading app.js (contains all chunk refs)..."
$appjs = curl.exe -s -L "$baseUrl/assets/app.js"

# Also download app.css  
Write-Host "[3] Downloading app.css..."
$appcss = curl.exe -s -L "$baseUrl/assets/app.css"
$appcss | Out-File "$outDir\assets\app.css" -Encoding UTF8
$ok++

# Write app.js to temp to extract refs
$appjs | Out-File "$outDir\assets\app.js" -Encoding UTF8
$ok++

# 3. Extract dynamic chunk references from app.js
Write-Host "[4] Extracting chunk refs from app.js..."
$chunkPattern = '"assets/([^"]+\.js)"'
$matches = [regex]::Matches($appjs, $chunkPattern)
$chunks = $matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique

Write-Host "  Found $($chunks.Count) JS chunks in app.js"

# Also look for css refs
$cssPattern = '"assets/([^"]+\.css)"'
$cssMatches = [regex]::Matches($appjs, $cssPattern)
$cssChunks = $cssMatches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
$allCss = @("assets/app.css") + $cssChunks | Select-Object -Unique

# Also from app.css
if ($appcss -match 'url\(["'"'"']?([^)"'"'"']+)["'"'"']?\)') {
    $extraCss = [regex]::Matches($appcss, 'url\(["'"'"']?([^)"'"'"'\)]+)["'"'"']?\)') | ForEach-Object { $_.Groups[1].Value } | Where-Object { $_ -match '\.css$' }
    $allCss = ($allCss + $extraCss) | Select-Object -Unique
}

# 4. Download all CSS chunks
Write-Host "[5] Downloading $($allCss.Count) CSS files..."
foreach ($css in $allCss) {
    $localPath = Join-Path $outDir $css
    if (-not (Test-Path $localPath)) {
        $url = if ($css -match '^https?://') { $css } else { "$baseUrl/$css" }
        $status = (curl.exe -o "$localPath" -L -w "%{http_code}" -s "$url")[-1]
        if ($status -eq "200") { $ok++; Write-Host "  [OK] $css" }
        else { $failed++; Write-Host "  [FAIL] $css (HTTP $status)" }
    }
}

# 5. Download all JS chunks
Write-Host "[6] Downloading $($chunks.Count) JS chunks..."
foreach ($chunk in $chunks) {
    $localPath = Join-Path $outDir $chunk
    if (-not (Test-Path $localPath)) {
        $url = if ($chunk -match '^https?://') { $chunk } else { "$baseUrl/$chunk" }
        $status = (curl.exe -o "$localPath" -L -w "%{http_code}" -s "$url")[-1]
        if ($status -eq "200") { $ok++; Write-Host "  [OK] $chunk" }
        else { $failed++; Write-Host "  [FAIL] $chunk (HTTP $status)" }
    }
}

# 6. Download other known assets
Write-Host "[7] Downloading other assets..."
$otherAssets = @(
    "assets/favicon.svg", "assets/building-2-lVXkzonG.js",
    "assets/circle-x-BLvES6cf.js", "assets/external-link-CG7Kg4mT.js",
    "assets/refresh-cw-BhxJ_MTF.js", "assets/shield-NsWRgIpi.js",
    "assets/shopping-bag-qJtKXq5V.js", "assets/trash-2-siSrgMXK.js",
    "assets/upload-orpDW_tJ.js", "assets/users-BeUwJ-7w.js",
    "assets/video-Dd4YZ7pM.js", "assets/video-XrUIltFi.js",
    "assets/zap-C7wl6_UV.js"
)
foreach ($asset in $otherAssets) {
    $localPath = Join-Path $outDir $asset
    if (-not (Test-Path $localPath)) {
        $url = "$baseUrl/$asset"
        $status = (curl.exe -o "$localPath" -L -w "%{http_code}" -s "$url")[-1]
        if ($status -eq "200") { $ok++; Write-Host "  [OK] $asset" }
        else { $failed++; Write-Host "  [SKIP] $asset (HTTP $status)" }
    }
}

# Count total files
$total = (Get-ChildItem -Recurse $outDir | Measure-Object).Count

Write-Host ""
Write-Host "=== DONE: $ok OK, $failed failed, total $($total) files ==="
