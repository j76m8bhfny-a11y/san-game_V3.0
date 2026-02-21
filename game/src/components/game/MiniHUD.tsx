import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import { PlayerClass, Disease } from '@/types/schema';
import { PlayerStatsPanel } from './PlayerStatsPanel';

// ✅ 1. 引入配置文件群 (Configuration Swarm)
import vitalityRules from '@/assets/data/rules/vitality_rules.json';
import INITIAL_STATE from '@/assets/data/config/initial_state.json';
import SYSTEM_RULES from '@/assets/data/config/system_rules.json';

// --- 配置: 阶级视觉风格 (保留在代码中，这是UI样式而非数值逻辑) ---
const CLASS_CONFIG: Record<PlayerClass, { bg: string; text: string; border: string; icon: string }> = {
  [PlayerClass.Homeless]: { 
    icon: '🏚️',
    bg: 'bg-stone-800/80', text: 'text-stone-400', border: 'border-stone-600/30' 
  },
  [PlayerClass.Worker]: { 
    icon: '⚒️',
    bg: 'bg-sky-900/60', text: 'text-sky-200', border: 'border-sky-500/30' 
  },
  [PlayerClass.Middle]: { 
    icon: '👔',
    bg: 'bg-indigo-900/60', text: 'text-indigo-200', border: 'border-indigo-500/30' 
  },
  [PlayerClass.Capitalist]: { 
    icon: '🎩',
    bg: 'bg-amber-900/60', text: 'text-amber-200', border: 'border-amber-500/30' 
  }
};

// 阶级对应的 i18n key
const CLASS_I18N_KEY: Record<PlayerClass, string> = {
  [PlayerClass.Homeless]: 'homeless',
  [PlayerClass.Worker]: 'worker',
  [PlayerClass.Middle]: 'middle',
  [PlayerClass.Capitalist]: 'capitalist',
};

// ✅ 优化：使用防抖避免频繁的状态更新
const useValueChange = (value: number) => {
  const prev = useRef(value);
  const [change, setChange] = useState<'UP' | 'DOWN' | 'NONE'>('NONE');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // 如果值没有变化，不触发更新
    if (value === prev.current) {
      setChange('NONE');
      return;
    }
    
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 设置新的变化状态
    const newChange = value > prev.current ? 'UP' : 'DOWN';
    setChange(newChange);
    prev.current = value;
    
    // 1秒后重置状态
    timeoutRef.current = setTimeout(() => {
      setChange('NONE');
      timeoutRef.current = null;
    }, 1000);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);
  
  return change;
};

export const MiniHUD: React.FC = () => {
  // 从 Store 中解构
  const { 
    vitality, 
    gameDataCache,
    setInventoryOpen, 
    setArchiveOpen, 
    setMenuOpen 
  } = useGameStore();
  
  // 获取医疗保险用于显示 - 从 vitality 中读取
  const activeInsurance = vitality.activeInsurances.find((ins: any) => ins.type === 'MEDICAL') || null;
  
  const { playSfx } = useAudioStore();
  const { t } = useI18n();
  
  // 属性面板开关状态
  const [isStatsPanelOpen, setStatsPanelOpen] = useState(false);

  const { hp, maxHp, insight, gold, addiction } = vitality.metrics;
  const { currentClass } = vitality.identity;
  const { activeDiseases } = vitality;

  // ✅ 2. 从 JSON 读取动态上限 (Insight 上限未来可能随装备变动，但目前是固定的)
  const maxInsight = (vitality.metrics as any).maxInsight || INITIAL_STATE.vitality.maxInsight;
  // 获取全局属性上限 (用于 Addiction 等没有 explicit max 的属性)
  const GLOBAL_MAX = SYSTEM_RULES.caps.maxStat; 

  const hpChange = useValueChange(hp);
  const goldChange = useValueChange(gold);

  const classInfo = CLASS_CONFIG[currentClass as PlayerClass] || CLASS_CONFIG[PlayerClass.Homeless];
  const classI18nKey = CLASS_I18N_KEY[currentClass as PlayerClass] || 'homeless';
  
  // ✅ 3. 解构视觉阈值配置（灵视值版本）
  const { thresholds } = vitalityRules.visuals;
  // 灵视值阈值：越高越觉醒
  const insightLow = thresholds.insightLow ?? 30;
  const insightMedium = thresholds.insightMedium ?? 50;
  const insightHigh = thresholds.insightHigh ?? 70;

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
              <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">{t('hud.week', { turn: '' }).replace('{turn}', '')}</div>
              <div className="text-base md:text-lg font-black font-serif text-white leading-none">
                {vitality.time.currentTurn}
              </div>
            </div>

            <button 
              onClick={() => { playSfx('sfx_click'); setStatsPanelOpen(true); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-inner transition-all duration-500 cursor-pointer hover:scale-105 hover:brightness-110 ${classInfo.bg} ${classInfo.text} ${classInfo.border}`}
            >
              <span className="text-sm filter drop-shadow-sm">{classInfo.icon}</span>
              <span className="hidden md:block text-[10px] font-black tracking-widest uppercase font-mono pt-0.5">
                {t(`hud.class.${classI18nKey}.label`)}
              </span>
            </button>
          </div>

          <div className="hidden md:block w-px h-8 bg-white/10 mx-1"></div>

          {/* Vitals (HP/SAN) - 可点击打开属性面板 */}
          <div className="flex items-center gap-4 md:gap-6">
            <button 
              onClick={() => { playSfx('sfx_click'); setStatsPanelOpen(true); }}
              className="flex flex-col gap-0.5 min-w-[60px] cursor-pointer hover:opacity-80 transition-opacity"
            >
               <div className="flex items-center justify-between">
                  <span className={`text-[10px] md:text-xs font-bold tracking-wider ${hp < thresholds.hpLow ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                    {t('hud.stats.hp_short')}
                  </span>
                  <span className={`font-mono font-bold text-xs md:text-sm ${hpChange === 'DOWN' ? 'text-red-500' : 'text-white'}`}>
                    {Math.floor(hp)}<span className="text-[10px] text-gray-500 opacity-50">/{maxHp}</span>
                  </span>
               </div>
               <div className="w-16 md:w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full transition-all duration-500 ${hp < thresholds.hpLow ? 'bg-red-600 shadow-[0_0_10px_red]' : 'bg-green-500'}`} style={{ width: `${Math.min((hp / maxHp) * 100, 100)}%` }} />
               </div>
            </button>

            <button 
              onClick={() => { playSfx('sfx_click'); setStatsPanelOpen(true); }}
              className="flex flex-col gap-0.5 min-w-[60px] cursor-pointer hover:opacity-80 transition-opacity"
            >
               <div className="flex items-center justify-between">
                  <span className={`text-[10px] md:text-xs font-bold tracking-wider ${insight > insightHigh ? 'text-amber-400' : insight > insightMedium ? 'text-purple-400' : 'text-gray-400'}`}>
                    {t('hud.stats.insight_short')}
                  </span>
                  <span className="font-mono font-bold text-xs md:text-sm text-white">{insight}<span className="text-[10px] text-gray-500 opacity-50">/{maxInsight}</span></span>
               </div>
               <div className="w-16 md:w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                  <div className={`h-full transition-all duration-500 ${insight > insightHigh ? 'bg-amber-500 shadow-[0_0_10px_amber]' : insight > insightMedium ? 'bg-purple-500 shadow-[0_0_8px_purple]' : insight > insightLow ? 'bg-blue-500' : 'bg-gray-500'}`} style={{ width: `${Math.min((insight / maxInsight) * 100, 100)}%` }} />
               </div>
            </button>
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
                         <div className={`h-full ${addiction > thresholds.addictionHigh ? 'bg-purple-500' : 'bg-purple-800'}`} style={{ width: `${Math.min((addiction / GLOBAL_MAX) * 100, 100)}%` }} />
                      </div>
                   </div>
                 )}
                 {activeDiseases.length > 0 && (
                   <div className="relative group flex items-center justify-center w-8 h-8 bg-red-900/30 rounded-full border border-red-500/50 animate-pulse">
                      <span className="text-sm">🦠</span>
                      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-max max-w-[150px] px-3 py-2 bg-black/95 text-red-200 text-[10px] rounded-lg border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                         <div className="font-bold border-b border-red-500/30 mb-1 pb-1">{t('hud.status.disease')}</div>
                         {diseaseNames}
                      </div>
                   </div>
                 )}
                 {activeInsurance && (
                   <div className="flex items-center justify-center w-8 h-8 bg-emerald-900/20 rounded-full border border-emerald-500/30 group">
                      <span className="text-sm">🛡️</span>
                      <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-max px-3 py-2 bg-black/95 text-emerald-200 text-[10px] rounded-lg border border-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                         <div className="font-bold border-b border-emerald-500/30 mb-1 pb-1">{t('hud.status.hasInsurance')}</div>
                         {activeInsurance.name}
                      </div>
                   </div>
                 )}
              </div>
            </>
          )}

        </div>

        {/* Center: Gold - 可点击打开属性面板 */}
        <button 
          onClick={() => { playSfx('sfx_click'); setStatsPanelOpen(true); }}
          className={`
            flex items-center gap-1.5 md:gap-2 font-mono text-lg md:text-2xl font-black transition-all cursor-pointer hover:scale-105
            ${goldChange === 'UP' ? 'text-green-400 scale-110' : goldChange === 'DOWN' ? 'text-red-400' : gold < 0 ? 'text-red-500' : 'text-yellow-400'}
          `}
        >
           <span className="text-sm opacity-50 font-sans">$</span>
           <span>{gold.toLocaleString()}</span>
        </button>

        {/* Right: Buttons */}
        <div className="flex items-center gap-1.5 md:gap-3 pl-3 md:pl-8 border-l border-white/10">
           {[
             { key: 'bag', action: () => setInventoryOpen(true), icon: '🎒', color: 'hover:bg-green-500/20' },
             { key: 'data', action: () => setArchiveOpen(true), icon: '💾', color: 'hover:bg-purple-500/20' },
             { key: 'sys', action: () => setMenuOpen(true), icon: '⚙️', color: 'hover:bg-gray-500/20' },
           ].map(btn => (
             <button
               key={btn.key}
               onClick={() => { playSfx('sfx_click'); btn.action(); }}
               className={`w-9 h-9 md:w-11 md:h-11 rounded-xl bg-white/5 flex items-center justify-center text-base md:text-xl transition-all border border-white/5 ${btn.color}`}
               title={t(`hud.buttons.${btn.key}`)}
             >
               {btn.icon}
             </button>
           ))}
        </div>

      </div>
      
      {/* 角色属性面板 */}
      <PlayerStatsPanel isOpen={isStatsPanelOpen} onClose={() => setStatsPanelOpen(false)} />
    </div>
  );
};
