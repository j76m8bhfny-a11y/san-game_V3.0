import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Item } from '@/types/schema';

export const ShopModal: React.FC = () => {
  const { shopItems, gold, buyItem, setShopOpen } = useGameStore();

  return (
    <div className="fixed inset-0 z-20 flex items-end md:items-center justify-center bg-black/30 backdrop-blur-md p-0 md:p-8 animate-in fade-in duration-200">
      
      {/* 容器：模拟 iPad/iOS App Store 界面 */}
      <div className="w-full max-w-4xl h-[90vh] md:h-[80vh] bg-[#F5F5F7] dark:bg-[#1C1C1E] md:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden flex flex-col font-sans text-slate-900 dark:text-white">
        
        {/* 顶部导航栏 */}
        <div className="px-8 py-6 flex justify-between items-end bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 sticky top-0 z-10">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">THURSDAY, NOV 14</div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              Today
              <span className="text-blue-500 text-sm font-normal bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                Credit: ${gold}
              </span>
            </h1>
          </div>
          <button 
            onClick={() => setShopOpen(false)}
            className="w-8 h-8 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center font-bold text-gray-500 hover:bg-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 内容滚动区 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
           
           {/* 顶部推荐卡片 (模拟 Featured) */}
           <div className="mb-8 relative w-full h-64 rounded-3xl overflow-hidden shadow-lg group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-600 mix-blend-multiply opacity-80" />
              <div className="absolute inset-0 bg-[url('/assets/textures/noise.svg')] opacity-20" />
              <div className="absolute bottom-6 left-6 text-white">
                <div className="text-xs font-bold uppercase opacity-80 mb-1">MUST HAVE</div>
                <div className="text-3xl font-black mb-2">Survive Another Day</div>
                <div className="text-sm opacity-90 max-w-md">Essentials for the modern dystopia. Buy happiness, buy silence.</div>
              </div>
           </div>

           {/* 商品列表 */}
           <div className="flex flex-col gap-0 divide-y divide-gray-200 dark:divide-white/10">
             {shopItems.map((item: Item) => {
               const isAffordable = gold >= item.price;
               const isSpecial = item.price <= 0 || item.price > 1000;

               // 隐藏未解锁的特殊商品 (人体拆解)
               if (item.unlockCondition) {
                  // 简单的条件解析逻辑
                  if (item.id === 'D05' && gold >= -2000) return null;
               }

               return (
                 <div key={item.id} className="py-4 flex items-center gap-4 group">
                    {/* 图标 */}
                    <div className={`w-16 h-16 rounded-2xl flex-shrink-0 shadow-sm flex items-center justify-center text-2xl overflow-hidden
                      ${isSpecial ? 'bg-black text-white' : 'bg-white dark:bg-white/10 border border-gray-100 dark:border-white/5'}
                    `}>
                      <img 
                        src={`/assets/items/${item.id}.png`} 
                        className="w-full h-full object-cover" 
                        alt={item.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerText = item.name[0];
                        }} 
                      />
                    </div>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold truncate">{item.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.flavorText}</div>
                      <div className="flex gap-2 mt-1">
                        {item.tags.map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-gray-500 uppercase font-bold tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 购买按钮 (Get) */}
                    <button 
                      onClick={() => buyItem(item.id)}
                      disabled={!isAffordable && item.price > 0}
                      className={`px-5 py-1.5 rounded-full font-bold text-sm transition-all active:scale-95
                        ${item.price <= 0 
                          ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/30' 
                          : isAffordable 
                            ? 'bg-[#F0F0F8] text-[#007AFF] hover:bg-[#E0E0F0] dark:bg-white/10 dark:text-blue-400' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-white/5'}
                      `}
                    >
                      {item.price <= 0 ? 'GET' : `$${item.price}`}
                    </button>
                 </div>
               )
             })}
           </div>
        </div>
      </div>
    </div>
  );
};