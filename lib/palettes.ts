export type PaletteName =
  | 'ember'
  | 'glacier'
  | 'bloom'
  | 'forest'
  | 'midnight'
  | 'paper'
  | 'citrus'
  | 'oceanic'
  | 'candy';

export const PALETTES: Record<PaletteName, string[]> = {
  ember:    ['#ffd166', '#f09236', '#e0451f', '#a31621', '#fef6c8'],
  glacier:  ['#caf0f8', '#90e0ef', '#48cae4', '#0096c7', '#023e8a'],
  bloom:    ['#ffd1dc', '#ff80a1', '#e84a7f', '#9b1d49', '#3a0a1f'],
  forest:   ['#b8e07a', '#6fbf6b', '#2d8a4e', '#1f5d3a', '#f3eccd'],
  midnight: ['#9c89ff', '#6c5ce7', '#3d3293', '#1b1547', '#e9e6ff'],
  paper:    ['#f4ecdc', '#c8c0b0', '#8a8275', '#3b3934', '#0b0a09'],
  citrus:   ['#fff4a3', '#ffd166', '#ff9f1c', '#e63946', '#ffefd6'],
  oceanic:  ['#001219', '#005f73', '#0a9396', '#94d2bd', '#e9d8a6'],
  candy:    ['#ff6f91', '#ff9671', '#ffc75f', '#f9f871', '#d65db1'],
};

export const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[];
