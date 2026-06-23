"""Backend test suite for The Continuum MMORPG.."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:

    from pathlib import Path
    fe = Path("/app/frontend/.env").read_text()
    for line in fe.splitlines():
        if line.startswith("REACT_APP_BACKEND_URL"):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"



SUFFIX = uuid.uuid4().hex[:8]
TEST_USER = {
    "username": f"TEST_{SUFFIX}",
    "email": f"test_{SUFFIX}@continuum.world",
    "password": "architect2026",
}


@pytest.fixture(scope="session")
def session_token():
    r = requests.post(f"{API}/auth/register", json=TEST_USER, timeout=30)
    if r.status_code == 400:
    
        r = requests.post(f"{API}/auth/login", json={
            "email": TEST_USER["email"], "password": TEST_USER["password"]
        }, timeout=15)
    assert r.status_code == 200, f"auth failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture
def auth_headers(session_token):
    return {"Authorization": f"Bearer {session_token}"}


def test_root():
    r = requests.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert r.json().get("status") == "alive"


def test_llm_providers():
    r = requests.get(f"{API}/llm/providers", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "default" in data and "available" in data
    assert "gemini" in data["available"]


def test_register_duplicate():
    requests.post(f"{API}/auth/register", json=TEST_USER, timeout=30)
    r = requests.post(f"{API}/auth/register", json=TEST_USER, timeout=30)
    assert r.status_code == 400


def test_login(session_token):
    r = requests.post(f"{API}/auth/login", json={
        "email": TEST_USER["email"], "password": TEST_USER["password"]
    }, timeout=15)
    assert r.status_code == 200
    assert "token" in r.json()


def test_login_bad_pw():
    r = requests.post(f"{API}/auth/login", json={
        "email": TEST_USER["email"], "password": "wrong"
    }, timeout=15)
    assert r.status_code == 401


def test_me_no_auth():
    r = requests.get(f"{API}/auth/me", timeout=10)
    assert r.status_code in (401, 403)


def test_me_with_auth(auth_headers):
    r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=10)
    assert r.status_code == 200
    body = r.json()
    assert body["user"]["username"] == TEST_USER["username"]
    assert body["player"]["x"] == 0


def test_world_state():
    r = requests.get(f"{API}/world/state", params={"x": 0, "y": 0, "radius": 25}, timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "structures" in data and "year" in data


def test_build_water_rejects_hut(auth_headers):
    import hashlib
    water = None
    for x in range(-30, 30):
        for y in range(-30, 30):
            h = int(hashlib.md5(f"continuum-{x // 4}-{y // 4}".encode()).hexdigest(), 16) % 100
            if h < 8:
                water = (x, y); break
        if water: break
    assert water, "no water tile found"
    r = requests.post(f"{API}/world/build", headers=auth_headers,
                      json={"x": water[0], "y": water[1], "structure_type": "hut"}, timeout=10)
    assert r.status_code == 400


def test_build_grass_hut(auth_headers):
    import hashlib
    target = None
    for x in range(50, 200):
        for y in range(50, 200):
            h = int(hashlib.md5(f"continuum-{x // 4}-{y // 4}".encode()).hexdigest(), 16) % 100
            if h >= 55:  # grasssss
                target = (x, y); break
        if target: break
    assert target
    r = requests.post(f"{API}/world/build", headers=auth_headers,
                      json={"x": target[0], "y": target[1], "structure_type": "hut",
                            "name": "TEST_Hut"}, timeout=10)
    assert r.status_code in (200, 400), r.text  # 400 only if duplicate
    if r.status_code == 200:
        body = r.json()
        assert body, "empty response"


def test_player_move(auth_headers):
    r = requests.post(f"{API}/player/move", headers=auth_headers,
                      json={"x": 5, "y": 3}, timeout=10)
    assert r.status_code == 200


def test_dig(auth_headers):
    r = requests.post(f"{API}/archaeology/dig", headers=auth_headers,
                      json={"x": 10, "y": 10}, timeout=15)
    assert r.status_code == 200
    data = r.json()
    assert "found" in data


def test_artifacts_list():
    r = requests.get(f"{API}/archaeology/artifacts", timeout=10)
    assert r.status_code == 200
    assert isinstance(r.json(), (list, dict))


def test_artifacts_architect_filter():
    r = requests.get(f"{API}/archaeology/artifacts",
                     params={"architect_only": "true"}, timeout=10)
    assert r.status_code == 200


def test_worldmind_ask(auth_headers):
    r = requests.post(f"{API}/worldmind/ask", headers=auth_headers,
                      json={"question": "What do you remember of the first arrival?"},
                      timeout=60)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "answer" in data
    assert isinstance(data["answer"], str) and len(data["answer"]) > 5


def test_worldmind_folklore():
    r = requests.get(f"{API}/worldmind/folklore", timeout=10)
    assert r.status_code == 200


def test_dream_state():
    r = requests.get(f"{API}/dream/state", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "is_dreaming" in data or "active_players" in data


def test_dream_trigger(auth_headers):
    r = requests.post(f"{API}/dream/trigger", headers=auth_headers, timeout=60)
    assert r.status_code == 200, r.text


def test_history_default():
    r = requests.get(f"{API}/history", params={"limit": 10}, timeout=10)
    assert r.status_code == 200
    assert isinstance(r.json(), (list, dict))


def test_history_filter_arrival():
    r = requests.get(f"{API}/history", params={"type": "arrival", "limit": 5}, timeout=10)
    assert r.status_code == 200


def test_history_stats():
    r = requests.get(f"{API}/history/stats", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "year" in data


def test_profile_existing():
    r = requests.get(f"{API}/profile/{TEST_USER['username']}", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "user" in data or "username" in data


def test_profile_missing():
    r = requests.get(f"{API}/profile/NotARealUser_xyz_abc", timeout=10)
    assert r.status_code == 404


def test_leaderboard():
    r = requests.get(f"{API}/leaderboard", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert "top_builders" in data and "top_diggers" in data







# APPARENTLY IT WORKS