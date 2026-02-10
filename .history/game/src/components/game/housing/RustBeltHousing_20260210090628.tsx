import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { RegionID } from '@/types/schema';
import { RustBeltExterior } from './components/RustBeltExterior';
import { RustBeltInterior } from './components/RustBeltInterior';

interface Props {
  onClose: () => void;
}

export const RustBeltHousing: React.FC<Props> = ({ onClose }) => {
  const { 
    gameDataCache, 
    activeHousing, 
    vitality, 
    rentHousing, 
    moveOut,
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  const houseData = gameDataCache?.housing?.find(h => h.region === RegionID.RustBelt);
  
  if (!houseData) return <div className="text-white p-4">No motel data found.</div>;

  const isRentingThis = activeHousing?.definitionId === houseData.id;

  const handleRent = () => {
    const result = rentHousing(houseData.id);
    if (result.success) {
      playSfx('sfx_keys_jingle'); // 钥匙声
      addNotification('Checked in to Room 204.', 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
  };

  const handleMoveOut = () => {
    playSfx('sfx_click');
    const result = moveOut();
    if (result.success) {
      addNotification('Checked out. Deposit returned.', 'info');
    }
  };

  const handleSleep = () => {
    playSfx('sfx_neon_hum'); // 或者是空调噪音
    addNotification('You slept through the highway noise. HP restored.', 'HP');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-5xl aspect-video bg-[#0f172a] shadow-2xl overflow-hidden border-8 border-[#1e293b] relative"
        onClick={e => e.stopPropagation()}
      >
        {isRentingThis ? (
          <RustBeltInterior 
            housing={activeHousing!}
            onSleep={handleSleep}
            onMoveOut={handleMoveOut}
            onClose={onClose}
          />
        ) : (
          <RustBeltExterior 
            house={houseData}
            gold={vitality.metrics.gold}
            onRent={handleRent}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};