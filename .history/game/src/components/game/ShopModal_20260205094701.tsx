// src/components/game/ShopModal.tsx
import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Item, RegionID } from '@/types/schema';
// ✅ 1. 引入数值配置文件
import shopRules from '@/assets/data/rules/shopRules.json';

// 定义主题数据的接口，确保类型安全
interface ShopTheme {
  bg: string;
  title: string;
  subtitle: string;
}

// 将 JSON 配置转换为强类型对象
const themes = shopRules.themes as Record<string, ShopTheme>;

export const ShopModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { getRegionItems, buyItem, vitality, currentRegion } = useGameStore();
  
  // ✅ 2. 正确获取金钱（对应 VitalitySlice 的结构）
  const gold = vitality.metrics.gold;

  const items = getRegionItems(currentRegion);
  
  // ✅ 3. 使用配置文件的动态主题
  // 如果当前区域没有配置，回退到贫民窟 (SLUMS) 主题
  const theme = themes[currentRegion] || themes[RegionID.Slums];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl h-[85vh] bg-[#121212] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header with Dynamic Theme from JSON */}
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
             items.map((item: Item) => (
               <ShopItemCard 
                 key={item.id} 
                 item={item} 
                 canAfford={gold >= item.price} 
                 onBuy={() => buyItem(item.id)} 
               />
             ))
           )}
        </div>
      </div>
    </div>
  );
};

// 子组件：保持 UI 逻辑，无需变动
const ShopItemCard = ({ item, canAfford, onBuy }: { item: Item, canAfford: boolean, onBuy: () => void }) => {
  const isSpecial = item.price < 0; 
  
  return (
    <div className="group relative flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 p-4 rounded-xl transition-all">
      <div className="w-16 h-16 bg-black rounded-lg border border-white/10 flex items-center justify-center text-2xl">
         {/* 这里未来也可以提取到 shopRules.icons 中，目前保持简易映射 */}
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