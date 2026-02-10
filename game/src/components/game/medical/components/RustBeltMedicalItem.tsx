import React, { useState } from 'react';
import { MedicalService } from '@/types/schema';

interface Props {
  service: MedicalService;
  canAfford: boolean;
  onBuy: () => void;
}

export const RustBeltMedicalItem: React.FC<Props> = ({ service, canAfford, onBuy }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={canAfford ? onBuy : undefined}
      disabled={!canAfford}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        w-full flex items-center justify-between p-3 border-b border-gray-700
        transition-all duration-200 group relative overflow-hidden
        ${canAfford ? 'hover:bg-blue-900/30 cursor-pointer' : 'opacity-50 grayscale cursor-not-allowed'}
        ${isHovered ? 'pl-6' : 'pl-3'}
      `}
    >
      {/* 选中时的左侧高亮条 */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-blue-500 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

      {/* 左侧：名称与效果 */}
      <div className="flex flex-col items-start text-left">
        <div className={`font-mono font-bold text-sm uppercase ${isHovered ? 'text-white' : 'text-gray-300'}`}>
          {service.name}
        </div>
        <div className="text-[10px] text-gray-500 group-hover:text-gray-400">
          {service.effects?.hpRestore && <span>REPAIR: +{service.effects.hpRestore} HP</span>}
          {service.effects?.sanRestore && <span className="ml-2">CALM: +{service.effects.sanRestore}</span>}
        </div>
      </div>

      {/* 中间：描述 (仅Hover显示) */}
      <div className={`
        absolute left-1/2 -translate-x-1/2 text-[10px] text-blue-300 italic
        transition-opacity duration-200 hidden md:block
        ${isHovered ? 'opacity-100' : 'opacity-0'}
      `}>
        "{service.flavorText}"
      </div>

      {/* 右侧：价格 */}
      <div className="text-right">
        <div className={`font-mono text-lg font-bold ${canAfford ? 'text-yellow-500' : 'text-red-500'}`}>
          ${service.baseCost}
        </div>
        {!canAfford && (
          <div className="text-[8px] text-red-500 font-bold uppercase">Declined</div>
        )}
      </div>
    </button>
  );
};