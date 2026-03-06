import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { useI18n } from '@/i18n';
import { RegionID } from '@/types/schema';
import { useThrottle } from '@/hooks/useThrottle';
import { SuburbsBankExterior } from './components/SuburbsBankExterior';
import { SuburbsBankInterior } from './components/SuburbsBankInterior';

interface Props {
  onClose: () => void;
}

export const SuburbsBank: React.FC<Props> = ({ onClose }) => {
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
  
  const { playSfx } = useAudioStore();

  // 筛选属于 SUBURBS 区域的贷款产品
  const loanProducts = gameDataCache?.loans?.filter(l => 
    l.region === RegionID.Suburbs
  ) || [];

  const handleEnter = () => {
    playSfx('sfx_sci_fi_door'); // 自动门/机器启动声
    setTimeout(() => playSfx('sfx_typing'), 300); // 机器自检声
    setHasEntered(true);
  };

  // 贷款操作添加节流防止重复申请
  const [throttledTakeLoan] = useThrottle((productId: string) => {
    const product = loanProducts.find(p => p.id === productId);
    const amount = product?.maxAmount || 0;
    const result = takeLoan(productId, amount);
    if (result.success) {
      playSfx('sfx_print_receipt'); // 打印凭条声
      playSfx('sfx_cash');
      addNotification(t('bank.loan.success'), 'info');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
  }, { delay: 500 });

  const [throttledRepayLoan] = useThrottle((loanId: string) => {
    const result = repayLoan(loanId);
    if (result.success) {
      playSfx('sfx_typing'); // 数字转账声
      addNotification(t('bank.loan.repaySuccess'), 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(t('bank.insufficientFunds'), 'error');
    }
  }, { delay: 500 });

  const [throttledMakeInstallment] = useThrottle((loanId: string, amount: number) => {
    const result = makeInstallment(loanId, amount);
    if (result.success) {
      playSfx('sfx_typing');
      addNotification(result.message, 'success');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
    return result;
  }, { delay: 500 });

  const handleTakeLoan = (productId: string) => throttledTakeLoan(productId);
  const handleRepayLoan = (loanId: string) => throttledRepayLoan(loanId);
  const handleMakeInstallment = (loanId: string, amount: number) => throttledMakeInstallment(loanId, amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-5xl aspect-video bg-[#0a0a0a] shadow-2xl overflow-hidden border border-gray-800 relative"
        onClick={e => e.stopPropagation()}
      >
        {hasEntered ? (
          <SuburbsBankInterior 
            gold={vitality.metrics.gold}
            creditScore={vitality.metrics.creditScore}
            currentTurn={vitality.time.currentTurn}
            products={loanProducts}
            activeLoans={bank.activeLoans}
            onTakeLoan={handleTakeLoan}
            onRepayLoan={handleRepayLoan}
            onMakeInstallment={handleMakeInstallment}
            onClose={onClose}
          />
        ) : (
          <SuburbsBankExterior 
            onEnter={handleEnter}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};