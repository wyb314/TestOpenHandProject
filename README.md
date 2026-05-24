# Particle Field Instrument

Interactive P5.js particle-field laboratory, built with **Next.js 14 (App
Router) + TypeScript + Zustand**.

> Migrated from the original single-file static version on the
> `features/nextJS` branch.

## Quick start

```bash
npm install
npm run dev     # http://localhost:8011
```

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build on :8011
```

## Controls

- **Click** — burst of 50 particles at the cursor
- **Drag** — pull particles toward the cursor (right-click drag = repel)
- **Space** — pause / resume the simulation
- **R** — clear the field
- **C** — capture a PNG of the canvas

The right-hand **Console** exposes 8 presets (Fountain / Vortex / Fireworks /
Snow / Fire / Smoke / Galaxy / Network), 11 parameter sliders, 3 render modes
(Dot / Trail / Web), and 9 colour palettes.

## Project structure

```
app/                  Next.js App Router entry (layout, page, globals.css)
components/           React UI (Brand, HUD, Console, StatusBar, Hint, …)
lib/
  ├─ engine.ts        p5 instance-mode engine (Particle + 3 renderers)
  ├─ store.ts         Zustand store (parameters, mouse, stats)
  ├─ palettes.ts      9 colour palettes
  ├─ presets.ts       8 preset parameter packs
  └─ engineBus.ts     Bridges UI buttons → engine commands
```

p5 is loaded client-side only via `dynamic(import, { ssr: false })`.
