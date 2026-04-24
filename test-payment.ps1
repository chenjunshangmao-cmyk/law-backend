$ErrorActionPreference = 'Stop'

function Get-Backend {
    $r = Invoke-WebRequest -Uri 'https://claw-backend-2026.onrender.com/api/health' -UseBasicParsing
    $r.Content
}

# Step 1: Register test user
$ts = Get-Date -Format 'HHmmss'
$email = "paytest_$ts@claw.com"
$body = @{
    email = $email
    password = 'Test123456'
    name = "支付测试$ts"
} | ConvertTo-Json

Write-Host "=== 注册用户: $email ==="
$r = Invoke-WebRequest -Uri 'https://claw-backend-2026.onrender.com/api/auth/register' -Method POST -ContentType 'application/json' -Body $body -UseBasicParsing
$r.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
$regData = $r.Content | ConvertFrom-Json
$token = $regData.token

if (-not $token) {
    Write-Host "❌ 注册失败，无token"
    exit 1
}

# Step 2: 创建基础版支付订单（¥1.9测试）
Write-Host "=== 创建基础版支付订单 ==="
$payBody = @{
    plan = 'basic'
} | ConvertTo-Json

$payHeaders = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

$r2 = Invoke-WebRequest -Uri 'https://claw-backend-2026.onrender.com/api/payment/create' -Method POST -Headers $payHeaders -Body $payBody -UseBasicParsing
$payResult = $r2.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
Write-Host $payResult

# Step 3: 创建业务服务支付订单（5000积分=¥50）
Write-Host "=== 创建业务服务支付订单 ==="
$svcBody = @{
    serviceId = 'domestic-op'
    serviceName = '国内代运营'
} | ConvertTo-Json

$r3 = Invoke-WebRequest -Uri 'https://claw-backend-2026.onrender.com/api/payment/create' -Method POST -Headers $payHeaders -Body $svcBody -UseBasicParsing
$svcResult = $r3.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
Write-Host $svcResult

Write-Host "=== 完成 ==="
