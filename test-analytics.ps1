# Test Analytics Dashboard API
Write-Host "Testing Analytics Dashboard API..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# First, login to get a valid token
Write-Host "Step 1: Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@workix.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "Login successful! Token obtained." -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test Dashboard Stats endpoint
Write-Host "Step 2: Testing /analytics/dashboard endpoint..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $dashboardResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/analytics/dashboard?timeRange=30" -Method Get -Headers $headers
    
    Write-Host "Dashboard Stats endpoint working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "KPIs:" -ForegroundColor Cyan
    Write-Host "  Total Work Orders: $($dashboardResponse.data.kpis.total_work_orders)"
    Write-Host "  Completed: $($dashboardResponse.data.kpis.completed)"
    Write-Host "  Completion Rate: $($dashboardResponse.data.kpis.completion_rate)%"
    Write-Host "  Avg Completion Hours: $($dashboardResponse.data.kpis.avg_completion_hours)h"
    Write-Host "  Active Technicians: $($dashboardResponse.data.kpis.active_technicians)"
    Write-Host ""
    
    Write-Host "SLA Compliance:" -ForegroundColor Cyan
    Write-Host "  Compliance Rate: $($dashboardResponse.data.slaCompliance.compliance_rate)%"
    Write-Host "  Violations: $($dashboardResponse.data.slaCompliance.violations)"
    Write-Host ""
    
    Write-Host "Trends Data Points: $($dashboardResponse.data.trends.Count)" -ForegroundColor Cyan
    Write-Host "Status Distribution: $($dashboardResponse.data.statusDistribution.Count)" -ForegroundColor Cyan
    Write-Host "Top Technicians: $($dashboardResponse.data.topTechnicians.Count)" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "Dashboard Stats failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# Test Real-time Metrics endpoint
Write-Host "Step 3: Testing /analytics/real-time endpoint..." -ForegroundColor Yellow
try {
    $realTimeResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/analytics/real-time" -Method Get -Headers $headers
    
    Write-Host "Real-time Metrics endpoint working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Real-time Metrics:" -ForegroundColor Cyan
    Write-Host "  Pending: $($realTimeResponse.data.pending_count)"
    Write-Host "  Active: $($realTimeResponse.data.active_count)"
    Write-Host "  Critical Open: $($realTimeResponse.data.critical_open)"
    Write-Host "  SLA Violations Today: $($realTimeResponse.data.sla_violations_today)"
    Write-Host "  Low Stock Items: $($realTimeResponse.data.low_stock_items)"
    Write-Host "  Unread Notifications: $($realTimeResponse.data.unread_notifications)"
    Write-Host "  Timestamp: $($realTimeResponse.timestamp)"
    Write-Host ""
    
} catch {
    Write-Host "Real-time Metrics failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Analytics API Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Open your browser to the Tauri app"
Write-Host "  2. Navigate to Dashboard > Analytics"
Write-Host "  3. Enjoy the visualizations!"
Write-Host ""
