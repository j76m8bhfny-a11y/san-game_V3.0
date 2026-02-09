import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';
import { RustBeltItem } from './components/RustBeltItem';

interface Props {
  onClose: () => void;
}

export const RustBeltShop: React.FC<Props> = ({ onClose }) => {
  const { getRegionItems, buyItem, vitality } = useGameStore();
  
  const items = getRegionItems(RegionID.RustBelt);
  const gold = vitality.metrics.gold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      
      {/* 1. 商店容器：模拟透过防弹玻璃看货架 */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl aspect-video bg-[#1e293b] shadow-2xl overflow-hidden border-8 border-[#334155] flex flex-col"
        style={{
          backgroundImage: "url('/assets/shops/rust_shelves_bg.jpg')", // 货架背景
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* --- 顶部：荧光灯管与招牌 --- */}
        <div className="h-24 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start p-6">
          {/* 闪烁的霓虹灯招牌 */}
          <div className="border-4 border-red-900 bg-black/50 px-4 py-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse">
            <h1 className="text-3xl font-black text-red-500 font-mono tracking-[0.2em] uppercase italic glitch-text">
              QUICK-MART
            </h1>
          </div>

          {/* 收银机显示的金额 */}
          <div className="bg-[#0f172a] border-2 border-gray-600 p-2 rounded">
             <div className="text-[10px] text-gray-400 font-mono mb-1">CASH TENDERED</div>
             <div className={`text-2xl font-mono text-right font-bold ${gold < 10 ? 'text-red-500' : 'text-green-400'}`}>
               <span className="mr-1 text-sm">$</span>{gold.toFixed(2)}
             </div>
          </div>
        </div>

        {/* --- 中部：金属货架区域 (Grid Layout) --- */}
        <div className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar z-0 relative">
          
          {/* 货架阴影层 */}
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />

          {items.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 font-mono bg-black/60">
              [ OUT OF STOCK ]
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12 relative z-10">
              {items.map((item) => (
                <RustBeltItem 
                  key={item.id} 
                  item={item} 
                  canAfford={gold >= item.price}
                  onBuy={() => buyItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* --- 前景层：防弹玻璃与反光 --- */}
        <div className="absolute inset-0 z-20 pointer-events-none select-none overflow-hidden">
           {/* 1. 整体玻璃质感 (青色滤镜 + 噪点) */}
           <div className="absolute inset-0 bg-[#a5f3fc] opacity-[0.03] mix-blend-overlay" />
           
           {/* 2. 划痕与污渍贴图 */}
           <div className="absolute inset-0 bg-[url('/assets/fx/scratch_glass.png')] opacity-30 mix-blend-screen" />
           
           {/* 3. 反光 (高光条) */}
           <div className="absolute top-0 right-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-50%]" />

           {/* 4. 贴纸：只收现金 */}
           <div className="absolute bottom-10 right-10 rotate-[-5deg] border-2 border-white/30 bg-red-600/90 text-white px-4 py-2 font-black font-sans text-xl shadow-lg">
             CASH ONLY
           </div>
           <div className="absolute bottom-24 right-12 rotate-[2deg] border border-white/20 bg-yellow-500/90 text-black px-3 py-1 font-bold font-mono text-xs shadow-md">
             NO CREDIT
           </div>
        </div>

        {/* --- 底部：金属交易槽 (互动区) --- */}
        <div className="h-20 bg-[#334155] border-t-4 border-[#475569] flex items-center justify-center relative z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
           <div className="w-1/2 h-12 bg-[#1e293b] rounded-lg border-2 border-[#0f172a] shadow-inner flex items-center justify-center">
             <span className="text-slate-600 font-mono text-xs tracking-widest uppercase">
               SLIDE ITEMS HERE
             </span>
           </div>
           
           {/* 关闭按钮 */}
           <button 
             onClick={onClose}
             className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white font-mono hover:underline"
           >
             [LEAVE STORE]
           </button>
        </div>

      </div>
    </div>
  );
};