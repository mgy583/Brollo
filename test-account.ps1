# 测试account服务
$login = Invoke-RestMethod -Uri "http://localhost:3000/login" -Method Post -Body '{"email":"dockeruser@test.com","password":"Test123456"}' -ContentType "application/json"
$token = $login.data.access_token
Write-Host "Token: $($token.Substring(0,30))..." -ForegroundColor Cyan

Write-Host "`n测试直接访问 account-service:3001" -ForegroundColor Yellow
try {
    $acc = Invoke-RestMethod -Uri "http://localhost:3001/accounts" -Method Post -Body '{"name":"Direct","account_type":"checking","currency":"USD","balance":5000}' -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
    Write-Host "✓ 成功" -ForegroundColor Green
    $acc.data | Format-List name, balance
} catch {
    Write-Host "✗ 失败: $_" -ForegroundColor Red
}

Write-Host "`n测试通过 nginx /api/accounts" -ForegroundColor Yellow  
try {
    $acc2 = Invoke-RestMethod -Uri "http://localhost/api/accounts" -Method Post -Body '{"name":"Nginx","account_type":"savings","currency":"CNY","balance":10000}' -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
    Write-Host "✓ 成功" -ForegroundColor Green
    $acc2.data | Format-List name, balance
} catch {
    Write-Host "✗ 失败 (Status: $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
}
