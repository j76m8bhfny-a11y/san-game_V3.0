import React from 'react';
import { GameEvent } from '@/types/schema';

interface Option {
  id: string;
  label: string;
  type: 'normal' | 'locked' | 'awakened';
  onClick: () => void;
}

export const MessageWindow: React.FC<{ event: GameEvent; onOptionSelect: (optionId: string) => void }> = ({ event, onOptionSelect }) => {
  return (
    <div className="absolute bottom-0 w-full h-[40vh] z-10 p-2 md:p-4">
      {/* 容器背景: 点阵纹理 + 边框 */}
      <div className="w-full h-full bg-[#020410]/95 border-t-2 border-x-2 border-cyan-800/80 flex flex-col p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.9)] relative overflow-hidden rounded-t-lg">
        
        {/* CSS Dot Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#4fd1c5 1px, transparent 1px)', backgroundSize: '4px 4px' }} />
        
        {/* 1. 文本区 (打字机效果) */}
        <div className="flex-1 font-pixel text-cyan-50 text-base md:text-lg leading-relaxed mb-4 overflow-y-auto custom-scrollbar">
          <span className="text-cyan-600 mr-2 font-bold">></span>
          {event.text}
          <span className="animate-blink inline-block w-2 h-4 bg-cyan-500 ml-1 align-middle"/>
        </div>

        {/* 2. 按钮网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {event.options.map((opt, idx) => {
             // 动态样式逻辑
             let btnStyle = "border-cyan-500/40 text-cyan-100 hover:bg-cyan-500 hover:text-black"; // Normal
             if (opt.type === 'locked') btnStyle = "border-gray-700 text-gray-600 cursor-not-allowed border-dashed";
             if (opt.type === 'awakened') btnStyle = "border-red-600 text-red-500 hover:bg-red-900 hover:text-red-100 animate-pulse font-bold";

             return (
              <button 
                key={opt.id} 
                onClick={() => onOptionSelect(opt.id)} 
                disabled={opt.type === 'locked'} 
                className={`relative w-full border-2 p-3 text-left font-pixel text-sm transition-all duration-100 group overflow-hidden ${btnStyle}`}
              >
                <span className="relative z-10 flex justify-between items-center">
                  <span>{idx + 1}. {opt.label}</span>
                  {opt.type === 'normal' && <span className="opacity-0 group-hover:opacity-100"><<</span>}
                </span>
                {/* 扫光特效 */}
                {opt.type === 'normal' && <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:animate-shine" />}
              </button>
             );
          })}
        </div>
      </div>
    </div>
  );
};
