const ASSET = (p) => `${process.env.PUBLIC_URL || ""}/assets/audio/${p}`;
let ctx = null;
const samples = {};
let ambientEl = null;
let muted = false;

function getCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  return ctx;
}

function preload(name) {
  if (samples[name]) return samples[name];
  const a = new Audio(ASSET(`${name}.wav`));
  a.preload = "auto";
  a.volume = 0.5;
  samples[name] = a;
  return a;
}

function play(name, fallbackTone) {
  if (muted) return;
  try {
    const a = preload(name);
    const clone = a.cloneNode();
    clone.volume = a.volume;
    clone.play().catch(() => fallbackTone && fallbackTone());
  } catch { fallbackTone && fallbackTone(); }
}

function tone(freq, duration = 0.15, type = "sine", gain = 0.08) {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime);
  o.stop(c.currentTime + duration);
}

export const sfx = {
  build: () => play("build", () => { tone(440, 0.08, "square"); setTimeout(() => tone(660, 0.12, "square"), 60); }),
  dig: () => play("dig", () => { tone(180, 0.18, "sawtooth", 0.06); setTimeout(() => tone(140, 0.22, "sawtooth", 0.05), 100); }),
  found: () => play("found", () => { tone(523, 0.1); setTimeout(() => tone(659, 0.1), 100); setTimeout(() => tone(784, 0.18), 200); }),
  dream: () => play("dream", () => { tone(220, 0.6, "triangle", 0.05); setTimeout(() => tone(165, 0.6, "triangle", 0.04), 200); setTimeout(() => tone(110, 0.8, "triangle", 0.04), 400); }),
  attack: () => play("attack", () => tone(80, 0.06, "sawtooth", 0.1)),
  slain: () => play("slain", () => { tone(440, 0.1, "triangle"); setTimeout(() => tone(330, 0.1, "triangle"), 100); setTimeout(() => tone(220, 0.3, "triangle"), 200); }),
  click: () => tone(880, 0.04, "square", 0.04),
};

export const ambient = {
  start: () => {
    if (muted || ambientEl) return;
    ambientEl = new Audio(ASSET("ambient.wav"));
    ambientEl.loop = true;
    ambientEl.volume = 0.18;
    ambientEl.play().catch(() => {});
  },
  stop: () => {
    if (ambientEl) { ambientEl.pause(); ambientEl = null; }
  },
  toggle: () => {
    muted = !muted;
    if (muted) ambient.stop();
    else ambient.start();
    return muted;
  },
  isMuted: () => muted,
};