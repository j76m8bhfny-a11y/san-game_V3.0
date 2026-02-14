import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import { DowntownBankExterior } from './components/DowntownBankExterior';
import { DowntownBankInterior } from './components/DowntownBankInterior';
import { RegionID } from '@/types/schema';

interface Props {
  onClose: () => void;
}

export const DowntownBank: React.FC<Props> = ({ onClose }) => {
  const { t } = useI18n();
  const [hasEntered, setHasEntered] = useState(true);
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

  // 筛选核心区的贷款产品
  const loanProducts = gameDataCache?.loans?.filter(l => 
    l.region === RegionID.Downtown
  ) || [];

  const handleEnter = () => {
    playSfx('sfx_sci_fi_door'); // 沉重的金属门声
    setHasEntered(true);
  };

  const handleTakeLoan = (productId: string) => {
    const product = loanProducts.find(p => p.id === productId);
    const amount = product?.maxAmount || 0;
    const result = takeLoan(productId, amount);
    if (result.success) {
      playSfx('sfx_pen_scratch'); // 签字声
      setTimeout(() => playSfx('sfx_glass_clink'), 500); // 庆祝的碰杯声
      addNotification(t('bank.loan.success'), 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
  };

  const handleRepayLoan = (loanId: string) => {
    const result = repayLoan(loanId);
    if (result.success) {
      playSfx('sfx_cash'); // 或者用更有质感的金币声
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl" onClick={onClose}>
      <div 
        className="w-full max-w-6xl aspect-video bg-[#050505] shadow-[0_0_100px_rgba(212,175,55,0.1)] overflow-hidden border border-[#333] relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <DowntownBankInterior 
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
          <DowntownBankExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};