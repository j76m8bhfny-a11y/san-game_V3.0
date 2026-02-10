import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { SlumsBankExterior } from './components/SlumsBankExterior';
import { SlumsBankInterior } from './components/SlumsBankInterior';

interface Props {
  onClose: () => void;
}

export const SlumsBank: React.FC<Props> = ({ onClose }) => {
  const [hasEntered, setHasEntered] = useState(false);
  const { 
    vitality, 
    bank, // 假设 store 里有 bank slice
    takeLoan,
    repayLoan,
    addNotification, 
    gameDataCache
  } = useGameStore();
  
  const { playSfx } = useAudioStore();

  // 获取贫民窟特有的高利贷产品
  const loanProducts = gameDataCache?.loans?.filter(l => l.region === 'SLUMS') || [];

  const handleEnter = () => {
    playSfx('sfx_metal_door_creak'); // 借用一下铁门声
    setTimeout(() => playSfx('sfx_neon_hum'), 200);
    setHasEntered(true);
  };

  const handleTakeLoan = (productId: string) => {
    const result = takeLoan(productId);
    if (result.success) {
      playSfx('sfx_cash');
      addNotification('You got the cash. Watch your back.', 'info');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
  };

  const handleRepayLoan = (loanId: string) => {
    const result = repayLoan(loanId);
    if (result.success) {
      playSfx('sfx_coin_drop_bag');
      addNotification('Debt paid. One less problem.', 'success');
    } else {
      playSfx('sfx_deny');
      addNotification('Not enough cash.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-4xl aspect-video bg-[#111] shadow-2xl overflow-hidden border-4 border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <SlumsBankInterior 
            gold={vitality.metrics.gold}
            products={loanProducts}
            activeLoans={bank.activeLoans}
            onTakeLoan={handleTakeLoan}
            onRepayLoan={handleRepayLoan}
            onClose={onClose}
          />
        ) : (
          <SlumsBankExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};