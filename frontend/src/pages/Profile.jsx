import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { profile } from "../api";

export default function Profile() {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    profile.get(username).then(setData).catch((e) => setError(e?.response?.data?.detail || "Not found"));
  }, [username]);

  if (error) return <div className="min-h-screen flex items-center justify-center"><div className="text-[#A0A0AB]">{error}</div></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center"><span className="overline flicker">Recovering imprint…</span></div>;

  const { user, player, structures, artifacts, events } = data;

  return (
    <div data-testid="profile-page" className="min-h-screen">
      <header className="border-b border-white/10 px-6 py-4 bg-[#0C0C10]">
        <Link to="/play" className="overline text-[#A0A0AB] hover:text-[#D4AF37]">← Return to World</Link>
      </header>

      <div className="max-w-5xl mx-auto p-8">
        <div className="overline mb-3">{user.title}</div>
        <h1 className="font-heading text-6xl">{user.username}</h1>
        {user.is_first_settler && <div className="text-[#D4AF37] mt-2 overline">★ First Settler of The Continuum</div>}
        <div className="text-[#A0A0AB] text-sm mt-3 font-mono">Imprinted: {new Date(user.created_at).toLocaleString()}</div>

        <div className="divider-gold my-12" />

        <div className="grid sm:grid-cols-3 gap-px bg-white/10 border border-white/10 mb-12">
          <div className="bg-[#050508] p-5">
            <div className="overline mb-1">Position</div>
            <div className="font-mono">({player?.x ?? 0}, {player?.y ?? 0})</div>
          </div>
          <div className="bg-[#050508] p-5">
            <div className="overline mb-1">Structures Built</div>
            <div className="font-heading text-3xl">{player?.structures_built ?? 0}</div>
          </div>
          <div className="bg-[#050508] p-5">
            <div className="overline mb-1">Artifacts Found</div>
            <div className="font-heading text-3xl">{player?.artifacts_found ?? 0}</div>
          </div>
        </div>

        <h2 className="font-heading text-3xl mb-4">Legacy Events</h2>
        <div className="space-y-3 mb-12">
          {events.map(e => (
            <div key={e.id} className="panel p-4 grid grid-cols-[60px_1fr] gap-4">
              <div className="font-heading text-2xl text-[#D4AF37]">Y{e.year}</div>
              <div>
                <div className="font-heading text-lg">{e.title}</div>
                <div className="text-[#A0A0AB] text-sm">{e.description}</div>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-[#A0A0AB] text-sm">No legacy yet. The Archive watches.</p>}
        </div>

        <h2 className="font-heading text-3xl mb-4">Structures</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
          {structures.map(s => (
            <div key={s.id} className="panel p-4">
              <div className="overline text-[10px] mb-1">{s.structure_type} · Y{s.built_year}</div>
              <div className="font-heading text-lg">{s.name}</div>
              <div className="font-mono text-xs text-[#A0A0AB]">({s.x},{s.y}) · decay {s.decay}%</div>
            </div>
          ))}
          {structures.length === 0 && <p className="text-[#A0A0AB] text-sm">No structures built.</p>}
        </div>

        <h2 className="font-heading text-3xl mb-4">Artifacts Discovered</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {artifacts.map(a => (
            <div key={a.id} className={`panel p-4 ${a.is_architect_lore ? "border-[#D4AF37]" : ""}`}>
              <div className="overline text-[10px] mb-1">Y{a.discovered_year}</div>
              <div className="font-heading text-lg">{a.name}</div>
              {a.inscription && <div className="text-xs text-[#4ADE80] mt-2 font-mono italic">"{a.inscription}"</div>}
            </div>
          ))}
          {artifacts.length === 0 && <p className="text-[#A0A0AB] text-sm">No artifacts discovered.</p>}
        </div>
      </div>
    </div>
  );
}