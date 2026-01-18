import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { Item } from '@/types/schema';
// 如果 useAudioStore 还没创建，暂时注释掉或者我也给你一份
// import { useAudioStore } from '@/store/useAudioStore'; 

export const ShopModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  // 1. 解构出 shopItems 函数
  const { shopItems, gold, buyItem } = useGameStore();
  
  // 2. 🚨【关键修改】这里必须调用函数 () 才能拿到筛选后的数组
  const items = shopItems(); 

  // 临时模拟音效，防止报错（等你有了 useAudioStore 再替换回去）
  const playSfx = (name: string) => console.log('Play SFX:', name);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-0 md:p-8 animate-in fade-in duration-200" onClick={onClose}>
      
      {/* 容器 - 阻止冒泡防止点击关闭 */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl h-[90vh] md:h-[80vh] bg-[#F5F5F7] dark:bg-[#1C1C1E] md:rounded-[2rem] rounded-t-[2rem] shadow-2xl overflow-hidden flex flex-col font-sans text-slate-900 dark:text-white relative"
      >
        
        {/* 顶部导航栏 */}
        <div className="px-6 md:px-8 py-6 flex justify-between items-end bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 sticky top-0 z-10 shrink-0">
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">MARKETPLACE</div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              Today
              <span className={`text-sm font-normal px-2 py-1 rounded-full border ${gold < 0 ? 'text-red-500 border-red-500/30 bg-red-500/10' : 'text-blue-500 border-blue-500/30 bg-blue-100 dark:bg-blue-900/30'}`}>
                ${gold}
              </span>
            </h1>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center font-bold text-gray-500 hover:bg-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 内容滚动区 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
           
           {/* Banner */}
           <div className="mb-8 relative w-full h-48 md:h-64 rounded-3xl overflow-hidden shadow-lg group cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600">
              <div className="absolute bottom-6 left-6 text-white max-w-[80%]">
                <div className="text-xs font-bold uppercase opacity-80 mb-1">SPONSORED</div>
                <div className="text-2xl md:text-3xl font-black mb-2 leading-tight">Happiness is just a transaction away.</div>
              </div>
           </div>

           {/* 商品列表 */}
           <div className="flex flex-col gap-0 divide-y divide-gray-200 dark:divide-white/10">
             {/* 3. 🚨【关键修改】这里遍历 items 数组，而不是 shopItems 函数 */}
             {items.map((item: Item) => {
               const isAffordable = gold >= item.price;
               const isDarkWeb = item.id.startsWith('D');
               
               if (item.id === 'D05' && gold >= -2000) return null;

               return (
                 <div key={item.id} className={`py-4 flex items-center gap-4 group relative ${isDarkWeb ? 'bg-red-900/10 -mx-4 px-4 border-l-4 border-red-600' : ''}`}>
                    <ItemIcon item={item} />

                    <div className="flex-1 min-w-0">
                      <div className={`text-base font-semibold truncate ${isDarkWeb ? 'text-red-500 font-mono tracking-tighter' : ''}`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 md:truncate pr-2">
                        {item.flavorText}
                      </div>
                      <div className="flex gap-2 mt-1">
                        {item.tags.map(tag => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-gray-500 uppercase font-bold tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        if (item.price <= 0 || isAffordable) {
                          playSfx(isDarkWeb ? 'sfx_glitch' : 'sfx_cash');
                          buyItem(item.id);
                        }
                      }}
                      disabled={!isAffordable && item.price > 0}
                      className={`
                        px-5 py-2 rounded-full font-bold text-sm transition-all active:scale-95 shrink-0
                        ${item.price <= 0 
                          ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30' 
                          : isAffordable 
                            ? 'bg-[#F0F0F8] text-[#007AFF] hover:bg-[#E0E0F0] dark:bg-white/10 dark:text-blue-400' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-white/5'}
                      `}
                    >
                      {item.price <= 0 ? (item.id === 'D05' ? 'SACRIFICE' : 'GET') : `$${item.price}`}
                    </button>
                 </div>
               )
             })}
           </div>

           {items.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                暂无商品可购买
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

// 子组件保持不变...
const ItemIcon = ({ item }: { item: Item }) => {
  const [error, setError] = useState(false);
  const isSpecial = item.price <= 0 || item.price > 1000;
  
  const getBgColor = (id: string) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500'];
    const index = id.charCodeAt(id.length - 1) % colors.length;
    return colors[index];
  };

  return (
    <div className={`
      w-14 h-14 md:w-16 md:h-16 rounded-2xl flex-shrink-0 shadow-sm flex items-center justify-center overflow-hidden relative
      ${error ? getBgColor(item.id) : (isSpecial ? 'bg-black text-white' : 'bg-white dark:bg-white/10 border border-gray-100 dark:border-white/5')}
    `}>
      {!error ? (
        <img 
          src={`/assets/items/${item.id}.png`} 
          className="w-full h-full object-cover" 
          alt={item.name}
          onError={() => setError(true)}
        />
      ) : (
        <span className="text-white font-black text-xl opacity-50 uppercase">
          {item.name.slice(0, 2)}
        </span>
      )}
    </div>
  );
};