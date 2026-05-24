'use client';

import { useEffect, useRef } from 'react';
import { usePFIStore } from '@/lib/store';
import { useEngineBus } from '@/lib/engineBus';

export default function PFICanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const setHandle = useEngineBus((s) => s.setHandle);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const { createEngine } = await import('@/lib/engine');
      const handle = await createEngine(
        host,
        usePFIStore.getState,
        usePFIStore.getState().setStats,
      );
      if (disposed) {
        handle.destroy();
        return;
      }
      setHandle(handle);
      cleanup = () => handle.destroy();
    })();

    // ---- Mouse / keyboard -> store ----
    const setMouse = usePFIStore.getState().setMouse;
    const togglePause = usePFIStore.getState().togglePause;

    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.tagName !== 'CANVAS') return;
      setMouse({ x: e.clientX, y: e.clientY, down: true, button: e.button === 2 ? 2 : 0 });
    };
    const onUp = () => setMouse({ down: false });
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    const onCtx = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'CANVAS') e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ') { e.preventDefault(); togglePause(); }
      if (e.key === 'r' || e.key === 'R') useEngineBus.getState().handle?.clear();
      if (e.key === 'c' || e.key === 'C') useEngineBus.getState().handle?.capture();
    };

    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('contextmenu', onCtx);
    window.addEventListener('keydown', onKey);

    return () => {
      disposed = true;
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('contextmenu', onCtx);
      window.removeEventListener('keydown', onKey);
      cleanup?.();
      setHandle(null);
    };
  }, [setHandle]);

  return <div id="canvas-host" ref={hostRef} />;
}
