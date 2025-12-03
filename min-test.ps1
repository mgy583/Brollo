# 最小化测试
Write-Host "=== 最小化测试 ===" -ForegroundColor Cyan

# 注册
$r = Invoke-RestMethod -Uri "http://localhost/api/register" -Method Post -Body '{"username":"mintest","email":"mintest@test.com","password":"Test123"}' -ContentType "application/json"
$t = $r.data.access_token

# 创建账户
Write-Host "`nPOST /api/accounts" -ForegroundColor Yellow
Write-Host "Token: $($t.Substring(0,30))..." -ForegroundColor Gray

$body = '{"name":"MinTest","account_type":"checking","currency":"USD","initial_balance":1000}'
Write-Host "Body: $body" -ForegroundColor Gray

try {
    $acc = Invoke-WebRequest -Uri "http://localhost/api/accounts" -Method Post -Body $body -ContentType "application/json" -Headers @{Authorization="Bearer $t"} -Verbose 4>&1
    Write-Host "✓ 成功: $($acc.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ 失败: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

# 检查日志
Write-Host "`nAccount Service 日志:" -ForegroundColor Cyan
docker logs abook-account-service --tail 5
