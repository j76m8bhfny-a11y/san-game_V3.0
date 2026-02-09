import React, { useState } from 'react';
import { Item } from '@/types/schema';

interface Props {
  item: Item;
  canAfford: boolean;
  onBuy: () => void;
}

export const SuburbsItem: React.FC<Props> = ({ item, canAfford, onBuy }) => {
  const [isHovered, setIsHovered] = useState(false);

  // 图标映射：使用更干净的 Emoji 或图片
  const getIcon = (tags: string[]) => {
    if (tags.includes('FOOD')) return '🥗'; // 沙拉
    if (tags.includes('WEAPON')) return '🏏'; // 运动器材(伪装)
    if (tags.includes('DRUG')) return '💊'; // 处方药
    if (tags.includes('BOOK')) return '📚';
    return '🎁';
  };

  return (
    <div 
      className="group relative flex flex-col items-center justify-end h-40 w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={canAfford ? onBuy : undefined}
    >
      {/* 1. 物品本体 (悬浮感) */}
      <div className={`
        relative text-6xl transition-all duration-300 z-20 mb-3
        ${isHovered ? 'scale-110 -translate-y-2 drop-shadow-xl' : 'drop-shadow-md'}
        ${!canAfford ? 'opacity-50 grayscale' : 'cursor-pointer'}
      `}>
        {getIcon(item.tags)}
        
        {/* 有机认证标签 (装饰) */}
        {item.tags.includes('FOOD') && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center border border-white shadow-sm">
            <span className="text-[8px] text-white font-bold">BIO</span>
          </div>
        )}
      </div>

      {/* 2. 木质货架层板 (Shelf) */}
      <div className="absolute bottom-8 w-[120%] h-4 bg-[#d4a373] border-t border-[#faedcd] shadow-lg rounded-sm z-10" />
      <div className="absolute bottom-5 w-[110%] h-3 bg-[#a98467] z-0 rounded-b-sm" />

      {/* 3. 价格标签 (黑板吊牌风格) */}
      {/* 像是一个挂在货架边缘的小黑板 */}
      <div className={`
        absolute -bottom-2 left-1/2 -translate-x-1/2 
        bg-[#1e1e1e] border-2 border-[#8b4513] rounded-md
        w-20 h-10 flex flex-col items-center justify-center shadow-lg
        transition-transform origin-top z-30
        ${isHovered ? 'rotate-[-2deg] scale-110' : 'rotate-0'}
      `}>
        {/* 挂绳/挂钩 */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-3 bg-gray-400" />
        
        <span className="text-white font-handwriting text-lg leading-none">
          ${item.price}
        </span>
        <span className="text-[8px] text-gray-400 uppercase tracking-widest scale-75">
          ea.
        </span>
      </div>

      {/* 4. 详情悬浮卡片 (干净的白色卡片) */}
      <div className={`
        absolute bottom-full mb-4 w-48 bg-white p-4 rounded-xl shadow-2xl border border-gray-100
        text-center pointer-events-none z-50 transition-all duration-200
        ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
         <h3 className="font-serif font-bold text-green-900 text-sm mb-1">{item.name}</h3>
         <div className="w-8 h-0.5 bg-green-200 mx-auto mb-2" />
         <p className="text-xs text-gray-500 italic mb-2">"{item.flavorText}"</p>
         
         <div className="flex justify-center gap-2 text-[10px] font-medium">
            {item.effects?.hp !== undefined && <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Health {item.effects.hp > 0 ? '+' : ''}{item.effects.hp}</span>}
            {item.effects?.san !== undefined && <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Mood {item.effects.san > 0 ? '+' : ''}{item.effects.san}</span>}
         </div>

         {!canAfford && (
           <div className="mt-2 text-red-500 text-[10px] font-bold uppercase tracking-wide">
             Insufficient Funds
           </div>
         )}
         
         {/* 底部小箭头 */}
         <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white transform rotate-45 border-r border-b border-gray-100" />
      </div>

    </div>
  );
};