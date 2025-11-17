# Script to fix "Runtime not ready" error in Expo

Write-Host "`n🔧 Fixing Expo Runtime Error..." -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# 1. Clear Expo cache
Write-Host "1. Clearing Expo cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo-shared -ErrorAction SilentlyContinue
Write-Host "   ✓ Expo cache cleared`n" -ForegroundColor Green

# 2. Clear Metro bundler cache
Write-Host "2. Clearing Metro bundler cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $env:TEMP\metro-* -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $env:TEMP\haste-map-* -ErrorAction SilentlyContinue
Write-Host "   ✓ Metro cache cleared`n" -ForegroundColor Green

# 3. Clear React Native cache
Write-Host "3. Clearing React Native cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $env:TEMP\react-* -ErrorAction SilentlyContinue
Write-Host "   ✓ React Native cache cleared`n" -ForegroundColor Green

# 4. Clear npm cache
Write-Host "4. Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "   ✓ npm cache cleared`n" -ForegroundColor Green

Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ All caches cleared!`n" -ForegroundColor Green

Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Start Expo with clean cache:" -ForegroundColor White
Write-Host "   npx expo start -c" -ForegroundColor Yellow
Write-Host "`n2. If still having issues, reinstall dependencies:" -ForegroundColor White
Write-Host "   Remove-Item -Recurse -Force node_modules" -ForegroundColor Yellow
Write-Host "   npm install --legacy-peer-deps`n" -ForegroundColor Yellow

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

