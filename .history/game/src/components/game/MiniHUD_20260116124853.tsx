import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';

export const MiniHUD: React.FC = () => {
  const { day, hp, san, gold, setShopOpen, setInventoryOpen, setArchiveOpen, setMenuOpen } = useGameStore();
  const { playSfx } = useAudioStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-10 w-[95%] max-w-4xl pointer-events-none">
      <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between pointer-events-auto">
        
        {/* 左侧：生存指标 (实物隐喻) */}
        <div className="flex items-center gap-6 md:gap-8">
          
          {/* DAY: 日历 */}
          <div className="flex flex-col items-center leading-none">
             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Day</div>
             <div className="text-xl font-black font-serif text-[var(--text-color)]">{day}</div>
          </div>

          {/* HP: 心电图 (SVG 动画) */}
          <div className="flex items-center gap-2" title={`HP: ${hp}`}>
            <div className={`w-3 h-3 rounded-full ${hp < 30 ? 'bg-red-600 animate-ping' : 'bg-green-500'}`} />
            <svg className="w-16 h-8 text-[var(--text-color)] opacity-80" viewBox="0 0 100 40">
              <path 
                d="M0 20 H30 L40 5 L50 35 L60 20 H100" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className={hp < 30 ? 'animate-pulse' : ''}
              />
            </svg>
          </div>

          {/* SAN: 眼球 (根据阶段变化) */}
          <div className="flex items-center gap-2 relative group" title={`SAN: ${san}`}>
            <div className="text-2xl relative">
              {san > 70 ? '👁️' : san > 30 ? '🩸' : '🧿'}
              {/* 低 SAN 时的幻觉光晕 */}
              {san <= 30 && <div className="absolute inset-0 animate-ping opacity-50 text-red-500">🧿</div>}
            </div>
            <div className="h-1 w-16 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${san > 70 ? 'bg-blue-500' : san > 30 ? 'bg-yellow-600' : 'bg-purple-600'}`} 
                style={{ width: `${san}%` }} 
              />
            </div>
          </div>
        </div>

        {/* 中间：金钱 (钱包) */}
        <div className={`flex items-center gap-2 font-mono text-lg font-bold transition-colors ${gold < 0 ? 'text-red-600' : 'text-green-600'}`}>
           <span>{gold < 0 ? '-' : ''}${Math.abs(gold)}</span>
        </div>

        {/* 右侧：功能按钮 (极简图标) */}
        <div className="flex items-center gap-2">
           {[
             { label: 'SHOP', action: () => setShopOpen(true), icon: '🛍️' },
             { label: 'BAG', action: () => setInventoryOpen(true), icon: '🎒' },
             { label: 'DATA', action: () => setArchiveOpen(true), icon: '💾' },
             { label: 'SYS', action: () => setMenuOpen(true), icon: '⚙️' },
           ].map(btn => (
             <button
               key={btn.label}
               onClick={() => { playSfx('sfx_click'); btn.action(); }}
               className="w-10 h-10 rounded-full bg-white/10 hover:bg-black/10 flex items-center justify-center text-lg transition-transform hover:scale-110 active:scale-90"
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