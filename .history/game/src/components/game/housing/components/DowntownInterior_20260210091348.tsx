import React from 'react';
import { ActiveHousingState } from '@/types/schema';

interface Props {
  housing: ActiveHousingState;
  onSleep: () => void;
  onDrink: () => void;
  onMoveOut: () => void;
  onClose: () => void;
}

export const DowntownInterior: React.FC<Props> = ({ housing, onSleep, onDrink, onMoveOut, onClose }) => {
  return (
    <div className="relative w-full h-full flex flex-col p-6 overflow-hidden select-none">
      
      {/* 1. 场景：顶层公寓夜景 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/housing/downtown_interior_bg.jpg')",
        }}
      >
        {/* 城市微光动画 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
      </div>

      {/* 2. 左上角：智能家居面板 */}
      <div className="absolute top-8 left-8 z-10">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-sm flex gap-6 text-gray-300">
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-50">Temperature</div>
            <div className="font-mono text-lg">72°F</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-50">Air Quality</div>
            <div className="font-mono text-lg text-green-400">PURE</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest opacity-50">Security</div>
            <div className="font-mono text-lg text-blue-400">ARMED</div>
          </div>
        </div>
      </div>

      {/* 3. 中间交互：红酒/威士忌 */}
      <div className="absolute bottom-1/3 right-1/4 z-10 group cursor-pointer" onClick={onDrink}>
        <div className="relative w-24 h-32 transition-transform duration-500 group-hover:scale-110">
          <img src="/assets/housing/ui_whiskey.png" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <span className="text-xs font-serif text-[#d4af37] italic">1940 Macallan</span>
          </div>
        </div>
      </div>

      {/* 4. 底部交互栏 (极简风格) */}
      <div className="relative z-10 mt-auto flex justify-center items-end gap-16 pb-8">
        
        {/* 资产处置按钮 */}
        <button 
          onClick={onMoveOut}
          className="group flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity"
        >
          <div className="text-xl mb-2 text-white group-hover:text-red-400 transition-colors">❖</div>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">Liquidate Asset</span>
        </button>

        {/* 深度睡眠按钮：像是进入休眠舱 */}
        <button 
          onClick={onSleep}
          className="group relative w-48 h-16 border border-white/20 hover:border-[#d4af37] hover:bg-white/5 transition-all flex items-center justify-center gap-3"
        >
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-gray-300 font-sans font-light tracking-[0.2em] group-hover:text-[#d4af37]">
            DEEP SLEEP
          </span>
        </button>

        {/* 离开按钮 */}
        <button 
          onClick={onClose}
          className="group flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity"
        >
          <div className="text-xl mb-2 text-white">▼</div>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">Elevator</span>
        </button>
      </div>

    </div>
  );
};