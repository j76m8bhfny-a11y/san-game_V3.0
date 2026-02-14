import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import { RegionID } from '@/types/schema';
import { SlumsBankExterior } from './components/SlumsBankExterior';
import { SlumsBankInterior } from './components/SlumsBankInterior';

interface Props {
  onClose: () => void;
}

export const SlumsBank: React.FC<Props> = ({ onClose }) => {
  const { t } = useI18n();
  const [hasEntered, setHasEntered] = useState(true);
  const { 
    vitality, 
    bank,
    takeLoan,
    repayLoan,
    makeInstallment,
    addNotification, 
    gameDataCache
  } = useGameStore();
  
  const currentTurn = vitality.time.currentTurn;
  
  const { playSfx } = useAudioStore();

  // 获取贫民窟特有的高利贷产品
  const loanProducts = gameDataCache?.loans?.filter(l => l.region === RegionID.Slums) || [];

  const handleEnter = () => {
    playSfx('sfx_click'); // 借用一下点击声
    setTimeout(() => playSfx('sfx_neon_hum'), 200);
    setHasEntered(true);
  };

  const handleTakeLoan = (productId: string) => {
    const product = loanProducts.find(p => p.id === productId);
    const amount = product?.maxAmount || 0;
    const result = takeLoan(productId, amount);
    if (result.success) {
      playSfx('sfx_cash');
      addNotification(t('bank.loan.success'), 'info');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
  };

  const handleRepayLoan = (loanId: string) => {
    const result = repayLoan(loanId);
    if (result.success) {
      playSfx('sfx_cash');
      addNotification(t('bank.loan.repaySuccess'), 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(t('bank.insufficientFunds'), 'error');
    }
  };

  const handleMakeInstallment = (loanId: string, amount: number) => {
    const result = makeInstallment(loanId, amount);
    if (result.success) {
      playSfx('sfx_cash');
      addNotification(result.message, 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
    return result;
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
          <SlumsBankExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};