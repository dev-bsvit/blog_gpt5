import os
import pytest
from httpx import AsyncClient
from main import app


@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/api/v1/articles/health")
        assert r.status_code == 200


@pytest.mark.asyncio
async def test_create_requires_auth():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post("/api/v1/articles", json={"title": "Test"})
        assert r.status_code == 401


@pytest.mark.asyncio
async def test_comment_unauth_blocked_by_default(monkeypatch):
    monkeypatch.setenv("ALLOW_UNAUTH_WRITE", "false")
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.post("/api/v1/articles/welcome/comments", json={"text": "hi"})
        assert r.status_code == 401


