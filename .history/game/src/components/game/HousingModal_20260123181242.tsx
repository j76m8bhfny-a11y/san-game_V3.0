import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Housing } from '@/types/schema';

interface HousingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HousingModal: React.FC<HousingModalProps> = ({ isOpen, onClose }) => {
  const { 
    gameDataCache, 
    currentRegion, 
    activeHousing, 
    gold,
    setHousing,
    updatePlayerStats,
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  if (!isOpen || !gameDataCache) return null;

  // 1. 筛选当前区域的房源
  const availableHousing = (gameDataCache.housing || []).filter(
    (h: Housing) => h.region === currentRegion
  );

  const handleTransaction = (house: Housing) => {
    // 检查资金 (针对首付/购买价格)
    if (gold < house.price) {
      playSfx('sfx_deny');
      addNotification("资金不足，无法支付首付/全款", 'error');
      return;
    }

    playSfx('sfx_cash');
    
    // 扣除首付
    updatePlayerStats({ gold: gold - house.price });
    
    // 设置新房产
    setHousing(house);
    
    addNotification(
      house.type === 'RENT' 
        ? `签约成功: ${house.name} (日租 $${house.dailyCost})` 
        : `购房成功: ${house.name}`, 
      'success'
    );
    onClose();
  };

  const handleMoveOut = () => {
    playSfx('sfx_click');
    setHousing(null);
    addNotification("已搬离住所，恢复流浪状态", 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-4xl bg-[#1a1a1a] border border-gray-700 shadow-2xl overflow-hidden flex flex-col font-mono text-white relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-[#111] flex justify-between items-center">
          <div>
            <div className="text-xs text-green-500 font-bold tracking-widest mb-1">REGION: {currentRegion}</div>
            <h2 className="text-2xl font-black font-pixel text-white">REAL ESTATE</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">[ ESC ]</button>
        </div>

        {/* List */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {availableHousing.length === 0 ? (
            <div className="col-span-2 text-center py-10 text-gray-500">
              本区域暂无房源。
            </div>
          ) : (
            availableHousing.map((house: Housing) => {
              const isCurrent = activeHousing?.id === house.id;
              const isAffordable = gold >= house.price;

              return (
                <div 
                  key={house.id} 
                  className={`
                    relative p-5 border-2 transition-all group flex flex-col justify-between min-h-[200px]
                    ${isCurrent ? 'border-green-500 bg-green-900/10' : 'border-gray-700 bg-[#222] hover:border-gray-500'}
                  `}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-lg font-bold ${isCurrent ? 'text-green-400' : 'text-white'}`}>
                        {house.name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${house.type === 'OWN' ? 'bg-amber-900/40 text-amber-500' : 'bg-blue-900/40 text-blue-400'}`}>
                        {house.type === 'OWN' ? '出售' : '租赁'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 mb-4 h-10 line-clamp-2">
                      {house.description}
                    </p>

                    <div className="space-y-1 text-sm font-mono mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-500">首付/全款:</span>
                        <span className={isAffordable ? 'text-white' : 'text-red-500'}>${house.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">每日开销:</span>
                        <span className="text-amber-400">-${house.dailyCost}/Day</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">防御等级:</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-3 h-3 rounded-sm ${i < house.defenseLevel ? 'bg-green-500' : 'bg-gray-700'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto">
                    {isCurrent ? (
                      <button 
                        onClick={handleMoveOut}
                        className="w-full py-2 bg-red-900/20 text-red-500 border border-red-900 hover:bg-red-900/40 text-sm font-bold tracking-wider"
                      >
                        MOVE OUT (搬离)
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleTransaction(house)}
                        disabled={!isAffordable}
                        className={`
                          w-full py-2 text-sm font-bold tracking-wider transition-all
                          ${isAffordable 
                            ? 'bg-green-600 text-black hover:bg-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'}
                        `}
                      >
                        {house.type === 'RENT' ? 'SIGN LEASE' : 'PURCHASE'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};