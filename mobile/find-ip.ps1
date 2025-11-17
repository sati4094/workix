# Script to find your computer's IP address for mobile app configuration

Write-Host "`n🔍 Finding your IP address for mobile app..." -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Get all network adapters
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notmatch "^127\." -and
    $_.IPAddress -notmatch "^169\.254\." -and
    $_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual"
}

if ($adapters) {
    Write-Host "✅ Found the following IP addresses:`n" -ForegroundColor Green
    
    foreach ($adapter in $adapters) {
        $interface = Get-NetAdapter | Where-Object { $_.ifIndex -eq $adapter.InterfaceIndex }
        Write-Host "   Interface: $($interface.Name)" -ForegroundColor Yellow
        Write-Host "   IP Address: $($adapter.IPAddress)" -ForegroundColor White
        Write-Host "   Status: $($interface.Status)`n" -ForegroundColor Gray
    }
    
    # Get the most likely active adapter
    $activeAdapter = $adapters | Select-Object -First 1
    $activeIP = $activeAdapter.IPAddress
    
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "🎯 Recommended IP to use: $activeIP" -ForegroundColor Green
    Write-Host "================================================`n" -ForegroundColor Cyan
    
    Write-Host "📝 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Open: workix\mobile\src\config\api.js" -ForegroundColor White
    Write-Host "2. Find line 6 with 'http://10.0.2.2:5000/api/v1'" -ForegroundColor White
    Write-Host "3. Replace with: 'http://$($activeIP):5000/api/v1'" -ForegroundColor Yellow
    Write-Host "4. Save the file" -ForegroundColor White
    Write-Host "5. Restart Expo (Ctrl+C then 'npx expo start')`n" -ForegroundColor White
    
    Write-Host "⚠️  Note:" -ForegroundColor Yellow
    Write-Host "- Use 10.0.2.2 for Android Emulator" -ForegroundColor Gray
    Write-Host "- Use $activeIP for real phone or iOS simulator" -ForegroundColor Gray
    Write-Host "- Make sure your phone is on the same WiFi network`n" -ForegroundColor Gray
    
} else {
    Write-Host "❌ Could not find an active network connection" -ForegroundColor Red
    Write-Host "   Make sure you're connected to WiFi or Ethernet`n" -ForegroundColor Yellow
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


