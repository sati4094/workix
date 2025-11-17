# Test script to diagnose login issues

Write-Host "`n🔍 Testing Workix Backend & Web Admin Connection..." -ForegroundColor Cyan
Write-Host "====================================================`n" -ForegroundColor Cyan

# Test 1: Backend Health
Write-Host "Test 1: Checking backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
    if ($health.status -eq "healthy") {
        Write-Host "   ✅ Backend is healthy!" -ForegroundColor Green
        Write-Host "   Environment: $($health.environment)" -ForegroundColor Gray
        Write-Host "   Uptime: $($health.uptime) seconds`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Backend health check failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Make sure backend is running: npm run dev`n" -ForegroundColor Yellow
    exit
}

# Test 2: Login API
Write-Host "Test 2: Testing login API..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@workix.com"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    if ($loginResponse.success) {
        Write-Host "   ✅ Login API works!" -ForegroundColor Green
        Write-Host "   User: $($loginResponse.data.user.name)" -ForegroundColor Gray
        Write-Host "   Role: $($loginResponse.data.user.role)" -ForegroundColor Gray
        Write-Host "   Token received: $($loginResponse.data.token.Substring(0,20))...`n" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Login API failed!" -ForegroundColor Red
    Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
    exit
}

# Test 3: CORS Configuration
Write-Host "Test 3: Checking CORS configuration..." -ForegroundColor Yellow
$corsConfig = Select-String -Path "backend\.env" -Pattern "CORS_ORIGIN"
Write-Host "   CORS Setting: $($corsConfig.Line)" -ForegroundColor Gray
if ($corsConfig.Line -match "3025") {
    Write-Host "   ✅ CORS includes port 3025!`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ CORS missing port 3025!" -ForegroundColor Red
    Write-Host "   Update backend/.env CORS_ORIGIN to include http://localhost:3025`n" -ForegroundColor Yellow
}

# Test 4: Web Admin Config
Write-Host "Test 4: Checking web admin configuration..." -ForegroundColor Yellow
if (Test-Path "web-admin\.env.local") {
    $apiUrl = Get-Content "web-admin\.env.local" | Select-String "NEXT_PUBLIC_API_URL"
    Write-Host "   API URL: $($apiUrl.Line)" -ForegroundColor Gray
    Write-Host "   ✅ .env.local exists!`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ .env.local not found!" -ForegroundColor Red
    Write-Host "   Create web-admin/.env.local with: NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`n" -ForegroundColor Yellow
}

# Test 5: Port Status
Write-Host "Test 5: Checking if ports are listening..." -ForegroundColor Yellow
$backend = netstat -an | Select-String ":5000.*LISTENING"
$webapp = netstat -an | Select-String ":3025.*LISTENING"

if ($backend) {
    Write-Host "   ✅ Backend listening on port 5000" -ForegroundColor Green
} else {
    Write-Host "   ❌ Nothing listening on port 5000" -ForegroundColor Red
}

if ($webapp) {
    Write-Host "   ✅ Web admin listening on port 3025`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Nothing listening on port 3025`n" -ForegroundColor Red
}

# Summary
Write-Host "====================================================`n" -ForegroundColor Cyan
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "If all tests passed, the issue is in the browser/frontend." -ForegroundColor White
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Open browser: http://localhost:3025/login" -ForegroundColor White
Write-Host "2. Press F12 (Developer Tools)" -ForegroundColor White
Write-Host "3. Go to Network tab" -ForegroundColor White
Write-Host "4. Try to login" -ForegroundColor White
Write-Host "5. Check the request to /auth/login" -ForegroundColor White
Write-Host "6. Look at Response tab for actual error`n" -ForegroundColor White

Write-Host "📝 Check these in browser console:" -ForegroundColor Yellow
Write-Host "- CORS errors (Access-Control-Allow-Origin)" -ForegroundColor Gray
Write-Host "- Network errors (Failed to fetch)" -ForegroundColor Gray
Write-Host "- Status codes (401, 404, 500, etc.)`n" -ForegroundColor Gray

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

