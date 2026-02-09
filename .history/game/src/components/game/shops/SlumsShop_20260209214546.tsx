import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID } from '@/types/schema';
import { SlumsItem } from './components/SlumsItem';

interface Props {
  onClose: () => void;
}

export const SlumsShop: React.FC<Props> = ({ onClose }) => {
  const { getRegionItems, buyItem, vitality } = useGameStore();
  
  // 获取贫民窟的物品
  const items = getRegionItems(RegionID.Slums);
  const gold = vitality.metrics.gold;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      
      {/* 1. 后备箱容器 */}
      {/* 背景图应该是后备箱内部视角，边缘有车体结构 */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl aspect-video bg-[#1a1a1a] shadow-2xl rounded-lg overflow-hidden border-4 border-[#2a2a2a]"
        style={{
          backgroundImage: "url('/assets/shops/slums_trunk_bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: 'inset 0 0 150px black'
        }}
      >
        {/* 顶部标题栏：像是贴在车盖内侧的胶带 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-24 bg-gradient-to-b from-black/90 to-transparent pointer-events-none z-10" />
        <div className="absolute top-6 left-1/2 -translate-x-1/2 rotate-1 bg-[#d4c5a9] px-6 py-2 shadow-lg transform origin-center z-20">
          <h1 className="text-2xl font-black text-[#2a2a2a] font-serif tracking-widest uppercase">
            BLACK MARKET
          </h1>
          <div className="text-xs text-center font-mono text-[#5c4d3c] font-bold">CASH ONLY • NO REFUNDS</div>
        </div>

        {/* 玩家金钱显示：扔在角落的零钱 */}
        <div className="absolute top-6 right-8 rotate-3 bg-[#111] border border-white/20 px-4 py-2 rounded-sm shadow-xl z-20">
          <div className="text-[10px] text-gray-500 font-mono uppercase">MY CASH</div>
          <div className={`text-xl font-mono ${gold < 10 ? 'text-red-500' : 'text-green-500'}`}>
            ${gold}
          </div>
        </div>

        {/* 2. 物品散落区域 */}
        {/* 使用 Grid 布局防止重叠，但通过 Item 内部的随机旋转制造混乱感 */}
        <div className="absolute inset-0 pt-32 px-16 pb-16 overflow-y-auto custom-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/30 font-pixel">
              ( EMPTY )
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pb-20">
              {items.map((item) => (
                <SlumsItem 
                  key={item.id} 
                  item={item} 
                  canAfford={gold >= item.price}
                  onBuy={() => buyItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 3. 关闭按钮 (模拟关上后备箱) */}
        <button 
          onClick={onClose}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-900/80 hover:bg-red-700 text-white px-8 py-3 font-bold font-mono border-2 border-red-950 shadow-lg transition-all active:scale-95"
        >
          CLOSE TRUNK
        </button>

        {/* 氛围遮罩：手电筒光圈效果 (Vignette) */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]" />
      </div>
    </div>
  );
};