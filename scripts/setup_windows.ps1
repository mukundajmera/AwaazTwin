# ---------------------------------------------------------------------------
# AwaazTwin – Windows Development Setup (PowerShell)
# Installs Python, ffmpeg, and sets up a virtual environment for local dev.
# Safe to re-run (idempotent).
# Run: powershell -ExecutionPolicy Bypass -File scripts\setup_windows.ps1
# ---------------------------------------------------------------------------

$ErrorActionPreference = "Stop"

Write-Host "=== AwaazTwin Windows Setup ===" -ForegroundColor Cyan

# ---- Python ----
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "Python not found. Please install Python 3.11+ from https://www.python.org/downloads/" -ForegroundColor Red
    Write-Host "Make sure to check 'Add Python to PATH' during installation."
    exit 1
}

$pyVersion = & python --version 2>&1
Write-Host "✓ $pyVersion available" -ForegroundColor Green

# ---- ffmpeg ----
$ffmpegCmd = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpegCmd) {
    Write-Host "ffmpeg not found." -ForegroundColor Yellow
    Write-Host "Install via winget:  winget install ffmpeg"
    Write-Host "Or download from: https://ffmpeg.org/download.html"
    Write-Host "Continuing without ffmpeg (audio conversion will not work)..."
} else {
    Write-Host "✓ ffmpeg already installed" -ForegroundColor Green
}

# ---- Node.js ----
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "Node.js not found." -ForegroundColor Yellow
    Write-Host "Install via winget:  winget install OpenJS.NodeJS.LTS"
    Write-Host "Or download from: https://nodejs.org/"
} else {
    $nodeVersion = & node --version 2>&1
    Write-Host "✓ Node.js $nodeVersion available" -ForegroundColor Green
}

# ---- Virtual environment ----
$venvDir = ".venv"
if (-not (Test-Path $venvDir)) {
    Write-Host "Creating Python virtual environment..."
    & python -m venv $venvDir
} else {
    Write-Host "✓ Virtual environment already exists" -ForegroundColor Green
}

Write-Host "Activating virtual environment and installing dependencies..."
& "$venvDir\Scripts\Activate.ps1"
& pip install --upgrade pip
& pip install -e ".[dev]"

# ---- Detect CUDA ----
$device = "cpu"
try {
    $device = & python -c @"
try:
    import torch
    if torch.cuda.is_available():
        print('cuda')
    else:
        print('cpu')
except ImportError:
    print('cpu')
"@
} catch {
    $device = "cpu"
}
Write-Host "Detected compute device: $device" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Activate venv:     .venv\Scripts\Activate.ps1"
Write-Host "  2. Start Postgres:    docker run -d --name awaaztwin-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=awaaztwin -p 5432:5432 postgres:16-alpine"
Write-Host "  3. Start Redis:       docker run -d --name awaaztwin-redis -p 6379:6379 redis:7-alpine"
Write-Host "  4. Start MinIO:       docker run -d --name awaaztwin-minio -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address :9001"
Write-Host "  5. Copy config:       Copy-Item awaaztwin.example.yaml awaaztwin.yaml"
Write-Host "  6. Run backend:       uvicorn backend.main:app --reload"
Write-Host "  7. Run portal:        cd apps\portal; npm install; npm run dev"
Write-Host "  8. Device detected:   $device (set AWAAZTWIN_DEVICE to override)"
Write-Host ""
Write-Host "For GPU support:" -ForegroundColor Yellow
Write-Host "  - Install NVIDIA CUDA toolkit from https://developer.nvidia.com/cuda-downloads"
Write-Host "  - Install PyTorch with CUDA: pip install torch --index-url https://download.pytorch.org/whl/cu121"
