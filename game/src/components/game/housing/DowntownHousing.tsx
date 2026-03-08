import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import { RegionID } from '@/types/schema';
import { useThrottle } from '@/hooks/useThrottle';
import { DowntownExterior } from './components/DowntownExterior';
import { DowntownInterior } from './components/DowntownInterior';

interface Props {
  onClose: () => void;
}

export const DowntownHousing: React.FC<Props> = ({ onClose }) => {
  const { t } = useI18n();
  const { 
    gameDataCache, 
    activeHousing, 
    vitality, 
    buyHousing, 
    moveOut,
    modifyStats,
    addNotification 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  const houseData = gameDataCache?.housing?.find(h => h.region === RegionID.Downtown);
  
  if (!houseData) return <div className="text-white p-4">{t('housing.error')}</div>;

  const isOwningThis = activeHousing?.definitionId === houseData.id;

  // 处理动作（添加节流防止重复操作）
  const [throttledBuy] = useThrottle(() => {
    const result = buyHousing(houseData.id);
    if (result.success) {
      playSfx('sfx_sci_fi_door'); // 高科技门声
      addNotification(result.message, 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
  }, { delay: 500 });

  const [throttledMoveOut] = useThrottle(() => {
    playSfx('sfx_click');
    const result = moveOut();
    if (result.success) {
      addNotification(result.message, 'info');
    }
  }, { delay: 500 });

  const handleBuy = () => throttledBuy();
  const handleMoveOut = () => throttledMoveOut();

  const handleSleep = () => {
    playSfx('sfx_ambient_drone'); // 低沉的氛围音
    const restoreAmount = activeHousing?.regenHp || 0;
    const newHp = Math.min(vitality.metrics.maxHp, vitality.metrics.hp + restoreAmount);
    modifyStats({ hp: newHp });
    addNotification(`${t('housing.rest')} HP +${restoreAmount}`, 'HP');
    onClose();
  };
  
  const handleDrink = () => {
    playSfx('sfx_glass_clink');
    addNotification(t('housing.relax'), 'info');
    // 氛围装饰交互，不实际修改数值
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-solid-dark" onClick={onClose}>
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