# Project memory — Particle Field Instrument

## Overview
Interactive P5.js particle-field "laboratory instrument", migrated from a
single-file static site (`index.html` + `sketch.js`) to a **Next.js 14**
project (App Router + TypeScript) on the `features/nextJS` branch.

## Tech stack
- Next.js 14 (App Router) + React 18 + TypeScript (strict)
- `p5@1.11` (loaded via dynamic `import('p5')` to avoid SSR `window` issues)
- `zustand` for global state (replaces the original `S` object)
- Plain CSS (no Tailwind) — `app/globals.css` ports the original styles 1:1
- Google Fonts: Instrument Serif (italic) + JetBrains Mono

## Layout
```
app/
  layout.tsx          # HTML shell, fonts
  page.tsx            # Composes all components; PFICanvas via dynamic({ssr:false})
  globals.css         # All styles from the original index.html
components/
  PFICanvas.tsx       # Mounts/unmounts the p5 engine + global mouse/key listeners
  Brand.tsx           # Top-left title block
  HUD.tsx             # Top-right FRAMES / ENTITIES / EMITTERS
  Console.tsx         # Right-side panel (presets, sliders, modes, palettes, buttons)
  StatusBar.tsx       # Bottom bar (signal, mode, run timer)
  Hint.tsx            # Top-center keyboard hint pill (auto-hides 5.5s)
  RegMarks.tsx        # Four corner registration crosses
lib/
  palettes.ts         # 9 colour palettes
  presets.ts          # 8 named presets + label map
  store.ts            # Zustand store: parameters, mouse, stats, actions
  engine.ts           # p5 instance-mode engine (Particle class + 3 renderers)
  engineBus.ts        # Tiny store exposing engine handle (clear/capture) to UI
```

## Conventions
- **Engine reads state via `usePFIStore.getState()` every frame** (avoids
  re-rendering React on every tick). UI components use selector hooks.
- Engine pushes `fps` / `count` back to the store every 10 frames via
  `setStats`, so HUD updates ~6×/sec without thrashing.
- Slider value formatting lives in `components/Console.tsx` (`FMT` map),
  matching the original `sketch.js` exactly.
- Engine is loaded with `dynamic(() => import('@/components/PFICanvas'),
  { ssr: false })` because p5 touches `window` at construction time.

## Commands
```bash
npm run dev      # http://localhost:8011 (binds 0.0.0.0)
npm run build
npm run start
```

## Branches
- `main` — original static HTML/JS version
- `features/nextJS` — current Next.js port (active)
