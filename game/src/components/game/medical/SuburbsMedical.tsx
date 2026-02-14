import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import { SuburbsClinicExterior } from './components/SuburbsClinicExterior';
import { SuburbsClinicInterior } from './components/SuburbsClinicInterior';
import { RegionID } from '@/types/schema';

interface Props {
  onClose: () => void;
}

export const SuburbsMedical: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { 
    gameDataCache, 
    vitality, 
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();
  const { t } = useI18n();

  const services = gameDataCache?.regions?.find(r => r.id === RegionID.Suburbs)?.hospitalTheme?.services 
    || [];

  const handleEnter = () => {
    playSfx('sfx_click'); // 商店迎客铃
    setHasEntered(true);
  };

  const handleBuy = (_serviceId: string) => {
    playSfx('sfx_click'); // 扫码声
    addNotification(t('hospital.notification.suburbs'), 'HP');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-5xl aspect-video bg-white shadow-2xl overflow-hidden border-4 border-gray-100 relative rounded-xl"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <SuburbsClinicInterior 
            services={services}
            gold={vitality.metrics.gold}
            onBuy={handleBuy}
            onClose={onClose}
          />
        ) : (
          <SuburbsClinicExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};