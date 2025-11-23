# Quick Mobile App Health Check

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Mobile App Health Check" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

$allGood = $true

# 1. Check Backend
Write-Host ""
Write-Host "[1/4] Checking Backend..." -ForegroundColor Yellow
try {
    $body = @{email="admin@workix.com";password="Admin@123"} | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "http://192.168.1.13:5000/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  OK Backend is running and accessible" -ForegroundColor Green
}
catch {
    Write-Host "  FAIL Backend not accessible" -ForegroundColor Red
    $allGood = $false
}

# 2. Check API Config
Write-Host ""
Write-Host "[2/4] Checking API Configuration..." -ForegroundColor Yellow
$apiConfigPath = "src\config\api.js"
if (Test-Path $apiConfigPath) {
    $content = Get-Content $apiConfigPath -Raw
    if ($content -match "192") {
        Write-Host "  OK API Config has correct IP" -ForegroundColor Green
    }
    else {
        Write-Host "  WARN Could not verify IP" -ForegroundColor Yellow
    }
}
else {
    Write-Host "  FAIL API config file not found" -ForegroundColor Red
    $allGood = $false
}

# 3. Check Node Modules
Write-Host ""
Write-Host "[3/4] Checking Dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  OK node_modules exists" -ForegroundColor Green
}
else {
    Write-Host "  FAIL node_modules missing" -ForegroundColor Red
    $allGood = $false
}

# 4. Check Expo
Write-Host ""
Write-Host "[4/4] Checking Expo..." -ForegroundColor Yellow
if (Test-Path "node_modules\expo") {
    Write-Host "  OK Expo is installed" -ForegroundColor Green
}
else {
    Write-Host "  FAIL Expo not found" -ForegroundColor Red
    $allGood = $false
}

# Summary
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "   ALL CHECKS PASSED" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ready to start:" -ForegroundColor White
    Write-Host "  npm start" -ForegroundColor Cyan
}
else {
    Write-Host "   SOME CHECKS FAILED" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please fix issues above" -ForegroundColor White
}

Write-Host ""
