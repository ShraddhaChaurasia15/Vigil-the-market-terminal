import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_and_root():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

        regime_res = await ac.get("/api/market/regime")
        assert regime_res.status_code == 200
        data = regime_res.json()
        assert "benchmarks" in data
        assert len(data["benchmarks"]) == 3

@pytest.mark.asyncio
async def test_watchlists_and_deltas():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Trigger startup lifespan manually by making request
        res = await ac.get("/api/watchlists")
        assert res.status_code == 200
        lists = res.json()
        assert len(lists) >= 1
        wl_id = lists[0]["id"]

        detail_res = await ac.get(f"/api/watchlists/{wl_id}")
        assert detail_res.status_code == 200
        detail = detail_res.json()
        assert "checkpoint" in detail
        assert "tickers" in detail
        assert len(detail["tickers"]) > 0

        # Checkpoint structure verification
        assert "urgent_count" in detail["checkpoint"]
        assert "elapsed_human" in detail["checkpoint"]

        # Ticker delta metrics verification
        first_ticker = detail["tickers"][0]
        assert "delta_score" in first_ticker
        assert "attention_tier" in first_ticker
        assert "sparkline" in first_ticker
        assert len(first_ticker["sparkline"]) > 0

@pytest.mark.asyncio
async def test_checkpoint_simulation_and_acknowledgement():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Simulate stepping away 2 hours ago
        sim_res = await ac.post("/api/checkpoints/simulate", json={"preset": "2H_AGO"})
        assert sim_res.status_code == 200

        # Acknowledge changes (syncing checkpoint to now)
        ack_res = await ac.post("/api/checkpoints/acknowledge", json={"label": "Reviewed desk"})
        assert ack_res.status_code == 200
        assert ack_res.json()["status"] == "checkpoint_updated"
