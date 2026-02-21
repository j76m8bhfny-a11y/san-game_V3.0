import React, { useState } from 'react';
import { Item } from '@/types/schema';
import { useI18n } from '@/i18n';

interface Props {
  item: Item;
  canAfford: boolean;
  onBuy: () => void;
}

export const RustBeltItem: React.FC<Props> = ({ item, canAfford, onBuy }) => {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  // 简单的图标映射
  const getIcon = (tags: string[]) => {
    if (tags.includes('FOOD')) return '🍺';
    if (tags.includes('WEAPON')) return '🔧';
    if (tags.includes('DRUG')) return '🚬';
    return '🥫';
  };

  return (
    <div 
      className="group relative flex flex-col items-center justify-end h-32 w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={canAfford ? onBuy : undefined}
    >
      {/* 1. 物品本体 (立在货架上) */}
      <div className={`
        relative text-5xl transition-all duration-200 z-10 mb-2 filter
        ${isHovered ? 'scale-110 brightness-110 drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]' : 'grayscale-[0.3] brightness-90 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]'}
        ${!canAfford ? 'opacity-40 grayscale' : 'cursor-pointer'}
      `}>
        {getIcon(item.tags)}
        
        {/* 玻璃反光效果 (在物品上) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 pointer-events-none rounded-full" />
      </div>

      {/* 2. 货架层板 (Item stand) */}
      <div className="absolute bottom-0 w-full h-2 bg-gradient-to-r from-[#334155] via-[#475569] to-[#334155] shadow-lg rounded-sm z-0" />

      {/* 3. 价格标签 (贴在货架边缘的塑料片) */}
      <div className={`
        absolute -bottom-6 left-1/2 -translate-x-1/2 
        bg-yellow-400 text-black w-20 h-8 
        flex flex-col items-center justify-center
        border-t-2 border-white/20 shadow-sm transition-transform origin-top
        ${isHovered ? 'scale-110 bg-yellow-300 z-20' : 'scale-100 z-10'}
      `}>
        <span className="text-[10px] font-bold leading-none scale-75 uppercase truncate w-full text-center px-1">
          {item.name}
        </span>
        <span className="font-black font-mono text-lg leading-none">
          ${item.price}
        </span>
      </div>

      {/* 4. 详情悬浮窗 (透过玻璃看详情) */}
      <div className={`
        absolute bottom-full mb-2 w-40 bg-black/90 border border-green-500/30 text-green-500 p-2 
        backdrop-blur-md shadow-[0_0_15px_rgba(0,255,0,0.1)] pointer-events-none z-50
        transition-all duration-200
        ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}>
         <div className="text-xs font-mono mb-1 text-white border-b border-white/20 pb-1">{item.name}</div>
         <div className="text-[10px] text-gray-400 italic">"{item.flavorText}"</div>
         
         <div className="mt-2 flex gap-1 text-[10px]">
            {item.effects?.hp !== undefined && <span className="bg-red-900/50 text-red-400 px-1 rounded">HP {item.effects.hp > 0 ? '+' : ''}{item.effects.hp}</span>}
            {item.effects?.insight !== undefined && <span className="bg-amber-900/50 text-amber-400 px-1 rounded">灵视{item.effects.insight > 0 ? '+' : ''}{item.effects.insight}</span>}
         </div>

         {!canAfford && (
           <div className="mt-1 text-center bg-red-600 text-white text-[10px] font-bold animate-pulse">
             {t('shop.insufficient')}
           </div>
         )}
      </div>

    </div>
  );
};