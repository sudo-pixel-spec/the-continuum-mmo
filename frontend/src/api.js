import axios from "axios";

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("continuum_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const auth = {
  register: (data) => api.post("/auth/register", data).then((r) => r.data),
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
};

export const world = {
  state: (x, y, radius = 25) => api.get(`/world/state?x=${x}&y=${y}&radius=${radius}`).then((r) => r.data),
  build: (data) => api.post("/world/build", data).then((r) => r.data),
  move: (x, y) => api.post("/player/move", { x, y }).then((r) => r.data),
};

export const history = {
  list: (limit = 50, type) => api.get(`/history?limit=${limit}${type ? `&type=${type}` : ""}`).then((r) => r.data),
  stats: () => api.get("/history/stats").then((r) => r.data),
};

export const archaeology = {
  dig: () => api.post("/archaeology/dig").then((r) => r.data),
  artifacts: (architectOnly = false) =>
    api.get(`/archaeology/artifacts?architect_only=${architectOnly}`).then((r) => r.data),
};

export const worldmind = {
  ask: (question) => api.post("/worldmind/ask", { question }).then((r) => r.data),
  folklore: () => api.get("/worldmind/folklore").then((r) => r.data),
};

export const dream = {
  state: () => api.get("/dream/state").then((r) => r.data),
  trigger: () => api.post("/dream/trigger").then((r) => r.data),
  list: () => api.get("/dream/list").then((r) => r.data),
};

export const profile = {
  get: (username) => api.get(`/profile/${username}`).then((r) => r.data),
  leaderboard: () => api.get("/leaderboard").then((r) => r.data),
};

export const civilization = {
  layers: () => api.get("/civilization/layers").then((r) => r.data),
};

export const guilds = {
  create: (name, motto) => api.post("/guilds/create", { name, motto }).then((r) => r.data),
  join: (id) => api.post(`/guilds/${id}/join`).then((r) => r.data),
  list: () => api.get("/guilds/list").then((r) => r.data),
};

export const creatures = {
  list: (x, y, radius = 50) => api.get(`/creatures/list?x=${x}&y=${y}&radius=${radius}`).then((r) => r.data),
  attack: (creature_id) => api.post("/creatures/attack", { creature_id }).then((r) => r.data),
  spawnFromDream: () => api.post("/creatures/spawn-from-dream").then((r) => r.data),
};