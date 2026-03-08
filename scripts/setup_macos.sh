#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# AwaazTwin – macOS Development Setup
# Installs Python, ffmpeg, Redis, and sets up a virtualenv for local dev.
# Safe to re-run (idempotent).
# ---------------------------------------------------------------------------
set -euo pipefail

echo "=== AwaazTwin macOS Setup ==="

# ---- Homebrew ----
if ! command -v brew &>/dev/null; then
  echo "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo "✓ Homebrew already installed"
fi

# ---- Python ----
if ! command -v python3 &>/dev/null || [[ "$(python3 -c 'import sys; print(sys.version_info >= (3,11))')" != "True" ]]; then
  echo "Installing Python 3.11+..."
  brew install python@3.11
else
  echo "✓ Python $(python3 --version) available"
fi

# ---- ffmpeg ----
if ! command -v ffmpeg &>/dev/null; then
  echo "Installing ffmpeg..."
  brew install ffmpeg
else
  echo "✓ ffmpeg already installed"
fi

# ---- Redis ----
if ! command -v redis-server &>/dev/null; then
  echo "Installing Redis..."
  brew install redis
else
  echo "✓ Redis already installed"
fi

# ---- Node.js (for portal) ----
if ! command -v node &>/dev/null; then
  echo "Installing Node.js..."
  brew install node
else
  echo "✓ Node.js $(node --version) available"
fi

# ---- Virtual environment ----
VENV_DIR=".venv"
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv "$VENV_DIR"
else
  echo "✓ Virtual environment already exists"
fi

echo "Activating virtual environment and installing dependencies..."
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -e ".[dev]"

# ---- Detect PyTorch MPS ----
DEVICE=$(python3 -c "
try:
    import torch
    if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        print('mps')
    else:
        print('cpu')
except ImportError:
    print('cpu')
")
echo "Detected compute device: $DEVICE"
export AWAAZTWIN_DEVICE="$DEVICE"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Activate the venv:   source .venv/bin/activate"
echo "  2. Start Redis:         brew services start redis"
echo "  3. Start Postgres:      docker run -d --name awaaztwin-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=awaaztwin -p 5432:5432 postgres:16-alpine"
echo "  4. Start MinIO:         docker run -d --name awaaztwin-minio -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address :9001"
echo "  5. Copy config:         cp awaaztwin.example.yaml awaaztwin.yaml"
echo "  6. Run backend:         uvicorn backend.main:app --reload"
echo "  7. Run portal:          cd apps/portal && npm install && npm run dev"
echo "  8. Device detected:     $DEVICE (set AWAAZTWIN_DEVICE to override)"
