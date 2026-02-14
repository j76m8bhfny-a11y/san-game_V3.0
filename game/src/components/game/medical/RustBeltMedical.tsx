import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import { RustBeltClinicExterior } from './components/RustBeltClinicExterior';
import { RustBeltClinicInterior } from './components/RustBeltClinicInterior';
import { RegionID } from '@/types/schema';

interface Props {
  onClose: () => void;
}

export const RustBeltMedical: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { 
    gameDataCache, 
    vitality, 
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();
  const { t } = useI18n();

  const services = gameDataCache?.regions?.find(r => r.id === RegionID.RustBelt)?.hospitalTheme?.services 
    || [];

  const handleEnter = () => {
    playSfx('sfx_click'); // 自动门声音
    setHasEntered(true);
  };

  const handleBuy = (_serviceId: string) => {
    playSfx('sfx_click'); // 打印机/收银机声
    addNotification(t('hospital.notification.rustbelt'), 'HP');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-5xl aspect-video bg-[#0f172a] shadow-2xl overflow-hidden border-4 border-[#1e293b] relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <RustBeltClinicInterior 
            services={services}
            gold={vitality.metrics.gold}
            onBuy={handleBuy}
            onClose={onClose}
          />
        ) : (
          <RustBeltClinicExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};