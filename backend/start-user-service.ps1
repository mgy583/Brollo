# 启动用户服务
Set-Location E:\workspace\abook\backend

$env:MONGO_URI = "mongodb://localhost:27017"
$env:REDIS_URI = "redis://localhost:6379"
$env:JWT_SECRET = "abook_secret_key_for_development"

Write-Host "正在启动用户服务 (Port 3000)..." -ForegroundColor Green
cargo run -p user-service
