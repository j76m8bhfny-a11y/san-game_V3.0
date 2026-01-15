import { create } from 'zustand';

interface TooltipState {
  content: string | null;
  position: { x: number; y: number };
  showTooltip: (content: string, x: number, y: number) => void;
  hideTooltip: () => void;
}

export const useTooltipStore = create<TooltipState>((set) => ({
  content: null,
  position: { x: 0, y: 0 },
  
  showTooltip: (content, x, y) => set({ content, position: { x, y } }),
  hideTooltip: () => set({ content: null }),
}));