import React, { useState, useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { RegionID, NoviceActionType, Item } from '@/types/schema';
import { SlumsOffering } from './SlumsOffering';
import { placeholderBackgrounds, placeholderIcons } from '../utils/placeholderAssets';

interface Props {
  onClose: () => void;
}

export const SlumsShrineInterior: React.FC<Props> = ({ onClose }) => {
  const { faith, inventory, gameDataCache, performNoviceAction, performFaithRite, updatePlayerStats, modifyStats, addNotification, getFaithMode } = useGameStore();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [ratVisible, setRatVisible] = useState(false);

  const mode = getFaithMode(RegionID.Slums);

  // --- 物品逻辑 (仅 Native 模式用) ---
  const playerItems = useMemo(() => {
    if (mode !== 'NATIVE' || !gameDataCache?.items) return [];
    return inventory
      .map(id => gameDataCache.items.find(item => item.id === id))
      .filter((item): item is Item => !!item);
  }, [inventory, gameDataCache, mode]);

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

  // --- 动作处理 ---
  const handleSacrificeItem = () => {
    if (!selectedItemId) return;
    setIsAnimating(true);
    setTimeout(() => setRatVisible(true), 500);
    setTimeout(() => {
      const index = inventory.indexOf(selectedItemId);
      if (index > -1) {
        const newInventory = [...inventory];
        newInventory.splice(index, 1);
        updatePlayerStats({ inventory: newInventory });
        performFaithRite(); // 实际上应该根据物品算分，这里简化调用通用 Rite
      }
      setRatVisible(false);
      setIsAnimating(false);
      setSelectedItemId(null);
    }, 1500);
  };

  const handleNoviceAction = (type: NoviceActionType) => {
      performNoviceAction(type);
      if (type === NoviceActionType.REJECT) onClose();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-black">
      {/* 背景 */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ background: placeholderBackgrounds.slums_shrine_interior }}
      >
        <div className="absolute inset-0 bg-black/50 radial-vignette" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-xl">
        
        {/* === 祭坛视觉主体 === */}
        <div className={`
          relative w-64 h-64 border-4 border-dashed rounded-full flex items-center justify-center transition-all duration-500
          ${selectedItemId ? 'border-red-500/50 bg-red-900/20' : 'border-white/10'}
          ${isAnimating ? 'scale-90 opacity-50' : ''}
        `}>
          {!selectedItemId && !isAnimating && (
            <div className="text-[100px] opacity-60 drop-shadow-2xl grayscale">
              {mode === 'NATIVE' ? placeholderIcons.broken_statue : '🌑'}
            </div>
          )}
          
          {selectedItemId && (
            <div className="text-6xl animate-bounce-slow filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">📦</div>
          )}

          {ratVisible && <div className="absolute text-[120px] animate-slide-out-right z-20">{placeholderIcons.rat}</div>}
        </div>

        {/* === 分支交互区 === */}

        {/* 1. 新手模式：4 个操作按钮 */}
        {mode === 'NOVICE' && (
            <div className="grid grid-cols-2 gap-4 w-full px-8">
                <button 
                    onClick={() => handleNoviceAction(NoviceActionType.DEDICATE)}
                    className="bg-black/40 border border-white/20 p-3 hover:bg-orange-900/40 hover:border-orange-500 text-left transition-all"
                >
                    <div className="text-orange-400 font-bold text-xs">THROW COIN</div>
                    <div className="text-[9px] text-gray-500">-$50</div>
                </button>
                <button 
                    onClick={() => handleNoviceAction(NoviceActionType.AID)}
                    className="bg-black/40 border border-white/20 p-3 hover:bg-green-900/40 hover:border-green-500 text-left transition-all"
                >
                    <div className="text-green-400 font-bold text-xs">SHARE FOOD</div>
                    <div className="text-[9px] text-gray-500">-HP / +$</div>
                </button>
                <button 
                    onClick={() => handleNoviceAction(NoviceActionType.SACRIFICE)}
                    className="bg-black/40 border border-white/20 p-3 hover:bg-red-900/40 hover:border-red-500 text-left transition-all"
                >
                    <div className="text-red-400 font-bold text-xs">BLEED</div>
                    <div className="text-[9px] text-gray-500">-HP / ++$</div>
                </button>
                <button 
                    onClick={() => handleNoviceAction(NoviceActionType.REJECT)}
                    className="bg-black/40 border border-white/20 p-3 hover:bg-white/10 text-left transition-all"
                >
                    <div className="text-gray-400 font-bold text-xs">LEAVE</div>
                    <div className="text-[9px] text-gray-500">Just walk away</div>
                </button>
            </div>
        )}

        {/* 2. 主场模式：献祭按钮 */}
        {mode === 'NATIVE' && (
          <button
            onClick={handleSacrificeItem}
            disabled={!selectedItemId || isAnimating}
            className="bg-red-900/80 text-red-100 font-marker text-xl px-8 py-2 border border-red-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-800 transition-colors"
          >
            {isAnimating ? "SACRIFICING..." : selectedItemId ? "OFFER FLESH" : "SELECT ITEM BELOW"}
          </button>
        )}

        {/* 3. 客场模式：冥想按钮 */}
        {mode === 'GUEST' && (
            <button
              onClick={() => performFaithRite()}
              className="bg-gray-800 text-white font-mono text-sm px-6 py-3 border border-gray-600 hover:bg-gray-700 transition-all"
            >
              MEDITATE
            </button>
        )}
      </div>

      {/* 底部物品栏 (仅主场显示) */}
      {mode === 'NATIVE' && (
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