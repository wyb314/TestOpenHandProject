import { create } from 'zustand';
import { PALETTE_NAMES, type PaletteName } from './palettes';
import { PRESETS, type EmitterSource, type PresetName, type RenderMode } from './presets';

export interface Emitter {
  x: number;
  y: number;
}

export interface MouseState {
  x: number;
  y: number;
  down: boolean;
  button: number;
}

export interface PFIState {
  // Emission
  rate: number;
  life: number;
  size: number;
  vel: number;
  spread: number;
  // Forces
  grav: number;
  wind: number;
  turb: number;
  damp: number;
  // Render
  mode: RenderMode;
  decay: number;
  glow: number;
  // Misc
  palette: PaletteName;
  dir: number;
  preset: PresetName;
  burst: boolean;
  spiral: boolean;
  source: EmitterSource;
  paused: boolean;
  emitters: Emitter[];
  mouse: MouseState;
  // Live stats (written by engine, displayed by UI)
  fps: number;
  count: number;
  startTs: number;
  // Actions
  setParam: <K extends keyof PFIState>(key: K, value: PFIState[K]) => void;
  applyPreset: (name: PresetName) => void;
  togglePause: () => void;
  setPaused: (v: boolean) => void;
  setStats: (fps: number, count: number) => void;
  setMouse: (m: Partial<MouseState>) => void;
  resetTimer: () => void;
}

export const usePFIStore = create<PFIState>((set) => ({
  rate: 12, life: 180, size: 30, vel: 30, spread: 45,
  grav: 6, wind: 0, turb: 20, damp: 0,
  mode: 'dot', decay: 18, glow: 10,
  palette: 'ember', dir: -90,
  preset: 'fountain', burst: false, spiral: false, source: 'emitter',
  paused: false,
  emitters: [],
  mouse: { x: 0, y: 0, down: false, button: 0 },
  fps: 60, count: 0,
  startTs: typeof window !== 'undefined' ? Date.now() : 0,

  setParam: (key, value) => set({ [key]: value } as Partial<PFIState>),

  applyPreset: (name) => {
    const p = PRESETS[name];
    if (!p) return;
    set({
      preset: name,
      rate: p.rate, life: p.life, size: p.size, vel: p.vel, spread: p.spread,
      grav: p.grav, wind: p.wind, turb: p.turb, damp: p.damp,
      mode: p.mode, palette: p.palette,
      decay: p.decay, glow: p.glow, dir: p.dir,
      burst: !!p.burst, spiral: !!p.spiral, source: p.source ?? 'emitter',
    });
  },

  togglePause: () => set((s) => ({ paused: !s.paused })),
  setPaused: (v) => set({ paused: v }),
  setStats: (fps, count) => set({ fps, count }),
  setMouse: (m) => set((s) => ({ mouse: { ...s.mouse, ...m } })),
  resetTimer: () => set({ startTs: Date.now() }),
}));

export { PALETTE_NAMES };
