# Quick Start - Just User Service

Write-Host "Starting User Service (Port 3000)..." -ForegroundColor Green
Write-Host "This is the login/register service" -ForegroundColor Yellow
Write-Host ""

Set-Location E:\workspace\abook\backend

$env:MONGO_URI = "mongodb://localhost:27017"
$env:REDIS_URI = "redis://localhost:6379"  
$env:JWT_SECRET = "abook_secret_key"

cargo run -p user-service
