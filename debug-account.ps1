Write-Host "=== DEBUG 账户创建 ===" -ForegroundColor Cyan

# 1. 注册
$reg = Invoke-RestMethod -Uri "http://localhost/api/register" -Method Post -Body (@{username="debuguser";email="debuguser@test.com";password="Test123"}|ConvertTo-Json) -ContentType "application/json"
$token = $reg.data.access_token
Write-Host "Token: $($token.Substring(0,50))..." -ForegroundColor Gray

# 2. 测试直接访问 account-service (绕过nginx)
Write-Host "`n直接访问 localhost:3001/accounts (绕过nginx)" -ForegroundColor Yellow
try {
    $acc1 = Invoke-RestMethod -Uri "http://localhost:3001/accounts" -Method Post -Body (@{name="Direct";account_type="checking";currency="USD";initial_balance=1000}|ConvertTo-Json) -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
    Write-Host "✓ 成功! 账户: $($acc1.data.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ 失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. 测试通过 nginx
Write-Host "`n通过 nginx /api/accounts" -ForegroundColor Yellow
try {
    $acc2 = Invoke-RestMethod -Uri "http://localhost/api/accounts" -Method Post -Body (@{name="Nginx";account_type="savings";currency="CNY";initial_balance=5000}|ConvertTo-Json) -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
    Write-Host "✓ 成功! 账户: $($acc2.data.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ 失败 (Status: $($_.Exception.Response.StatusCode.value__)): $($_.Exception.Message)" -ForegroundColor Red
}
