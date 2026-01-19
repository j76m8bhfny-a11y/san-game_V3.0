import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';

// 辅助 Hook：检测数值变化方向 (用于红/绿跳字特效)
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
  // 1. 获取 maxHp 以显示百分比
  const { day, hp, maxHp, san, gold, setShopOpen, setInventoryOpen, setArchiveOpen, setMenuOpen } = useGameStore();
  const { playSfx } = useAudioStore();

  const hpChange = useValueChange(hp);
  const goldChange = useValueChange(gold);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl pointer-events-none select-none">
      {/* 🎨 视觉重构：
         1. 背景改为深色 (bg-neutral-900/90)，保证在浅色/深色背景下都能看清。
         2. 添加 border-white/10 增加精致感。
         3. 文字颜色不再依赖全局变量，而是使用固定的高亮色。
      */}
      <div className="rounded-2xl px-4 py-3 md:px-6 flex items-center justify-between pointer-events-auto shadow-2xl bg-neutral-900/90 backdrop-blur-md border border-white/10 text-white">
        
        {/* Left: 状态数值区 */}
        <div className="flex items-center gap-4 md:gap-8">
          
          {/* DAY: 增加圆形背景突显 */}
          <div className="flex flex-col items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-full border border-white/5">
             <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">Day</div>
             <div className="text-lg md:text-xl font-black font-serif text-white leading-none">{day}</div>
          </div>

          {/* HP: 显式数值 + 动态图标 */}
          <div className="flex flex-col gap-0.5 min-w-[60px]">
             <div className="flex items-center gap-2">
                <span className={`text-xs font-bold tracking-wider ${hp < 30 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>HP</span>
                {/* 数值显示 */}
                <span className={`font-mono font-bold text-sm md:text-base ${hpChange === 'DOWN' ? 'text-red-500' : 'text-white'}`}>
                  {hp}<span className="text-xs text-gray-500">/{maxHp}</span>
                </span>
             </div>
             {/* 进度条 */}
             <div className="w-20 md:w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${hp < 30 ? 'bg-red-600' : 'bg-green-500'}`} 
                  style={{ width: `${Math.min((hp / maxHp) * 100, 100)}%` }}
                />
             </div>
          </div>

          {/* SAN: 显式数值 + 颜色区分 */}
          <div className="flex flex-col gap-0.5 min-w-[60px]">
             <div className="flex items-center gap-2">
                <span className={`text-xs font-bold tracking-wider ${san > 80 ? 'text-purple-400' : 'text-gray-400'}`}>SAN</span>
                {/* 数值显示 */}
                <span className="font-mono font-bold text-sm md:text-base text-white">
                  {san}<span className="text-xs text-gray-500">%</span>
                </span>
             </div>
             {/* 进度条 */}
             <div className="w-20 md:w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${san > 70 ? 'bg-purple-500' : san > 30 ? 'bg-blue-500' : 'bg-cyan-500'}`} 
                  style={{ width: `${Math.min(san, 100)}%` }}
                />
             </div>
          </div>
        </div>

        {/* Center: Gold (加大加粗) */}
        <div className={`
          flex items-center gap-2 font-mono text-xl md:text-2xl font-black transition-all duration-300 mx-4
          ${goldChange === 'UP' ? 'text-green-400 scale-110' : goldChange === 'DOWN' ? 'text-red-400' : gold < 0 ? 'text-red-500' : 'text-yellow-400'}
        `}>
           <span className="text-base opacity-50">$</span>
           <span>{gold}</span>
        </div>

        {/* Right: 功能按钮 (增加 hover 效果和分割线) */}
        <div className="flex items-center gap-2 md:gap-3 pl-4 md:pl-8 border-l border-white/10">
           {[
             { label: 'SHOP', action: () => setShopOpen(true), icon: '🛍️', color: 'hover:bg-blue-500/20 hover:text-blue-300' },
             { label: 'BAG', action: () => setInventoryOpen(true), icon: '🎒', color: 'hover:bg-green-500/20 hover:text-green-300' },
             { label: 'DATA', action: () => setArchiveOpen(true), icon: '💾', color: 'hover:bg-purple-500/20 hover:text-purple-300' },
             { label: 'SYS', action: () => setMenuOpen(true), icon: '⚙️', color: 'hover:bg-gray-500/20 hover:text-gray-200' },
           ].map(btn => (
             <button
               key={btn.label}
               onClick={() => { playSfx('sfx_click'); btn.action(); }}
               className={`
                 w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/5 flex items-center justify-center text-lg md:text-xl 
                 transition-all active:scale-95 border border-white/5 ${btn.color}
               `}
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