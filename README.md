# AwaazTwin

**Voice Cloning & Text-to-Speech Platform** — A local-first, privacy-preserving voice cloning server with a clean web UI.

---

## Architecture Overview

AwaazTwin consists of two main components:

| Component | Technology | Description |
|---|---|---|
| **Portal** (Frontend) | Next.js 16, React 19, TypeScript, Tailwind CSS | Web UI for configuration, content, practice flows, and diagnostics |
| **Backend** (API + Workers) | Python 3.11+, FastAPI, SQLAlchemy, Redis (RQ) | REST API, voice-cloning engine adapters, background job processing |

### System Diagram

```
┌──────────────────────────────────────────────────────┐
│                 Browser (User)                        │
│  Portal: Topics · Settings · Practice · Test Console  │
└────────────┬─────────────────────────────────────────┘
             │
             ▼
┌────────────────────────┐     ┌─────────────────────┐
│  Next.js Portal (:3000)│────▶│  FastAPI API (:8000) │
│  apps/portal/          │     │  backend/            │
└────────────────────────┘     └─────────┬───────────┘
                                         │
               ┌─────────────────────────┼──────────────────┐
               ▼                         ▼                  ▼
     ┌──────────────┐         ┌──────────────┐    ┌─────────────┐
     │  PostgreSQL   │         │    Redis     │    │    MinIO     │
     │  (metadata)   │         │  (job queue) │    │  (audio/obj) │
     └──────────────┘         └──────┬───────┘    └─────────────┘
                                     │
                          ┌──────────┼──────────┐
                          ▼                     ▼
                ┌──────────────────┐  ┌──────────────────┐
                │ voice-prep-worker│  │ synthesis-worker  │
                │ (XTTS/OpenVoice) │  │ (XTTS/OpenVoice) │
                └──────────────────┘  └──────────────────┘
```

---

## Quick Start

### Option 1: Docker Compose (Recommended for Linux + GPU)

```bash
git clone https://github.com/mukundajmera/AwaazTwin.git
cd AwaazTwin
cp .env.example .env
cp awaaztwin.example.yaml awaaztwin.yaml
docker compose up -d
```

- Portal: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:8000](http://localhost:8000)
- MinIO Console: [http://localhost:9001](http://localhost:9001)

For GPU support, uncomment the `deploy.resources` blocks in `docker-compose.yml` and ensure [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) is installed.

### Option 2: Local Development

#### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (for Postgres, Redis, MinIO)

#### macOS
```bash
./scripts/setup_macos.sh
```

#### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup_windows.ps1
```

#### Manual Setup
```bash
# Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp awaaztwin.example.yaml awaaztwin.yaml

# Start infrastructure
docker run -d --name awaaztwin-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=awaaztwin -p 5432:5432 postgres:16-alpine
docker run -d --name awaaztwin-redis -p 6379:6379 redis:7-alpine
docker run -d --name awaaztwin-minio -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address :9001

# Run backend
uvicorn backend.main:app --reload

# Portal (in another terminal)
cd apps/portal
npm install
npm run dev
```

---

## Project Structure

```
AwaazTwin/
├── apps/portal/           # Next.js frontend (TypeScript, Tailwind, shadcn/ui)
│   ├── src/app/           # App Router pages and API routes
│   ├── src/components/    # React components
│   ├── src/lib/           # Utilities (LLM client, TTS client, content loader)
│   ├── content/           # MDX content (voice cloning, TTS, models, guides)
│   ├── tests/             # Vitest unit/integration tests
│   └── e2e/               # Playwright E2E tests
├── backend/               # Python FastAPI backend
│   ├── engines/           # TTS engine abstraction (XTTS, OpenVoice)
│   ├── routers/           # API route handlers
│   ├── models.py          # SQLAlchemy domain models
│   ├── schemas.py         # Pydantic request/response DTOs
│   ├── config.py          # YAML + env var configuration
│   ├── database.py        # Async DB engine setup
│   └── storage.py         # S3/MinIO object storage
├── workers/               # Background job workers (RQ)
│   ├── voice_prep.py      # Audio processing → voice embedding
│   └── synthesis_worker.py# Text → speech generation
├── tests/backend/         # Python backend tests (pytest)
├── infra/docker/          # Dockerfiles for backend and portal
├── scripts/               # Cross-platform setup scripts
├── docs/                  # Architecture and UI design documents
├── docker-compose.yml     # Full-stack Docker deployment
├── awaaztwin.example.yaml # Configuration template
├── pyproject.toml         # Python project config
├── ARCHITECTURE.md        # Architecture overview and constraints
└── AGENTS.md              # AI agent guidelines
```

---

## Engine Abstraction

AwaazTwin uses a pluggable engine adapter pattern for TTS/voice-cloning:

```python
from backend.engines.factory import get_engine_adapter

adapter = get_engine_adapter("xtts-hindi")
embedding = await adapter.prepare_voice([Path("sample.wav")])
audio = await adapter.synthesize("Hello world", embedding)
```

**Supported engines:**
| Engine | Status | Description |
|---|---|---|
| `xtts-hindi` | Placeholder | Coqui XTTS v2 fine-tuned for Hindi |
| `openvoice` | Placeholder | OpenVoice tone-colour cloning |

To add a new engine, implement `EngineAdapter` in `backend/engines/` and register it in `backend/engines/factory.py`.

---

## Configuration

AwaazTwin loads configuration from (highest priority first):
1. Environment variables prefixed with `AWAAZTWIN_`
2. `awaaztwin.yaml` (or path set by `AWAAZTWIN_CONFIG_PATH`)
3. Built-in defaults

See `awaaztwin.example.yaml` for the full configuration schema.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health/live` | Liveness probe |
| `GET` | `/health/ready` | Readiness probe |
| `POST` | `/voices` | Create a voice profile |
| `GET` | `/voices` | List voice profiles |
| `GET` | `/voices/{id}` | Get a voice profile |
| `POST` | `/voices/{id}/samples` | Upload audio sample |
| `POST` | `/synthesize` | Submit a synthesis job |
| `GET` | `/jobs/{id}` | Check job status |
| `GET` | `/admin/metrics` | Platform metrics |
| `GET` | `/admin/queues` | Queue statistics |
| `GET` | `/admin/engines` | Registered engines |

---

## Testing

### Portal Tests (TypeScript)
```bash
cd apps/portal
npm run test        # Unit/integration tests (Vitest)
npm run test:e2e    # E2E tests (Playwright)
```

### Backend Tests (Python)
```bash
python -m pytest tests/backend/ -v
```

### Test Summary
| Suite | Tests | Framework |
|---|---|---|
| Portal unit/integration | 84 | Vitest |
| Backend unit/API | 48 | pytest |
| Portal E2E | 3 files | Playwright |

---

## Platform Support

| Platform | Status | Notes |
|---|---|---|
| Linux x86_64 + NVIDIA GPU | Tier 1 (recommended) | Full Docker Compose support |
| Windows 11 (WSL2 + Docker) | Tier 2 | GPU passthrough supported |
| Windows 11 (native Python) | Tier 2 | Setup script provided |
| macOS (Apple Silicon) | Tier 2 | CPU/MPS; for dev and light workloads |
| Linux ARM (Jetson) | Tier 3 | Best-effort |

---

## License

See repository for license information.
