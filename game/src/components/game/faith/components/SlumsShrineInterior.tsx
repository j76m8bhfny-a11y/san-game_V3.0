import React, { useState } from 'react';
import { Item } from '@/types/schema';
import { SlumsOffering } from './SlumsOffering';

interface Props {
  inventory: Item[];
  onSacrifice: (itemId: string) => void;
  onPray: () => void;
  onClose: () => void;
}

export const SlumsShrineInterior: React.FC<Props> = ({ inventory, onSacrifice, onPray, onClose }) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [ratVisible, setRatVisible] = useState(false);

  const handleSacrifice = () => {
    if (!selectedItemId) return;
    
    setIsAnimating(true);
    
    // 1. 播放老鼠出来的动画
    setTimeout(() => setRatVisible(true), 500);

    // 2. 物品消失，回调触发
    setTimeout(() => {
      onSacrifice(selectedItemId);
      setRatVisible(false);
      setIsAnimating(false);
      setSelectedItemId(null);
    }, 1500);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-black">
      
      {/* 1. 背景：祭坛特写 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: "url('/assets/faith/slums_shrine_interior.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/40 radial-vignette" />
      </div>

      {/* 2. 祭坛中心交互区 */}
      <div className="relative z-10 w-full max-w-2xl aspect-square flex flex-col items-center justify-center">
        
        {/* 祭坛台面 (Drop Zone) */}
        <div className={`
          relative w-64 h-64 border-4 border-dashed rounded-full flex items-center justify-center
          transition-all duration-500
          ${selectedItemId ? 'border-orange-500/50 bg-orange-900/10' : 'border-white/10'}
          ${isAnimating ? 'scale-90 opacity-50' : ''}
        `}>
          {/* 默认状态：断头圣像 */}
          {!selectedItemId && !isAnimating && (
            <img src="/assets/faith/prop_broken_statue.png" className="w-40 opacity-80 drop-shadow-2xl" />
          )}

          {/* 选中状态：显示的供品 */}
          {selectedItemId && !isAnimating && (
             <div className="text-6xl animate-bounce-slow filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
               📦
             </div>
          )}

          {/* 动画：老鼠叼走供品 */}
          {ratVisible && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <img src="/assets/faith/fx_rat_snatch.png" className="w-48 animate-slide-out-right" />
            </div>
          )}
        </div>

        {/* 动作按钮 */}
        <div className="mt-8 h-16">
          {selectedItemId ? (
            <button
              onClick={handleSacrifice}
              disabled={isAnimating}
              className="bg-orange-800 hover:bg-orange-700 text-orange-100 font-marker text-xl px-8 py-2 border-2 border-orange-900 shadow-[0_0_20px_rgba(194,65,12,0.4)] animate-pulse"
            >
              {isAnimating ? "..." : "SACRIFICE"}
            </button>
          ) : (
            <div className="text-gray-500 font-mono text-xs bg-black/60 px-4 py-2">
              Select an item to offer...
            </div>
          )}
        </div>

      </div>

      {/* 3. 底部：玩家物品栏 (Inventory Strip) */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent p-6 z-20">
        <div className="flex justify-center gap-4 overflow-x-auto pb-4">
          {/* 祈祷按钮 (无物品时的低保) */}
          <button 
            onClick={onPray}
            className="w-20 h-20 border border-white/20 flex flex-col items-center justify-center opacity-60 hover:opacity-100 hover:bg-white/10 transition-all"
          >
            <span className="text-2xl">🙏</span>
            <span className="text-[10px] mt-1 font-mono">PRAY</span>
          </button>

          <div className="w-[1px] bg-white/20 mx-2" />

          {/* 物品列表 */}
          {inventory.slice(0, 5).map(item => ( // 只显示前5个，避免太乱
            <SlumsOffering
              key={item.id}
              item={item}
              isSelected={selectedItemId === item.id}
              onClick={() => !isAnimating && setSelectedItemId(item.id === selectedItemId ? null : item.id)}
            />
          ))}
          
          {inventory.length === 0 && (
             <div className="text-gray-600 font-mono text-xs flex items-center">
               (No offerings available)
             </div>
          )}
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-8 text-gray-500 hover:text-white text-xs font-mono"
        >
          [LEAVE]
        </button>
      </div>

    </div>
  );
};