import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export const ShopModal: React.FC = () => {
  const items = useGameStore(s => s.shopItems);
  const gold = useGameStore(s => s.gold);
  const buyItem = useGameStore(s => s.buyItem);
  const close = () => useGameStore.getState().setShopOpen(false);

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-grayscale">
      {/* Windows 98 风格窗口框 */}
      <div className="w-full max-w-5xl bg-[#c0c0c0] border-2 border-white border-b-black border-r-black shadow-2xl h-[85vh] flex flex-col font-sans">
        
        {/* 标题栏 */}
        <div className="bg-[#000080] text-white px-2 py-1 flex justify-between items-center font-bold select-none">
          <div className="flex items-center gap-2">
            <img src="/assets/icons/ie_icon.png" className="w-4 h-4" alt="icon"/>
            <span>Netscape Navigator - [Dark_Market]</span>
          </div>
          <button onClick={close} className="bg-[#c0c0c0] text-black w-5 h-5 flex items-center justify-center border border-white border-b-black border-r-black text-sm font-bold active:border-t-black active:border-l-black select-none">X</button>
        </div>

        {/* 菜单栏 (装饰) */}
        <div className="bg-[#c0c0c0] border-b border-gray-400 px-2 py-1 text-xs flex gap-4 text-black select-none">
          <span className="underline">F</span>ile <span className="underline">E</span>dit <span className="underline">V</span>iew <span className="underline">G</span>o <span className="underline">H</span>elp
        </div>

        {/* 浏览器内容区 (白色背景) */}
        <div className="flex-1 bg-white overflow-y-auto custom-scrollbar p-4">
          
          {/* 粗糙的头部设计 */}
          <div className="text-center mb-8 border-b-4 border-blue-800 pb-4">
            <h1 className="text-4xl text-blue-800 font-serif italic font-bold tracking-tight">WELCOME TO THE SHOP</h1>
            <div className="mt-2 bg-yellow-200 text-red-600 border border-red-600 p-1 font-mono text-sm">
              🚨 SPECIAL OFFER: SELL YOUR KIDNEY TODAY FOR $500! CLICK HERE! 🚨
            </div>
          </div>

          {/* 商品网格 (Grid) - 模拟 Table 布局 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="border-2 border-blue-600 p-2 text-center bg-[#ffffcc] hover:bg-[#ffffaa] transition-colors">
                {/* 图片框 */}
                <div className="w-full h-24 border border-black mb-2 bg-white flex items-center justify-center overflow-hidden">
                   <img src={`/assets/items/${item.id}.png`} className="object-cover h-full w-full grayscale contrast-125" alt={item.name} onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
                
                <div className="font-bold text-blue-700 underline cursor-pointer text-sm mb-1">{item.name}</div>
                <div className="text-red-600 font-bold text-lg font-serif">${item.price}</div>
                <div className="text-[10px] text-black mt-1 leading-tight">{item.flavorText}</div>
                
                <button 
                  onClick={() => buyItem(item.id)}
                  disabled={gold < item.price}
                  className="mt-3 w-full bg-[#e0e0e0] border-2 border-white border-b-black border-r-black px-2 py-1 text-xs active:border-t-black active:border-l-black active:bg-[#cccccc] disabled:opacity-50 disabled:cursor-not-allowed select-none"
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center text-xs text-gray-500">
            Copyright © 1999 American Insight Corp. All rights reserved. <br/>
            Best viewed with Internet Explorer 4.0 at 800x600 resolution.
          </div>
        </div>
      </div>
    </div>
  );
};
