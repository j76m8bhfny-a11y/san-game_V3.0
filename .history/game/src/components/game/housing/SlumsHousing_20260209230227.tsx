import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { RegionID } from '@/types/schema';
import { SlumsExterior } from './components/SlumsExterior';
import { SlumsInterior } from './components/SlumsInterior';

interface Props {
  onClose: () => void;
}

export const SlumsHousing: React.FC<Props> = ({ onClose }) => {
  const { 
    gameDataCache, 
    activeHousing, 
    vitality, 
    rentHousing, 
    moveOut,
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  // 1. 获取贫民窟的房源数据 (假设只有一个默认的 Tent)
  const slumsHouse = gameDataCache?.housing?.find(h => h.region === RegionID.Slums);
  
  if (!slumsHouse) return <div className="text-white">Data Error: No housing found for Slums.</div>;

  // 2. 判断当前是否已拥有此房源
  const isRentingThis = activeHousing?.definitionId === slumsHouse.id;

  // 3. 处理动作
  const handleRent = () => {
    const result = rentHousing(slumsHouse.id);
    if (result.success) {
      playSfx('sfx_fabric_heavy'); // 播放搭建帐篷的声音
      addNotification(result.message, 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
  };

  const handleMoveOut = () => {
    // 增加确认步骤或直接拆除
    playSfx('sfx_trash');
    const result = moveOut();
    if (result.success) {
      addNotification('You tore down your camp.', 'info');
    }
  };

  const handleSleep = () => {
    // 这里触发“睡觉/跳过回合”逻辑
    // 暂时先只播放音效并关闭，逻辑由后续 RestSystem 处理
    playSfx('sfx_snore'); 
    addNotification('You rested for a while. HP restored.', 'HP');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-4xl aspect-video bg-[#111] shadow-2xl overflow-hidden border-4 border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {isRentingThis ? (
          <SlumsInterior 
            housing={activeHousing!}
            onSleep={handleSleep}
            onMoveOut={handleMoveOut}
            onClose={onClose}
          />
        ) : (
          <SlumsExterior 
            house={slumsHouse}
            gold={vitality.metrics.gold}
            onRent={handleRent}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};