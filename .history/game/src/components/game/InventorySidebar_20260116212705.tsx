import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Item } from '@/types/schema';

// 子组件：防错图片
const InventoryIcon = ({ id, name }: { id: string, name: string }) => {
  const [error, setError] = useState(false);
  return (
    <div className="w-12 h-12 bg-black border border-cyan-900 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
      {!error ? (
        <img 
          src={`/assets/items/${id}.png`} 
          alt={name} 
          className="w-full h-full object-cover grayscale opacity-70"
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-full h-full bg-cyan-900/20 flex items-center justify-center text-cyan-700 text-xs font-bold">
          {name[0]}
        </div>
      )}
    </div>
  );
};

export const InventorySidebar: React.FC = () => {
  const isOpen = useGameStore(s => s.isInventoryOpen);
  const setOpen = useGameStore(s => s.setInventoryOpen);
  const inventoryIds = useGameStore(s => s.inventory);
  const allItems = useGameStore(s => s.shopItems);
  const { playSfx } = useAudioStore();

  const myItems: Item[] = inventoryIds
    .map(id => allItems.find(i => i.id === id))
    .filter((item): item is Item => !!item);

  React.useEffect(() => {
    if (isOpen) playSfx('sfx_hover');
  }, [isOpen, playSfx]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[4000]"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full md:w-96 bg-[#111] border-l-4 border-cyan-900 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] z-[4001] flex flex-col font-mono text-cyan-500 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-cyan-800 bg-cyan-950/30 flex justify-between items-center select-none shrink-0">
              <div>
                <h2 className="text-xl font-bold tracking-widest text-cyan-100">ASSET_MANIFEST</h2>
                <div className="text-[10px] opacity-60">ID: USER_8841 // STORAGE</div>
              </div>
              <button 
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center border border-cyan-700 hover:bg-cyan-800 text-cyan-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative z-10">
              {myItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                  <div className="text-6xl grayscale">∅</div>
                  <p>NO ASSETS FOUND</p>
                </div>
              ) : (
                myItems.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="border border-cyan-900/50 bg-black/40 p-3 hover:bg-cyan-900/10 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-cyan-200 group-hover:text-white transition-colors">{item.name}</span>
                      <span className="text-[10px] border border-cyan-800 px-1 text-cyan-600">{item.tags[0]}</span>
                    </div>
                    
                    <div className="flex gap-3">
                      <InventoryIcon id={item.id} name={item.name} />
                      <div className="text-xs text-cyan-600/80 leading-tight italic">{item.flavorText}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};