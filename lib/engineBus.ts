import { create } from 'zustand';
import type { EngineHandle } from './engine';

interface EngineBus {
  handle: EngineHandle | null;
  setHandle: (h: EngineHandle | null) => void;
}

export const useEngineBus = create<EngineBus>((set) => ({
  handle: null,
  setHandle: (h) => set({ handle: h }),
}));
