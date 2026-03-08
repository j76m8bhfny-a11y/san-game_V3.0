import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import { RegionID } from '@/types/schema';
import { useThrottle } from '@/hooks/useThrottle';
import { RustBeltExterior } from './components/RustBeltExterior';
import { RustBeltInterior } from './components/RustBeltInterior';

interface Props {
  onClose: () => void;
}

export const RustBeltHousing: React.FC<Props> = ({ onClose }) => {
  const { t } = useI18n();
  const { 
    gameDataCache, 
    activeHousing, 
    vitality, 
    rentHousing, 
    moveOut,
    modifyStats,
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  const houseData = gameDataCache?.housing?.find(h => h.region === RegionID.RustBelt);
  
  if (!houseData) return <div className="text-white p-4">{t('housing.error')}</div>;

  const isRentingThis = activeHousing?.definitionId === houseData.id;

  // 处理动作（添加节流防止重复操作）
  const [throttledRent] = useThrottle(() => {
    const result = rentHousing(houseData.id);
    if (result.success) {
      playSfx('sfx_keys_jingle'); // 钥匙声
      addNotification(t('housing.moveIn'), 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
  }, { delay: 500 });

  const [throttledMoveOut] = useThrottle(() => {
    playSfx('sfx_click');
    const result = moveOut();
    if (result.success) {
      addNotification(t('housing.moveOut'), 'info');
    }
  }, { delay: 500 });

  const handleRent = () => throttledRent();
  const handleMoveOut = () => throttledMoveOut();

  const handleSleep = () => {
    playSfx('sfx_neon_hum'); // 或者是空调噪音
    const restoreAmount = activeHousing?.regenHp || 0;
    const newHp = Math.min(vitality.metrics.maxHp, vitality.metrics.hp + restoreAmount);
    modifyStats({ hp: newHp });
    addNotification(`${t('housing.rest')} HP +${restoreAmount}`, 'HP');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-solid-dark" onClick={onClose}>
      <div 
        className="w-full max-w-5xl aspect-video bg-[#0f172a] shadow-pixel overflow-hidden border-8 border-[#1e293b] relative"
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