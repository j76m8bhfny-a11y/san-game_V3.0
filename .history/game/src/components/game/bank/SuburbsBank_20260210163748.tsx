import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useAudioStore } from '@/store/useAudioStore';
import { SuburbsBankExterior } from './components/SuburbsBankExterior';
import { SuburbsBankInterior } from './components/SuburbsBankInterior';
import { RegionID } from '@/types/schema';

interface Props {
  onClose: () => void;
}

export const SuburbsBank: React.FC<Props> = ({ onClose }) => {
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

  // 筛选属于 SUBURBS 区域的贷款产品
  // 假设贷款数据里有 region 字段，或者根据 ID 规则筛选
  // 如果没有 region 字段，可以根据 creditScore 要求来硬筛选（中产通常要求 > 600）
  const loanProducts = gameDataCache?.loans?.filter(l => 
    l.region === RegionID.Suburbs || (l.requiredCreditScore >= 600 && l.requiredCreditScore < 800)
  ) || [];

  const handleEnter = () => {
    playSfx('sfx_automatic_door'); // 自动门/机器启动声
    setTimeout(() => playSfx('sfx_typing'), 300); // 机器自检声
    setHasEntered(true);
  };

  const handleTakeLoan = (productId: string) => {
    const result = takeLoan(productId);
    if (result.success) {
      playSfx('sfx_print_receipt'); // 打印凭条声
      playSfx('sfx_cash');
      addNotification('Loan approved. Funds deposited.', 'info');
    } else {
      playSfx('sfx_deny');
      addNotification(result.message, 'error');
    }
  };

  const handleRepayLoan = (loanId: string) => {
    const result = repayLoan(loanId);
    if (result.success) {
      playSfx('sfx_typing'); // 数字转账声
      addNotification('Payment processed successfully.', 'success');
    } else {
      playSfx('sfx_deny');
      addNotification('Insufficient funds for transfer.', 'error');
    }
  };

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
            products={loanProducts}
            activeLoans={bank.activeLoans}
            onTakeLoan={handleTakeLoan}
            onRepayLoan={handleRepayLoan}
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