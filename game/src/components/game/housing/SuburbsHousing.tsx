import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import { RegionID } from '@/types/schema';
import { useThrottle } from '@/hooks/useThrottle';
import { SuburbsExterior } from './components/SuburbsExterior';
import { SuburbsInterior } from './components/SuburbsInterior';

interface Props {
  onClose: () => void;
}

export const SuburbsHousing: React.FC<Props> = ({ onClose }) => {
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

  const houseData = gameDataCache?.housing?.find(h => h.region === RegionID.Suburbs);
  
  if (!houseData) return <div className="text-white p-4">{t('housing.error')}</div>;

  const isOwningThis = activeHousing?.definitionId === houseData.id;

  // 处理动作（添加节流防止重复操作）
  const [throttledBuy] = useThrottle(() => {
    // 郊区只支持购买
    const result = buyHousing(houseData.id);
    if (result.success) {
      playSfx('sfx_print_receipt'); // 打印合同声
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

  const handleRest = () => {
    playSfx('sfx_bird_chirp'); // 或者是轻音乐
    const restoreAmount = activeHousing?.regenHp || 0;
    const newHp = Math.min(vitality.metrics.maxHp, vitality.metrics.hp + restoreAmount);
    modifyStats({ hp: newHp });
    addNotification(`${t('housing.rest')} HP +${restoreAmount}`, 'HP');
    onClose();
  };
  
  const handlePayBills = () => {
    // 氛围装饰交互，账单通过回合结算自动处理
    addNotification(t('housing.weeklyCost'), 'info');
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