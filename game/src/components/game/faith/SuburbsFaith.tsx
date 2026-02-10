import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { SuburbsChurchExterior } from './components/SuburbsChurchExterior';
import { SuburbsChurchInterior } from './components/SuburbsChurchInterior';

interface Props {
  onClose: () => void;
}

export const SuburbsFaith: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { 
    vitality, 
    addNotification,
    addTransaction 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  const handleEnter = () => {
    playSfx('sfx_automatic_door'); // 自动门声
    setTimeout(() => playSfx('sfx_mall_ambience'), 500); // 商场环境音
    setHasEntered(true);
  };

  const handleSubscribe = (tier: 'BASIC' | 'PREMIUM') => {
    const amount = tier === 'BASIC' ? 50 : 200;
    const result = addTransaction('MISC', -amount, `GraceLife ${tier} Plan`);
    
    if (result.success) {
      playSfx('sfx_payment_success'); // 支付成功音效
      if (tier === 'PREMIUM') {
        addNotification('Kingdom Builder status active. Reputation +++', 'SAN');
        // TODO: 增加声望或解锁特定工作机会
      } else {
        addNotification('Subscription active. You feel socially secure.', 'SAN');
      }
    } else {
      playSfx('sfx_payment_fail');
      addNotification('Transaction declined. Insufficient funds.', 'error');
    }
  };

  const handleAttendSeminar = () => {
    playSfx('sfx_presentation_applause'); // 掌声
    addNotification('You networked with local leaders. Job prospects improved.', 'SAN');
    // TODO: 消耗时间 (例如 2 hours)
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={onClose}>
      <div 
        className="w-full max-w-5xl aspect-video bg-white shadow-2xl overflow-hidden border-4 border-gray-100 relative rounded-xl"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <SuburbsChurchInterior 
            gold={vitality.metrics.gold}
            onSubscribe={handleSubscribe}
            onAttendSeminar={handleAttendSeminar}
            onClose={onClose}
          />
        ) : (
          <SuburbsChurchExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};