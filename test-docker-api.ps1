# Docker API 测试脚本
# 用法: .\test-docker-api.ps1

Write-Host "`n========== Docker 部署 API 测试 ==========" -ForegroundColor Cyan

# 生成随机测试用户
$timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
$testUser = "testuser$timestamp"
$testEmail = "$testUser@test.com"

# 1. 测试用户注册
Write-Host "`n[1/4] 测试用户注册..." -ForegroundColor Yellow
$regBody = @{
    username = $testUser
    email = $testEmail
    password = "Test123456"
} | ConvertTo-Json -Compress

try {
    $regResp = Invoke-RestMethod -Uri "http://localhost/api/register" -Method Post -Body $regBody -ContentType "application/json"
    Write-Host "  ✓ 注册成功" -ForegroundColor Green
    Write-Host "    用户: $($regResp.data.user.username)" -ForegroundColor Gray
    Write-Host "    邮箱: $($regResp.data.user.email)" -ForegroundColor Gray
    $token = $regResp.data.access_token
} catch {
    Write-Host "  ✗ 注册失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "    状态码: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    exit 1
}

# 2. 测试用户登录
Write-Host "`n[2/4] 测试用户登录..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = "Test123456"
} | ConvertTo-Json -Compress

try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost/api/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "  ✓ 登录成功" -ForegroundColor Green
    $token = $loginResp.data.access_token
} catch {
    Write-Host "  ✗ 登录失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. 测试账户创建
Write-Host "`n[3/4] 测试创建账户..." -ForegroundColor Yellow
$accBody = @{
    name = "测试储蓄账户"
    account_type = "savings"
    currency = "CNY"
    initial_balance = 10000
    current_balance = 10000
    is_excluded_from_total = $false
    status = "active"
} | ConvertTo-Json -Compress

try {
    $accResp = Invoke-RestMethod -Uri "http://localhost/api/accounts" -Method Post -Body $accBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
    Write-Host "  ✓ 账户创建成功" -ForegroundColor Green
    Write-Host "    名称: $($accResp.data.name)" -ForegroundColor Gray
    Write-Host "    余额: $($accResp.data.currency) $($accResp.data.current_balance)" -ForegroundColor Gray
    $accountId = $accResp.data._id
} catch {
    Write-Host "  ✗ 账户创建失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. 测试交易创建
Write-Host "`n[4/4] 测试创建交易..." -ForegroundColor Yellow
$txBody = @{
    account_id = $accountId
    category_id = "000000000000000000000001"
    amount = 500
    currency = "CNY"
    transaction_type = "expense"
    description = "Docker测试交易"
    transaction_date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    status = "completed"
} | ConvertTo-Json -Compress

try {
    $txResp = Invoke-RestMethod -Uri "http://localhost/api/transactions" -Method Post -Body $txBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
    Write-Host "  ✓ 交易创建成功" -ForegroundColor Green
    Write-Host "    类型: $($txResp.data.transaction_type)" -ForegroundColor Gray
    Write-Host "    金额: $($txResp.data.currency) $($txResp.data.amount)" -ForegroundColor Gray
    Write-Host "    描述: $($txResp.data.description)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ 交易创建失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. 测试获取汇率
Write-Host "`n[5/5] 测试汇率查询..." -ForegroundColor Yellow
try {
    $quoteResp = Invoke-RestMethod -Uri "http://localhost/api/quotes/exchange-rate?from=USD&to=CNY&amount=100" -Method Get
    Write-Host "  ✓ 汇率查询成功" -ForegroundColor Green
    Write-Host "    汇率: 1 USD = $($quoteResp.data.rate) CNY" -ForegroundColor Gray
    Write-Host "    100 USD = $($quoteResp.data.converted_amount) CNY" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ 汇率查询失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========== 测试完成 ==========" -ForegroundColor Cyan
Write-Host "✓ 所有核心功能运行正常！" -ForegroundColor Green
Write-Host "`n访问前端: http://localhost" -ForegroundColor Cyan
