'use client';

import { usePFIStore } from '@/lib/store';
import { useEngineBus } from '@/lib/engineBus';
import { PALETTES, PALETTE_NAMES, type PaletteName } from '@/lib/palettes';
import { PRESETS, PRESET_LABELS, PRESET_NAMES, type PresetName, type RenderMode } from '@/lib/presets';

type NumKey =
  | 'rate' | 'life' | 'size' | 'vel' | 'spread'
  | 'grav' | 'wind' | 'turb' | 'damp'
  | 'decay' | 'glow';

interface SliderRow {
  key: NumKey;
  label: string;
  min: number;
  max: number;
  format: (v: number) => string;
}

const FMT = {
  rate:   (v: number) => String(v),
  life:   (v: number) => (v / 75).toFixed(1) + 's',
  size:   (v: number) => (v / 10).toFixed(1),
  vel:    (v: number) => (v / 10).toFixed(1),
  spread: (v: number) => Math.round(v) + '°',
  grav:   (v: number) => (v / 100 >= 0 ? '+' : '') + (v / 100).toFixed(2),
  wind:   (v: number) => (v / 100).toFixed(2),
  turb:   (v: number) => (v / 100).toFixed(2),
  damp:   (v: number) => (v / 1000).toFixed(3),
  decay:  (v: number) => (v / 100).toFixed(2),
  glow:   (v: number) => (v / 10).toFixed(1),
};

const EMISSION: SliderRow[] = [
  { key: 'rate',   label: 'Rate',     min: 1,   max: 80,  format: FMT.rate },
  { key: 'life',   label: 'Lifespan', min: 20,  max: 500, format: FMT.life },
  { key: 'size',   label: 'Size',     min: 1,   max: 120, format: FMT.size },
  { key: 'vel',    label: 'Velocity', min: 1,   max: 120, format: FMT.vel },
  { key: 'spread', label: 'Spread',   min: 0,   max: 360, format: FMT.spread },
];

const FORCES: SliderRow[] = [
  { key: 'grav', label: 'Gravity',    min: -50, max: 50, format: FMT.grav },
  { key: 'wind', label: 'Wind',       min: -30, max: 30, format: FMT.wind },
  { key: 'turb', label: 'Turbulence', min: 0,   max: 100, format: FMT.turb },
  { key: 'damp', label: 'Damping',    min: 0,   max: 40,  format: FMT.damp },
];

const MODES: { mode: RenderMode; label: string }[] = [
  { mode: 'dot',     label: 'Dot' },
  { mode: 'trail',   label: 'Trail' },
  { mode: 'network', label: 'Web' },
];

function Slider({ row }: { row: SliderRow }) {
  const value = usePFIStore((s) => s[row.key]);
  const setParam = usePFIStore((s) => s.setParam);
  return (
    <div className="ctl">
      <label>{row.label}</label>
      <span className="val">{row.format(value)}</span>
      <input
        type="range"
        min={row.min}
        max={row.max}
        value={value}
        onChange={(e) => setParam(row.key, parseFloat(e.target.value))}
      />
    </div>
  );
}

export default function Console() {
  const preset = usePFIStore((s) => s.preset);
  const mode = usePFIStore((s) => s.mode);
  const palette = usePFIStore((s) => s.palette);
  const paused = usePFIStore((s) => s.paused);

  const applyPreset = usePFIStore((s) => s.applyPreset);
  const setParam = usePFIStore((s) => s.setParam);
  const togglePause = usePFIStore((s) => s.togglePause);

  return (
    <aside className="panel">
      <div className="panel-head">
        <span className="title">Console<span className="dot">.</span></span>
        <span className="id">CH-01</span>
      </div>

      <div className="group">
        <div className="group-label">Preset</div>
        <div className="chips">
          {PRESET_NAMES.map((name) => (
            <button
              key={name}
              className={`chip${preset === name ? ' active' : ''}`}
              onClick={() => applyPreset(name as PresetName)}
            >
              {PRESET_LABELS[name]}
            </button>
          ))}
        </div>
      </div>

      <div className="group">
        <div className="group-label">Emission</div>
        {EMISSION.map((row) => <Slider key={row.key} row={row} />)}
      </div>

      <div className="group">
        <div className="group-label">Forces</div>
        {FORCES.map((row) => <Slider key={row.key} row={row} />)}
      </div>

      <div className="group">
        <div className="group-label">Render</div>
        <div className="chips toggles">
          {MODES.map((m) => (
            <button
              key={m.mode}
              className={`chip tri${mode === m.mode ? ' active' : ''}`}
              onClick={() => setParam('mode', m.mode)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <Slider row={{ key: 'decay', label: 'Trail Decay', min: 2, max: 80, format: FMT.decay }} />
          <Slider row={{ key: 'glow',  label: 'Glow',        min: 0, max: 40, format: FMT.glow }} />
        </div>
      </div>

      <div className="group">
        <div className="group-label">Palette</div>
        <div className="palettes">
          {PALETTE_NAMES.map((name) => (
            <button
              key={name}
              className={`palette${palette === name ? ' active' : ''}`}
              title={name}
              onClick={() => setParam('palette', name as PaletteName)}
            >
              {PALETTES[name].map((c, i) => (
                <span key={i} style={{ background: c }} />
              ))}
            </button>
          ))}
        </div>
      </div>

      <div className="actions">
        <button className="btn primary" onClick={togglePause}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button className="btn" onClick={() => useEngineBus.getState().handle?.capture()}>
          Capture
        </button>
        <button className="btn danger" onClick={() => useEngineBus.getState().handle?.clear()}>
          Clear
        </button>
      </div>
    </aside>
  );
}
