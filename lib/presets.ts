import type { PaletteName } from './palettes';

export type RenderMode = 'dot' | 'trail' | 'network';
export type EmitterSource = 'emitter' | 'top';

export type PresetName =
  | 'fountain'
  | 'vortex'
  | 'fireworks'
  | 'snow'
  | 'fire'
  | 'smoke'
  | 'galaxy'
  | 'constellation';

export interface Preset {
  rate: number;
  life: number;
  size: number;
  vel: number;
  spread: number;
  grav: number;
  wind: number;
  turb: number;
  damp: number;
  mode: RenderMode;
  palette: PaletteName;
  decay: number;
  glow: number;
  dir: number;
  burst?: boolean;
  spiral?: boolean;
  source?: EmitterSource;
}

export const PRESETS: Record<PresetName, Preset> = {
  fountain:      { rate:12, life:180, size:30, vel:30,  spread:45,  grav:  6, wind:0, turb:20, damp:0, mode:'dot',     palette:'ember',    decay:18, glow:10, dir:-90 },
  vortex:        { rate:30, life:300, size:18, vel:25,  spread:360, grav:  0, wind:0, turb:60, damp:5, mode:'trail',   palette:'midnight', decay:8,  glow:14, dir:0   },
  fireworks:     { rate:2,  life:160, size:42, vel:90,  spread:360, grav: 12, wind:0, turb:8,  damp:2, mode:'trail',   palette:'citrus',   decay:6,  glow:22, dir:0,  burst:true },
  snow:          { rate:18, life:480, size:22, vel:8,   spread:30,  grav:  3, wind:4, turb:30, damp:0, mode:'dot',     palette:'glacier',  decay:60, glow:4,  dir:90, source:'top' },
  fire:          { rate:50, life:140, size:38, vel:18,  spread:25,  grav:-15, wind:0, turb:55, damp:0, mode:'trail',   palette:'ember',    decay:14, glow:18, dir:-90 },
  smoke:         { rate:14, life:380, size:80, vel:12,  spread:35,  grav: -6, wind:2, turb:40, damp:1, mode:'dot',     palette:'paper',    decay:30, glow:0,  dir:-90 },
  galaxy:        { rate:8,  life:500, size:14, vel:20,  spread:360, grav:  0, wind:0, turb:15, damp:0, mode:'trail',   palette:'midnight', decay:4,  glow:14, dir:0,  spiral:true },
  constellation: { rate:4,  life:500, size:10, vel:6,   spread:360, grav:  0, wind:0, turb:8,  damp:1, mode:'network', palette:'glacier',  decay:30, glow:6,  dir:0   },
};

export const PRESET_LABELS: Record<PresetName, string> = {
  fountain: 'Fountain',
  vortex: 'Vortex',
  fireworks: 'Fireworks',
  snow: 'Snow',
  fire: 'Fire',
  smoke: 'Smoke',
  galaxy: 'Galaxy',
  constellation: 'Network',
};

export const PRESET_NAMES = Object.keys(PRESETS) as PresetName[];
