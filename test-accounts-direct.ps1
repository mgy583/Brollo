$token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI2NzRlYzk2YTQyYjM4ZTQ5ZDgxNzRjZjUiLCJ1c2VybmFtZSI6InRlc3R1c2VyMTc2NDc1MTM2NSIsImV4cCI6MTczMzMyNzk4Nn0.VjaCVFGXUYTkx06QxLGH0oUGhxJxTKg0AW7wWGSVIhM"

Write-Host "`n测试1: 通过 nginx (localhost:80) 访问"
try {
    $response = Invoke-WebRequest -Uri "http://localhost/api/accounts" `
        -Method POST `
        -Headers @{Authorization="Bearer $token"} `
        -Body (@{name="测试账户";account_type="savings";currency="CNY";initial_balance=1000.0} | ConvertTo-Json) `
        -ContentType "application/json"
    Write-Host "✓ 成功 (Status: $($response.StatusCode))"
    Write-Host $response.Content
} catch {
    Write-Host "✗ 失败 (Status: $($_.Exception.Response.StatusCode.value__))"
}

Write-Host "`n测试2: 直接访问 account-service (localhost:3001)"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/accounts" `
        -Method POST `
        -Headers @{Authorization="Bearer $token"} `
        -Body (@{name="测试账户2";account_type="savings";currency="CNY";initial_balance=2000.0} | ConvertTo-Json) `
        -ContentType "application/json"
    Write-Host "✓ 成功 (Status: $($response.StatusCode))"
    Write-Host $response.Content
} catch {
    Write-Host "✗ 失败 (Status: $($_.Exception.Response.StatusCode.value__))"
}
