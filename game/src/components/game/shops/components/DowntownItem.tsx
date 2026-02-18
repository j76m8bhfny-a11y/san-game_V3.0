import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import { Item } from '@/types/schema';

interface Props {
  item: Item;
  canAfford: boolean;
  onBuy: () => void;
}

export const DowntownItem: React.FC<Props> = ({ item, canAfford, onBuy }) => {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // 极简的高级图标
  const getIcon = (tags: string[]) => {
    if (tags.includes('WEAPON')) return '♟️'; // 战略武器
    if (tags.includes('DRUG')) return '🧪';   // 生物制剂
    if (tags.includes('BOOK')) return '📜';   // 机密文件
    return '💎';
  };

  const handleBuy = () => {
    if (!canAfford) return;
    setIsSigning(true);
    // 模拟签字动画时间
    setTimeout(() => {
      onBuy();
      setIsSigning(false);
    }, 800);
  };

  return (
    <div 
      className={`
        group relative p-8 transition-all duration-500 border
        ${isHovered ? 'bg-[#111] border-[#d4af37] translate-y-[-4px]' : 'bg-transparent border-white/10'}
        ${!canAfford ? 'opacity-50' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 装饰性边角 (Corner Accents) */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l transition-colors duration-300 ${isHovered ? 'border-[#d4af37]' : 'border-white/20'}`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r transition-colors duration-300 ${isHovered ? 'border-[#d4af37]' : 'border-white/20'}`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l transition-colors duration-300 ${isHovered ? 'border-[#d4af37]' : 'border-white/20'}`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r transition-colors duration-300 ${isHovered ? 'border-[#d4af37]' : 'border-white/20'}`} />

      {/* 1. 物品展示区 (Spotlight) */}
      <div className="relative h-48 flex items-center justify-center mb-6 overflow-hidden">
        {/* 光束效果 */}
        <div className={`absolute inset-0 bg-gradient-to-b from-white/5 to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
        
        <div className={`text-7xl text-white/90 drop-shadow-2xl transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}>
          {getIcon(item.tags)}
        </div>
      </div>

      {/* 2. 信息区 (Minimalist Typography) */}
      <div className="text-center">
        <h3 className="text-white font-serif text-xl tracking-wide mb-2 group-hover:text-[#d4af37] transition-colors">
          {item.name}
        </h3>
        <div className="w-8 h-[1px] bg-white/20 mx-auto mb-4" />
        <p className="text-gray-500 font-serif text-sm italic mb-6 min-h-[3em]">
          "{item.flavorText}"
        </p>
      </div>

      {/* 3. 价格与操作 (Signature Interaction) */}
      <div className="flex items-center justify-between mt-4 border-t border-white/10 pt-4">
        <div className="text-right">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest">{t('shop.valuation')}</div>
          <div className="text-white font-serif text-lg">${item.price.toLocaleString()}</div>
        </div>

        <button
          onClick={handleBuy}
          disabled={!canAfford || isSigning}
          className={`
            relative px-6 py-2 overflow-hidden transition-all duration-300
            ${!canAfford 
               ? 'text-gray-600 cursor-not-allowed' 
               : 'hover:bg-[#d4af37] hover:text-black text-[#d4af37] border border-[#d4af37]'}
          `}
        >
          {isSigning ? (
            <span className="font-handwriting text-xl animate-pulse">{t('shop.signing')}</span>
          ) : !canAfford ? (
            <span className="text-xs uppercase font-sans tracking-widest">{t('shop.insufficientAsset')}</span>
          ) : (
            <span className="font-serif italic tracking-wide">{t('shop.acquire')}</span>
          )}
        </button>
      </div>

      {/* 属性微标 (极简风格) */}
      <div className="absolute top-4 right-4 flex flex-col gap-1 items-end opacity-50 group-hover:opacity-100 transition-opacity">
         {item.effects?.hp !== undefined && (
           <span className="text-[10px] text-gray-400 font-mono">
             {t('common.hp')} {item.effects.hp > 0 ? '+' : ''}{item.effects.hp}
           </span>
         )}
         {item.effects?.san !== undefined && (
           <span className="text-[10px] text-amber-500 font-mono">
             灵视{item.effects.san > 0 ? '+' : ''}{item.effects.san}
           </span>
         )}
      </div>

    </div>
  );
};
