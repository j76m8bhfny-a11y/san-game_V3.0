import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export const ShopModal: React.FC = () => {
  const { shopItems, gold, buyItem, setShopOpen } = useGameStore();

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* 极繁主义外框 */}
      <div className="w-full max-w-5xl h-[85vh] bg-white border-[8px] border-yellow-400 shadow-[0_0_50px_rgba(255,215,0,0.5)] flex flex-col relative overflow-hidden rounded-xl">
        
        {/* 顶部跑马灯 */}
        <div className="bg-red-600 text-white font-bold text-sm py-1 overflow-hidden whitespace-nowrap">
           🔥 FLASH SALE! 90% OFF YOUR SOUL! BUY NOW OR DIE TRYING! CONSUME! OBEY! 🔥
        </div>

        {/* 标题栏 */}
        <div className="bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 p-4 border-b-4 border-yellow-500 flex justify-between items-center">
          <h1 className="text-3xl font-black italic text-red-600 drop-shadow-md font-serif">
            AMAZON_PRIME_PLUS++
          </h1>
          <button onClick={() => setShopOpen(false)} className="text-2xl font-bold text-black hover:text-red-500">×</button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto bg-[url('/assets/textures/noise.svg')] bg-gray-50 p-6">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {shopItems.map(item => {
               // 此处复用之前的解锁逻辑(略)...
               // 仅展示视觉变化
               const isAffordable = gold >= item.price;

               return (
                 <div key={item.id} className="bg-white border-2 border-gray-200 rounded-lg p-3 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col relative overflow-hidden group">
                    {/* 伪造的标签 */}
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                      HOT
                    </div>

                    {/* 商品图占位 */}
                    <div className="w-full h-32 bg-gray-100 mb-3 rounded-md flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500">
                      {item.price <= 0 ? '🩸' : '📦'}
                    </div>

                    <h3 className="font-bold text-sm line-clamp-1">{item.name}</h3>
                    <p className="text-[10px] text-gray-500 line-clamp-2 h-8 leading-tight mb-2">{item.flavorText}</p>
                    
                    <div className="mt-auto">
                      <div className="text-lg font-black text-red-600 mb-1">
                        ${item.price} <span className="text-xs text-gray-300 line-through font-normal">${Math.floor(item.price * 1.5)}</span>
                      </div>
                      <button 
                        onClick={() => buyItem(item.id)}
                        disabled={!isAffordable && item.price > 0}
                        className={`w-full py-2 font-bold text-xs uppercase rounded shadow-md active:translate-y-1
                          ${item.price <= 0 
                            ? 'bg-black text-red-500 border border-red-500 hover:bg-red-900' 
                            : isAffordable 
                              ? 'bg-yellow-400 text-black hover:bg-yellow-500' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                        `}
                      >
                        {item.price <= 0 ? 'ACCEPT DEAL' : 'ADD TO CART'}
                      </button>
                    </div>
                 </div>
               )
             })}
           </div>
        </div>
      </div>
    </div>
  );
};