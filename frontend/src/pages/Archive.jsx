import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { history, archaeology, worldmind, dream, profile, civilization, guilds as guildsApi } from "../api";

export default function Archive() {
  const [tab, setTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [folklore, setFolklore] = useState([]);
  const [dreams, setDreams] = useState([]);
  const [stats, setStats] = useState(null);
  const [lb, setLb] = useState(null);
  const [zones, setZones] = useState([]);
  const [guilds, setGuilds] = useState([]);
  const [newGuild, setNewGuild] = useState({ name: "", motto: "" });

  useEffect(() => {
    Promise.all([
      history.list(100), archaeology.artifacts(), worldmind.folklore(),
      dream.list(), history.stats(), profile.leaderboard(),
      civilization.layers(), guildsApi.list(),
    ]).then(([h, a, f, d, s, l, c, g]) => {
      setEvents(h.events); setArtifacts(a.artifacts); setFolklore(f.folklore);
      setDreams(d.dreams); setStats(s); setLb(l); setZones(c.zones); setGuilds(g.guilds);
    });
  }, []);

  const createGuild = async (e) => {
    e.preventDefault();
    try {
      await guildsApi.create(newGuild.name, newGuild.motto);
      const g = await guildsApi.list();
      setGuilds(g.guilds);
      setNewGuild({ name: "", motto: "" });
    } catch (err) { alert(err?.response?.data?.detail || "Could not create guild"); }
  };

  const joinGuild = async (id) => {
    try {
      await guildsApi.join(id);
      const g = await guildsApi.list();
      setGuilds(g.guilds);
    } catch {}
  };

  return (
    <div data-testid="archive-page" className="min-h-screen">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#0C0C10]">
        <Link to="/play" className="overline text-[#A0A0AB] hover:text-[#D4AF37]">← Return to World</Link>
        <h1 className="font-heading text-2xl">The Archive</h1>
        <div className="text-xs text-[#A0A0AB]">Year {stats?.year}</div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-white/10 border border-white/10 mb-8">
            {[
              ["Bearers", stats.bearers], ["Structures", stats.structures], ["Artifacts", stats.artifacts],
              ["Events", stats.events], ["Folklore", stats.folklore],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#050508] p-5">
                <div className="overline text-[10px] mb-1">{k}</div>
                <div className="font-heading text-3xl">{v}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex border-b border-white/10 mb-6 flex-wrap">
          {[["events", "Historical Events"], ["artifacts", "Artifacts"], ["folklore", "Folklore"], ["dreams", "Dreams"], ["civilization", "Civilization"], ["guilds", "Guilds"], ["legacy", "Legacy"]].map(([id, label]) => (
            <button
              key={id}
              data-testid={`archive-tab-${id}`}
              onClick={() => setTab(id)}
              className={`px-5 py-3 overline border-b-2 transition ${tab === id ? "border-[#D4AF37] text-[#D4AF37]" : "border-transparent text-[#A0A0AB] hover:text-[#F8F8F8]"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "events" && (
          <div className="space-y-4">
            {events.map(e => (
              <div key={e.id} className="panel p-5 grid grid-cols-[80px_1fr] gap-4">
                <div>
                  <div className="font-heading text-3xl text-[#D4AF37]">Y{e.year}</div>
                  <div className="overline text-[10px]">{e.type}</div>
                </div>
                <div>
                  <div className="font-heading text-xl">{e.title}</div>
                  <div className="text-[#A0A0AB] text-sm mt-1">{e.description}</div>
                  <div className="text-[10px] text-[#A0A0AB]/70 mt-2 font-mono">  {e.actor}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "artifacts" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {artifacts.map(a => (
              <div key={a.id} className={`panel p-5 ${a.is_architect_lore ? "border-[#D4AF37]" : ""}`}>
                <div className="overline text-[10px] mb-2">{a.category} · Y{a.discovered_year}</div>
                <div className="font-heading text-xl">{a.name}</div>
                <div className="text-[10px] text-[#A0A0AB] mt-1">at ({a.x},{a.y}) by <Link to={`/profile/${a.discovered_by}`} className="text-[#D4AF37] hover:underline">{a.discovered_by}</Link></div>
                {a.inscription && <div className="text-xs text-[#4ADE80] mt-3 font-mono italic leading-relaxed">"{a.inscription}"</div>}
              </div>
            ))}
          </div>
        )}

        {tab === "folklore" && (
          <div className="space-y-3 max-w-3xl">
            {folklore.map(f => (
              <div key={f.id} className="panel p-5">
                <div className="overline text-[10px] mb-2">Y{f.year} · asked by {f.asker}</div>
                <div className="text-sm text-[#A0A0AB] mb-2">"{f.question}"</div>
                <div className="font-heading italic text-lg leading-relaxed">{f.content}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "dreams" && (
          <div className="space-y-4 max-w-3xl">
            {dreams.map(d => (
              <div key={d.id} className="panel p-5 border-l-4 border-l-[#4ADE80]">
                <div className="overline text-[10px] mb-2">Y{d.year} · ({d.x},{d.y})</div>
                <div className="font-heading italic leading-relaxed">{d.content}</div>
              </div>
            ))}
            {dreams.length === 0 && <p className="text-[#A0A0AB]">The world has not yet dreamed. Reduce activity, then trigger one.</p>}
          </div>
        )}

        {tab === "civilization" && (
          <div data-testid="civilization-tab">
            {zones.length === 0 && <p className="text-[#A0A0AB]">No civilization yet. Be the first to build.</p>}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {zones.map((z, i) => {
                const colors = { wilderness: "#3a3328", frontier: "#78622f", settlement: "#A88A2A", city: "#D4AF37", kingdom: "#F0C84A", ruin: "#5a5a55" };
                return (
                  <div key={i} className="panel p-4" style={{ borderLeft: `3px solid ${colors[z.kind]}` }}>
                    <div className="overline text-[10px] mb-1">{z.kind}</div>
                    <div className="font-heading text-xl">({z.x}, {z.y})</div>
                    <div className="text-xs text-[#A0A0AB] mt-1">
                      {z.structure_count} structures · {z.avg_decay}% avg decay
                    </div>
                    <div className="text-[10px] text-[#A0A0AB]/70 mt-2">by {z.owners.join(", ")}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "guilds" && (
          <div data-testid="guilds-tab">
            <form onSubmit={createGuild} className="panel p-5 mb-6 max-w-lg">
              <div className="overline mb-3">Found a Guild</div>
              <input data-testid="guild-name" required minLength={3} maxLength={30} placeholder="Guild name" value={newGuild.name} onChange={(e) => setNewGuild({...newGuild, name: e.target.value})} className="input-archive mb-2" />
              <input data-testid="guild-motto" placeholder="Motto (optional)" value={newGuild.motto} onChange={(e) => setNewGuild({...newGuild, motto: e.target.value})} className="input-archive mb-3" />
              <button data-testid="guild-create-btn" className="btn-gold">Found Guild</button>
            </form>
            <div className="grid sm:grid-cols-2 gap-3">
              {guilds.map(g => (
                <div key={g.id} className="panel p-4">
                  <div className="overline text-[10px] mb-1">Y{g.founded_year} · founded by {g.founder}</div>
                  <div className="font-heading text-xl">{g.name}</div>
                  {g.motto && <div className="italic text-[#A0A0AB] text-sm mt-1">"{g.motto}"</div>}
                  <div className="text-xs text-[#A0A0AB] mt-2">{g.members.length} member(s): {g.members.join(", ")}</div>
                  <button onClick={() => joinGuild(g.id)} data-testid={`guild-join-${g.id}`} className="btn-ghost text-[10px] mt-3">Join</button>
                </div>
              ))}
              {guilds.length === 0 && <p className="text-[#A0A0AB] text-sm">No guilds yet.</p>}
            </div>
          </div>
        )}

        {tab === "legacy" && lb && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="panel p-6">
              <div className="overline mb-4">Top Builders</div>
              {lb.top_builders.map((p, i) => (
                <Link key={p.username} to={`/profile/${p.username}`} className="flex justify-between py-2 border-b border-white/5 hover:text-[#D4AF37]">
                  <span>{i+1}. {p.username}</span><span className="font-mono">{p.structures_built}</span>
                </Link>
              ))}
            </div>
            <div className="panel p-6">
              <div className="overline mb-4">Top Diggers</div>
              {lb.top_diggers.map((p, i) => (
                <Link key={p.username} to={`/profile/${p.username}`} className="flex justify-between py-2 border-b border-white/5 hover:text-[#D4AF37]">
                  <span>{i+1}. {p.username}</span><span className="font-mono">{p.artifacts_found}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
