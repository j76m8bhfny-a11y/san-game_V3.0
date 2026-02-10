import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { RegionID } from '@/types/schema';
import { DowntownExterior } from './components/DowntownExterior';
import { DowntownInterior } from './components/DowntownInterior';

interface Props {
  onClose: () => void;
}

export const DowntownHousing: React.FC<Props> = ({ onClose }) => {
  const { 
    gameDataCache, 
    activeHousing, 
    vitality, 
    buyHousing, 
    moveOut,
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  const houseData = gameDataCache?.housing?.find(h => h.region === RegionID.Downtown);
  
  if (!houseData) return <div className="text-white p-4">No penthouse data found.</div>;

  const isOwningThis = activeHousing?.definitionId === houseData.id;

  const handleBuy = () => {
    // 资本家通常只有购买选项
    const result = buyHousing(houseData.id);
    if (result.success) {
      playSfx('sfx_sci_fi_door'); // 高科技门声
      addNotification(result.message, 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
  };

  const handleMoveOut = () => {
    playSfx('sfx_click');
    const result = moveOut();
    if (result.success) {
      addNotification(result.message, 'info');
    }
  };

  const handleSleep = () => {
    playSfx('sfx_ambient_drone'); // 低沉的氛围音
    addNotification('Optimal rest cycle completed. All stats restored.', 'HP');
    onClose();
  };
  
  const handleDrink = () => {
    playSfx('sfx_glass_clink');
    addNotification('The vintage taste calms your nerves. SAN +10.', 'SAN');
    // 这里可以调用一个增加 SAN 的 action
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl" onClick={onClose}>
      <div 
        className="w-full max-w-6xl aspect-video bg-[#050505] shadow-[0_0_50px_rgba(255,255,255,0.1)] overflow-hidden border border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {isOwningThis ? (
          <DowntownInterior 
            housing={activeHousing!}
            onSleep={handleSleep}
            onDrink={handleDrink}
            onMoveOut={handleMoveOut}
            onClose={onClose}
          />
        ) : (
          <DowntownExterior 
            house={houseData}
            gold={vitality.metrics.gold}
            onBuy={handleBuy}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};