# Workix Launcher Script
# This script starts Docker, Backend, and Frontend servers
# Usage: 
#   .\Start-Workix.ps1         - Auto-detect mode
#   .\Start-Workix.ps1 -Dev    - Force development mode (backend + npm run dev)

param(
    [switch]$Dev,
    [switch]$Prod
)

$ErrorActionPreference = "SilentlyContinue"

$backendPath = "d:\OneDrive\Documents\GitHub\workix\backend"
$frontendPath = "d:\OneDrive\Documents\GitHub\workix\workix-desktop"
$tauriExePath = "d:\OneDrive\Documents\GitHub\workix\workix-desktop\src-tauri\target\release\workix-desktop.exe"
$debugExePath = "d:\OneDrive\Documents\GitHub\workix\workix-desktop\src-tauri\target\debug\workix-desktop.exe"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       WORKIX LAUNCHER                 " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Check and start Docker containers
# ============================================================================
Write-Host "[Step 1] Checking Docker containers..." -ForegroundColor Yellow

try {
    $timedbRunning = docker ps --filter "name=timedb" --format "{{.Names}}" 2>&1
    if ($timedbRunning -notmatch "timedb") {
        Write-Host "   Starting TimescaleDB..." -ForegroundColor Yellow
        docker start timedb 2>&1 | Out-Null
        Write-Host "   TimescaleDB started" -ForegroundColor Green
    } else {
        Write-Host "   TimescaleDB already running" -ForegroundColor Green
    }
} catch {
    Write-Host "   Warning: Could not check TimescaleDB" -ForegroundColor Yellow
}

try {
    $redisRunning = docker ps --filter "name=redis" --format "{{.Names}}" 2>&1
    if ($redisRunning -notmatch "redis") {
        Write-Host "   Starting Redis..." -ForegroundColor Yellow
        docker start redis 2>&1 | Out-Null
        Write-Host "   Redis started" -ForegroundColor Green
    } else {
        Write-Host "   Redis already running" -ForegroundColor Green
    }
} catch {
    Write-Host "   Warning: Could not check Redis" -ForegroundColor Yellow
}

Start-Sleep -Seconds 3

# ============================================================================
# STEP 2: Start Backend Server
# ============================================================================
Write-Host ""
Write-Host "[Step 2] Starting Backend Server..." -ForegroundColor Yellow

$backendRunning = $false
try {
    $test = Test-NetConnection -ComputerName localhost -Port 5000 -WarningAction SilentlyContinue
    $backendRunning = $test.TcpTestSucceeded
} catch {
    $backendRunning = $false
}

if ($backendRunning) {
    Write-Host "   Backend already running on port 5000" -ForegroundColor Green
} else {
    Write-Host "   Starting backend server..." -ForegroundColor Yellow
    
    # Start backend in a new window
    $backendCmd = "cd '$backendPath'; Write-Host 'WORKIX BACKEND SERVER' -ForegroundColor Cyan; Write-Host ''; node src/server.js"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
    
    # Wait for backend to be ready
    Write-Host "   Waiting for backend to start..." -ForegroundColor Gray
    $maxRetries = 20
    $retryCount = 0
    $backendReady = $false
    
    while (-not $backendReady -and $retryCount -lt $maxRetries) {
        Start-Sleep -Seconds 1
        $retryCount++
        Write-Host "   Checking... ($retryCount)" -ForegroundColor Gray
        try {
            $test = Test-NetConnection -ComputerName localhost -Port 5000 -WarningAction SilentlyContinue
            $backendReady = $test.TcpTestSucceeded
        } catch {
            $backendReady = $false
        }
    }
    
    if ($backendReady) {
        Write-Host "   Backend started successfully on port 5000!" -ForegroundColor Green
    } else {
        Write-Host "   Backend may still be starting. Check the backend window." -ForegroundColor Yellow
    }
}

# ============================================================================
# STEP 3: Start Frontend
# ============================================================================
Write-Host ""
Write-Host "[Step 3] Starting Frontend..." -ForegroundColor Yellow

# Determine mode
$useDevMode = $Dev.IsPresent
$useProdMode = $Prod.IsPresent

if (-not $useDevMode -and -not $useProdMode) {
    # Auto-detect: check if Tauri exe exists
    if ((Test-Path $tauriExePath) -or (Test-Path $debugExePath)) {
        $useProdMode = $true
        Write-Host "   Mode: Production (Tauri exe found)" -ForegroundColor Cyan
    } else {
        $useDevMode = $true
        Write-Host "   Mode: Development (no Tauri exe)" -ForegroundColor Cyan
    }
}

if ($useDevMode) {
    # Development mode: Start Next.js dev server
    Write-Host "   Starting in DEVELOPMENT mode..." -ForegroundColor Magenta
    
    $frontendRunning = $false
    try {
        $test = Test-NetConnection -ComputerName localhost -Port 3033 -WarningAction SilentlyContinue
        $frontendRunning = $test.TcpTestSucceeded
    } catch {
        $frontendRunning = $false
    }
    
    if ($frontendRunning) {
        Write-Host "   Frontend already running on port 3033" -ForegroundColor Green
    } else {
        Write-Host "   Starting frontend dev server (npm run dev)..." -ForegroundColor Yellow
        
        # Start frontend in a new window
        $frontendCmd = "cd '$frontendPath'; Write-Host 'WORKIX FRONTEND DEV SERVER' -ForegroundColor Cyan; Write-Host ''; npm run dev"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
        
        # Wait for frontend to be ready
        Write-Host "   Waiting for frontend to start (this takes 15-30 seconds)..." -ForegroundColor Gray
        $maxRetries = 45
        $retryCount = 0
        $frontendReady = $false
        
        while (-not $frontendReady -and $retryCount -lt $maxRetries) {
            Start-Sleep -Seconds 1
            $retryCount++
            if ($retryCount % 10 -eq 0) {
                Write-Host "   Still waiting... ($retryCount seconds)" -ForegroundColor Gray
            }
            try {
                $test = Test-NetConnection -ComputerName localhost -Port 3033 -WarningAction SilentlyContinue
                $frontendReady = $test.TcpTestSucceeded
            } catch {
                $frontendReady = $false
            }
        }
        
        if ($frontendReady) {
            Write-Host "   Frontend started successfully on port 3033!" -ForegroundColor Green
        } else {
            Write-Host "   Frontend may still be compiling. Check the frontend window." -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "       WORKIX IS READY! (DEV)          " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
    Write-Host "   Frontend: http://localhost:3033" -ForegroundColor White
    Write-Host ""
    Write-Host "   Open http://localhost:3033 in your browser" -ForegroundColor Cyan
    
} else {
    # Production mode: Start Tauri executable
    Write-Host "   Starting in PRODUCTION mode..." -ForegroundColor Magenta
    
    if (Test-Path $tauriExePath) {
        Write-Host "   Launching Workix Desktop (Release)..." -ForegroundColor Yellow
        Start-Process $tauriExePath
        Write-Host "   Workix Desktop started!" -ForegroundColor Green
    } elseif (Test-Path $debugExePath) {
        Write-Host "   Launching Workix Desktop (Debug)..." -ForegroundColor Yellow
        Start-Process $debugExePath
        Write-Host "   Workix Desktop (Debug) started!" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: No Tauri executable found!" -ForegroundColor Red
        Write-Host "   Run with -Dev flag for development mode:" -ForegroundColor Yellow
        Write-Host "      .\Start-Workix.ps1 -Dev" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "       WORKIX IS READY! (PROD)         " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Backend: http://localhost:5000" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
