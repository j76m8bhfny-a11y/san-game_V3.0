import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { DowntownClinicExterior } from './components/DowntownClinicExterior';
import { DowntownClinicInterior } from './components/DowntownClinicInterior';
import { RegionID } from '@/types/schema';

interface Props {
  onClose: () => void;
}

export const DowntownMedical: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { 
    gameDataCache, 
    vitality, 
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  const services = gameDataCache?.regions?.find(r => r.id === RegionID.Downtown)?.hospitalTheme?.services 
    || [];

  const handleEnter = () => {
    playSfx('sfx_click'); // 科幻嗡嗡声
    setHasEntered(true);
  };

  const handleBuy = (_serviceId: string) => {
    playSfx('sfx_click'); // 液压注射声
    addNotification('Biological enhancement protocol complete.', 'HP');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl" onClick={onClose}>
      <div 
        className="w-full max-w-6xl aspect-video bg-[#020617] shadow-[0_0_50px_rgba(6,182,212,0.1)] overflow-hidden border border-cyan-900/30 relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <DowntownClinicInterior 
            services={services}
            gold={vitality.metrics.gold}
            onBuy={handleBuy}
            onClose={onClose}
          />
        ) : (
          <DowntownClinicExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};