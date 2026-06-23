import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { history } from "../api";
import { ArrowRight, Compass, Layers, Brain, Moon, BookMarked, Hammer } from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1770486036751-e55247238964?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwzfHxkaWdpdGFsJTIwYWJzdHJhY3QlMjBkYXJrJTIwbWF0cml4fGVufDB8fHx8MTc4MjIyNDEyMXww&ixlib=rb-4.1.0&q=85";
const RUINS_IMG = "https://images.unsplash.com/photo-1779018400727-3fa0e97760dd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwyfHxhbmNpZW50JTIwcnVpbiUyMG1vbnVtZW50JTIwbmlnaHR8ZW58MHx8fHwxNzgyMjI0MTIxfDA&ixlib=rb-4.1.0&q=85";

export default function Landing() {
  const [stats, setStats] = useState(null);
  useEffect(() => { history.stats().then(setStats).catch(() => {}); }, []);

  return (
    <div data-testid="landing-page" className="min-h-screen text-[#F8F8F8]">
      <header className="fixed top-0 inset-x-0 z-50 glass">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[#D4AF37] pulse-gold" />
            <span data-testid="brand-mark" className="font-accent text-sm tracking-widest">THE&nbsp;CONTINUUM</span>
          </div>
          <nav className="flex items-center gap-6 text-xs uppercase tracking-[0.2em] text-[#A0A0AB]">
            <a href="#lore" className="hover:text-[#D4AF37] transition">Lore</a>
            <a href="#systems" className="hover:text-[#D4AF37] transition">Systems</a>
            <Link data-testid="nav-login" to="/login" className="hover:text-[#D4AF37] transition">Login</Link>
            <Link data-testid="nav-register" to="/register" className="btn-gold">Enter Archive</Link>
          </nav>
        </div>
      </header>

      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <img src={HERO_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/40 via-[#050508]/70 to-[#050508]" />
        <div className="relative max-w-7xl mx-auto">
          <div className="overline fade-up">A persistent civilization MMORPG</div>
          <h1 data-testid="hero-title" className="font-heading text-5xl sm:text-7xl lg:text-8xl mt-6 fade-up-delay-1 leading-[0.95]">
            The world<br/>
            <span className="italic text-[#D4AF37]">remembers.</span>
          </h1>
          <p className="font-body text-base sm:text-lg text-[#A0A0AB] max-w-2xl mt-8 fade-up-delay-2 leading-relaxed">
            Long ago, the Architects vanished. They left behind a world that thinks for itself  
            a digital archive that grows, decays, dreams, and inherits the actions of every Bearer
            who walks through it. You are not a hero. You are a footnote in history. <span className="text-[#F8F8F8]">Decide what survives.</span>
          </p>
          <div className="flex flex-wrap gap-4 mt-10 fade-up-delay-3">
            <Link data-testid="hero-cta-register" to="/register" className="btn-gold flex items-center gap-2">
              Become a Bearer <ArrowRight size={14} />
            </Link>
            <Link data-testid="hero-cta-login" to="/login" className="btn-ghost">Return to your Echo</Link>
          </div>

          {stats && (
            <div data-testid="world-stats" className="mt-20 grid grid-cols-2 sm:grid-cols-5 gap-px bg-white/10 border border-white/10">
              {[
                ["Year", stats.year],
                ["Bearers", stats.bearers],
                ["Structures", stats.structures],
                ["Artifacts", stats.artifacts],
                ["Folklore", stats.folklore],
              ].map(([k, v]) => (
                <div key={k} className="bg-[#050508] p-6">
                  <div className="overline mb-2">{k}</div>
                  <div className="font-heading text-4xl">{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="lore" className="relative py-32 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto bento-grid">
          <div className="md:col-span-5 space-y-6">
            <div className="overline">I. The Architects</div>
            <h2 className="font-heading text-4xl sm:text-5xl">They built a world that could think   and then they vanished.</h2>
            <p className="text-[#A0A0AB] leading-relaxed">
              Nobody knows whether the Architects ascended, destroyed themselves, or were consumed
              by the very world they crafted. Three Archives disagree. The fourth is corrupted.
            </p>
            <p className="text-[#A0A0AB] leading-relaxed">
              All that remains are <span className="text-[#D4AF37]">cracked tablets, silent machines, and journal pages</span>
              {" "}buried beneath the soil. Dig long enough, and you may piece together their final design notes  
              and a name: <span className="font-mono text-[#4ADE80]">Dylen Fernandes</span>.
            </p>
          </div>
          <div className="md:col-span-7 relative aspect-[4/3] overflow-hidden border border-white/10">
            <img src={RUINS_IMG} alt="Ancient ruins" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#050508] via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 font-mono text-xs text-[#4ADE80]/80">
              &gt; archive_fragment_0x4F.txt<br/>
              &gt; "Persistent civilization {`>`} persistent character. The world is the protagonist."   D.F.
            </div>
          </div>
        </div>
      </section>

      <section id="systems" className="py-32 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="overline mb-4">II. What The World Does</div>
          <h2 className="font-heading text-4xl sm:text-5xl mb-16 max-w-3xl">Eight systems. One civilization. Permanent consequence.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10">
            {[
              { Icon: Hammer, t: "Persistence", d: "Every hut, road, and bridge stays. Forever. Until entropy reclaims it." },
              { Icon: BookMarked, t: "History", d: "First arrivals, first kills, first cities   all carved into the Archive." },
              { Icon: Brain, t: "World Mind", d: "An LLM-driven collective unconscious. Ask it anything; it remembers everyone." },
              { Icon: Moon, t: "Dream State", d: "When the world is quiet, it generates ruins, myths, and creatures from your history." },
              { Icon: Compass, t: "Archaeology", d: "Dig at any tile. Uncover artifacts left by extinct player civilizations." },
              { Icon: Layers, t: "Civilization Layers", d: "Wilderness → Frontier → Settlement → City → Kingdom → Ruin. Watch it unfold." },
              { Icon: BookMarked, t: "Architect Lore", d: "Hidden fragments tell the story of the world's creator. Reconstruct him." },
              { Icon: Brain, t: "Collective Memory", d: "Every action trains the World Mind. NPCs slowly learn what players do." },
            ].map(({ Icon, t, d }, i) => (
              <div key={i} data-testid={`system-card-${i}`} className="bg-[#050508] p-8 hover:bg-[#0C0C10] transition">
                <Icon size={20} className="text-[#D4AF37] mb-4" />
                <div className="font-heading text-2xl mb-2">{t}</div>
                <p className="text-sm text-[#A0A0AB] leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="overline mb-6">III. Step Through</div>
          <h2 className="font-heading text-4xl sm:text-6xl">Your first footstep<br/><span className="italic text-[#D4AF37]">becomes someone's myth.</span></h2>
          <p className="text-[#A0A0AB] mt-8">
            Three years from now, a Bearer you will never meet may unearth your campfire and write
            a song about it. The Archive does not forget what you build.
          </p>
          <Link data-testid="footer-cta" to="/register" className="btn-gold inline-flex items-center gap-2 mt-12">
            Begin the Archive <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 px-6 text-xs text-[#A0A0AB] text-center font-mono">
        THE&nbsp;CONTINUUM &nbsp;//&nbsp; A persistent civilization. &nbsp;//&nbsp; Architect: D.F.
      </footer>
    </div>
  );
}
