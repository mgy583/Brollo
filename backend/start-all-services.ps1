# 启动所有后端服务的脚本

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "启动 ABook 后端服务" -ForegroundColor Cyan  
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 设置环境变量
$env:MONGO_URI = "mongodb://localhost:27017"
$env:REDIS_URI = "redis://localhost:6379"
$env:JWT_SECRET = "abook_secret_key_for_development"

Set-Location E:\workspace\abook\backend

# 检查数据库连接
Write-Host "检查数据库连接..." -ForegroundColor Yellow

# 检查 MongoDB
try {
    $mongoTest = Test-NetConnection -ComputerName localhost -Port 27017 -WarningAction SilentlyContinue
    if ($mongoTest.TcpTestSucceeded) {
        Write-Host "✓ MongoDB 运行中 (Port 27017)" -ForegroundColor Green
    } else {
        Write-Host "✗ MongoDB 未运行 - 请先启动 MongoDB" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ MongoDB 连接失败" -ForegroundColor Red
}

# 检查 Redis
try {
    $redisTest = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
    if ($redisTest.TcpTestSucceeded) {
        Write-Host "✓ Redis 运行中 (Port 6379)" -ForegroundColor Green
    } else {
        Write-Host "✗ Redis 未运行 - 请先启动 Redis" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Redis 连接失败" -ForegroundColor Red
}

Write-Host ""
Write-Host "数据库连接正常，开始启动服务..." -ForegroundColor Green
Write-Host ""

# 定义服务列表
$services = @(
    @{Name="user-service"; Port=3000; Description="用户服务"}
    @{Name="account-service"; Port=3001; Description="账户服务"}
    @{Name="transaction-service"; Port=3002; Description="交易服务"}
    @{Name="budget-service"; Port=3003; Description="预算服务"}
    @{Name="report-service"; Port=3004; Description="报表服务"}
    @{Name="quote-service"; Port=3005; Description="汇率服务"}
)

# 启动所有服务
foreach ($service in $services) {
    Write-Host "启动 $($service.Description) (Port $($service.Port))..." -ForegroundColor Cyan
    
    # 在新的 PowerShell 窗口中启动服务
    $command = "cd E:\workspace\abook\backend; `$env:MONGO_URI='mongodb://localhost:27017'; `$env:REDIS_URI='redis://localhost:6379'; `$env:JWT_SECRET='abook_secret_key'; cargo run -p $($service.Name)"
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $command
    
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "所有服务启动完成！" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "服务列表:" -ForegroundColor Yellow
foreach ($service in $services) {
    Write-Host "  - $($service.Description): http://localhost:$($service.Port)" -ForegroundColor White
}
Write-Host ""
Write-Host "前端地址: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tip: Each service runs in a separate window" -ForegroundColor Gray
