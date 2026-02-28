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

# ── Node.js ───────────────────────────────────────────────────────────
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = & node -v
    Ok "Node.js $nodeVer already installed"
} else {
    Info "Node.js not found. Installing via winget..."
    winget install --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Warn "winget install failed. Download Node.js manually: https://nodejs.org"
    } else {
        Ok "Node.js installed – restart your terminal to pick it up"
    }
}

# ── ffmpeg ────────────────────────────────────────────────────────────
if (Get-Command ffmpeg -ErrorAction SilentlyContinue) {
    Ok "ffmpeg already installed"
} else {
    Info "Installing ffmpeg via winget..."
    winget install --id Gyan.FFmpeg --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Warn "winget install failed. Download ffmpeg manually: https://ffmpeg.org/download.html"
    } else {
        Ok "ffmpeg installed"
    }
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
    Info "Installing portal dependencies..."
    Push-Location $portalDir
    npm install
    Pop-Location
    Ok "Portal dependencies installed"
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
