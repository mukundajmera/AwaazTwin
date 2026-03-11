# AwaazTwin – Windows development environment setup (PowerShell)
#
# Usage:  .\scripts\setup_windows.ps1
#
# Prerequisites: Windows 10/11 with PowerShell 5.1+
# Safe to re-run (idempotent).

$ErrorActionPreference = "Stop"

function Info($msg)  { Write-Host "-> $msg" -ForegroundColor Cyan }
function Ok($msg)    { Write-Host "[OK] $msg" -ForegroundColor Green }
function Warn($msg)  { Write-Host "[!] $msg" -ForegroundColor Yellow }

# ── Check for winget ──────────────────────────────────────────────────
$hasWinget = [bool](Get-Command winget -ErrorAction SilentlyContinue)
if (-not $hasWinget) {
    Warn "winget is not available on this system."
    Warn "Install it from https://aka.ms/getwinget or use the Microsoft Store."
    Warn "The script will skip automated package installs and provide manual links instead."
}

# ── Node.js ───────────────────────────────────────────────────────────
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = & node -v
    Ok "Node.js $nodeVer already installed"
} elseif ($hasWinget) {
    Info "Node.js not found. Installing via winget..."
    winget install --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Warn "winget install failed. Download Node.js manually: https://nodejs.org"
    } else {
        Ok "Node.js installed"
        if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
            Warn "Node.js was installed but is not yet available in this session."
            Warn "Please restart your terminal and re-run this script."
            exit 0
        }
    }
} else {
    Warn "Node.js not found. Install it from https://nodejs.org"
}

# ── ffmpeg ────────────────────────────────────────────────────────────
if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
    Ok "ffmpeg already installed"
} elseif ($hasWinget) {
    Info "Installing ffmpeg via winget..."
    winget install --id Gyan.FFmpeg --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Warn "winget install failed. Download ffmpeg manually: https://ffmpeg.org/download.html"
    } else {
        Ok "ffmpeg installed"
    }
} else {
    Warn "ffmpeg not found. Download it from https://ffmpeg.org/download.html"
}

# ── Docker ────────────────────────────────────────────────────────────
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerVer = & docker --version
    Ok "Docker available: $dockerVer"
} else {
    Warn "Docker not found. Coqui TTS runs in Docker."
    Warn "Install Docker Desktop: https://www.docker.com/products/docker-desktop"
}

# ── Install portal dependencies ───────────────────────────────────────
$portalDir = Join-Path $PSScriptRoot "..\apps\portal"
if (Test-Path $portalDir) {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        Info "Installing portal dependencies..."
        Push-Location $portalDir
        try {
            npm install
            Ok "Portal dependencies installed"
        } catch {
            Warn "npm install failed: $($_.Exception.Message)"
            Warn "You can manually run 'npm install' in $portalDir after resolving the issue."
        } finally {
            Pop-Location
        }
    } else {
        Warn "npm not found. Skipping portal dependency installation."
        Warn "Install Node.js/npm from https://nodejs.org and then run 'npm install' in $portalDir."
    }
} else {
    Warn "Portal directory not found at $portalDir"
}

# ── Summary ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================"
Write-Host "  AwaazTwin - Windows setup complete"
Write-Host "============================================"
Write-Host ""
Write-Host "  Next steps:"
Write-Host "    1. cd apps\portal; npm run dev        # Start the portal"
Write-Host "    2. Install Ollama: https://ollama.ai"
Write-Host "       ollama pull llama3.2               # Download a model"
Write-Host "    3. (Optional) Start Coqui TTS:"
Write-Host "       docker compose up coqui-tts -d"
Write-Host ""
