import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { toast } from "sonner";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back, Bearer.");
      nav("/play");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "The Archive does not recognize you.");
    } finally { setLoading(false); }
  };

  return (
    <div data-testid="login-page" className="min-h-screen flex">
      <div className="flex-1 hidden md:flex items-center justify-center bg-[#0C0C10] border-r border-white/10 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.15),transparent)]" />
        <div className="relative max-w-md">
          <div className="overline mb-6">Returning Bearer</div>
          <h1 className="font-heading text-5xl leading-tight">The Archive<br/><span className="italic text-[#D4AF37]">recognizes its own.</span></h1>
          <p className="text-[#A0A0AB] mt-8 leading-relaxed">
            Your structures stand where you left them. Your artifacts wait in your inventory.
            Your last footprint is still warm.
          </p>
          <div className="font-mono text-xs text-[#4ADE80]/60 mt-12 border-l border-[#4ADE80]/30 pl-4">
            &gt; archive.identify(...)<br/>
            &gt; checking imprint...<br/>
            &gt; awaiting credentials.
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="overline text-[#A0A0AB] hover:text-[#D4AF37]">← The Continuum</Link>
          <h2 className="font-heading text-3xl mt-6 mb-8">Authenticate</h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="overline mb-2 block">Email</label>
              <input data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-archive" />
            </div>
            <div>
              <label className="overline mb-2 block">Pass-phrase</label>
              <input data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-archive" />
            </div>
            <button data-testid="login-submit" type="submit" disabled={loading} className="btn-gold w-full mt-6">
              {loading ? "Identifying…" : "Enter the Archive"}
            </button>
          </form>
          <p className="text-[#A0A0AB] text-xs mt-6">
            New here? <Link data-testid="login-to-register" to="/register" className="text-[#D4AF37] hover:underline">Become a Bearer</Link>
          </p>
        </div>
      </div>
    </div>
  );
}