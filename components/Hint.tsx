'use client';

import { useEffect, useState } from 'react';

export default function Hint() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 5500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`hint${hidden ? ' hidden' : ''}`}>
      <kbd>CLICK</kbd> burst &nbsp;·&nbsp;
      <kbd>DRAG</kbd> attract &nbsp;·&nbsp;
      <kbd>SPACE</kbd> pause &nbsp;·&nbsp;
      <kbd>R</kbd> reset
    </div>
  );
}
