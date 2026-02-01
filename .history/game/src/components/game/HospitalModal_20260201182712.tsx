import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { Insurance, Item } from '@/types/schema';

interface HospitalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HospitalModal: React.FC<HospitalModalProps> = ({ isOpen, onClose }) => {
  const { 
    gameDataCache, 
    currentRegion, 
    activeInsurance, 
    gold,
    setInsurance,
    buyItem,
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();
  const [tab, setTab] = useState<'TREATMENT' | 'INSURANCE'>('TREATMENT');

  if (!isOpen || !gameDataCache) return null;

  // 筛选当前区域的医疗物品 (假设 ID 以 'M' 开头或有 MEDICAL 标签)
  // 为了简化，这里展示当前区域的所有物品，但 UI 上区分
  const medicalItems = (gameDataCache.items || []).filter(
    (item: Item) => item.region === currentRegion && (item.tags.includes('MEDICAL') || item.id.includes('M'))
  );

  const availableInsurance = gameDataCache.insurance || [];

  const handleSubscribe = (plan: Insurance) => {
    playSfx('sfx_paper');
    setInsurance(plan);
    addNotification(`已签署医保: ${plan.name}`, 'success');
  };

  const handleCancel = () => {
    playSfx('sfx_click');
    setInsurance(null);
    addNotification("已取消医保订阅", 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-4xl bg-[#1a1a1a] border border-gray-700 shadow-2xl overflow-hidden flex flex-col font-mono text-white relative h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-[#111] flex justify-between items-center shrink-0">
          <div>
            <div className="text-xs text-red-500 font-bold tracking-widest mb-1">REGION: {currentRegion}</div>
            <h2 className="text-2xl font-black font-pixel text-white">MEDICAL CENTER</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">[ ESC ]</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 shrink-0">
          <button 
            onClick={() => setTab('TREATMENT')}
            className={`flex-1 py-4 text-center font-bold tracking-widest transition-colors ${tab === 'TREATMENT' ? 'bg-red-900/20 text-red-500' : 'text-gray-500 hover:bg-[#222]'}`}
          >
            TREATMENT
          </button>
          <button 
            onClick={() => setTab('INSURANCE')}
            className={`flex-1 py-4 text-center font-bold tracking-widest transition-colors ${tab === 'INSURANCE' ? 'bg-blue-900/20 text-blue-500' : 'text-gray-500 hover:bg-[#222]'}`}
          >
            INSURANCE
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          {/* --- 治疗服务 --- */}
          {tab === 'TREATMENT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicalItems.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-gray-500">
                  本区域暂无医疗服务。
                </div>
              ) : (
                medicalItems.map((item: Item) => (
                  <div key={item.id} className="p-4 border border-gray-700 bg-[#222] flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-white">{item.name}</h3>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.flavorText}</p>
                      <div className="flex gap-2 mt-2">
                         {item.effects.hp > 0 && <span className="text-green-500 text-xs">HP +{item.effects.hp}</span>}
                         {item.effects.san > 0 && <span className="text-purple-500 text-xs">SAN +{item.effects.san}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        playSfx('sfx_cash');
                        buyItem(item.id);
                      }}
                      disabled={gold < item.price}
                      className={`
                        px-4 py-2 text-sm font-bold rounded
                        ${gold >= item.price ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
                      `}
                    >
                      ${item.price}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* --- 医保订阅 --- */}
          {tab === 'INSURANCE' && (
             <div className="space-y-4">
               {availableInsurance.map((plan: Insurance) => {
                 const isSubscribed = activeInsurance?.id === plan.id;
                 return (
                   <div 
                    key={plan.id}
                    className={`
                      p-6 border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all
                      ${isSubscribed ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 bg-[#222]'}
                    `}
                   >
                     <div>
                       <div className="flex items-center gap-3 mb-2">
                         <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                         {isSubscribed && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">CURRENT</span>}
                       </div>
                       <p className="text-gray-400 mb-2">{plan.description}</p>
                       <div className="text-blue-400 font-bold">
                         日费: ${plan.weeklyCost}
                       </div>
                     </div>

                     {isSubscribed ? (
                       <button 
                         onClick={handleCancel}
                         className="px-6 py-3 border border-red-500 text-red-500 font-bold hover:bg-red-900/20"
                       >
                         CANCEL
                       </button>
                     ) : (
                       <button 
                         onClick={() => handleSubscribe(plan)}
                         className="px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-900/20"
                       >
                         SUBSCRIBE
                       </button>
                     )}
                   </div>
                 );
               })}
             </div>
          )}

        </div>
      </div>
    </div>
  );
};