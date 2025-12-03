# 详细测试
Write-Host "=== 详细Token测试 ===" -ForegroundColor Cyan

# 1. 注册
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$regBody = @{
    username = "user$timestamp"
    email = "user$timestamp@test.com"
    password = "Test123456"
} | ConvertTo-Json

$reg = Invoke-RestMethod -Uri "http://localhost/api/register" -Method Post -Body $regBody -ContentType "application/json"
$token = $reg.data.access_token
Write-Host "Token长度: $($token.Length)" -ForegroundColor Gray
Write-Host "Token前缀: $($token.Substring(0,20))..." -ForegroundColor Gray

# 2. 测试profile（user服务自己的受保护路由）
Write-Host "`n测试 GET /api/profile (user-service)" -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "http://localhost/api/profile" -Method Get -Headers @{Authorization="Bearer $token"}
    Write-Host "✓ Profile成功! 用户: $($profile.data.username)" -ForegroundColor Green
} catch {
    Write-Host "✗ Profile失败: $_" -ForegroundColor Red
}

# 3. 测试account服务
Write-Host "`n测试 POST /api/accounts (account-service)" -ForegroundColor Yellow
$accBody = @{
    name = "Test Account"
    account_type = "checking"
    currency = "USD"
    initial_balance = 1000
} | ConvertTo-Json

try {
    $acc = Invoke-RestMethod -Uri "http://localhost/api/accounts" -Method Post -Body $accBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
    Write-Host "✓ Account成功! 账户: $($acc.data.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Account失败 (Status: $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    
    # 读取错误详情
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "错误详情: $errorBody" -ForegroundColor Yellow
}
