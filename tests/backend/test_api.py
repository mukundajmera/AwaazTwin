"""Tests for the FastAPI application routes."""

import pytest
from httpx import ASGITransport, AsyncClient

from backend.main import app


@pytest.fixture
async def client():
    """Create an async test client for the FastAPI app."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


class TestHealthEndpoints:
    @pytest.mark.asyncio
    async def test_liveness(self, client: AsyncClient) -> None:
        resp = await client.get("/health/live")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"

    @pytest.mark.asyncio
    async def test_readiness(self, client: AsyncClient) -> None:
        resp = await client.get("/health/ready")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"


class TestAdminEndpoints:
    @pytest.mark.asyncio
    async def test_metrics(self, client: AsyncClient) -> None:
        resp = await client.get("/admin/metrics")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_voices" in data
        assert "total_jobs" in data

    @pytest.mark.asyncio
    async def test_queues(self, client: AsyncClient) -> None:
        resp = await client.get("/admin/queues")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 2
        queue_names = [q["name"] for q in data]
        assert "voice-prep" in queue_names
        assert "synthesis" in queue_names

    @pytest.mark.asyncio
    async def test_engines(self, client: AsyncClient) -> None:
        resp = await client.get("/admin/engines")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        engine_names = [e["name"] for e in data]
        assert "xtts-hindi" in engine_names
        assert "openvoice" in engine_names


class TestVoicesEndpoints:
    @pytest.mark.asyncio
    async def test_create_voice_profile(self, client: AsyncClient) -> None:
        resp = await client.post("/voices", json={"label": "Test Voice"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["label"] == "Test Voice"
        assert data["language"] == "hi"
        assert data["status"] == "PENDING"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_create_voice_profile_missing_label(self, client: AsyncClient) -> None:
        resp = await client.post("/voices", json={})
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_list_voice_profiles(self, client: AsyncClient) -> None:
        resp = await client.get("/voices")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    @pytest.mark.asyncio
    async def test_get_voice_profile_not_found(self, client: AsyncClient) -> None:
        import uuid
        resp = await client.get(f"/voices/{uuid.uuid4()}")
        assert resp.status_code == 404


class TestSynthesisEndpoints:
    @pytest.mark.asyncio
    async def test_submit_synthesis_job(self, client: AsyncClient) -> None:
        import uuid
        resp = await client.post("/synthesize", json={
            "voice_profile_id": str(uuid.uuid4()),
            "text": "Hello world",
        })
        assert resp.status_code == 202
        data = resp.json()
        assert data["status"] == "PENDING"
        assert data["input_text"] == "Hello world"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_submit_synthesis_missing_text(self, client: AsyncClient) -> None:
        import uuid
        resp = await client.post("/synthesize", json={
            "voice_profile_id": str(uuid.uuid4()),
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_get_job_not_found(self, client: AsyncClient) -> None:
        import uuid
        resp = await client.get(f"/jobs/{uuid.uuid4()}")
        assert resp.status_code == 404
