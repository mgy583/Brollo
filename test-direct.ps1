# 直接测试 account-service
Write-Host "测试 account-service" -ForegroundColor Cyan

# 1. 注册获取token
$reg = Invoke-RestMethod -Uri "http://localhost:3000/register" -Method Post -Body (@{username="directtest";email="directtest@test.com";password="Test123"}|ConvertTo-Json) -ContentType "application/json"
$token = $reg.data.access_token
Write-Host "Token获取: OK" -ForegroundColor Green

# 2. 直接访问3001端口
Write-Host "`n直接访问 localhost:3001/accounts" -ForegroundColor Yellow
$accBody = @{name="Direct Account";account_type="checking";currency="USD";balance=5000}|ConvertTo-Json
$acc = Invoke-RestMethod -Uri "http://localhost:3001/accounts" -Method Post -Body $accBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
Write-Host "创建成功: $($acc.data.name), Balance: $($acc.data.balance)" -ForegroundColor Green
