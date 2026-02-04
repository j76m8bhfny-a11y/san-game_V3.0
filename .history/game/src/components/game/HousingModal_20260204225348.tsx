import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Housing } from '@/types/schema';
import { AlertCircle, Home, Key, Shield } from 'lucide-react';
import housingRules from '@/assets/data/rules/housingRules.json';

interface HousingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HousingModal: React.FC<HousingModalProps> = ({ isOpen, onClose }) => {
  const { 
    gameDataCache, 
    currentRegion, 
    activeHousing, 
    vitality,
    rentHousing, // ✅ 使用 Slice Action
    buyHousing,  // ✅ 使用 Slice Action
    addNotification,
    setHousing // 仅用于搬离 (handleMoveOut)
  } = useGameStore();
  
  const gold = vitality.metrics.gold;

  const { playSfx } = useAudioStore();

  if (!isOpen || !gameDataCache) return null;

  // 筛选当前区域的房源
  const availableHousing = (gameDataCache.housing || []).filter(
    (h: Housing) => h.region === currentRegion
  );

  // 处理签约/购买
  const handleAction = (house: Housing, mode: 'RENT' | 'BUY') => {
    let result;
    if (mode === 'RENT') {
      result = rentHousing(house.id);
    } else {
      result = buyHousing(house.id);
    }

    if (result.success) {
      playSfx('sfx_cash');
      addNotification(result.message, 'success');
      onClose();
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
  };

  const handleMoveOut = () => {
    playSfx('sfx_click');
    setHousing(housingRules.eviction.fallbackState as any);
    addNotification("已搬离住所，恢复流浪状态", 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-5xl bg-[#1a1a1a] border border-gray-700 shadow-2xl overflow-hidden flex flex-col font-mono text-white relative max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-[#111] flex justify-between items-center shrink-0">
          <div>
            <div className="text-xs text-green-500 font-bold tracking-widest mb-1 uppercase">Region: {currentRegion}</div>
            <h2 className="text-2xl font-black font-pixel text-white flex items-center gap-2">
              <Home className="mb-1" /> REAL ESTATE
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white px-3 py-1 border border-transparent hover:border-gray-500 transition-all">[ ESC ]</button>
        </div>

        {/* List */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto custom-scrollbar">
          {availableHousing.length === 0 ? (
            <div className="col-span-2 text-center py-20 text-gray-500 flex flex-col items-center">
              <AlertCircle size={48} className="mb-4 opacity-50"/>
              <p>本区域暂无房源。</p>
            </div>
          ) : (
            availableHousing.map((house: Housing) => {
              // 判断当前是否住在这里
              const isCurrent = activeHousing?.definitionId === house.id;

              // 提取配置 (优先判断是否拥有买/租配置)
              const rentConfig = house.rentConfig;
              const buyConfig = house.buyConfig;

              // 计算显示用的数值
              let weeklyCost = 0;
              let upfrontCost = 0;
              let modeLabel = '';
              let canAfford = false;

              // 显示逻辑：如果既能租也能买，这里简单起见，优先显示“买”如果它是主要属性，或者并在 UI 里显示两个按钮。
              // 为了简化 UI 复杂度，我们假设数据表里一个条目要么主要是租，要么主要是卖。
              // 或者我们在这里分别渲染。
              
              // 临时逻辑：如果由 buyConfig 则显示购买信息，否则显示租赁信息
              const isSale = !!buyConfig;
              
              if (isSale && buyConfig) {
                modeLabel = '出售 (FOR SALE)';
                weeklyCost = buyConfig.weeklyCosts.reduce((s, c) => s + c.baseAmount, 0); // 物业费等
                // 虽然暂时可能还要保留计算，但建议加上 TODO 或检查配置开关
                let estimatedMortgage = 0;
                if (housingRules.mortgage.displayEstimation.includeInterest) {
                  // 这里暂时保留计算公式，但理想情况下应该调用 BankSystem 的 helper 方法
                    estimatedMortgage = Math.floor((buyConfig.price * (1-buyConfig.downPaymentRate)) * buyConfig.interestRate);
                }
                weeklyCost += estimatedMortgage; 
                
                upfrontCost = buyConfig.price * buyConfig.downPaymentRate;
                canAfford = gold >= upfrontCost;
              } else if (rentConfig) {
                modeLabel = '租赁 (FOR RENT)';
                weeklyCost = rentConfig.weeklyCosts.reduce((s, c) => s + c.baseAmount, 0);
                upfrontCost = rentConfig.deposit + weeklyCost; // 押金 + 首周
                canAfford = gold >= upfrontCost;
              }

              return (
                <div 
                  key={house.id} 
                  className={`
                    relative p-5 border-2 transition-all group flex flex-col justify-between min-h-[220px]
                    ${isCurrent ? 'border-green-500 bg-green-900/10' : 'border-gray-700 bg-[#222] hover:border-gray-500'}
                  `}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-lg font-bold flex items-center gap-2 ${isCurrent ? 'text-green-400' : 'text-white'}`}>
                        {house.name}
                        {isCurrent && <span className="text-xs bg-green-600 text-black px-2 py-0.5 rounded-full">CURRENT</span>}
                      </h3>
                      <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-wider ${isSale ? 'bg-amber-900/40 text-amber-500' : 'bg-blue-900/40 text-blue-400'}`}>
                        {modeLabel}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 mb-4 h-10 line-clamp-2 leading-relaxed">
                      {house.description}
                    </p>

                    <div className="space-y-2 text-sm font-mono mb-4 bg-black/20 p-3 rounded">
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                        <span className="text-gray-500 flex items-center gap-2">
                           <Key size={14}/> {isSale ? '首付 (Down Pmt)' : '首付 (Deposit+1st)'}
                        </span>
                        <span className={canAfford ? 'text-white font-bold' : 'text-red-500 font-bold'}>
                          ${upfrontCost.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                        <span className="text-gray-500">周开销 (Weekly)</span>
                        <span className="text-amber-400">
                          ${weeklyCost.toLocaleString()}/wk
                          {isSale && <span className="text-[10px] text-gray-600 ml-1">(含预估房贷)</span>}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Shield size={14}/> 防御等级
                        </span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-2 h-3 rounded-sm ${i < house.defenseLevel ? 'bg-green-500' : 'bg-gray-800'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto grid grid-cols-1 gap-2">
                    {isCurrent ? (
                      <button 
                        onClick={handleMoveOut}
                        className="w-full py-3 bg-red-900/20 text-red-500 border border-red-900 hover:bg-red-900/40 text-sm font-bold tracking-wider flex items-center justify-center gap-2"
                      >
                        搬离 (MOVE OUT)
                      </button>
                    ) : (
                      <>
                        {/* 如果是租赁房源 */}
                        {!isSale && rentConfig && (
                          <button 
                            onClick={() => handleAction(house, 'RENT')}
                            disabled={!canAfford}
                            className={`
                              w-full py-3 text-sm font-bold tracking-wider transition-all flex items-center justify-center gap-2
                              ${canAfford 
                                ? 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'}
                            `}
                          >
                            签约租赁 (SIGN LEASE)
                          </button>
                        )}
                        
                        {/* 如果是出售房源 */}
                        {isSale && buyConfig && (
                          <button 
                            onClick={() => handleAction(house, 'BUY')}
                            disabled={!canAfford}
                            className={`
                              w-full py-3 text-sm font-bold tracking-wider transition-all flex items-center justify-center gap-2
                              ${canAfford 
                                ? 'bg-amber-600 text-black hover:bg-amber-500 hover:shadow-[0_0_15px_rgba(217,119,6,0.4)]' 
                                : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'}
                            `}
                          >
                            购买房产 (PURCHASE)
                          </button>
                        )}
                      </>
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