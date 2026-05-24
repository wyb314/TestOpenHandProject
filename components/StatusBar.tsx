'use client';

import { useEffect, useState } from 'react';
import { usePFIStore } from '@/lib/store';
import { PRESET_LABELS } from '@/lib/presets';

export default function StatusBar() {
  const preset = usePFIStore((s) => s.preset);
  const startTs = usePFIStore((s) => s.startTs);
  const [elapsed, setElapsed] = useState('00:00');

  useEffect(() => {
    const id = setInterval(() => {
      const sec = Math.floor((Date.now() - startTs) / 1000);
      const mm = String(Math.floor(sec / 60)).padStart(2, '0');
      const ss = String(sec % 60).padStart(2, '0');
      setElapsed(`${mm}:${ss}`);
    }, 1000);
    return () => clearInterval(id);
  }, [startTs]);

  return (
    <footer className="status">
      <div className="lhs">
        <span><span className="pulse" />SIGNAL OK</span>
        <span>MODE / <span className="field">{PRESET_LABELS[preset]}</span></span>
      </div>
      <div className="ruler" />
      <div className="rhs">
        <span>RUN <span className="field">{elapsed}</span></span>
        <span>CH-01 / 48 KHZ / NORM</span>
      </div>
    </footer>
  );
}
