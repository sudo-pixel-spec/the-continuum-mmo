import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("continuum_token");
    if (!token) { setLoading(false); return; }
    auth.me()
      .then((data) => { setUser(data.user); setPlayer(data.player); })
      .catch(() => { localStorage.removeItem("continuum_token"); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await auth.login({ email, password });
    localStorage.setItem("continuum_token", data.token);
    setUser(data.user);
    const me = await auth.me();
    setPlayer(me.player);
    return data;
  };

  const register = async (username, email, password) => {
    const data = await auth.register({ username, email, password });
    localStorage.setItem("continuum_token", data.token);
    setUser(data.user);
    const me = await auth.me();
    setPlayer(me.player);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("continuum_token");
    setUser(null);
    setPlayer(null);
  };

  return (
    <AuthCtx.Provider value={{ user, player, setPlayer, login, register, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);