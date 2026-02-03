import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { PlayerClass, Disease } from '@/types/schema';

// --- 配置: 阶级视觉风格 ---
const CLASS_CONFIG: Record<PlayerClass, { label: string; bg: string; text: string; border: string; icon: string }> = {
  [PlayerClass.Homeless]: { 
    label: 'HOMELESS', icon: '🏚️',
    bg: 'bg-stone-800/80', text: 'text-stone-400', border: 'border-stone-600/30' 
  },
  [PlayerClass.Worker]: { 
    label: 'WORKER', icon: '⚒️',
    bg: 'bg-sky-900/60', text: 'text-sky-200', border: 'border-sky-500/30' 
  },
  [PlayerClass.Middle]: { 
    label: 'MIDDLE', icon: '👔',
    bg: 'bg-indigo-900/60', text: 'text-indigo-200', border: 'border-indigo-500/30' 
  },
  [PlayerClass.Capitalist]: { 
    label: 'CAPITALIST', icon: '🎩',
    bg: 'bg-amber-900/60', text: 'text-amber-200', border: 'border-amber-500/30' 
  }
};

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
  const { 
    day, hp, maxHp, san, gold, currentClass, vitality, activeInsurance, gameDataCache,
    setShopOpen, setInventoryOpen, setArchiveOpen, setMenuOpen 
  } = useGameStore();
  const { playSfx } = useAudioStore();

  const hpChange = useValueChange(hp);
  const goldChange = useValueChange(gold);

  const classInfo = CLASS_CONFIG[currentClass] || CLASS_CONFIG[PlayerClass.Homeless];
  
  // 解构新状态
  const { addiction } = vitality.metrics;
  const { activeDiseases } = vitality;

  // 计算当前疾病名称列表
  const diseaseNames = useMemo(() => {
    if (!gameDataCache?.diseases) return [];
    return activeDiseases
      .map(id => gameDataCache.diseases.find((d: Disease) => d.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  }, [activeDiseases, gameDataCache]);

  const hasStatusEffects = addiction > 0 || activeDiseases.length > 0 || activeInsurance;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[98%] max-w-5xl pointer-events-none select-none">
      <div className="rounded-2xl px-3 py-2 md:px-6 md:py-3 flex items-center justify-between pointer-events-auto shadow-2xl bg-neutral-900/90 backdrop-blur-md border border-white/10 text-white transition-all duration-300">
        
        {/* Left Section */}
        <div className="flex items-center gap-3 md:gap-6">
          
          {/* Time & Class */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center justify-center w-10 h-10 bg-white/5 rounded-full border border-white/10 shadow-lg">
              <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">WEEK</div>
              <div className="text-base md:text-lg font-black font-serif text-white leading-none">
                {vitality.time.currentTurn}
              </div>
            </div>

            <div key={currentClass} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-inner transition-all duration-500 ${classInfo.bg} ${classInfo.text} ${classInfo.border} animate-in fade-in slide-in-from-top-2`}>
              <span className="text-sm filter drop-shadow-sm">{classInfo.icon}</span>
              <span className="hidden md:block text-[10px] font-black tracking-widest uppercase font-mono pt-0.5">{classInfo.label}</span>
            </div>
          </div>

          <div className="hidden md:block w-px h-8 bg-white/10 mx-1"></div>

          {/* Vitals (HP/SAN) */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* HP */}
            <div className="flex flex-col gap-0.5 min-w-[60px]">
               <div className="flex items-center justify-between">
                  <span className={`text-[10px] md:text-xs font-bold tracking-wider ${hp < 30 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>HP</span>
                  <span className={`font-mono font-bold text-xs md:text-sm ${hpChange === 'DOWN' ? 'text-red-500' : 'text-white'}`}>
                    {Math.floor(hp)}<span className="text-[10px] text-gray-500 opacity-50">/{maxHp}</span>
                  </span>
               </div>
               <div className="w-16 md:w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full transition-all duration-500 ${hp < 30 ? 'bg-red-600 shadow-[0_0_10px_red]' : 'bg-green-500'}`} style={{ width: `${Math.min((hp / maxHp) * 100, 100)}%` }} />
               </div>
            </div>

            {/* SAN */}
            <div className="flex flex-col gap-0.5 min-w-[60px]">
               <div className="flex items-center justify-between">
                  <span className={`text-[10px] md:text-xs font-bold tracking-wider ${san > 80 ? 'text-purple-400' : 'text-gray-400'}`}>SAN</span>
                  <span className="font-mono font-bold text-xs md:text-sm text-white">{san}<span className="text-[10px] text-gray-500 opacity-50">%</span></span>
               </div>
               <div className="w-16 md:w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full transition-all duration-500 ${san > 70 ? 'bg-purple-500 shadow-[0_0_10px_purple]' : san > 30 ? 'bg-blue-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(san, 100)}%` }} />
               </div>
            </div>
          </div>

          {/* ✨ New: Status Monitor (Dynamic) */}
          {hasStatusEffects && (
            <>
              <div className="hidden md:block w-px h-8 bg-white/10 mx-1"></div>
              <div className="flex items-center gap-3">
                 
                 {/* 1. Addiction Meter */}
                 {addiction > 0 && (
                   <div className="group relative flex flex-col items-center justify-center pt-1" title={`药物成瘾度: ${addiction}%`}>
                      <div className="text-xs animate-bounce" style={{ animationDuration: '3s' }}>💉</div>
                      <div className="w-8 h-1 bg-gray-800 rounded-full mt-1 overflow-hidden border border-white/10">
                         <div 
                           className={`h-full ${addiction > 50 ? 'bg-purple-500' : 'bg-purple-800'}`} 
                           style={{ width: `${Math.min(addiction, 100)}%` }} 
                         />
                      </div>
                   </div>
                 )}

                 {/* 2. Disease Indicator */}
                 {activeDiseases.length > 0 && (
                   <div className="relative group flex items-center justify-center w-8 h-8 bg-red-900/30 rounded-full border border-red-500/50 animate-pulse cursor-help">
                      <span className="text-sm">🦠</span>
                      {/* Tooltip */}
                      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-max max-w-[150px] px-3 py-2 bg-black/95 text-red-200 text-[10px] rounded-lg border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                         <div className="font-bold border-b border-red-500/30 mb-1 pb-1">当前病症</div>
                         {diseaseNames}
                      </div>
                   </div>
                 )}

                 {/* 3. Insurance Badge */}
                 {activeInsurance && (
                   <div className="flex items-center justify-center w-8 h-8 bg-emerald-900/20 rounded-full border border-emerald-500/30 cursor-help group">
                      <span className="text-sm">🛡️</span>
                      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-max px-3 py-2 bg-black/95 text-emerald-200 text-[10px] rounded-lg border border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                         <div className="font-bold border-b border-emerald-500/30 mb-1 pb-1">医疗保险生效中</div>
                         {activeInsurance.name}
                      </div>
                   </div>
                 )}
              </div>
            </>
          )}

        </div>

        {/* Center: Gold */}
        <div className={`
          flex items-center gap-1.5 md:gap-2 font-mono text-lg md:text-2xl font-black transition-all duration-300 mx-2 md:mx-4
          ${goldChange === 'UP' ? 'text-green-400 scale-110 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : goldChange === 'DOWN' ? 'text-red-400' : gold < 0 ? 'text-red-500' : 'text-yellow-400'}
        `}>
           <span className="text-sm opacity-50 font-sans">$</span>
           <span>{gold.toLocaleString()}</span>
        </div>

        {/* Right: Buttons */}
        <div className="flex items-center gap-1.5 md:gap-3 pl-3 md:pl-8 border-l border-white/10">
           {[
             { label: 'SHOP', action: () => setShopOpen(true), icon: '🛍️', color: 'hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/30' },
             { label: 'BAG', action: () => setInventoryOpen(true), icon: '🎒', color: 'hover:bg-green-500/20 hover:text-green-300 hover:border-green-500/30' },
             { label: 'DATA', action: () => setArchiveOpen(true), icon: '💾', color: 'hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/30' },
             { label: 'SYS', action: () => setMenuOpen(true), icon: '⚙️', color: 'hover:bg-gray-500/20 hover:text-gray-200 hover:border-gray-500/30' },
           ].map(btn => (
             <button
               key={btn.label}
               onClick={() => { playSfx('sfx_click'); btn.action(); }}
               className={`w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white/5 flex items-center justify-center text-base md:text-xl transition-all active:scale-95 border border-white/5 ${btn.color}`}
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