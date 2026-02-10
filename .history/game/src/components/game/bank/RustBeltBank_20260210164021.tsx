import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { RustBeltBankExterior } from './components/RustBeltBankExterior';
import { RustBeltBankInterior } from './components/RustBeltBankInterior';
import { RegionID } from '@/types/schema';

interface Props {
  onClose: () => void;
}

export const RustBeltBank: React.FC<Props> = ({ onClose }) => {
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

  // 筛选属于 RUST_BELT 区域的贷款产品
  const loanProducts = gameDataCache?.loans?.filter(l => 
    l.region === RegionID.RustBelt || (!l.region && l.interestRate > 0.05 && l.interestRate < 0.2)
  ) || [];

  const handleEnter = () => {
    playSfx('sfx_church_door_creak'); // 复用开门声，或者用 sfx_click
    setHasEntered(true);
  };

  const handleTakeLoan = (productId: string) => {
    // 播放盖章声（可以用 sfx_heavy_door_slide 的前半段模拟沉闷的敲击，或者 sfx_click）
    playSfx('sfx_click'); 
    
    setTimeout(() => {
      const result = takeLoan(productId);
      if (result.success) {
        playSfx('sfx_cash');
        addNotification('Application approved. Cash dispensed.', 'success');
      } else {
        playSfx('sfx_deny');
        addNotification(result.message, 'error');
      }
    }, 200);
  };

  const handleRepayLoan = (loanId: string) => {
    const result = repayLoan(loanId);
    if (result.success) {
      playSfx('sfx_paper'); // 纸币摩擦声
      addNotification('Payment accepted.', 'success');
    } else {
      playSfx('sfx_deny');
      addNotification('Not enough cash.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-5xl aspect-video bg-[#d1d5db] shadow-2xl overflow-hidden border-4 border-gray-600 relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <RustBeltBankInterior 
            gold={vitality.metrics.gold}
            products={loanProducts}
            activeLoans={bank.activeLoans}
            onTakeLoan={handleTakeLoan}
            onRepayLoan={handleRepayLoan}
            onClose={onClose}
          />
        ) : (
          <RustBeltBankExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};