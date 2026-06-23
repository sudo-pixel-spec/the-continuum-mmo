# THE CONTINUUM
### A Persistent Civilization MMORPG

> "Persistent civilization > persistent character. The world is the protagonist."
>   Architect's Journal Fragment 0x1A

The Continuum is a browser-based MMORPG where the **world itself is the main character**. Every action a player takes   building a hut, walking a path, asking a question, dying in a forgotten valley   is permanently recorded in the world's memory. Cities rise. Roads decay. Myths are dreamed by an AI. Civilizations leave ruins for the next era to dig up.

You are not a hero. You are a **Bearer**   a footnote in a long, slowly-unfolding history.

---

## The 8 Systems

| # | System | What it does |
|---|--------|--------------|
| 1 | **Persistent Civilization** | Buildings, roads, monuments stay forever. The map evolves: wilderness → frontier → settlement → city → ruin. |
| 2 | **World Mind (Collective Unconscious)** | An LLM-driven memory layer that answers questions using the actual events of every player. NPCs slowly learn what really happened. |
| 3 | **Entropy / Decay** | Unmaintained structures degrade. History fragments fade. Players must preserve. |
| 4 | **Dream State** | When activity is low, the world generates new ruins, myths, and creatures from accumulated player history (LLM-powered). |
| 5 | **Architect Archaeology** | The creator's career exists as buried artifacts. Dig long enough and you reconstruct, the First Architect. |
| 6 | **Real Systems Exposed** | The MongoDB schema, FastAPI endpoints, and procedural terrain hash are all transparent   players can inspect the world's source code. |
| 7 | **Collective Memory** | Every World Mind question and answer is stored as folklore. The world's lore literally grows from player questions. |
| 8 | **Legacy** | First Settler, First Builder, First Architect-Lore Discoverer   these become permanent historical figures. |

---

## Tech Stack

- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Auth**: JWT email/password (simple, browser-friendly)
- **LLM Engine**: Multi-provider with fallback chain
  - Primary: **Gemini 2.5 Flash** (via Emergent Universal Key)
  - Configurable: Claude Sonnet 4.5, GPT-5
  - Fallback: **Ollama** (any local/cloud model   `llama3.2` default)
  - Final fallback: Hand-crafted offline lore fragments
- **Frontend**: React 19 + Tailwind + Canvas (2D top-down rendering)
- **Fonts**: Cormorant Garamond (cinematic) + IBM Plex Mono (terminal/archive)
- **Aesthetic**: Deep obsidian (`#050508`) + Ancient Gold (`#D4AF37`) + Terminal Green (`#4ADE80`)

---

## Folder Structure

```
/app
├── backend/
│   ├── server.py            # All FastAPI routes + LLM service
│   ├── .env                 # MONGO_URL, JWT_SECRET, LLM_PROVIDER
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── assets/          # ◀── DROP YOUR PIXEL ART HERE (see below)
│   └── src/
│       ├── App.js
│       ├── api.js           # Backend API client
│       ├── AuthContext.jsx  # JWT auth state
│       ├── index.css        # Theme, fonts, animations
│       └── pages/
│           ├── Landing.jsx  # Marketing landing page
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Play.jsx     # Main game (Canvas + tools + side panels)
│           ├── Archive.jsx  # World history browser
│           └── Profile.jsx  # Bearer legacy page
└── README.md (this file)
```

---

## Asset Replacement Guide

To replace pixel art, drop assets at the paths below. The frontend is structured to swap them in trivially   see `Play.jsx` → `TERRAIN_COLORS` and `STRUCTURES`.

### 1. Terrain Tiles
Drop **48×48 PNG** tiles at `/app/frontend/public/assets/tiles/`:

| Filename | Used for | Suggested look |
|----------|----------|----------------|
| `grass.png` | Default ground | Mossy green pixel grass |
| `forest.png` | Dense vegetation | Dark trees, top-down |
| `water.png` | Oceans/rivers | Animated blue (or static) |
| `mountain.png` | Stone, impassable | Grey rocks |
| `sand.png` | Coast/desert | Tan, slightly grainy |
| `dirt.png` | Paths, exposed earth | Brown |

To enable: in `Play.jsx`, replace the `ctx.fillStyle = TERRAIN_COLORS[t]` block with a sprite-image draw call.

### 2. Structure Sprites
Drop **32×32 PNG** sprites at `/app/frontend/public/assets/structures/`:

| Filename | Structure |
|----------|-----------|
| `hut.png` | Player home |
| `campfire.png` | Resting point |
| `road.png` | Path tile |
| `farm.png` | Crops |
| `watchtower.png` | Mountain-only lookout |
| `port.png` | Water-only dock |
| `bridge.png` | Crosses water |
| `guild_hall.png` | Group HQ |
| `monument.png` | Historical marker |
| `ruin.png` | Decayed structure (decay ≥ 70) |

### 3. Player Sprite (animated)
Drop **32×32 PNG** sprites at `/app/frontend/public/assets/player/`:
- `down_0.png`, `down_1.png`   facing camera, 2-frame walk cycle
- `up_0.png`, `up_1.png`   facing away
- `left_0.png`, `left_1.png`   facing left
- `right_0.png`, `right_1.png`   facing right

### 4. UI Frames & Orbs
Drop at `/app/frontend/public/assets/ui/`:
- `orb_hp.png`, `orb_mp.png`, `orb_xp.png`   **64×64** ornate spheres for HUD
- `hotbar_slot.png`   **64×64** gold-cornered slot frame (currently rendered with CSS, swap-in supported)

### 5. Creature Sprite
**32×32 PNG** at `/app/frontend/public/assets/creature.png`   for Dream-spawned enemies.

### 5. Audio (not yet wired up)
Recommended drop point: `/app/frontend/public/assets/audio/`
- `ambient.mp3`   atmospheric loop for the game view
- `dream.mp3`   sting when a Dream is generated
- `dig.mp3`   when an artifact is uncovered
- `build.mp3`   when a structure is placed

---

## API Reference

All endpoints are prefixed with `/api`. Auth required where noted.

### Auth
- `POST /api/auth/register` `{username, email, password}` → `{token, user}`
- `POST /api/auth/login` `{email, password}` → `{token, user}`
- `GET /api/auth/me` → `{user, player}`

### World
- `GET /api/world/state?x=0&y=0&radius=25` → `{structures, year, center, radius}`
- `POST /api/world/build` `{x, y, structure_type, name?}` → structure
- `POST /api/player/move` `{x, y}` → `{x, y}`

### History
- `GET /api/history?limit=50&type=arrival|milestone|dream|discovery` → events
- `GET /api/history/stats` → `{year, bearers, structures, artifacts, events, folklore}`

### Archaeology
- `POST /api/archaeology/dig` → `{found, artifact?}` (30% find chance, 6% Architect-lore chance)
- `GET /api/archaeology/artifacts?architect_only=false` → artifacts

### World Mind
- `POST /api/worldmind/ask` `{question}` → `{answer, year}` (LLM call)
- `GET /api/worldmind/folklore` → folklore

### Dream
- `GET /api/dream/state` → `{is_dreaming, active_players}`
- `POST /api/dream/trigger` → dream object (LLM call)
- `GET /api/dream/list` → dreams

### Profile
- `GET /api/profile/{username}` → full Bearer legacy
- `GET /api/leaderboard` → top builders & diggers

### LLM
- `GET /api/llm/providers` → available providers + models

---

## Configuring the LLM Provider

In `/app/backend/.env`:

```env
LLM_PROVIDER=gemini       # or "claude", "gpt"
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

The backend always tries the configured provider first. If it fails (rate-limit, no credits, network), it automatically falls back to **Ollama**. If Ollama is also unreachable, it returns a hand-crafted mystical fragment so the game never breaks.

To use Ollama-only: set `LLM_PROVIDER=ollama`

---

## Lore Summary

**The Architects** built a world that could think   then vanished. Three Archives disagree on what happened: ascension, self-destruction, or consumption. Now, thousands of years later, **Bearers** arrive. Their job is not to save or destroy the world. Their job is to **decide what it remembers**.

The hidden truth, buried in 6% of all artifacts: the Architect was named sudo-pixel-spec, and The Continuum was always meant to be his portfolio.

---