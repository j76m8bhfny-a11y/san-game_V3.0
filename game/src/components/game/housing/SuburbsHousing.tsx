import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { RegionID } from '@/types/schema';
import { SuburbsExterior } from './components/SuburbsExterior';
import { SuburbsInterior } from './components/SuburbsInterior';

interface Props {
  onClose: () => void;
}

export const SuburbsHousing: React.FC<Props> = ({ onClose }) => {
  const { 
    gameDataCache, 
    activeHousing, 
    vitality, 
    buyHousing, 
    rentHousing,
    moveOut,
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  const houseData = gameDataCache?.housing?.find(h => h.region === RegionID.Suburbs);
  
  if (!houseData) return <div className="text-white p-4">No housing data found.</div>;

  const isOwningThis = activeHousing?.definitionId === houseData.id;

  const handleBuy = () => {
    // 优先尝试购买，如果配置支持
    if (houseData.buyConfig) {
      const result = buyHousing(houseData.id);
      if (result.success) {
        playSfx('sfx_print_receipt'); // 打印合同声
        addNotification(result.message, 'success');
      } else {
        playSfx('sfx_deny');
        addNotification(result.message, 'error');
      }
    } else {
      // 否则尝试租赁
      const result = rentHousing(houseData.id);
      if (result.success) {
        playSfx('sfx_pen_scratch'); // 签字声
        addNotification(result.message, 'success');
      } else {
        playSfx('sfx_deny');
        addNotification(result.message, 'error');
      }
    }
  };

  const handleMoveOut = () => {
    playSfx('sfx_click');
    const result = moveOut();
    if (result.success) {
      addNotification(result.message, 'info');
    }
  };

  const handleRest = () => {
    playSfx('sfx_bird_chirp'); // 或者是轻音乐
    addNotification('You enjoyed a peaceful afternoon. SAN restored.', 'SAN');
    onClose();
  };
  
  const handlePayBills = () => {
    // 这里可以打开账单界面，或者直接扣款
    // 暂时简单处理：打开账单 Overlay (需要在 GameStore 里 setBillOpen)
    addNotification('Checking bills...', 'info');
    // useGameStore.getState().setBillOverlay(true); // 伪代码
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-5xl aspect-video bg-[#f3f4f6] shadow-2xl overflow-hidden border-8 border-white relative rounded-lg"
        onClick={e => e.stopPropagation()}
      >
        {isOwningThis ? (
          <SuburbsInterior 
            housing={activeHousing!}
            onRest={handleRest}
            onPayBills={handlePayBills}
            onMoveOut={handleMoveOut}
            onClose={onClose}
          />
        ) : (
          <SuburbsExterior 
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