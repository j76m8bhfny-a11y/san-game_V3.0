import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export const MiniHUD: React.FC = () => {
  const day = useGameStore(s => s.day);
  const hp = useGameStore(s => s.hp);
  const san = useGameStore(s => s.san);
  const gold = useGameStore(s => s.gold);

  return (
    <div className="fixed top-0 left-0 right-0 z-10 p-2 md:p-4">
      <div className="max-w-4xl mx-auto bg-black/80 border-b-2 border-cyan-800/60 backdrop-blur-sm">
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
              className="px-3 py-1 text-xs font-pixel border border-cyan-500/40 text-cyan-100 hover:bg-cyan-500 hover:text-black transition-colors touch-action-manipulation user-select-none"
              onClick={() => {
                // TODO: 触发商店打开
                console.log('[MiniHUD] Open Shop');
              }}
            >
              SHOP
            </button>
            
            <button 
              className="px-3 py-1 text-xs font-pixel border border-cyan-500/40 text-cyan-100 hover:bg-cyan-500 hover:text-black transition-colors touch-action-manipulation user-select-none"
              onClick={() => {
                // TODO: 触发档案打开
                console.log('[MiniHUD] Open Archive');
              }}
            >
              ARCHIVE
            </button>
            
            <button 
              className="px-3 py-1 text-xs font-pixel border border-cyan-500/40 text-cyan-100 hover:bg-cyan-500 hover:text-black transition-colors touch-action-manipulation user-select-none"
              onClick={() => {
                // TODO: 触发菜单打开
                console.log('[MiniHUD] Open Menu');
              }}
            >
              MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
