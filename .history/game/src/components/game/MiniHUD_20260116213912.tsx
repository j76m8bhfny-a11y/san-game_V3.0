import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';

// 辅助 Hook：检测数值变化方向
const useValueChange = (value: number) => {
  const prev = useRef(value);
  const [change, setChange] = useState<'UP' | 'DOWN' | 'NONE'>('NONE');
  
  useEffect(() => {
    if (value > prev.current) setChange('UP');
    else if (value < prev.current) setChange('DOWN');
    else setChange('NONE');
    
    prev.current = value;
    const timer = setTimeout(() => setChange('NONE'), 1000);
    return () => clearTimeout(timer);
  }, [value]);
  
  return change;
};

export const MiniHUD: React.FC = () => {
  const { day, hp, san, gold, setShopOpen, setInventoryOpen, setArchiveOpen, setMenuOpen } = useGameStore();
  const { playSfx } = useAudioStore();

  const hpChange = useValueChange(hp);
  const goldChange = useValueChange(gold);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-10 w-[95%] max-w-4xl pointer-events-none select-none">
      <div className="glass-panel rounded-full px-4 py-2 md:px-6 md:py-3 flex items-center justify-between pointer-events-auto shadow-2xl bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-white/20">
        
        {/* Left: Metrics */}
        <div className="flex items-center gap-4 md:gap-8">
          
          {/* DAY */}
          <div className="flex flex-col items-center leading-none">
             <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Day</div>
             <div className="text-xl md:text-2xl font-black font-serif text-[var(--text-color)]">{day}</div>
          </div>

          {/* HP */}
          <div className={`flex items-center gap-2 transition-transform duration-300 ${hpChange === 'DOWN' ? 'scale-110 text-red-600' : ''}`} title={`HP: ${hp}`}>
            <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${hp < 30 ? 'bg-red-600 animate-ping' : 'bg-green-500'}`} />
            <div className="relative h-8 w-12 md:w-16">
               <svg className="w-full h-full text-[var(--text-color)] opacity-80" viewBox="0 0 100 40">
                 <path 
                   d={`M0 20 H30 L40 ${hp < 30 ? '0' : '5'} L50 ${hp < 30 ? '40' : '35'} L60 20 H100`} 
                   fill="none" 
                   stroke="currentColor" 
                   strokeWidth="3" 
                   className={hp < 30 ? 'animate-pulse' : ''}
                 />
               </svg>
            </div>
          </div>

          {/* SAN */}
          <div className="flex items-center gap-2 relative group w-20 md:w-24">
            <span className="text-xl">{san > 70 ? '👁️' : san > 30 ? '🩸' : '🧿'}</span>
            <div className="h-1.5 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ease-out ${san > 70 ? 'bg-blue-500' : san > 30 ? 'bg-yellow-600' : 'bg-purple-600'}`} 
                style={{ width: `${san}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Center: Gold */}
        <div className={`
          flex items-center gap-1 font-mono text-base md:text-xl font-bold transition-colors duration-300
          ${goldChange === 'UP' ? 'text-green-500 scale-110' : goldChange === 'DOWN' ? 'text-red-500' : gold < 0 ? 'text-red-600' : 'text-[var(--text-color)]'}
        `}>
           <span>{gold < 0 ? '-' : ''}${Math.abs(gold)}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 md:gap-2">
           {[
             { label: 'SHOP', action: () => setShopOpen(true), icon: '🛍️' },
             { label: 'BAG', action: () => setInventoryOpen(true), icon: '🎒' },
             { label: 'DATA', action: () => setArchiveOpen(true), icon: '💾' },
             { label: 'SYS', action: () => setMenuOpen(true), icon: '⚙️' },
           ].map(btn => (
             <button
               key={btn.label}
               onClick={() => { playSfx('sfx_click'); btn.action(); }}
               className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center text-base md:text-lg transition-all hover:scale-105 active:scale-90 shadow-sm"
               title={btn.label}
             >
               {btn.icon}
             </button>
           ))}
        </div>

      </div>
    </div>
  );
};