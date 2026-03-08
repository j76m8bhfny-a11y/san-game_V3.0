import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import { RegionID } from '@/types/schema';
import { useThrottle } from '@/hooks/useThrottle';

import { SlumsExterior } from './components/SlumsExterior';
import { SlumsInterior } from './components/SlumsInterior';

interface Props {
  onClose: () => void;
}

export const SlumsHousing: React.FC<Props> = ({ onClose }) => {
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

  // 获取贫民窟的房源数据
  const slumsHouse = gameDataCache?.housing?.find(h => h.region === RegionID.Slums);
  
  if (!slumsHouse) return <div className="text-white p-4">{t('housing.error')}</div>;

  // 判断当前是否已拥有此房源
  const isRentingThis = activeHousing?.definitionId === slumsHouse.id;

  // 处理动作（添加节流防止重复操作）
  const [throttledRent] = useThrottle(() => {
    const result = rentHousing(slumsHouse.id);
    if (result.success) {
      // 使用现有音效 'sfx_paper' 模拟搭建帐篷的声音
      playSfx('sfx_paper'); 
      addNotification(result.message, 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
  }, { delay: 500 });

  const [throttledMoveOut] = useThrottle(() => {
    // 使用现有音效 'sfx_paper' 模拟拆除
    playSfx('sfx_paper');
    const result = moveOut();
    if (result.success) {
      addNotification(t('housing.moveOut'), 'info');
    }
  }, { delay: 500 });

  const handleRent = () => throttledRent();
  const handleMoveOut = () => throttledMoveOut();

  const handleSleep = () => {
    // 使用现有音效 'sfx_heartbeat' 模拟休息的心跳声
    playSfx('sfx_heartbeat'); 
    const restoreAmount = activeHousing?.regenHp || 0;
    const newHp = Math.min(vitality.metrics.maxHp, vitality.metrics.hp + restoreAmount);
    modifyStats({ hp: newHp });
    addNotification(`${t('housing.rest')} HP +${restoreAmount}`, 'HP');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-solid-dark" onClick={onClose}>
      <div 
        className="w-full max-w-4xl aspect-video bg-[#111] shadow-pixel overflow-hidden border-4 border-[#333] relative"
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