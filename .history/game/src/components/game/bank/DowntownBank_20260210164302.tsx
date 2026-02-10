import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { DowntownBankExterior } from './components/DowntownBankExterior';
import { DowntownBankInterior } from './components/DowntownBankInterior';
import { RegionID } from '@/types/schema';

interface Props {
  onClose: () => void;
}

export const DowntownBank: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { 
    vitality, 
    bank,
    gameDataCache,
    takeLoan,
    repayLoan,
    addNotification, 
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  // 筛选核心区的高端贷款产品
  // 假设核心区只提供高额度贷款
  const loanProducts = gameDataCache?.loans?.filter(l => 
    l.region === RegionID.Downtown || l.amount >= 50000
  ) || [];

  const handleEnter = () => {
    playSfx('sfx_heavy_door_slide'); // 沉重的金属门声
    setHasEntered(true);
  };

  const handleTakeLoan = (productId: string) => {
    const result = takeLoan(productId);
    if (result.success) {
      playSfx('sfx_pen_scratch'); // 签字声
      setTimeout(() => playSfx('sfx_glass_clink'), 500); // 庆祝的碰杯声
      addNotification('Capital leverage acquired.', 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
  };

  const handleRepayLoan = (loanId: string) => {
    const result = repayLoan(loanId);
    if (result.success) {
      playSfx('sfx_coin_drop_bag'); // 或者用更有质感的金币声
      addNotification('Liabilities cleared.', 'success');
    } else {
      playSfx('sfx_deny');
      addNotification('Insufficient liquid assets.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl" onClick={onClose}>
      <div 
        className="w-full max-w-6xl aspect-video bg-[#050505] shadow-[0_0_100px_rgba(212,175,55,0.1)] overflow-hidden border border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <DowntownBankInterior 
            gold={vitality.metrics.gold}
            products={loanProducts}
            activeLoans={bank.activeLoans}
            onTakeLoan={handleTakeLoan}
            onRepayLoan={handleRepayLoan}
            onClose={onClose}
          />
        ) : (
          <DowntownBankExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};