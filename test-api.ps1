#!/usr/bin/env pwsh
# ABook 系统功能测试脚本

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "    ABook 系统功能测试" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ErrorActionPreference = "Continue"
$testsPassed = 0
$testsFailed = 0

function Test-API {
    param($Name, $ScriptBlock)
    Write-Host "[$Name]" -ForegroundColor Yellow
    try {
        & $ScriptBlock
        $script:testsPassed++
        Write-Host "  ✓ 通过`n" -ForegroundColor Green
    } catch {
        $script:testsFailed++
        Write-Host "  ✗ 失败: $($_.Exception.Message)`n" -ForegroundColor Red
    }
}

# 生成测试数据
$random = Get-Random -Maximum 99999
$testUsername = "testuser_$random"
$testPassword = "Test123456"
$testEmail = "test_${random}@example.com"

# 测试1: 用户注册
Test-API "1. 用户注册" {
    $body = @{
        username = $script:testUsername
        password = $script:testPassword
        email = $script:testEmail
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/register" `
        -Method POST -Body $body -ContentType "application/json"
    
    if (-not $response.success) { throw "注册失败" }
    $script:accessToken = $response.data.access_token
    Write-Host "    用户名: $($response.data.user.username)" -ForegroundColor Gray
    Write-Host "    用户ID: $($response.data.user._id)" -ForegroundColor Gray
}

# 测试2: 用户登录
Test-API "2. 用户登录" {
    $body = @{
        username = $script:testUsername
        password = $script:testPassword
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/login" `
        -Method POST -Body $body -ContentType "application/json"
    
    if (-not $response.success) { throw "登录失败" }
    $script:accessToken = $response.data.access_token
    Write-Host "    获取新 Token" -ForegroundColor Gray
}

# 测试3: 获取用户资料
Test-API "3. 获取用户资料" {
    $headers = @{ "Authorization" = "Bearer $($script:accessToken)" }
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/profile" `
        -Method GET -Headers $headers
    
    if (-not $response.success) { throw "获取资料失败" }
    Write-Host "    邮箱: $($response.data.email)" -ForegroundColor Gray
    Write-Host "    状态: $($response.data.status)" -ForegroundColor Gray
}

# 测试4: 创建账户
Test-API "4. 创建账户" {
    $headers = @{ "Authorization" = "Bearer $($script:accessToken)" }
    $body = @{
        name = "测试银行账户"
        account_type = "checking"
        currency = "CNY"
        initial_balance = 10000.0
        current_balance = 10000.0
        icon = "bank"
        color = "#1890ff"
        is_excluded_from_total = $false
        status = "active"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/accounts" `
        -Method POST -Body $body -ContentType "application/json" -Headers $headers
    
    if (-not $response.success) { throw "创建账户失败" }
    $script:accountId = $response.data.id
    Write-Host "    账户ID: $($response.data.id)" -ForegroundColor Gray
    Write-Host "    余额: ¥$($response.data.current_balance)" -ForegroundColor Gray
}

# 测试5: 获取账户列表
Test-API "5. 获取账户列表" {
    $headers = @{ "Authorization" = "Bearer $($script:accessToken)" }
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/accounts?page=1&amp;page_size=10" `
        -Method GET -Headers $headers
    
    if (-not $response.success) { throw "获取账户列表失败" }
    Write-Host "    总数: $($response.data.pagination.total)" -ForegroundColor Gray
    Write-Host "    当前页: $($response.data.items.Count) 个账户" -ForegroundColor Gray
}

# 测试6: 创建交易分类
Test-API "6. 创建交易分类" {
    $headers = @{ "Authorization" = "Bearer $($script:accessToken)" }
    $body = @{
        name = "餐饮"
        category_type = "expense"
        icon = "food"
        color = "#ff4d4f"
        order = 1
        is_system = $false
        is_archived = $false
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/categories" `
        -Method POST -Body $body -ContentType "application/json" -Headers $headers
    
    if (-not $response.success) { throw "创建分类失败" }
    $script:categoryId = $response.data.id
    Write-Host "    分类ID: $($response.data.id)" -ForegroundColor Gray
    Write-Host "    分类名: $($response.data.name)" -ForegroundColor Gray
}

# 测试7: 创建交易记录
Test-API "7. 创建交易记录" {
    $headers = @{ "Authorization" = "Bearer $($script:accessToken)" }
    
    if (-not $script:accountId) { throw "需要先创建账户" }
    if (-not $script:categoryId) { throw "需要先创建分类" }
    
    $body = @{
        transaction_type = "expense"
        amount = 50.0
        currency = "CNY"
        account_id = $script:accountId
        category_id = $script:categoryId
        description = "午餐"
        transaction_date = (Get-Date).ToUniversalTime().ToString("o")
        status = "completed"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/transactions" `
        -Method POST -Body $body -ContentType "application/json" -Headers $headers
    
    if (-not $response.success) { throw "创建交易失败" }
    $script:transactionId = $response.data.id
    Write-Host "    交易ID: $($response.data.id)" -ForegroundColor Gray
    Write-Host "    金额: ¥$($response.data.amount)" -ForegroundColor Gray
}

# 测试8: 获取交易列表
Test-API "8. 获取交易列表" {
    $headers = @{ "Authorization" = "Bearer $($script:accessToken)" }
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/transactions?page=1&amp;page_size=10" `
        -Method GET -Headers $headers
    
    if (-not $response.success) { throw "获取交易列表失败" }
    Write-Host "    总数: $($response.data.pagination.total)" -ForegroundColor Gray
}

# 测试9: 创建预算
Test-API "9. 创建预算" {
    $headers = @{ "Authorization" = "Bearer $($script:accessToken)" }
    
    if (-not $script:categoryId) { throw "需要先创建分类" }
    
    $startDate = Get-Date -Day 1
    $endDate = $startDate.AddMonths(1).AddDays(-1)
    
    $body = @{
        name = "餐饮预算"
        budget_type = "monthly"
        start_date = $startDate.ToUniversalTime().ToString("o")
        end_date = $endDate.ToUniversalTime().ToString("o")
        amount = 1000.0
        currency = "CNY"
        category_ids = @($script:categoryId)
        account_ids = @()
        spent = 0.0
        remaining = 1000.0
        progress = 0.0
        alert_thresholds = @(
            @{ percentage = 80; notified = $false }
        )
        status = "active"
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/budgets" `
        -Method POST -Body $body -ContentType "application/json" -Headers $headers
    
    if (-not $response.success) { throw "创建预算失败" }
    $script:budgetId = $response.data.id
    Write-Host "    预算ID: $($response.data.id)" -ForegroundColor Gray
    Write-Host "    预算金额: ¥$($response.data.amount)" -ForegroundColor Gray
}

# 测试10: 获取预算列表
Test-API "10. 获取预算列表" {
    $headers = @{ "Authorization" = "Bearer $($script:accessToken)" }
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/budgets?page=1&amp;page_size=10" `
        -Method GET -Headers $headers
    
    if (-not $response.success) { throw "获取预算列表失败" }
    Write-Host "    总数: $($response.data.pagination.total)" -ForegroundColor Gray
}

# 测试11: 获取交易统计
Test-API "11. 获取交易统计" {
    $headers = @{ "Authorization" = "Bearer $($script:accessToken)" }
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/transactions/statistics" `
        -Method GET -Headers $headers
    
    if (-not $response.success) { throw "获取统计失败" }
    Write-Host "    总收入: ¥$($response.data.total_income)" -ForegroundColor Gray
    Write-Host "    总支出: ¥$($response.data.total_expense)" -ForegroundColor Gray
    Write-Host "    交易数: $($response.data.transaction_count)" -ForegroundColor Gray
}

# 测试12: 获取月度报表
Test-API "12. 获取月度报表" {
    $headers = @{ "Authorization" = "Bearer $($script:accessToken)" }
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/report/monthly" `
        -Method GET -Headers $headers
    
    if (-not $response.success) { throw "获取报表失败" }
    Write-Host "    总收入: ¥$($response.data.total_income)" -ForegroundColor Gray
    Write-Host "    总支出: ¥$($response.data.total_expense)" -ForegroundColor Gray
}

# 测试13: 汇率查询
Test-API "13. 汇率查询" {
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/quote?from=USD&amp;to=CNY" `
        -Method GET
    
    if (-not $response.success) { throw "汇率查询失败" }
    Write-Host "    汇率对: $($response.data.pair)" -ForegroundColor Gray
    Write-Host "    汇率: $($response.data.rate)" -ForegroundColor Gray
}

# 测试14: 货币转换
Test-API "14. 货币转换" {
    $response = Invoke-RestMethod -Uri "http://localhost:5173/api/convert?from=USD&amp;to=CNY&amp;amount=100" `
        -Method GET
    
    if (-not $response.success) { throw "货币转换失败" }
    Write-Host "    原金额: $($response.data.original_amount) $($response.data.from_currency)" -ForegroundColor Gray
    Write-Host "    转换后: $($response.data.converted_amount) $($response.data.to_currency)" -ForegroundColor Gray
}

# 输出测试结果
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "           测试结果汇总" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "通过: $testsPassed 个" -ForegroundColor Green
Write-Host "失败: $testsFailed 个" -ForegroundColor $(if($testsFailed -gt 0){"Red"}else{"Green"})
$total = $testsPassed + $testsFailed
$percentage = [math]::Round(($testsPassed / $total) * 100, 2)
Write-Host "成功率: $percentage%" -ForegroundColor $(if($percentage -eq 100){"Green"}else{"Yellow"})
Write-Host "========================================`n" -ForegroundColor Cyan

if ($testsFailed -eq 0) {
    Write-Host "🎉 所有测试通过！系统运行正常。" -ForegroundColor Green
} else {
    Write-Host "⚠️ 部分测试失败，请检查日志。" -ForegroundColor Yellow
}
