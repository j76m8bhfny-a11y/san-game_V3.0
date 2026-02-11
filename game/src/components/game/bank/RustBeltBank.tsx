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
    makeInstallment,
    addNotification, 
  } = useGameStore();
  
  const currentTurn = vitality.time.currentTurn;
  
  const { playSfx } = useAudioStore();

  // 筛选属于 RUST_BELT 区域的贷款产品
  const loanProducts = gameDataCache?.loans?.filter(l => 
    l.region === RegionID.RustBelt
  ) || [];

  const handleEnter = () => {
    playSfx('sfx_click'); // 复用开门声
    setHasEntered(true);
  };

  const handleTakeLoan = (productId: string) => {
    const product = loanProducts.find(p => p.id === productId);
    const amount = product?.maxAmount || 0;
    
    // 播放盖章声
    playSfx('sfx_click'); 
    
    const result = takeLoan(productId, amount);
    if (result.success) {
      playSfx('sfx_cash');
      addNotification('Application approved. Cash dispensed.', 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
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

  const handleMakeInstallment = (loanId: string, amount: number) => {
    const result = makeInstallment(loanId, amount);
    if (result.success) {
      playSfx('sfx_paper');
      addNotification(result.message, 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
    return result;
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
            creditScore={vitality.metrics.creditScore}
            products={loanProducts}
            activeLoans={bank.activeLoans}
            currentTurn={currentTurn}
            onTakeLoan={handleTakeLoan}
            onRepayLoan={handleRepayLoan}
            onMakeInstallment={handleMakeInstallment}
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