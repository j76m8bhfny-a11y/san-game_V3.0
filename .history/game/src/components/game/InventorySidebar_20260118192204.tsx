import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Item } from '@/types/schema';
// 💡 引入源数据以获取完整的物品信息，避免使用 shopItems() 导致背包物品因没钱而被过滤
import itemsData from '@/assets/data/items.json'; 

// 子组件：防错图片
const InventoryIcon = ({ id, name }: { id: string, name: string }) => {
  const [error, setError] = useState(false);
  
  // 根据 ID 生成确定性颜色，提升缺少图片时的视觉体验
  const getBgColor = (id: string) => {
    const colors = ['bg-cyan-900', 'bg-blue-900', 'bg-purple-900', 'bg-teal-900'];
    const index = id.charCodeAt(id.length - 1) % colors.length;
    return colors[index];
  };

  return (
    <div className={`w-12 h-12 border border-cyan-900/50 flex-shrink-0 flex items-center justify-center overflow-hidden relative ${getBgColor(id)}/20`}>
      {!error ? (
        <img 
          src={`/assets/items/${id}.png`} 
          alt={name} 
          className="w-full h-full object-cover grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-cyan-700/50 text-xs font-bold font-mono">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export const InventorySidebar: React.FC = () => {
  // 使用解构获取 Store 状态，更加清晰
  const { 
    isInventoryOpen: isOpen, 
    setInventoryOpen: setOpen, 
    inventory: inventoryIds 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  // 🛠️ 修正逻辑：
  // 1. 不再使用 shopItems()，因为它会过滤掉买不起的物品。
  // 2. 直接使用导入的 itemsData (需断言为 Item[]) 来查找，确保拥有即显示。
  const allItemsList = itemsData as unknown as Item[];

  const myItems: Item[] = inventoryIds
    .map(id => allItemsList.find((i: Item) => i.id === id)) // 显式声明 i 的类型
    .filter((item): item is Item => !!item);

  useEffect(() => {
    if (isOpen) playSfx('sfx_hover');
  }, [isOpen, playSfx]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[4000]"
          />

          {/* 侧边栏面板 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full md:w-96 bg-[#0a0a0a] border-l border-cyan-900/50 shadow-[-20px_0_50px_rgba(0,0,0,0.9)] z-[4001] flex flex-col font-mono text-cyan-500 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-cyan-900/30 bg-cyan-950/10 flex justify-between items-center select-none shrink-0 relative overflow-hidden">
              {/* 装饰性扫描线 */}
              <div className="absolute inset-0 bg-[url('/assets/textures/scanline.png')] opacity-10 pointer-events-none" />
              
              <div className="relative z-10">
                <h2 className="text-xl font-bold tracking-widest text-cyan-100 flex items-center gap-2">
                  <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                  ASSET_MANIFEST
                </h2>
                <div className="text-[10px] text-cyan-700 mt-1">ID: USER_8841 // STORAGE_UNIT_01</div>
              </div>
              <button 
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center border border-cyan-900/50 text-cyan-700 hover:bg-cyan-900/20 hover:text-cyan-100 transition-all rounded-sm"
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative z-10">
              {myItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4 select-none">
                  <div className="text-6xl font-thin tracking-tighter">∅</div>
                  <p className="text-xs tracking-widest">NO ASSETS FOUND</p>
                </div>
              ) : (
                myItems.map((item, index) => (
                  <div 
                    key={`${item.id}-${index}`} 
                    className="border border-cyan-900/30 bg-black/40 p-3 hover:bg-cyan-900/10 hover:border-cyan-500/30 transition-all duration-200 group relative overflow-hidden"
                  >
                    {/* Hover Highlight */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/0 group-hover:bg-cyan-500 transition-all duration-200" />

                    <div className="flex justify-between items-start mb-2 pl-2">
                      <span className="font-bold text-cyan-200/80 group-hover:text-cyan-100 transition-colors text-sm">
                        {item.name}
                      </span>
                      <span className="text-[9px] border border-cyan-900/50 px-1.5 py-0.5 text-cyan-700 group-hover:text-cyan-400 bg-cyan-950/20">
                        {item.tags[0]}
                      </span>
                    </div>
                    
                    <div className="flex gap-3 pl-2">
                      <InventoryIcon id={item.id} name={item.name} />
                      <div className="text-xs text-cyan-600/60 leading-tight italic group-hover:text-cyan-500/80 transition-colors pt-1">
                        {item.flavorText}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Status */}
            <div className="p-2 border-t border-cyan-900/30 bg-black text-[10px] text-cyan-800 flex justify-between uppercase">
               <span>Capacity: UNLIMITED</span>
               <span>Count: {myItems.length}</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};