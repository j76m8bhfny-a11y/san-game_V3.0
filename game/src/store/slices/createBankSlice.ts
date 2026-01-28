import { StateCreator } from 'zustand';
import { BankState, LoanProduct, GameState } from '@/types/schema';
import { processDailyInterest } from '@/logic/bank';
import loansData from '@/assets/data/loans.json';
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export interface BankSlice {
  bank: BankState;
  
  // Actions
  takeLoan: (productId: string, amount: number) => { success: boolean; message: string };
  repayLoan: (loanId: string) => { success: boolean; message: string };
  processDailyBank: () => { interestPaid: number; scoreChange: number }; // 每日结算调用
}

const INITIAL_BANK: BankState = {
  creditScore: 580, // 典型的美国穷人起步分 (Fair/Poor)
  creditHistory: [580, 580, 580, 580, 580],
  activeLoans: [],
  lifetimeInterestPaid: 0
};

export const createBankSlice: StateCreator<any, [], [], BankSlice> = (set, get) => ({
  bank: INITIAL_BANK,

  takeLoan: (productId, amount) => {
    const state = get() as GameState;
    const product = loansData.find(p => p.id === productId) as LoanProduct;
    
    if (!product) return { success: false, message: "产品不存在" };
    if (state.bank.creditScore < product.minScore) return { success: false, message: "信用评分不足，拒绝放款。" };

    // 创建贷款记录
    const newLoan = {
      id: generateId(), 
      productId: product.id,
      principal: amount,
      interest: 0,
      rate: product.dailyRate,
      dueDate: state.day + product.termDays,
      isOverdue: false
    };

    set((s: GameState) => ({
      gold: s.gold + amount,
      bank: {
        ...s.bank,
        activeLoans: [...s.bank.activeLoans, newLoan],
        // 借贷会轻微降低信用分 (Hard Inquiry)
        creditScore: Math.max(300, s.bank.creditScore - 5),
        creditHistory: [...s.bank.creditHistory, Math.max(300, s.bank.creditScore - 5)]
      }
    }));

    return { success: true, message: `资金 $${amount} 已到账。利息开始计算。` };
  },

  repayLoan: (loanId) => {
    const state = get() as GameState;
    const loan = state.bank.activeLoans.find(l => l.id === loanId);
    
    if (!loan) return { success: false, message: "贷款不存在" };
    
    const totalDue = loan.principal + loan.interest;
    if (state.gold < totalDue) return { success: false, message: "资金不足以还款" };

    set((s: GameState) => ({
      gold: s.gold - totalDue,
      bank: {
        ...s.bank,
        activeLoans: s.bank.activeLoans.filter(l => l.id !== loanId),
        lifetimeInterestPaid: s.bank.lifetimeInterestPaid + loan.interest,
        // 还款成功提升信用分
        creditScore: Math.min(850, s.bank.creditScore + 15),
        creditHistory: [...s.bank.creditHistory, Math.min(850, s.bank.creditScore + 15)]
      }
    }));

    return { success: true, message: `债务已结清。信用记录已修复。` };
  },

  processDailyBank: () => {
    const state = get() as GameState;
    const { updatedLoans, totalDailyInterest } = processDailyInterest(state.bank.activeLoans, state.day);

    // 检查逾期情况调整信用分
    let scoreChange = 0;
    const hasOverdue = updatedLoans.some(l => l.isOverdue);
    
    if (hasOverdue) {
      scoreChange = -20; // 逾期暴跌
    } else if (updatedLoans.length > 0) {
      scoreChange = 1; // 按时持有并付息，缓慢增加
    }

    const newScore = Math.max(300, Math.min(850, state.bank.creditScore + scoreChange));

    set((s: GameState) => ({
      bank: {
        ...s.bank,
        activeLoans: updatedLoans,
        creditScore: newScore,
        creditHistory: [...s.bank.creditHistory, newScore]
      }
    }));

    return { interestPaid: totalDailyInterest, scoreChange };
  }
});