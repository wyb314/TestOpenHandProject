'use client';

import dynamic from 'next/dynamic';
import RegMarks from '@/components/RegMarks';
import Brand from '@/components/Brand';
import HUD from '@/components/HUD';
import Hint from '@/components/Hint';
import Console from '@/components/Console';
import StatusBar from '@/components/StatusBar';

// p5 needs `window`, so load the canvas component without SSR.
const PFICanvas = dynamic(() => import('@/components/PFICanvas'), { ssr: false });

export default function Page() {
  return (
    <>
      <RegMarks />
      <PFICanvas />
      <Brand />
      <HUD />
      <Hint />
      <Console />
      <StatusBar />
    </>
  );
}
