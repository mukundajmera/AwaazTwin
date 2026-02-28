#!/usr/bin/env bash
# AwaazTwin – macOS development environment setup
#
# Usage:  chmod +x scripts/setup_macos.sh && ./scripts/setup_macos.sh
#
# Prerequisites: macOS with admin access. The script uses Homebrew.
# Safe to re-run (idempotent).

set -euo pipefail

info()  { printf "\033[1;34m→ %s\033[0m\n" "$*"; }
ok()    { printf "\033[1;32m✔ %s\033[0m\n" "$*"; }
warn()  { printf "\033[1;33m⚠ %s\033[0m\n" "$*"; }

# ── Homebrew ──────────────────────────────────────────────────────────
if ! command -v brew &>/dev/null; then
  info "Installing Homebrew…"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  ok "Homebrew already installed"
fi

# ── Node.js ───────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  info "Installing Node.js 20 via Homebrew…"
  brew install node@20
  brew link --overwrite node@20
else
  ok "Node.js $(node -v) already installed"
fi

# ── ffmpeg (used by TTS pipelines for audio conversion) ───────────────
if ! command -v ffmpeg &>/dev/null; then
  info "Installing ffmpeg…"
  brew install ffmpeg
else
  ok "ffmpeg already installed"
fi

# ── Docker (optional, for Coqui TTS) ─────────────────────────────────
if ! command -v docker &>/dev/null; then
  warn "Docker not found. Coqui TTS runs in Docker."
  warn "Install Docker Desktop from https://www.docker.com/products/docker-desktop"
else
  ok "Docker $(docker --version | awk '{print $3}') available"
fi

# ── Detect Apple Silicon MPS support ─────────────────────────────────
DEVICE="cpu"
if python3 -c "import torch; print(torch.backends.mps.is_available())" 2>/dev/null | grep -q True; then
  DEVICE="mps"
  ok "PyTorch MPS backend available – using MPS for local inference"
else
  info "MPS not detected or PyTorch not installed – defaulting to CPU"
fi
export AWAAZTWIN_DEVICE="$DEVICE"

# ── Install portal dependencies ───────────────────────────────────────
info "Installing portal dependencies…"
cd "$(dirname "$0")/../apps/portal"
npm install
ok "Portal dependencies installed"

# ── Summary ───────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  AwaazTwin – macOS setup complete"
echo "============================================"
echo ""
echo "  Device: $DEVICE"
echo ""
echo "  Next steps:"
echo "    1. cd apps/portal && npm run dev    # Start the portal"
echo "    2. Install Ollama: https://ollama.ai"
echo "       ollama pull llama3.2             # Download a model"
echo "    3. (Optional) Start Coqui TTS:"
echo "       docker compose up coqui-tts -d"
echo ""
