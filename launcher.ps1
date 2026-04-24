# =============================================
#  dev-launcher.ps1
#  Real-time status + toggle Frontend / Docker
# =============================================

$FrontendPath = "Frontend\odza-warehouse"
$FrontendPort = 3001

# ---- Helpers ----

function Is-PortInUse {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

function Is-DockerRunning {
    $p = Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
    return ($null -ne $p)
}

# ---- Draw the menu at a fixed position (no flicker) ----

function Draw-Menu {
    param(
        [bool]$FrontendOn,
        [bool]$DockerOn
    )

    # Move cursor to top-left of our reserved block instead of clearing the whole screen
    [Console]::SetCursorPosition(0, 0)

    $feStatus = if ($FrontendOn) { "● running  " } else { "○ inactive " }
    $feColor  = if ($FrontendOn) { "Green"        } else { "DarkGray"   }
    $dkStatus = if ($DockerOn)   { "● running  " } else { "○ inactive " }
    $dkColor  = if ($DockerOn)   { "Green"        } else { "DarkGray"   }

    Write-Host "                                              " # blank line top padding
    Write-Host "  dev-launcher                               " -ForegroundColor White
    Write-Host "  ----------------------------------------   " -ForegroundColor DarkGray
    Write-Host "  1. Frontend   " -NoNewline
    Write-Host $feStatus -ForegroundColor $feColor -NoNewline
    Write-Host "  (npm run dev @ odza-warehouse)   " -ForegroundColor DarkGray
    Write-Host "  2. Backend    " -NoNewline
    Write-Host $dkStatus -ForegroundColor $dkColor -NoNewline
    Write-Host "  (Docker Desktop)                 " -ForegroundColor DarkGray
    Write-Host "  ----------------------------------------   " -ForegroundColor DarkGray
    Write-Host "  q. Quit                                    " -ForegroundColor DarkGray
    Write-Host "                                              "
    Write-Host "  Pick an option: " -NoNewline
}

# ---- Actions ----

function Toggle-Frontend {
    if (Is-PortInUse $FrontendPort) {
        [Console]::SetCursorPosition(0, 11)
        Write-Host "  Stopping frontend on port $FrontendPort...       " -ForegroundColor Yellow
        $pids = Get-NetTCPConnection -LocalPort $FrontendPort -State Listen -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
        Write-Host "  Frontend stopped.                                 " -ForegroundColor Red
        Start-Sleep 1
        Write-Host "                                                     "
    } else {
        if (-not (Test-Path $FrontendPath)) {
            [Console]::SetCursorPosition(0, 11)
            Write-Host "  ERROR: Path not found -> $FrontendPath   " -ForegroundColor Red
            Start-Sleep 3
            Write-Host "                                                     "
            return
        }
        [Console]::SetCursorPosition(0, 11)
        Write-Host "  Starting frontend...                              " -ForegroundColor Cyan
        Start-Process "cmd.exe" -ArgumentList "/c cd /d `"$FrontendPath`" && npm run dev"
        $timeout = 30
        $elapsed = 0
        while ((-not (Is-PortInUse $FrontendPort)) -and ($elapsed -lt $timeout)) {
            [Console]::SetCursorPosition(0, 11)
            Write-Host "  Waiting for port $FrontendPort... [$elapsed/$timeout]   " -ForegroundColor DarkGray
            Start-Sleep 1
            $elapsed++
        }
        [Console]::SetCursorPosition(0, 11)
        if (Is-PortInUse $FrontendPort) {
            Write-Host "  Frontend live on port $FrontendPort!                  " -ForegroundColor Green
        } else {
            Write-Host "  Timed out - check the cmd window for errors.  " -ForegroundColor Yellow
        }
        Start-Sleep 2
        Write-Host "                                                     "
    }
}

function Toggle-Docker {
    if (Is-DockerRunning) {
        [Console]::SetCursorPosition(0, 11)
        Write-Host "  Stopping Docker Desktop...                        " -ForegroundColor Yellow
        Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
        Write-Host "  Docker Desktop stopped.                           " -ForegroundColor Red
    } else {
        [Console]::SetCursorPosition(0, 11)
        Write-Host "  Launching Docker Desktop...                       " -ForegroundColor Cyan
        $dockerExe = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
        if (Test-Path $dockerExe) {
            Start-Process $dockerExe
            Write-Host "  Docker Desktop launched!                          " -ForegroundColor Green
        } else {
            Write-Host "  ERROR: Not found at -> $dockerExe   " -ForegroundColor Red
        }
    }
    Start-Sleep 2
    [Console]::SetCursorPosition(0, 11)
    Write-Host "                                                     "
}

# ---- Main ----

Clear-Host
[Console]::CursorVisible = $false

# Draw once so the layout is there before the loop
Draw-Menu -FrontendOn (Is-PortInUse $FrontendPort) -DockerOn (Is-DockerRunning)

$lastFe = $null
$lastDk = $null
$inputBuffer = ""

try {
    while ($true) {
        # Poll status every 500ms
        $fe = Is-PortInUse $FrontendPort
        $dk = Is-DockerRunning

        # Only redraw if something changed (prevents flicker)
        if ($fe -ne $lastFe -or $dk -ne $lastDk) {
            Draw-Menu -FrontendOn $fe -DockerOn $dk
            $lastFe = $fe
            $lastDk = $dk
        }

        # Non-blocking key check
        if ([Console]::KeyAvailable) {
            $key = [Console]::ReadKey($true)
            $char = $key.KeyChar.ToString().ToLower()

            switch ($char) {
                "1" {
                    [Console]::CursorVisible = $false
                    Toggle-Frontend
                    Draw-Menu -FrontendOn (Is-PortInUse $FrontendPort) -DockerOn (Is-DockerRunning)
                }
                "2" {
                    [Console]::CursorVisible = $false
                    Toggle-Docker
                    Draw-Menu -FrontendOn (Is-PortInUse $FrontendPort) -DockerOn (Is-DockerRunning)
                }
                "q" {
                    Clear-Host
                    Write-Host "  Goodbye." -ForegroundColor DarkGray
                    Write-Host ""
                    exit 0
                }
            }
        }

        Start-Sleep -Milliseconds 500
    }
} finally {
    [Console]::CursorVisible = $true
    Clear-Host
}