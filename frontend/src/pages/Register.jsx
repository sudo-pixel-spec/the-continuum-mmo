import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { toast } from "sonner";

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await register(username, email, password);
      toast.success(res.user.is_first_settler ? "You are the First Settler." : "Welcome, Bearer.");
      nav("/play");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed.");
    } finally { setLoading(false); }
  };

  return (
    <div data-testid="register-page" className="min-h-screen flex">
      <div className="flex-1 hidden md:flex items-center justify-center bg-[#0C0C10] border-r border-white/10 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_bottom,rgba(74,222,128,0.10),transparent)]" />
        <div className="relative max-w-md">
          <div className="overline mb-6">First Footstep</div>
          <h1 className="font-heading text-5xl leading-tight">Choose a name<br/><span className="italic text-[#D4AF37]">the world will keep.</span></h1>
          <p className="text-[#A0A0AB] mt-8 leading-relaxed">
            Once you arrive, the Archive will remember. Your username may outlive you here.
            Bearers from years from now will read it on plaques, on ruins, in songs sung by NPCs.
          </p>
          <div className="font-mono text-xs text-[#4ADE80]/60 mt-12 border-l border-[#4ADE80]/30 pl-4">
            &gt; archive.imprint(name)<br/>
            &gt; reserving slot in history...<br/>
            &gt; this action cannot be undone.
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="overline text-[#A0A0AB] hover:text-[#D4AF37]">← The Continuum</Link>
          <h2 className="font-heading text-3xl mt-6 mb-8">Become a Bearer</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="overline mb-2 block">Bearer Name</label>
              <input data-testid="register-username" minLength={3} maxLength={20} value={username} onChange={(e) => setUsername(e.target.value)} required className="input-archive" />
            </div>
            <div>
              <label className="overline mb-2 block">Email</label>
              <input data-testid="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-archive" />
            </div>
            <div>
              <label className="overline mb-2 block">Pass-phrase</label>
              <input data-testid="register-password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required className="input-archive" />
            </div>
            <button data-testid="register-submit" type="submit" disabled={loading} className="btn-gold w-full mt-6">
              {loading ? "Imprinting…" : "Imprint into Archive"}
            </button>
          </form>
          <p className="text-[#A0A0AB] text-xs mt-6">
            Returning? <Link data-testid="register-to-login" to="/login" className="text-[#D4AF37] hover:underline">Identify yourself</Link>
          </p>
        </div>
      </div>
    </div>
  );
}