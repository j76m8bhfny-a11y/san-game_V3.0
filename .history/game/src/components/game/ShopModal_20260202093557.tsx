// src/components/game/ShopModal.tsx
import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Item, RegionID } from '@/types/schema';

// 简单的区域风格映射
const REGION_THEMES: Record<RegionID, { bg: string, title: string, subtitle: string }> = {
  [RegionID.Slums]: { 
    bg: 'from-gray-900 to-black', 
    title: '贫民窟黑市', 
    subtitle: '这里卖的东西大多是过期的，或者是偷来的。' 
  },
  [RegionID.RustBelt]: { 
    bg: 'from-orange-900/50 to-black', 
    title: '工团补给站', 
    subtitle: '为了明天的劳作，补充燃料。' 
  },
  [RegionID.Suburbs]: { 
    bg: 'from-blue-900/30 to-gray-900', 
    title: '社区便利店', 
    subtitle: '中产阶级的避风港，干净、昂贵、无聊。' 
  },
  [RegionID.Downtown]: { 
    bg: 'from-purple-900/50 to-black', 
    title: 'VIP 尊享会所', 
    subtitle: '只要付得起钱，我们可以出售“快乐”。' 
  },
};

export const ShopModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { getRegionItems, buyItem, gold, currentRegion } = useGameStore();
  
  // ✅ 直接调用 Store 的筛选器
  const items = getRegionItems(currentRegion);
  const theme = REGION_THEMES[currentRegion] || REGION_THEMES[RegionID.Slums];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl h-[85vh] bg-[#121212] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header with Dynamic Theme */}
        <div className={`p-8 bg-gradient-to-r ${theme.bg} border-b border-white/10 relative overflow-hidden`}>
           <div className="relative z-10">
             <div className="text-xs font-mono text-white/50 mb-2 uppercase tracking-[0.2em]">{currentRegion} MARKET</div>
             <h1 className="text-4xl font-black text-white mb-2">{theme.title}</h1>
             <p className="text-white/60 italic font-serif">{theme.subtitle}</p>
           </div>
           
           {/* Money Display */}
           <div className="absolute top-8 right-8 text-right">
              <div className="text-xs text-white/50 uppercase tracking-widest mb-1">CURRENT FUNDS</div>
              <div className={`text-3xl font-mono font-bold ${gold < 0 ? 'text-red-500' : 'text-green-400'}`}>
                ${gold.toLocaleString()}
              </div>
           </div>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
           {items.length === 0 ? (
             <div className="h-full flex items-center justify-center text-gray-600 font-mono">
               [ 该区域暂无商品供应 ]
             </div>
           ) : (
             items.map((item) => (
               <ShopItemCard key={item.id} item={item} canAfford={gold >= item.price} onBuy={() => buyItem(item.id)} />
             ))
           )}
        </div>
      </div>
    </div>
  );
};

// 抽取子组件，保持代码整洁
const ShopItemCard = ({ item, canAfford, onBuy }: { item: Item, canAfford: boolean, onBuy: () => void }) => {
  const isSpecial = item.price < 0; // 卖血类
  
  return (
    <div className="group relative flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 p-4 rounded-xl transition-all">
      {/* Icon Placeholder */}
      <div className="w-16 h-16 bg-black rounded-lg border border-white/10 flex items-center justify-center text-2xl">
         {item.tags.includes('FOOD') ? '🥫' : 
          item.tags.includes('WEAPON') ? '🔪' : 
          item.tags.includes('BOOK') ? '📘' : '📦'}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-lg text-gray-200">{item.name}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/50 uppercase tracking-wider">
            {item.type}
          </span>
        </div>
        <p className="text-sm text-gray-500 font-serif italic">“{item.flavorText}”</p>
        
        {/* Effects Tags */}
        <div className="flex gap-2 mt-2 text-xs">
           {item.effects?.hp !== undefined && (
             <span className={`${item.effects.hp > 0 ? 'text-green-500' : 'text-red-500'}`}>
               {item.effects.hp > 0 ? '+' : ''}{item.effects.hp} HP
             </span>
           )}
           {item.effects?.san !== undefined && (
             <span className={`${item.effects.san > 0 ? 'text-blue-500' : 'text-purple-500'}`}>
               {item.effects.san > 0 ? '+' : ''}{item.effects.san} SAN
             </span>
           )}
        </div>
      </div>

      <button
        onClick={onBuy}
        disabled={!canAfford && !isSpecial}
        className={`
          px-6 py-3 rounded-lg font-mono font-bold text-sm transition-all
          ${isSpecial 
            ? 'bg-red-900/30 text-red-500 border border-red-800 hover:bg-red-900/50' 
            : canAfford 
              ? 'bg-white text-black hover:scale-105 hover:shadow-lg' 
              : 'bg-white/5 text-white/20 cursor-not-allowed'}
        `}
      >
        {isSpecial ? `GET $${Math.abs(item.price)}` : `$${item.price}`}
      </button>
    </div>
  );
};