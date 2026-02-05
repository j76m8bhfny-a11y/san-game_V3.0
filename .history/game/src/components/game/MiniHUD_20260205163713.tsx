import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { PlayerClass, Disease } from '@/types/schema';

// ✅ 1. 引入配置文件群 (Configuration Swarm)
import vitalityRules from '@/assets/data/rules/vitalityRules.json';
import INITIAL_STATE from '@/assets/data/config/initial_state.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

// --- 配置: 阶级视觉风格 (保留在代码中，这是UI样式而非数值逻辑) ---
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
  // 从 Store 中解构
  const { 
    vitality, 
    activeInsurance, 
    gameDataCache,
    setShopOpen, 
    setInventoryOpen, 
    setArchiveOpen, 
    setMenuOpen 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  const { hp, maxHp, san, gold, addiction } = vitality.metrics;
  const { currentClass } = vitality.identity;
  const { activeDiseases } = vitality;

  // ✅ 2. 从 JSON 读取动态上限 (Sanity 上限未来可能随装备变动，但目前是固定的)
  // 如果你的 Schema 里没有 metrics.maxSan，就回退到 INITIAL_STATE
  const maxSan = (vitality.metrics as any).maxSan || INITIAL_STATE.vitality.maxSan;
  // 获取全局属性上限 (用于 Addiction 等没有 explicit max 的属性)
  const GLOBAL_MAX = SYSTEM_RULES.caps.maxStat; 

  const hpChange = useValueChange(hp);
  const goldChange = useValueChange(gold);

  const classInfo = CLASS_CONFIG[currentClass as PlayerClass] || CLASS_CONFIG[PlayerClass.Homeless];
  
  // ✅ 3. 解构视觉阈值配置
  const { thresholds } = vitalityRules.visuals;

  // 计算当前疾病名称列表
  const diseaseNames = useMemo(() => {
    if (!gameDataCache?.diseases) return [];
    return activeDiseases
      .map(id => (gameDataCache.diseases as Disease[]).find(d => d.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  }, [activeDiseases, gameDataCache]);

  const hasStatusEffects = addiction > 0 || activeDiseases.length > 0 || !!activeInsurance;

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

            <div key={currentClass} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-inner transition-all duration-500 ${classInfo.bg} ${classInfo.text} ${classInfo.border}`}>
              <span className="text-sm filter drop-shadow-sm">{classInfo.icon}</span>
              <span className="hidden md:block text-[10px] font-black tracking-widest uppercase font-mono pt-0.5">{classInfo.label}</span>
            </div>
          </div>

          <div className="hidden md:block w-px h-8 bg-white/10 mx-1"></div>

          {/* Vitals (HP/SAN) */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex flex-col gap-0.5 min-w-[60px]">
               <div className="flex items-center justify-between">
                  <span className={`text-[10px] md:text-xs font-bold tracking-wider ${hp < thresholds.hpLow ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>HP</span>
                  <span className={`font-mono font-bold text-xs md:text-sm ${hpChange === 'DOWN' ? 'text-red-500' : 'text-white'}`}>
                    {Math.floor(hp)}<span className="text-[10px] text-gray-500 opacity-50">/{maxHp}</span>
                  </span>
               </div>
               <div className="w-16 md:w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full transition-all duration-500 ${hp < thresholds.hpLow ? 'bg-red-600 shadow-[0_0_10px_red]' : 'bg-green-500'}`} style={{ width: `${Math.min((hp / maxHp) * 100, 100)}%` }} />
               </div>
            </div>

            <div className="flex flex-col gap-0.5 min-w-[60px]">
               <div className="flex items-center justify-between">
                  {/* ✅ 使用 maxSan 变量 */}
                  <span className={`text-[10px] md:text-xs font-bold tracking-wider ${san > thresholds.sanHigh ? 'text-purple-400' : 'text-gray-400'}`}>SAN</span>
                  <span className="font-mono font-bold text-xs md:text-sm text-white">{san}<span className="text-[10px] text-gray-500 opacity-50">/{maxSan}</span></span>
               </div>
               <div className="w-16 md:w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                  {/* ✅ 修正进度条计算: (san / maxSan) * 100 */}
                  <div className={`h-full transition-all duration-500 ${san > thresholds.sanMedium ? 'bg-purple-500 shadow-[0_0_10px_purple]' : san > thresholds.sanLow ? 'bg-blue-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min((san / maxSan) * 100, 100)}%` }} />
               </div>
            </div>
          </div>

          {/* Status Monitor */}
          {hasStatusEffects && (
            <>
              <div className="hidden md:block w-px h-8 bg-white/10 mx-1"></div>
              <div className="flex items-center gap-3">
                 {addiction > 0 && (
                   <div className="group relative flex flex-col items-center justify-center pt-1">
                      <div className="text-xs animate-bounce" style={{ animationDuration: '3s' }}>💉</div>
                      <div className="w-8 h-1 bg-gray-800 rounded-full mt-1 overflow-hidden border border-white/10">
                         {/* ✅ 修正进度条计算: (addiction / GLOBAL_MAX) * 100 */}
                         <div className={`h-full ${addiction > thresholds.addictionHigh ? 'bg-purple-500' : 'bg-purple-800'}`} style={{ width: `${Math.min((addiction / GLOBAL_MAX) * 100, 100)}%` }} />
                      </div>
                   </div>
                 )}
                 {activeDiseases.length > 0 && (
                   <div className="relative group flex items-center justify-center w-8 h-8 bg-red-900/30 rounded-full border border-red-500/50 animate-pulse">
                      <span className="text-sm">🦠</span>
                      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-max max-w-[150px] px-3 py-2 bg-black/95 text-red-200 text-[10px] rounded-lg border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                         <div className="font-bold border-b border-red-500/30 mb-1 pb-1">当前病症</div>
                         {diseaseNames}
                      </div>
                   </div>
                 )}
                 {activeInsurance && (
                   <div className="flex items-center justify-center w-8 h-8 bg-emerald-900/20 rounded-full border border-emerald-500/30 group">
                      <span className="text-sm">🛡️</span>
                      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-max px-3 py-2 bg-black/95 text-emerald-200 text-[10px] rounded-lg border border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-50">
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
          flex items-center gap-1.5 md:gap-2 font-mono text-lg md:text-2xl font-black transition-all
          ${goldChange === 'UP' ? 'text-green-400 scale-110' : goldChange === 'DOWN' ? 'text-red-400' : gold < 0 ? 'text-red-500' : 'text-yellow-400'}
        `}>
           <span className="text-sm opacity-50 font-sans">$</span>
           <span>{gold.toLocaleString()}</span>
        </div>

        {/* Right: Buttons */}
        <div className="flex items-center gap-1.5 md:gap-3 pl-3 md:pl-8 border-l border-white/10">
           {[
             { label: 'SHOP', action: () => setShopOpen(true), icon: '🛍️', color: 'hover:bg-blue-500/20' },
             { label: 'BAG', action: () => setInventoryOpen(true), icon: '🎒', color: 'hover:bg-green-500/20' },
             { label: 'DATA', action: () => setArchiveOpen(true), icon: '💾', color: 'hover:bg-purple-500/20' },
             { label: 'SYS', action: () => setMenuOpen(true), icon: '⚙️', color: 'hover:bg-gray-500/20' },
           ].map(btn => (
             <button
               key={btn.label}
               onClick={() => { playSfx('sfx_click'); btn.action(); }}
               className={`w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white/5 flex items-center justify-center text-base md:text-xl transition-all border border-white/5 ${btn.color}`}
             >
               {btn.icon}
             </button>
           ))}
        </div>

      </div>
    </div>
  );
};