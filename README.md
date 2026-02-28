# AwaazTwin

AI-powered voice cloning and text-to-speech portal.  
Browse guides, configure LLM/TTS backends, practice voice-cloning workflows, and run diagnostics — all from the browser.

---

## Quick Start

### Prerequisites

| Tool | Required? | Notes |
|------|-----------|-------|
| **Node.js 20+** | Yes | Portal runtime |
| **npm** | Yes | Package manager (ships with Node) |
| **Docker** | Optional | Needed for Coqui TTS and containerised deployment |
| **Ollama** | Optional | Local LLM backend ([ollama.ai](https://ollama.ai)) |

### 1. Clone & install

```bash
git clone https://github.com/mukundajmera/AwaazTwin.git
cd AwaazTwin/apps/portal
npm install
```

### 2. Run the development server

```bash
npm run dev          # http://localhost:3000
```

### 3. (Optional) Start LLM backend

```bash
# Install Ollama, then:
ollama pull llama3.2
ollama serve         # listens on http://localhost:11434
```

### 4. (Optional) Start TTS backend

```bash
docker compose up coqui-tts -d   # listens on http://localhost:5002
```

---

## Docker Deployment

Deploy the entire stack (portal + Ollama + Coqui TTS) with Docker Compose:

```bash
cp .env.example .env   # customise ports and settings
docker compose up -d
```

For **GPU-accelerated TTS** (requires NVIDIA Container Toolkit):

```bash
docker compose --profile gpu up -d
```

See [docker-compose.yml](docker-compose.yml) for all services and options.

---

## Configuration

AwaazTwin reads config from three sources (later overrides earlier):

1. **Built-in defaults**
2. **`awaaztwin.yaml`** (copy from `awaaztwin.example.yaml`)
3. **Environment variables** (`AWAAZTWIN_*`)

Key environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `AWAAZTWIN_LLM_BASE_URL` | `http://localhost:11434` | LLM backend URL |
| `AWAAZTWIN_LLM_MODEL` | `llama3.2` | Model name |
| `AWAAZTWIN_TTS_SERVER_URL` | `http://localhost:5002` | TTS server URL |
| `AWAAZTWIN_TTS_ENABLED` | `false` | Enable TTS features |

See [`awaaztwin.example.yaml`](awaaztwin.example.yaml) for the full config schema.

---

## Cross-Platform Dev Setup

| Platform | Script |
|----------|--------|
| **macOS** | `./scripts/setup_macos.sh` |
| **Windows** | `.\scripts\setup_windows.ps1` |

Both scripts are idempotent and install Node.js, ffmpeg, and portal dependencies.

---

## Testing

```bash
cd apps/portal

# Unit & integration tests (Vitest)
npm run test

# E2E tests (Playwright)
npx playwright install --with-deps chromium
npm run test:e2e
```

Tests also run automatically on every push/PR via [GitHub Actions](.github/workflows/ci.yml).

---

## Project Structure

```
AwaazTwin/
├── apps/portal/         # Next.js portal (UI + API routes)
│   ├── src/app/         # Pages & API route handlers
│   ├── src/lib/         # Shared utilities (LLM client, TTS client, config, etc.)
│   ├── src/components/  # React components
│   ├── content/         # MDX guides and documentation
│   ├── tests/           # Vitest unit & integration tests
│   └── e2e/             # Playwright E2E tests
├── docs/                # Design documents
├── scripts/             # Cross-platform setup scripts
├── docker-compose.yml   # Docker Compose for full-stack deployment
└── awaaztwin.example.yaml  # Example configuration file
```

---

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full architecture, constraints, and domain model.
