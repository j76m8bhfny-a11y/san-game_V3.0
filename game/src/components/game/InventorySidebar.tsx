// src/components/game/InventorySidebar.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Item } from '@/types/schema';

export const InventorySidebar: React.FC = () => {
  const isOpen = useGameStore(s => s.isInventoryOpen);
  const setOpen = useGameStore(s => s.setInventoryOpen);
  const inventoryIds = useGameStore(s => s.inventory);
  const allItems = useGameStore(s => s.shopItems);
  const { playSfx } = useAudioStore();

  // 将 ID 列表转换为详细的 Item 对象列表
  const myItems: Item[] = inventoryIds
    .map(id => allItems.find(i => i.id === id))
    .filter((item): item is Item => !!item);

  // 播放开关音效
  React.useEffect(() => {
    if (isOpen) playSfx('sfx_hover'); // 或使用专门的滑出音效
  }, [isOpen, playSfx]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 1. 点击外部遮罩关闭 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[4000]"
          />

          {/* 2. 侧边栏主体 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full md:w-96 bg-[#111] border-l-4 border-cyan-900 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] z-[4001] flex flex-col font-mono text-cyan-500 overflow-hidden"
          >
            {/* 顶部标题栏 */}
            <div className="p-4 border-b border-cyan-800 bg-cyan-950/30 flex justify-between items-center select-none">
              <div>
                <h2 className="text-xl font-bold tracking-widest text-cyan-100">ASSET_MANIFEST</h2>
                <div className="text-[10px] opacity-60">ID: USER_8841 // STORAGE</div>
              </div>
              <button 
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center border border-cyan-700 hover:bg-cyan-800 text-cyan-100 transition-colors"
              >
                X
              </button>
            </div>

            {/* 装饰性背景 */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('/assets/textures/dither-pattern.png')]" />

            {/* 物品列表区域 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative z-10">
              {myItems.length === 0 ? (
                // 空状态
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                  <div className="text-6xl">∅</div>
                  <p>NO ASSETS FOUND</p>
                  <p className="text-xs max-w-[200px]">
                    "你的口袋比你的脸还干净。这很符合你现在的社会阶级。"
                  </p>
                </div>
              ) : (
                // 物品列表
                myItems.map((item, index) => (
                  <div 
                    key={`${item!.id}-${index}`} 
                    className="border border-cyan-900/50 bg-black/40 p-3 hover:bg-cyan-900/10 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-cyan-200 group-hover:text-white transition-colors">
                        {item!.name}
                      </span>
                      <span className="text-[10px] border border-cyan-800 px-1 text-cyan-600">
                        {item!.tags[0]}
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                      {/* 物品图标 (如果有) */}
                      <div className="w-12 h-12 bg-black border border-cyan-900 flex-shrink-0 flex items-center justify-center overflow-hidden">
                         <img 
                           src={`/assets/items/${item!.id}.png`} 
                           alt={item!.name} 
                           className="w-full h-full object-cover grayscale opacity-70"
                           onError={(e) => (e.currentTarget.style.display = 'none')} 
                         />
                      </div>
                      
                      {/* 描述 */}
                      <div className="text-xs text-cyan-600/80 leading-tight italic">
                        {item!.flavorText}
                      </div>
                    </div>

                    {/* 效果展示 (Debug style) */}
                    <div className="mt-2 pt-2 border-t border-dashed border-cyan-900/50 flex gap-3 text-[10px] text-gray-500 font-sans">
                       {/* ✅ 修复: item 已经被断言存在，无需非空断言 ! */}
                       {item.effects.hp !== 0 && <span>HP: {item.effects.hp && item.effects.hp > 0 ? '+' : ''}{item.effects.hp}</span>}
                       {item.effects.san !== 0 && <span>SAN: {item.effects.san && item.effects.san > 0 ? '+' : ''}{item.effects.san}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 底部状态栏 */}
            <div className="p-2 border-t border-cyan-900 bg-black text-[10px] text-center text-cyan-800">
              TOTAL ITEMS: {myItems.length} // CAPACITY: UNLIMITED
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};