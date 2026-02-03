import { StateCreator } from 'zustand';
import { BankState, LoanProduct, GameState, ActiveLoan } from '@/types/schema';
import loansData from '@/assets/data/loans.json';

const generateId = () => Math.random().toString(36).substring(2, 9);

export interface BankSlice {
  bank: BankState;
  
  // Actions
  takeLoan: (productId: string, amount: number) => { success: boolean; message: string };
  takeMortgage: (amount: number, termTurns: number, rate: number) => { success: boolean; message: string; loanId?: string };
  makeInstallment: (loanId: string, amount: number) => { success: boolean; message: string; principalPaid: number; interestPaid: number };
}

const INITIAL_BANK: BankState = {
  activeLoans: [],
  lifetimeInterestPaid: 0
};

export const createBankSlice: StateCreator<any, [], [], BankSlice> = (set, get) => ({
  bank: INITIAL_BANK,

  takeLoan: (productId, amount) => {
    const state = get() as any; 
    const { vitality } = state as GameState;
    const currentScore = vitality.metrics.creditScore;

    // ✅ 修复：显式使用 LoanProduct 类型进行断言，解决未使用警告
    const rawProduct = (loansData as unknown as LoanProduct[]).find(p => p.id === productId);
    
    if (!rawProduct) return { success: false, message: "信贷产品不存在" };
    
    // 门槛检查
    if (currentScore < rawProduct.minScore) {
      return { success: false, message: `信用分不足 (当前: ${currentScore}, 需要: ${rawProduct.minScore})` };
    }
    
    if (amount > rawProduct.maxAmount) {
      return { success: false, message: `超过该产品最大额度 $${rawProduct.maxAmount}` };
    }

    const newLoan: ActiveLoan = {
      id: generateId(), 
      productId: rawProduct.id,
      principal: amount,
      interest: 0,
      rate: rawProduct.weeklyRate, 
      dueTurn: vitality.time.currentTurn + rawProduct.termTurns, 
      overdueTurns: 0,
      isMortgage: false
    };


    state.addTransaction('BANK', amount, `贷款发放: ${rawProduct.name}`);

    // 硬查询扣分 (Hard Inquiry)
    state.modifyVitality({ metrics: { creditScore: -5 } }); // 直接扣5分

    set((s: GameState) => ({
      bank: {
        ...s.bank,
        activeLoans: [...s.bank.activeLoans, newLoan]
      }
    }));

    return { success: true, message: `贷款 $${amount} 已发放。` };
  },

  takeMortgage: (amount, termTurns, rate) => {
    const state = get() as GameState;
    const { vitality } = state;

    const newLoan: ActiveLoan = {
      id: generateId(),
      productId: 'MORTGAGE',
      principal: amount,
      interest: 0,
      rate: rate,
      dueTurn: vitality.time.currentTurn + termTurns,
      overdueTurns: 0,
      isMortgage: true
    };

    set((s: GameState) => ({
      bank: {
        ...s.bank,
        activeLoans: [...s.bank.activeLoans, newLoan]
      }
    }));

    return { success: true, message: "按揭贷款已批复。", loanId: newLoan.id };
  },

  // ✅ 支持部分还款
  makeInstallment: (loanId, amount) => {
    const state = get() as GameState & { addTransaction: (c: string, a: number, d: string) => void };
    const { bank, vitality } = state;
    
    // 1. ✅ 原子性检查：先确认钱够不够
    if (vitality.metrics.gold < amount) {
        return { success: false, message: "资金不足，无法还款", principalPaid: 0, interestPaid: 0 };
    }

    const loans = [...bank.activeLoans];
    const loanIndex = loans.findIndex(l => l.id === loanId);
    
    if (loanIndex === -1) return { success: false, message: "贷款不存在", principalPaid: 0, interestPaid: 0 };
    
    const loan = { ...loans[loanIndex] };
    let remainingPayment = amount;
    let interestPaid = 0;
    let principalPaid = 0;

    // 2. 扣除逻辑 (先息后本)
    if (loan.interest > 0) {
      const payInterest = Math.min(loan.interest, remainingPayment);
      loan.interest -= payInterest;
      remainingPayment -= payInterest;
      interestPaid += payInterest;
    }

    if (remainingPayment > 0) {
      const payPrincipal = Math.min(loan.principal, remainingPayment);
      loan.principal -= payPrincipal;
      principalPaid += payPrincipal;
    }

    // 3. ✅ 关键修复：直接在这里扣钱，不再依赖 UI
    state.addTransaction('BANK', -amount, `偿还贷款: ${loan.id.substring(0, 4)}...`);

    // 4. 更新贷款状态
    const isCleared = loan.principal <= 0 && loan.interest <= 0;
    
    if (isCleared) {
      loans.splice(loanIndex, 1);
    } else {
      loans[loanIndex] = loan;
    }

    set((s: GameState) => ({
      bank: {
        ...s.bank,
        activeLoans: loans,
        lifetimeInterestPaid: s.bank.lifetimeInterestPaid + interestPaid,
      },
      // 信用分奖励 (稍微增加一点)
      vitality: {
          ...s.vitality,
          metrics: {
              ...s.vitality.metrics,
              creditScore: Math.min(850, s.vitality.metrics.creditScore + (isCleared ? 5 : 1))
          }
      }
    }));

    return { 
        success: true, 
        message: isCleared ? "贷款已结清！" : "还款成功", 
        principalPaid, 
        interestPaid 
    };
  }
});