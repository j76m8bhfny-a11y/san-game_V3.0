import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { FaithID, Item } from '@/types/schema';
import { SlumsOffering } from './SlumsOffering';
import { placeholderBackgrounds, placeholderIcons } from '../utils/placeholderAssets';

interface Props {
  onClose: () => void;
}

export const SlumsShrineInterior: React.FC<Props> = ({ onClose }) => {
  const { faith, inventory, gameDataCache, performFaithRite, updatePlayerStats, modifyStats, addNotification } = useGameStore();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [ratVisible, setRatVisible] = useState(false);

  // 判断是否为主场 (血肉神教)
  const isNative = faith.id === FaithID.CULT;

  // 构建物品列表 (仅主场模式需要)
  const playerItems = useMemo(() => {
    if (!isNative || !gameDataCache?.items) return [];
    return inventory
      .map(id => gameDataCache.items.find(item => item.id === id))
      .filter((item): item is Item => !!item);
  }, [inventory, gameDataCache, isNative]);

  // 去重物品用于显示
  const uniqueItems = useMemo(() => {
    const seen = new Set<string>();
    return playerItems.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [playerItems]);

  const itemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    playerItems.forEach(item => counts.set(item.id, (counts.get(item.id) || 0) + 1));
    return counts;
  }, [playerItems]);

  // 处理通用仪式 (客场模式)
  const handleGenericRite = () => {
    setIsAnimating(true);
    setTimeout(() => {
      performFaithRite(); // 调用 Slice 中的通用仪式逻辑
      setIsAnimating(false);
    }, 1500);
  };

  // 处理物品献祭 (主场模式)
  const handleSacrifice = () => {
    if (!selectedItemId) return;
    setIsAnimating(true);
    setTimeout(() => setRatVisible(true), 500);
    setTimeout(() => {
      // 移除物品逻辑
      const index = inventory.indexOf(selectedItemId);
      if (index > -1) {
        const newInventory = [...inventory];
        newInventory.splice(index, 1);
        updatePlayerStats({ inventory: newInventory });
        
        // 简单回馈 (具体数值应读取规则，这里简化演示)
        modifyStats({ gold: 50, san: -2 }); 
        addNotification("血肉神教接受了你的供品。", "success");
      }
      setRatVisible(false);
      setIsAnimating(false);
      setSelectedItemId(null);
    }, 1500);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-black">
      {/* 1. 背景 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ background: placeholderBackgrounds.slums_shrine_interior }}
      >
        <div className="absolute inset-0 bg-black/50 radial-vignette" />
      </div>

      {/* 2. 核心交互区 */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        
        {/* 祭坛显示 */}
        <div className={`
          relative w-64 h-64 border-4 border-dashed rounded-full flex items-center justify-center transition-all duration-500
          ${selectedItemId ? 'border-red-500/50 bg-red-900/20' : 'border-white/10'}
          ${isAnimating ? 'scale-90 opacity-50' : ''}
        `}>
          {/* 默认图标 */}
          {!selectedItemId && !isAnimating && (
            <div className="text-[100px] opacity-60 drop-shadow-2xl grayscale">
              {isNative ? placeholderIcons.broken_statue : '🧘'}
            </div>
          )}
          
          {/* 选中物品展示 */}
          {selectedItemId && (
            <div className="text-6xl animate-bounce-slow filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
               📦
            </div>
          )}

          {/* 动画特效 */}
          {ratVisible && <div className="absolute text-[120px] animate-slide-out-right z-20">{placeholderIcons.rat}</div>}
        </div>

        {/* 操作按钮 */}
        {isNative ? (
          <button
            onClick={handleSacrifice}
            disabled={!selectedItemId || isAnimating}
            className="bg-red-900/80 text-red-100 font-marker text-xl px-8 py-2 border border-red-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-800 transition-colors"
          >
            {isAnimating ? "SACRIFICING..." : selectedItemId ? "OFFER FLESH" : "SELECT ITEM"}
          </button>
        ) : (
          <div className="text-center">
            <h3 className="text-gray-400 text-xs font-mono mb-2">WRONG GOD, RIGHT PLACE</h3>
            <button
              onClick={handleGenericRite}
              disabled={isAnimating}
              className="bg-gray-800 text-white font-mono text-sm px-6 py-3 border border-gray-600 hover:bg-gray-700 hover:border-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              {isAnimating ? "MEDITATING..." : "PERFORM RITE"}
            </button>
          </div>
        )}
      </div>

      {/* 3. 底部物品栏 (仅主场显示) */}
      {isNative && (
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent p-6 z-20">
          <div className="flex justify-center gap-4 overflow-x-auto pb-4 px-8">
             {uniqueItems.length === 0 && <div className="text-gray-600 font-mono text-xs">Inventory Empty</div>}
             {uniqueItems.map(item => (
                <SlumsOffering
                  key={item.id}
                  item={item}
                  count={itemCounts.get(item.id) || 1}
                  isSelected={selectedItemId === item.id}
                  onClick={() => !isAnimating && setSelectedItemId(item.id === selectedItemId ? null : item.id)}
                />
             ))}
          </div>
        </div>
      )}

      {/* 退出按钮 */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-gray-500 hover:text-white text-xs font-mono border border-transparent hover:border-gray-500 px-3 py-1 rounded"
      >
        [LEAVE]
      </button>
    </div>
  );
};