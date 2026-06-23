import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { world, archaeology, worldmind, dream, history, creatures as creaturesApi, civilization } from "../api";
import { sfx, ambient } from "../audio";
import { toast } from "sonner";
import { Hammer, Pickaxe, Brain, Moon, ScrollText, LogOut, Compass, User, Sword, Volume2, VolumeX } from "lucide-react";

const TILE = 48;
const VIEW_W = 17;
const VIEW_H = 11;
const ASSET = (p) => `${process.env.PUBLIC_URL || ""}/assets/${p}`;

function Minimap({ pos, structures, zones, creatures, otherPlayers }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = 180, H = 180, RANGE = 100;
    cv.width = W; cv.height = H;
    // bg
    ctx.fillStyle = "#0a0a0e"; ctx.fillRect(0, 0, W, H);
    
    
    // zone tints
    const ZT = { kingdom: "rgba(240,200,74,0.5)", city: "rgba(212,175,55,0.4)", settlement: "rgba(168,138,42,0.3)", frontier: "rgba(120,98,47,0.2)", ruin: "rgba(140,140,140,0.4)" };
    zones.forEach(z => {
      const px = (z.x - pos.x + RANGE) / (RANGE * 2) * W;
      const py = (z.y - pos.y + RANGE) / (RANGE * 2) * H;
      ctx.fillStyle = ZT[z.kind] || "rgba(0,0,0,0)";
      ctx.fillRect(px - 16, py - 16, 32, 32);
    });
    
    
    
    // structures
    structures.forEach(s => {
      const px = (s.x - pos.x + RANGE) / (RANGE * 2) * W;
      const py = (s.y - pos.y + RANGE) / (RANGE * 2) * H;
      if (px < 0 || py < 0 || px > W || py > H) return;
      ctx.fillStyle = s.decay >= 70 ? "#888" : "#D4AF37";
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    });
    
    
    // creatures
    creatures.filter(c => c.hp > 0).forEach(c => {
      const px = (c.x - pos.x + RANGE) / (RANGE * 2) * W;
      const py = (c.y - pos.y + RANGE) / (RANGE * 2) * H;
      if (px < 0 || py < 0 || px > W || py > H) return;
      ctx.fillStyle = "#A65EBE"; ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
    });
    
    
    
    // other players
    otherPlayers.forEach(p => {
      const px = (p.x - pos.x + RANGE) / (RANGE * 2) * W;
      const py = (p.y - pos.y + RANGE) / (RANGE * 2) * H;
      if (px < 0 || py < 0 || px > W || py > H) return;
      ctx.fillStyle = "#A0A0AB"; ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
    });
    
    
    // player center
    ctx.fillStyle = "#4ADE80"; ctx.beginPath(); ctx.arc(W/2, H/2, 4, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#050508"; ctx.lineWidth = 1; ctx.stroke();
    
    
    
    // border
    ctx.strokeStyle = "#D4AF37"; ctx.lineWidth = 2; ctx.strokeRect(1, 1, W-2, H-2);
  }, [pos, structures, zones, creatures, otherPlayers]);
  return (
    <div className="absolute top-6 right-6 pointer-events-none" data-testid="minimap">
      <div className="relative">
        <canvas ref={ref} className="border-4 border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.2)]" style={{imageRendering:"pixelated"}}/>
        <div className="absolute top-1 left-1 overline text-[9px] text-[#D4AF37] bg-[#0a0a0e]/80 px-2 py-0.5">Map</div>
        <div className="absolute bottom-1 right-1 overline text-[9px] text-[#D4AF37] bg-[#0a0a0e]/80 px-2 py-0.5">±100</div>
      </div>
    </div>
  );
}

// terrain colors
const TERRAIN_COLORS = {
  grass: "#1a3a1f",
  forest: "#0d2614",
  water: "#0e2a3f",
  mountain: "#3a3328",
  sand: "#3d3621",
  dirt: "#2a1f15",
};
function md5like(str) {
  
  // just request structures from server and approximate terrain client-side.
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}


// soo in server we use md5 of `continuum-{x//4}-{y//4}` mod 100.
// mark terrain server-authoritative for build validation.. andddd for visuals we will just use hash.. ig
function clientTerrain(x, y) {
  const cx = Math.floor(x / 4), cy = Math.floor(y / 4);
  const n = md5like(`cont-${cx}-${cy}`) % 100;
  if (n < 8) return "water";
  if (n < 18) return "mountain";
  if (n < 35) return "forest";
  if (n < 45) return "sand";
  if (n < 55) return "dirt";
  return "grass";
}

const STRUCTURES = [
  { type: "hut", label: "Hut", icon: "", glyph: "" },
  { type: "campfire", label: "Campfire", icon: "", glyph: "" },
  { type: "road", label: "Road", icon: "", glyph: "" },
  { type: "farm", label: "Farm", icon: "", glyph: "" },
  { type: "watchtower", label: "Watchtower", icon: "", glyph: "" },
  { type: "port", label: "Port", icon: "", glyph: "" },
  { type: "bridge", label: "Bridge", icon: "", glyph: "" },
  { type: "guild_hall", label: "Guild Hall", icon: "", glyph: "" },
  { type: "monument", label: "Monument", icon: "", glyph: "" },
];

export default function Play() {
  const nav = useNavigate();
  const { user, player, setPlayer, logout } = useAuth();
  const canvasRef = useRef(null);
  const spritesRef = useRef({});
  const wsRef = useRef(null);
  const [pos, setPos] = useState({ x: player?.x ?? 0, y: player?.y ?? 0 });
  const [structures, setStructures] = useState([]);
  const [creatures, setCreatures] = useState([]);
  const [otherPlayers, setOtherPlayers] = useState([]);
  const [year, setYear] = useState(1);
  const [selectedTool, setSelectedTool] = useState("hut");
  const [tab, setTab] = useState("history");
  const [events, setEvents] = useState([]);
  const [folklore, setFolklore] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [dreamState, setDreamState] = useState({ is_dreaming: false, active_players: 1 });
  const [askQ, setAskQ] = useState("");
  const [askA, setAskA] = useState(null);
  const [asking, setAsking] = useState(false);
  const [hover, setHover] = useState(null);
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  const [facing, setFacing] = useState("down");
  const [walkFrame, setWalkFrame] = useState(0);
  const [zones, setZones] = useState([]);
  const [audioOn, setAudioOn] = useState(false);

  // Preload sprites
  useEffect(() => {
    const names = {
      grass: "tiles/grass.png", forest: "tiles/forest.png", water: "tiles/water.png",
      mountain: "tiles/mountain.png", sand: "tiles/sand.png", dirt: "tiles/dirt.png",
      hut: "structures/hut.png", campfire: "structures/campfire.png", road: "structures/road.png",
      farm: "structures/farm.png", watchtower: "structures/watchtower.png", port: "structures/port.png",
      bridge: "structures/bridge.png", guild_hall: "structures/guild_hall.png",
      monument: "structures/monument.png", ruin: "structures/ruin.png",
      creature: "creature.png",
      "player_down_0": "player/down_0.png", "player_down_1": "player/down_1.png",
      "player_up_0": "player/up_0.png", "player_up_1": "player/up_1.png",
      "player_left_0": "player/left_0.png", "player_left_1": "player/left_1.png",
      "player_right_0": "player/right_0.png", "player_right_1": "player/right_1.png",
    };
    let loaded = 0, total = Object.keys(names).length;
    Object.entries(names).forEach(([k, p]) => {
      const img = new Image();
      img.onload = () => { loaded++; if (loaded === total) setSpritesLoaded(true); };
      img.onerror = () => { loaded++; if (loaded === total) setSpritesLoaded(true); };
      img.src = ASSET(p);
      spritesRef.current[k] = img;
    });
  }, []);

  const refreshWorld = useCallback(async () => {
    const data = await world.state(pos.x, pos.y, 30);
    setStructures(data.structures);
    setYear(data.year);
    try {
      const c = await creaturesApi.list(pos.x, pos.y, 50);
      setCreatures(c.creatures);
    } catch {}
  }, [pos.x, pos.y]);

  const refreshSidebar = useCallback(async () => {
    const [h, f, a, d, z] = await Promise.all([
      history.list(20),
      worldmind.folklore(),
      archaeology.artifacts(false),
      dream.state(),
      civilization.layers(),
    ]);
    setEvents(h.events);
    setFolklore(f.folklore);
    setArtifacts(a.artifacts);
    setDreamState(d);
    setZones(z.zones);
  }, []);

  useEffect(() => { refreshWorld(); }, [refreshWorld]);
  useEffect(() => { refreshSidebar(); const t = setInterval(refreshSidebar, 15000); return () => clearInterval(t); }, [refreshSidebar]);



  // WebSocket presence
  useEffect(() => {
    const token = localStorage.getItem("continuum_token");
    if (!token) return;
    const wsUrl = `${process.env.REACT_APP_BACKEND_URL.replace(/^http/, "ws")}/api/ws/presence?token=${token}`;
    let ws;
    try { ws = new WebSocket(wsUrl); } catch { return; }
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "presence") {
          setOtherPlayers((msg.players || []).filter(p => p.username !== user?.username));
        }
      } catch {}
    };
    ws.onerror = () => {};
    return () => { try { ws.close(); } catch {} };
  }, [user?.username]);



  // Send position over WS when it changes
  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) {
      try { ws.send(JSON.stringify({ type: "move", x: pos.x, y: pos.y })); } catch {}
    }
  }, [pos.x, pos.y]);



  
  // Render canvas
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !spritesLoaded) return;
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    cv.width = VIEW_W * TILE;
    cv.height = VIEW_H * TILE;
    const sx = pos.x - Math.floor(VIEW_W / 2);
    const sy = pos.y - Math.floor(VIEW_H / 2);
    
    
    // terraiin
    for (let dy = 0; dy < VIEW_H; dy++) {
      for (let dx = 0; dx < VIEW_W; dx++) {
        const wx = sx + dx, wy = sy + dy;
        const t = clientTerrain(wx, wy);
        const sprite = spritesRef.current[t];
        if (sprite && sprite.complete && sprite.naturalWidth) {
          ctx.drawImage(sprite, dx * TILE, dy * TILE, TILE, TILE);
        } else {
          ctx.fillStyle = TERRAIN_COLORS[t];
          ctx.fillRect(dx * TILE, dy * TILE, TILE, TILE);
        }
      }
    }
    
    
    // structure
    structures.forEach(s => {
      const dx = s.x - sx, dy = s.y - sy;
      if (dx < 0 || dy < 0 || dx >= VIEW_W || dy >= VIEW_H) return;
      const ruined = s.decay >= 70;
      const key = ruined ? "ruin" : s.structure_type;
      const sprite = spritesRef.current[key];
      const px = dx * TILE + (TILE - 24) / 2;
      const py = dy * TILE + (TILE - 24) / 2;
      if (sprite && sprite.complete && sprite.naturalWidth) {
        ctx.globalAlpha = ruined ? 0.6 : 1;
        ctx.drawImage(sprite, px, py, 24, 24);
        ctx.globalAlpha = 1;
      }
    });
    
    
    
    // Creatures
    creatures.forEach(c => {
      if (c.hp <= 0) return;
      const dx = c.x - sx, dy = c.y - sy;
      if (dx < 0 || dy < 0 || dx >= VIEW_W || dy >= VIEW_H) return;
      const sprite = spritesRef.current.creature;
      if (sprite && sprite.complete) ctx.drawImage(sprite, dx * TILE + 4, dy * TILE + 4, 24, 24);
      // hp bar
      const w = TILE - 6;
      ctx.fillStyle = "#330";
      ctx.fillRect(dx * TILE + 3, dy * TILE - 4, w, 3);
      ctx.fillStyle = "#D4AF37";
      ctx.fillRect(dx * TILE + 3, dy * TILE - 4, w * (c.hp / c.max_hp), 3);
    });
    
    
    
    // other players ((presence)
    otherPlayers.forEach(p => {
      const dx = p.x - sx, dy = p.y - sy;
      if (dx < 0 || dy < 0 || dx >= VIEW_W || dy >= VIEW_H) return;
      ctx.fillStyle = "#A0A0AB";
      ctx.beginPath();
      ctx.arc(dx * TILE + TILE / 2, dy * TILE + TILE / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#050508"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = "#F8F8F8";
      ctx.font = "10px IBM Plex Mono";
      ctx.textAlign = "center";
      ctx.fillText(p.username, dx * TILE + TILE / 2, dy * TILE - 2);
    });
    if (hover) {
      const dx = hover.x - sx, dy = hover.y - sy;
      if (dx >= 0 && dy >= 0 && dx < VIEW_W && dy < VIEW_H) {
        ctx.strokeStyle = "#D4AF37";
        ctx.lineWidth = 2;
        ctx.strokeRect(dx * TILE + 1, dy * TILE + 1, TILE - 2, TILE - 2);
      }
    }
    
    // zone overlay
    const ZONE_TINTS = {
      kingdom: "rgba(240, 200, 74, 0.18)",
      city: "rgba(212, 175, 55, 0.14)",
      settlement: "rgba(168, 138, 42, 0.10)",
      frontier: "rgba(120, 98, 47, 0.08)",
      ruin: "rgba(140, 140, 140, 0.18)",
      wilderness: "rgba(0,0,0,0)",
    };
    zones.forEach(z => {
      const CELL = 20;
      const cellLeft = Math.floor(z.x / CELL) * CELL;
      const cellTop = Math.floor(z.y / CELL) * CELL;
      const dxL = cellLeft - sx;
      const dyT = cellTop - sy;
      if (dxL + CELL < 0 || dyT + CELL < 0 || dxL >= VIEW_W || dyT >= VIEW_H) return;
      ctx.fillStyle = ZONE_TINTS[z.kind] || "rgba(0,0,0,0)";
      ctx.fillRect(dxL * TILE, dyT * TILE, CELL * TILE, CELL * TILE);



      const lx = Math.max(0, dxL * TILE) + 4;
      const ly = Math.max(0, dyT * TILE) + 12;
      if (z.kind !== "wilderness" && dxL >= -CELL && dyT >= -CELL) {
        ctx.fillStyle = "rgba(212,175,55,0.9)";
        ctx.font = "10px IBM Plex Mono";
        ctx.textAlign = "left";
        ctx.fillText(z.kind.toUpperCase(), lx, ly);
      }
    });
    // player
    const cx = Math.floor(VIEW_W / 2) * TILE;
    const cy = Math.floor(VIEW_H / 2) * TILE;
    const pSprite = spritesRef.current[`player_${facing}_${walkFrame}`];
    if (pSprite && pSprite.complete) ctx.drawImage(pSprite, cx + 8, cy + 8, 32, 32);
  }, [structures, creatures, otherPlayers, pos, hover, spritesLoaded, zones, facing, walkFrame]);

  // movement
  const moveBy = useCallback(async (dx, dy) => {
    let dir = facing;
    if (dx > 0) dir = "right";
    else if (dx < 0) dir = "left";
    else if (dy > 0) dir = "down";
    else if (dy < 0) dir = "up";
    setFacing(dir);
    setWalkFrame(f => (f + 1) % 2);
    const nx = pos.x + dx, ny = pos.y + dy;
    setPos({ x: nx, y: ny });
    try { await world.move(nx, ny); } catch {}
  }, [pos, facing]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "w" || e.key === "ArrowUp") { e.preventDefault(); moveBy(0, -1); }
      else if (e.key === "s" || e.key === "ArrowDown") { e.preventDefault(); moveBy(0, 1); }
      else if (e.key === "a" || e.key === "ArrowLeft") { e.preventDefault(); moveBy(-1, 0); }
      else if (e.key === "d" || e.key === "ArrowRight") { e.preventDefault(); moveBy(1, 0); }

      else if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (STRUCTURES[idx]) setSelectedTool(STRUCTURES[idx].type);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moveBy]);

  const onCanvasMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const tx = Math.floor((e.clientX - rect.left) / TILE);
    const ty = Math.floor((e.clientY - rect.top) / TILE);
    const wx = pos.x - Math.floor(VIEW_W / 2) + tx;
    const wy = pos.y - Math.floor(VIEW_H / 2) + ty;
    setHover({ x: wx, y: wy });
  };

  const onCanvasClick = async () => {
    if (!hover) return;
    const dist = Math.abs(hover.x - pos.x) + Math.abs(hover.y - pos.y);
    const creature = creatures.find(c => c.x === hover.x && c.y === hover.y && c.hp > 0);
    if (creature) {
      if (dist > 1) { toast.error("Move closer to strike."); return; }
      try {
        sfx.attack();
        const res = await creaturesApi.attack(creature.id);
        if (res.slain) { sfx.slain(); toast.success(`${creature.name} was slain.`); }
        else { toast(`Hit for ${res.damage}. HP: ${res.creature_hp}`); }
        refreshWorld();
      } catch (e) { toast.error(e?.response?.data?.detail || "Strike failed."); }
      return;
    }
    if (dist > 1) { toast.error("Build adjacent to your Bearer (1 tile)."); return; }
    try {
      await world.build({ x: hover.x, y: hover.y, structure_type: selectedTool });
      sfx.build();
      toast.success(`${STRUCTURES.find(s => s.type === selectedTool)?.label} built.`);
      refreshWorld();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not build here.");
    }
  };

  const dig = async () => {
    try {
      sfx.dig();
      const res = await archaeology.dig();
      if (res.found) {
        sfx.found();
        const a = res.artifact;
        toast.success(`You unearthed: ${a.name}${a.is_architect_lore ? " (Architect Fragment!)" : ""}`);
        if (a.inscription) {
          setTimeout(() => toast(`"${a.inscription}"`, { duration: 12000 }), 600);
        }
        refreshSidebar();
      } else {
        toast(res.message);
      }
    } catch { toast.error("The earth resists."); }
  };

  const ask = async (e) => {
    e.preventDefault();
    if (!askQ.trim()) return;
    setAsking(true);
    setAskA(null);
    try {
      const res = await worldmind.ask(askQ);
      setAskA(res.answer);
      setAskQ("");
      refreshSidebar();
    } catch { toast.error("The World Mind is silent."); }
    finally { setAsking(false); }
  };

  const triggerDream = async () => {
    try {
      const d = await dream.trigger();
      sfx.dream();
      toast.success("The world dreamed.");
      setTimeout(() => toast(d.content, { duration: 14000 }), 400);
      try { await creaturesApi.spawnFromDream(); } catch {}
      refreshSidebar();
      refreshWorld();
    } catch { toast.error("Dream layer unreachable."); }
  };

  return (
    <div data-testid="play-page" className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-[#0C0C10] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-accent text-xs tracking-widest text-[#D4AF37]">CONTINUUM</Link>
          <span className="overline text-[#A0A0AB]">Year {year}</span>
          <span className="overline text-[#A0A0AB]">@ ({pos.x}, {pos.y})</span>
          {dreamState.is_dreaming && <span data-testid="dream-indicator" className="overline text-[#4ADE80] flicker">◐ World Dreaming</span>}
        </div>
        <div className="flex items-center gap-3">
          <button
            data-testid="audio-toggle"
            onClick={() => { const m = ambient.toggle(); setAudioOn(!m); }}
            title={audioOn ? "Mute" : "Unmute"}
            className="overline text-[#A0A0AB] hover:text-[#D4AF37]"
          >
            {audioOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          <Link data-testid="nav-archive" to="/archive" className="overline text-[#A0A0AB] hover:text-[#D4AF37]">Archive</Link>
          <Link data-testid="nav-profile" to={`/profile/${user?.username}`} className="flex items-center gap-2 overline text-[#A0A0AB] hover:text-[#D4AF37]">
            <User size={12} /> {user?.username}
          </Link>
          <button data-testid="logout-btn" onClick={() => { logout(); nav("/"); }} className="overline text-[#A0A0AB] hover:text-[#D4AF37] flex items-center gap-1">
            <LogOut size={12} /> Exit
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[200px_1fr_320px]">
        <aside className="border-r border-[#D4AF37]/20 bg-[#0a0a0e] p-4 overflow-y-auto">
          <div className="overline mb-3 flex items-center gap-2"><Compass size={12} /> Bearer</div>
          <div className="text-xs space-y-1.5 text-[#A0A0AB] mb-4">
            <div>Position: <span className="text-[#F8F8F8] font-mono">({pos.x}, {pos.y})</span></div>
            <div>Built: <span className="text-[#D4AF37]">{player?.structures_built ?? 0}</span></div>
            <div>Artifacts: <span className="text-[#D4AF37]">{player?.artifacts_found ?? 0}</span></div>
            <div>Distance: <span className="text-[#F8F8F8]">{player?.distance_traveled ?? 0}</span></div>
            {user?.is_first_settler && <div className="text-[#D4AF37] mt-2">★ First Settler</div>}
          </div>

          {creatures.filter(c => c.hp > 0).length > 0 && (
            <div className="mb-4 p-3 border border-[#A65EBE]/40 bg-[#A65EBE]/5">
              <div className="overline mb-1 flex items-center gap-2 text-[#C880D9]"><Sword size={12} /> Hostile</div>
              <div className="text-xs text-[#A0A0AB]">
                {creatures.filter(c => c.hp > 0).length} dream-spawn nearby
              </div>
            </div>
          )}

          <div className="border-t border-[#D4AF37]/10 pt-3 mb-3">
            <div className="overline mb-2">Selected Tool</div>
            <div className="text-2xl mb-1">{STRUCTURES.find(s => s.type === selectedTool)?.icon}</div>
            <div className="font-heading text-sm">{STRUCTURES.find(s => s.type === selectedTool)?.label}</div>
            <div className="text-[10px] text-[#A0A0AB] mt-1">Click adjacent tile to build</div>
          </div>

          <div className="text-[10px] text-[#A0A0AB] leading-relaxed border-t border-[#D4AF37]/10 pt-3">
            <span className="overline block mb-2">Controls</span>
            WASD / Arrows   move<br/>
            1-9   quick-select tool<br/>
            Click tile   build/strike<br/>
            Hotbar    Dig<br/>
            Hotbar    Force Dream
          </div>
        </aside>

        <main className="bg-gradient-to-b from-[#050508] to-[#0c0c14] flex items-center justify-center p-4 relative">
          <canvas
            ref={canvasRef}
            data-testid="game-canvas"
            className="tile-canvas border-4 border-[#D4AF37]/30 shadow-[0_0_60px_rgba(212,175,55,0.15)]"
            onMouseMove={onCanvasMove}
            onMouseLeave={() => setHover(null)}
            onClick={onCanvasClick}
          />

          <div className="absolute top-6 left-6 flex items-center gap-3 pointer-events-none">
            <div className="relative">
              <img src={ASSET("ui/orb_hp.png")} alt="hp" className="w-14 h-14" style={{imageRendering:"pixelated"}}/>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-white drop-shadow">100</div>
            </div>
            <div className="relative">
              <img src={ASSET("ui/orb_mp.png")} alt="mp" className="w-14 h-14" style={{imageRendering:"pixelated"}}/>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-white drop-shadow">{player?.structures_built ?? 0}</div>
            </div>
            <div className="relative">
              <img src={ASSET("ui/orb_xp.png")} alt="xp" className="w-14 h-14" style={{imageRendering:"pixelated"}}/>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-[#1a1408] drop-shadow">Y{year}</div>
            </div>
            <div className="ml-2 text-xs">
              <div className="font-heading text-base text-[#D4AF37]">{user?.username}</div>
              <div className="text-[10px] text-[#A0A0AB] uppercase tracking-widest">{user?.title || "Bearer"}</div>
            </div>
          </div>

          <Minimap pos={pos} structures={structures} zones={zones} creatures={creatures} otherPlayers={otherPlayers} />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1 p-2 bg-[#0a0a0e]/90 border-2 border-[#D4AF37]/40 backdrop-blur" data-testid="hotbar">
            {STRUCTURES.slice(0, 9).map((s, i) => (
              <button
                key={s.type}
                data-testid={`hotbar-${s.type}`}
                onClick={() => setSelectedTool(s.type)}
                className={`relative w-14 h-14 flex items-center justify-center text-2xl transition ${selectedTool === s.type ? "bg-[#D4AF37]/30 border-2 border-[#D4AF37]" : "bg-[#1a1410] border-2 border-[#3a2818] hover:border-[#D4AF37]/60"}`}
                title={s.label}
              >
                <span>{s.icon}</span>
                <span className="absolute top-0 left-1 text-[8px] font-mono text-[#D4AF37]/80">{i+1}</span>
              </button>
            ))}
            <div className="w-px bg-[#D4AF37]/30 mx-1" />
            <button data-testid="hotbar-dig" onClick={dig} className="w-14 h-14 bg-[#1a1410] border-2 border-[#3a2818] hover:border-[#D4AF37]/60 flex items-center justify-center text-2xl" title="Dig">⛏</button>
            <button data-testid="hotbar-dream" onClick={triggerDream} className="w-14 h-14 bg-[#1a1410] border-2 border-[#3a2818] hover:border-[#D4AF37]/60 flex items-center justify-center text-2xl" title="Dream">🌙</button>
          </div>

          {hover && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-xs text-[#D4AF37] bg-[#0a0a0e]/90 border border-[#D4AF37]/40 px-4 py-1.5 pointer-events-none">
              ({hover.x}, {hover.y})   {clientTerrain(hover.x, hover.y)}
            </div>
          )}

          <div className="lg:hidden absolute bottom-32 left-6 flex flex-col items-center gap-1 select-none touch-none">
            <button data-testid="dpad-up" onClick={() => moveBy(0, -1)} className="w-12 h-12 bg-[#0C0C10]/90 border border-white/20 text-[#D4AF37] active:bg-[#D4AF37]/20">▲</button>
            <div className="flex gap-1">
              <button data-testid="dpad-left" onClick={() => moveBy(-1, 0)} className="w-12 h-12 bg-[#0C0C10]/90 border border-white/20 text-[#D4AF37] active:bg-[#D4AF37]/20">◀</button>
              <button data-testid="dpad-down" onClick={() => moveBy(0, 1)} className="w-12 h-12 bg-[#0C0C10]/90 border border-white/20 text-[#D4AF37] active:bg-[#D4AF37]/20">▼</button>
              <button data-testid="dpad-right" onClick={() => moveBy(1, 0)} className="w-12 h-12 bg-[#0C0C10]/90 border border-white/20 text-[#D4AF37] active:bg-[#D4AF37]/20">▶</button>
            </div>
          </div>
          <div className="lg:hidden absolute bottom-32 right-6 flex flex-col gap-2">
            <button data-testid="touch-build" onClick={() => { const front = { down: [0,1], up: [0,-1], left: [-1,0], right: [1,0] }[facing]; setHover({ x: pos.x + front[0], y: pos.y + front[1] }); setTimeout(() => onCanvasClick(), 30); }} className="w-14 h-14 bg-[#D4AF37] text-[#050508] font-bold rounded-full">▣</button>
            <button data-testid="touch-dig" onClick={dig} className="w-14 h-14 bg-[#0C0C10]/90 border border-white/20 text-[#D4AF37] rounded-full">⛏</button>
          </div>
        </main>

        <aside className="border-l border-white/10 bg-[#0C0C10] flex flex-col">
          <div className="flex border-b border-white/10">
            {[
              { id: "history", label: "History", Icon: ScrollText },
              { id: "mind", label: "Mind", Icon: Brain },
              { id: "archaeology", label: "Dig", Icon: Pickaxe },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                data-testid={`tab-${id}`}
                onClick={() => setTab(id)}
                className={`flex-1 p-3 text-xs uppercase tracking-widest flex items-center justify-center gap-2 border-r border-white/10 last:border-r-0 transition ${tab === id ? "bg-[#D4AF37]/10 text-[#D4AF37]" : "text-[#A0A0AB] hover:text-[#F8F8F8]"}`}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 text-sm">
            {tab === "history" && (
              <div data-testid="history-feed" className="space-y-3">
                {events.length === 0 && <p className="text-[#A0A0AB] text-xs">The Archive is silent.</p>}
                {events.map(e => (
                  <div key={e.id} className="border-l-2 border-[#D4AF37]/40 pl-3">
                    <div className="overline text-[10px] mb-1">Y{e.year} · {e.type}</div>
                    <div className="font-heading text-base">{e.title}</div>
                    <div className="text-[#A0A0AB] text-xs mt-1">{e.description}</div>
                  </div>
                ))}
              </div>
            )}
            {tab === "mind" && (
              <div data-testid="mind-tab" className="space-y-4">
                <form onSubmit={ask} className="space-y-2">
                  <label className="overline">Ask the World Mind</label>
                  <textarea
                    data-testid="mind-question"
                    value={askQ}
                    onChange={(e) => setAskQ(e.target.value)}
                    rows={2}
                    placeholder="What happened to the Architects?"
                    className="input-archive resize-none"
                  />
                  <button data-testid="mind-ask-btn" disabled={asking} className="btn-gold w-full text-[10px]">
                    {asking ? "Listening…" : "Speak"}
                  </button>
                </form>
                {askA && (
                  <div data-testid="mind-answer" className="border border-[#4ADE80]/30 bg-[#4ADE80]/5 p-3 text-xs leading-relaxed font-mono">
                    {askA}
                  </div>
                )}
                <div className="border-t border-white/5 pt-4">
                  <div className="overline mb-2">Recent Folklore</div>
                  {folklore.slice(0, 8).map(f => (
                    <div key={f.id} className="text-xs text-[#A0A0AB] italic mb-3 leading-relaxed">
                      "{f.content}" <span className="not-italic text-[10px]">  Y{f.year}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === "archaeology" && (
              <div data-testid="dig-tab" className="space-y-3">
                {artifacts.length === 0 && <p className="text-[#A0A0AB] text-xs">Nothing has been unearthed.</p>}
                {artifacts.map(a => (
                  <div key={a.id} className={`p-3 border ${a.is_architect_lore ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-white/10"}`}>
                    <div className="overline text-[10px] mb-1">Y{a.discovered_year} · ({a.x},{a.y})</div>
                    <div className="font-heading text-base">{a.name}</div>
                    <div className="text-[10px] text-[#A0A0AB]">found by {a.discovered_by}</div>
                    {a.inscription && (
                      <div className="text-xs text-[#4ADE80] mt-2 font-mono italic">"{a.inscription}"</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}