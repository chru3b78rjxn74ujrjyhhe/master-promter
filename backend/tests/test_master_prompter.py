"""Backend test suite for Master Prompter API.

Covers:
- Root/health endpoint
- /api/generate (LLM via Emergent) — happy path + validation
- /api/history (list, delete one, clear)
- /api/favorites (list, create, delete)
- MongoDB _id exclusion check
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # Fallback to reading /app/frontend/.env for the public URL
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip()
                break

BASE_URL = (BASE_URL or "").rstrip("/")
API = f"{BASE_URL}/api"

# Generous timeout: LLM calls can take 5-15s
LLM_TIMEOUT = 60
DEFAULT_TIMEOUT = 15


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def generated_item(session):
    """Generate one prompt to use across multiple tests (save LLM cost)."""
    payload = {
        "idea": "TEST_ a cozy reading nook with a cat",
        "target_ai": "Midjourney",
        "style": "Creative & Expressive",
    }
    r = session.post(f"{API}/generate", json=payload, timeout=LLM_TIMEOUT)
    if r.status_code != 200:
        pytest.fail(f"generate failed {r.status_code}: {r.text[:500]}")
    return r.json()


# ---------- Health ----------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/", timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"
        assert data.get("service") == "Master Prompter"


# ---------- Generate ----------
class TestGenerate:
    def test_generate_happy_path(self, generated_item):
        data = generated_item
        # Structure
        for key in ("id", "idea", "target_ai", "style", "prompt", "tips", "variations", "created_at"):
            assert key in data, f"missing {key}"
        assert isinstance(data["prompt"], str) and len(data["prompt"]) > 0
        assert isinstance(data["tips"], list) and len(data["tips"]) == 3
        assert isinstance(data["variations"], list) and len(data["variations"]) == 2
        assert data["target_ai"] == "Midjourney"
        assert data["style"] == "Creative & Expressive"
        assert data["idea"].startswith("TEST_")
        # No mongo _id
        assert "_id" not in data

    def test_generate_empty_idea(self, session):
        r = session.post(
            f"{API}/generate",
            json={"idea": "", "target_ai": "ChatGPT", "style": "Concise & Direct"},
            timeout=DEFAULT_TIMEOUT,
        )
        # Pydantic validation error -> 422
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text[:200]}"

    def test_generate_missing_fields(self, session):
        r = session.post(f"{API}/generate", json={"idea": "hi"}, timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 422


# ---------- History ----------
class TestHistory:
    def test_history_contains_generated_item(self, session, generated_item):
        r = session.get(f"{API}/history", timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 1
        # _id never leaks
        for it in items:
            assert "_id" not in it
        ids = [it["id"] for it in items]
        assert generated_item["id"] in ids
        # Most recent first — check created_at ordering (desc)
        if len(items) >= 2:
            assert items[0]["created_at"] >= items[1]["created_at"]

    def test_delete_single_history_item(self, session, generated_item):
        # Create a fresh item via favorites->history flow is not possible; instead generate another... too expensive.
        # We'll delete the generated_item and verify 404 on re-delete.
        item_id = generated_item["id"]
        r = session.delete(f"{API}/history/{item_id}", timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200
        assert r.json().get("ok") is True

        # Re-delete -> 404
        r2 = session.delete(f"{API}/history/{item_id}", timeout=DEFAULT_TIMEOUT)
        assert r2.status_code == 404

    def test_clear_history(self, session):
        r = session.delete(f"{API}/history", timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200
        assert r.json().get("ok") is True

        # Verify empty
        r2 = session.get(f"{API}/history", timeout=DEFAULT_TIMEOUT)
        assert r2.status_code == 200
        assert r2.json() == []


# ---------- Favorites ----------
class TestFavorites:
    FAV_PAYLOAD = {
        "idea": "TEST_ favorites sample idea",
        "target_ai": "Claude",
        "style": "Step-by-Step",
        "prompt": "<task>Do X</task><context>Y</context>",
        "tips": ["tip1", "tip2", "tip3"],
        "variations": ["var1", "var2"],
    }

    def test_create_favorite(self, session):
        r = session.post(f"{API}/favorites", json=self.FAV_PAYLOAD, timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert "id" in data and len(data["id"]) > 0
        assert data["idea"] == self.FAV_PAYLOAD["idea"]
        assert data["target_ai"] == "Claude"
        assert data["style"] == "Step-by-Step"
        assert data["prompt"] == self.FAV_PAYLOAD["prompt"]
        assert data["tips"] == self.FAV_PAYLOAD["tips"]
        assert data["variations"] == self.FAV_PAYLOAD["variations"]
        assert "_id" not in data
        assert "created_at" in data
        # Stash id
        pytest.fav_id = data["id"]

    def test_list_favorites(self, session):
        r = session.get(f"{API}/favorites", timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 1
        for it in items:
            assert "_id" not in it
        ids = [it["id"] for it in items]
        assert getattr(pytest, "fav_id", None) in ids

    def test_delete_favorite(self, session):
        fav_id = getattr(pytest, "fav_id", None)
        assert fav_id, "fav_id from earlier test missing"
        r = session.delete(f"{API}/favorites/{fav_id}", timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 200
        assert r.json().get("ok") is True

        # Delete nonexistent -> 404
        r2 = session.delete(f"{API}/favorites/{fav_id}", timeout=DEFAULT_TIMEOUT)
        assert r2.status_code == 404

    def test_delete_missing_favorite_returns_404(self, session):
        r = session.delete(f"{API}/favorites/does-not-exist-xyz", timeout=DEFAULT_TIMEOUT)
        assert r.status_code == 404


# ---------- Cleanup ----------
@pytest.fixture(scope="session", autouse=True)
def _final_cleanup(session):
    yield
    try:
        session.delete(f"{API}/history", timeout=DEFAULT_TIMEOUT)
    except Exception:
        pass
    try:
        favs = session.get(f"{API}/favorites", timeout=DEFAULT_TIMEOUT).json()
        for f in favs:
            if isinstance(f, dict) and str(f.get("idea", "")).startswith("TEST_"):
                session.delete(f"{API}/favorites/{f['id']}", timeout=DEFAULT_TIMEOUT)
    except Exception:
        pass
