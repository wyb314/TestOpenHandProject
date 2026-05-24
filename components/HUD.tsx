'use client';

import { usePFIStore } from '@/lib/store';

export default function HUD() {
  const fps = usePFIStore((s) => s.fps);
  const count = usePFIStore((s) => s.count);
  const emitters = usePFIStore((s) => s.emitters.length);

  return (
    <aside className="hud">
      <div className="stat"><span>FRAMES</span><span className="v">{fps}</span></div>
      <div className="stat"><span>ENTITIES</span><span className="v amber">{count}</span></div>
      <div className="stat"><span>EMITTERS</span><span className="v">{1 + emitters}</span></div>
    </aside>
  );
}
