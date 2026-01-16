import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';

export const MiniHUD: React.FC = () => {
  const day = useGameStore(s => s.day);
  const hp = useGameStore(s => s.hp);
  const san = useGameStore(s => s.san);
  const gold = useGameStore(s => s.gold);

  // 获取 Action
  const setShopOpen = useGameStore(s => s.setShopOpen);
  const setMenuOpen = useGameStore(s => s.setMenuOpen);
  const setArchiveOpen = useGameStore(s => s.setArchiveOpen);
  const setInventoryOpen = useGameStore(s => s.setInventoryOpen);
  const { playSfx } = useAudioStore();
  const handleOpenInventory = () => {
    playSfx('sfx_click');
    setInventoryOpen(true);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-10 p-2 md:p-4 pointer-events-none"> {/* pointer-events-none 让出点击区域 */}
      <div className="max-w-4xl mx-auto bg-black/80 border-b-2 border-cyan-800/60 backdrop-blur-sm pointer-events-auto"> {/* 内部恢复点击 */}
        <div className="flex items-center justify-between gap-4 px-4 py-2">
          
          {/* 左侧: 数值显示 */}
          <div className="flex items-center gap-4 md:gap-6 font-pixel text-sm md:text-base">
            <div className="flex items-center gap-2">
              <span className="text-cyan-600">DAY</span>
              <span className="text-cyan-100 font-bold">{day}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-red-500">HP</span>
              <span className="text-red-100 font-bold">{hp}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-purple-500">SAN</span>
              <span className="text-purple-100 font-bold">{san}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">$</span>
              <span className="text-yellow-100 font-bold">{gold}</span>
            </div>
          </div>

          {/* 右侧: 功能按钮 */}
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 text-xs font-pixel border border-cyan-500/40 text-cyan-100 hover:bg-cyan-500 hover:text-black transition-colors select-none"
              onClick={handleOpenInventory}
            >
              ITEMS
            </button>
            <button
              className="px-3 py-1 text-xs font-pixel border border-cyan-500/40 text-cyan-100 hover:bg-cyan-500 hover:text-black transition-colors select-none"
              onClick={() => setShopOpen(true)}
            >
              SHOP
            </button>
            
            <button 
              className="px-3 py-1 text-xs font-pixel border border-cyan-500/40 text-cyan-100 hover:bg-cyan-500 hover:text-black transition-colors select-none"
              onClick={() => setArchiveOpen(true)}
            >
              ARCHIVE
            </button>
            
            <button 
              className="px-3 py-1 text-xs font-pixel border border-cyan-500/40 text-cyan-100 hover:bg-cyan-500 hover:text-black transition-colors select-none"
              onClick={() => setMenuOpen(true)}
            >
              MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};