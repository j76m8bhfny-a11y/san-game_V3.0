import React, { useState } from 'react';
import { MedicalService } from '@/types/schema';

interface Props {
  service: MedicalService;
  canAfford: boolean;
  onBuy: () => void;
}

export const DowntownMedicalItem: React.FC<Props> = ({ service, canAfford, onBuy }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={canAfford ? onBuy : undefined}
      disabled={!canAfford}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        w-full h-32 relative border border-white/10 bg-black/40 backdrop-blur-sm
        flex flex-col items-center justify-center overflow-hidden transition-all duration-300 group
        ${canAfford ? 'hover:border-cyan-500/50 hover:bg-black/60 cursor-pointer' : 'opacity-40 grayscale cursor-not-allowed'}
      `}
    >
      {/* 激活时的扫描线特效 */}
      <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-[200%] w-full animate-scan pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

      {/* 图标 (抽象符号) */}
      <div className="text-2xl mb-2 text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
        {service.type === 'SPECIAL' ? '🧬' : service.type === 'SURGERY' ? '🦾' : '🧪'}
      </div>

      {/* 名称 */}
      <div className="font-mono text-sm text-white tracking-widest uppercase mb-1">
        {service.name}
      </div>

      {/* 价格 */}
      <div className={`text-xs font-mono ${canAfford ? 'text-cyan-400' : 'text-red-900'}`}>
        ${service.baseCost.toLocaleString()}
      </div>

      {/* 悬浮详情层 (覆盖) */}
      <div className={`
        absolute inset-0 bg-[#050505] flex flex-col items-center justify-center p-4 text-center
        transition-transform duration-300
        ${isHovered ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div className="text-[10px] text-gray-400 font-sans tracking-wide mb-2">
          {service.flavorText}
        </div>
        
        <div className="flex gap-4 text-[9px] font-mono text-cyan-600">
           {service.effects?.hpRestore && <span>VITALS++</span>}
           {service.effects?.sanRestore && <span>NEURAL++</span>}
        </div>

        <div className="mt-2 text-cyan-400 text-[10px] border border-cyan-800 px-2 py-0.5 animate-pulse">
          INITIALIZE PROTOCOL
        </div>
      </div>
      
      {/* 角标装饰 */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20" />
    </button>
  );
};