import { useState, useCallback } from 'react';
import { ActiveLoan } from '@/types/schema';

interface LoanStatus {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface UseBankUIReturn {
  getLoanStatus: (loan: ActiveLoan, currentTurn: number, isEnglish?: boolean) => LoanStatus;
  getSkipWarning: (loan: ActiveLoan, currentTurn: number, isEnglish?: boolean) => string | null;
  getTotalOwed: (loan: ActiveLoan) => number;
  repayAmount: Record<string, number>;
  setRepayAmount: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  handlePartialRepay: (
    loan: ActiveLoan, 
    amount: number, 
    onMakeInstallment: (loanId: string, amount: number) => { success: boolean; message: string; }
  ) => boolean;
  resetRepayAmount: (loanId: string) => void;
}

export const useBankUI = (): UseBankUIReturn => {
  const [repayAmount, setRepayAmount] = useState<Record<string, number>>({});

  const getLoanStatus = useCallback((loan: ActiveLoan, currentTurn: number, isEnglish = false): LoanStatus => {
    const weeksLeft = loan.dueTurn - currentTurn;
    const isOverdue = weeksLeft < 0;
    const overdueWeeks = isOverdue ? Math.abs(weeksLeft) : 0;
    
    if (isOverdue) {
      if (loan.isMortgage && overdueWeeks >= 4) {
        return isEnglish 
          ? { label: 'FORECLOSURE RISK', color: 'text-red-400', bgColor: 'bg-red-900/40', borderColor: 'border-red-500/50' }
          : { label: '即将收房', color: 'text-red-500', bgColor: 'bg-red-900', borderColor: 'border-red-600' };
      }
      if (overdueWeeks <= 1) {
        return isEnglish
          ? { label: `OVERDUE ${overdueWeeks} WK`, color: 'text-yellow-400', bgColor: 'bg-yellow-900/30', borderColor: 'border-yellow-500/30' }
          : { label: `逾期 ${overdueWeeks} 周`, color: 'text-yellow-500', bgColor: 'bg-yellow-900', borderColor: 'border-yellow-600' };
      }
      if (overdueWeeks <= 3) {
        return isEnglish
          ? { label: 'COLLECTIONS', color: 'text-orange-400', bgColor: 'bg-orange-900/30', borderColor: 'border-orange-500/30' }
          : { label: '暴力催收中', color: 'text-orange-500', bgColor: 'bg-orange-900', borderColor: 'border-orange-600' };
      }
      return isEnglish
        ? { label: 'GARNISH RISK', color: 'text-red-400', bgColor: 'bg-red-900/40', borderColor: 'border-red-500/50' }
        : { label: '强制划扣风险', color: 'text-red-500', bgColor: 'bg-red-900', borderColor: 'border-red-600' };
    }
    
    if (weeksLeft <= 2) {
      return isEnglish
        ? { label: `DUE IN ${weeksLeft} WK`, color: 'text-amber-400', bgColor: 'bg-amber-900/20', borderColor: 'border-amber-500/20' }
        : { label: `${weeksLeft} 周后到期`, color: 'text-amber-500', bgColor: 'bg-amber-900', borderColor: 'border-amber-600' };
    }
    
    return isEnglish
      ? { label: `DUE IN ${weeksLeft} WK`, color: 'text-blue-300', bgColor: 'bg-blue-900/20', borderColor: 'border-blue-500/20' }
      : { label: `${weeksLeft} 周后到期`, color: 'text-gray-400', bgColor: 'bg-gray-800', borderColor: 'border-gray-600' };
  }, []);

  const getSkipWarning = useCallback((loan: ActiveLoan, currentTurn: number, isEnglish = false): string | null => {
    const weeksLeft = loan.dueTurn - currentTurn;
    const isOverdue = weeksLeft < 0;
    const overdueWeeks = isOverdue ? Math.abs(weeksLeft) : 0;
    
    if (!isOverdue) {
      if (weeksLeft === 0) {
        return isEnglish ? 'DUE TODAY' : '⚠️ 今天到期！';
      }
      if (weeksLeft <= 2) {
        return isEnglish ? `DUE IN ${weeksLeft} WEEK(S)` : `⚠️ 还剩 ${weeksLeft} 周`;
      }
      return null;
    }
    
    if (loan.isMortgage) {
      if (overdueWeeks >= 4) {
        return isEnglish ? 'FORECLOSURE PROCEEDING' : '🔴 房贷严重逾期！银行将启动收房程序';
      }
      if (overdueWeeks >= 2) {
        return isEnglish ? 'MORTGAGE DELINQUENT' : '🟠 房贷逾期！信用受损，面临收房风险';
      }
      return isEnglish ? 'MORTGAGE PAST DUE' : '🟡 房贷逾期！请立即还款避免进一步损失';
    }
    
    if (overdueWeeks >= 8) {
      return isEnglish ? 'LEGAL ACTION PENDING' : '🔴 严重逾期！即将面临法律诉讼和入狱风险';
    }
    if (overdueWeeks >= 4) {
      return isEnglish ? 'GARNISHMENT WARNING' : '🟠 强制划扣风险！银行可能直接扣除您的存款';
    }
    if (overdueWeeks >= 2) {
      return isEnglish ? 'COLLECTIONS ACTIVE' : '🟠 暴力催收中！将损失 HP/SAN 值';
    }
    return isEnglish ? 'PAST DUE - ACT NOW' : '🟡 首次逾期警告！请尽快还款避免催收';
  }, []);

  const getTotalOwed = useCallback((loan: ActiveLoan): number => {
    return loan.principal + loan.interest;
  }, []);

  const handlePartialRepay = useCallback((
    loan: ActiveLoan,
    amount: number,
    onMakeInstallment: (loanId: string, amount: number) => { success: boolean; message: string; }
  ): boolean => {
    if (amount <= 0) return false;
    const result = onMakeInstallment(loan.id, amount);
    if (result.success) {
      setRepayAmount(prev => ({ ...prev, [loan.id]: 0 }));
      return true;
    }
    return false;
  }, []);

  const resetRepayAmount = useCallback((loanId: string) => {
    setRepayAmount(prev => ({ ...prev, [loanId]: 0 }));
  }, []);

  return {
    getLoanStatus,
    getSkipWarning,
    getTotalOwed,
    repayAmount,
    setRepayAmount,
    handlePartialRepay,
    resetRepayAmount,
  };
};
