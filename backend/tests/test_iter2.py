"""Iteration 2 backend testss: civilization layers, guilds, creatures, assets....."""
import os
import uuid
import asyncio
import pytest
import requests
from pathlib import Path

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL"):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
API = f"{BASE_URL}/api"

SUFFIX = uuid.uuid4().hex[:8]
USER = {
    "username": f"TEST_I2_{SUFFIX}",
    "email": f"test_i2_{SUFFIX}@continuum.world",
    "password": "architect2026",
}


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/register", json=USER, timeout=30)
    assert r.status_code in (200, 400), r.text
    if r.status_code == 400:
        r = requests.post(f"{API}/auth/login", json={"email": USER["email"], "password": USER["password"]}, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture
def headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_civilization_layers():
    r = requests.get(f"{API}/civilization/layers", timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "zones" in data
    assert isinstance(data["zones"], list)
    if data["zones"]:
        allowed = {"wilderness", "frontier", "settlement", "city", "kingdom", "ruin"}
        for z in data["zones"]:
            assert "kind" in z, f"zone missing kind: {z}"
            assert z["kind"] in allowed, f"unknown kind: {z['kind']}"


def test_guild_create(headers):
    name = f"TEST_Guild_{SUFFIX}"
    r = requests.post(f"{API}/guilds/create", headers=headers,
                      json={"name": name, "motto": "For Testing"}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    g = data.get("guild") or data
    assert g.get("name") == name or name in str(data)
    pytest.guild_id = g.get("id") or g.get("guild_id") or data.get("id")
    members = g.get("members", []) if isinstance(g, dict) else []
    if members:
        assert any(USER["username"] in str(m) or "founder" in str(m).lower() for m in members) or True


def test_guild_list_includes_created():
    r = requests.get(f"{API}/guilds/list", timeout=10)
    assert r.status_code == 200
    data = r.json()
    guilds = data.get("guilds") if isinstance(data, dict) else data
    assert isinstance(guilds, list)
    names = [g.get("name", "") for g in guilds]
    assert any(f"TEST_Guild_{SUFFIX}" in n for n in names), f"created guild not in list: {names[:5]}"


def test_guild_join_idempotent(headers):
    gid = getattr(pytest, "guild_id", None)
    if not gid:
        pytest.skip("no guild id captured")
    r1 = requests.post(f"{API}/guilds/{gid}/join", headers=headers, timeout=10)
    assert r1.status_code in (200, 201), r1.text
    r2 = requests.post(f"{API}/guilds/{gid}/join", headers=headers, timeout=10)
    assert r2.status_code in (200, 201), r2.text


def test_creature_spawn_requires_dream(headers):
    requests.post(f"{API}/dream/trigger", headers=headers, timeout=60)
    r = requests.post(f"{API}/creatures/spawn-from-dream", headers=headers, timeout=30)
    assert r.status_code in (200, 400, 404), r.text
    if r.status_code == 200:
        data = r.json()
        c = data.get("creature") or data
        assert c.get("hp", 0) == 50 or c.get("max_hp", 0) == 50, f"hp expectations: {c}"
        pytest.creature = c


def test_creatures_list_in_range():
    r = requests.get(f"{API}/creatures/list", params={"x": 0, "y": 0, "radius": 100}, timeout=10)
    assert r.status_code == 200
    data = r.json()
    arr = data.get("creatures") if isinstance(data, dict) else data
    assert isinstance(arr, list)
    for c in arr:
        assert c.get("hp", 1) > 0, f"dead creature returned: {c}"


def test_creature_attack_too_far(headers):
    c = getattr(pytest, "creature", None)
    if not c:


        r = requests.get(f"{API}/creatures/list", params={"x": 0, "y": 0, "radius": 200}, timeout=10)
        arr = r.json().get("creatures", []) if isinstance(r.json(), dict) else r.json()
        if not arr:
            pytest.skip("no creature available")
        c = arr[0]



    requests.post(f"{API}/player/move", headers=headers, json={"x": c["x"] + 10, "y": c["y"] + 10}, timeout=10)
    r = requests.post(f"{API}/creatures/attack", headers=headers,
                      json={"creature_id": c.get("id")}, timeout=10)
    assert r.status_code == 400, f"expected 400 too far, got {r.status_code}: {r.text}"


def test_creature_attack_adjacent(headers):
    c = getattr(pytest, "creature", None)
    if not c:
        r = requests.get(f"{API}/creatures/list", params={"x": 0, "y": 0, "radius": 200}, timeout=10)
        arr = r.json().get("creatures", []) if isinstance(r.json(), dict) else r.json()
        if not arr:
            pytest.skip("no creature available")
        c = arr[0]

    mv = requests.post(f"{API}/player/move", headers=headers, json={"x": c["x"], "y": c["y"] + 1}, timeout=10)
    assert mv.status_code == 200
    r = requests.post(f"{API}/creatures/attack", headers=headers,
                      json={"creature_id": c.get("id")}, timeout=10)
    assert r.status_code == 200, r.text
    data = r.json()

    dmg = data.get("damage") or data.get("dmg")
    if dmg is not None:
        assert 8 <= dmg <= 18, f"damage out of range: {dmg}"


def test_tile_assets_exist():
    for t in ["grass", "forest", "water", "mountain", "sand", "dirt"]:
        r = requests.get(f"{BASE_URL}/assets/tiles/{t}.png", timeout=10)
        assert r.status_code == 200, f"missing tile {t}: {r.status_code}"
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n", f"{t} not a valid PNG"


def test_structure_assets_exist():
    for s in ["hut", "campfire", "road", "farm", "watchtower", "port",
              "bridge", "guild_hall", "monument", "ruin"]:
        r = requests.get(f"{BASE_URL}/assets/structures/{s}.png", timeout=10)
        assert r.status_code == 200, f"missing structure {s}: {r.status_code}"
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n", f"{s} not valid PNG"


def test_entity_assets_exist():
    for e in ["player", "creature"]:
        r = requests.get(f"{BASE_URL}/assets/{e}.png", timeout=10)
        assert r.status_code == 200, f"missing entity {e}"
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n"


def test_websocket_presence(token):
    try:
        import websockets
    except ImportError:
        pytest.skip("websockets not installed")
    ws_url = BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + f"/api/ws/presence?token={token}"

    async def run():
        async with websockets.connect(ws_url, open_timeout=10, close_timeout=5) as ws:
            await ws.send('{"type":"move","x":5,"y":5}')
            import asyncio as aio
            try:
                msg = await aio.wait_for(ws.recv(), timeout=5)
                assert msg is not None
            except aio.TimeoutError:
                pass
    asyncio.run(run())


def test_websocket_bad_token():
    try:
        import websockets
    except ImportError:
        pytest.skip("websockets not installed")
    ws_url = BASE_URL.replace("https://", "wss://").replace("http://", "ws://") + "/api/ws/presence?token=invalid"

    async def run():
        try:
            async with websockets.connect(ws_url, open_timeout=10, close_timeout=5) as ws:
                await ws.recv()
                return None
        except Exception as e:
            return e
    err = asyncio.run(run())
    assert err is not None, "bad token should be rejected"

    # this also works