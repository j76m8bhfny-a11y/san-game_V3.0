import { StateCreator } from 'zustand';
import { BankState, LoanProduct, GameState, ActiveLoan } from '@/types/schema';
import loansData from '@/assets/data/loans.json';
import bankRules from '@/assets/data/rules/bankRules.json';

const generateId = () => `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;

export interface BankSlice {
  bank: BankState;
  
  // Actions
  takeLoan: (productId: string, amount: number) => { success: boolean; message: string };
  takeMortgage: (amount: number, termTurns: number, rate: number) => { success: boolean; message: string; loanId?: string };
  makeInstallment: (loanId: string, amount: number) => { success: boolean; message: string; principalPaid: number; interestPaid: number };
  clearLoan: (loanId: string) => boolean; // 强制结清贷款（如卖房时）
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

    const rawProduct = (loansData as unknown as LoanProduct[]).find(p => p.id === productId);
    
    if (!rawProduct) return { success: false, message: "信贷产品不存在" };
    
    // 门槛检查
    if (currentScore < rawProduct.minScore) {
      return { success: false, message: `信用分不足 (当前: ${currentScore}, 需要: ${rawProduct.minScore})` };
    }
    
    if (amount > rawProduct.maxAmount) {
      return { success: false, message: `超过该产品最大额度 $${rawProduct.maxAmount}` };
    }

    // ✅ 先扣信用分（与 takeMortgage 保持一致）
    const penalty = bankRules.creditScore.actions.hardInquiry; 
    state.modifyStats({ creditScore: penalty });

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

    // 存入贷款
    set((s: GameState) => ({
      bank: {
        ...s.bank,
        activeLoans: [...s.bank.activeLoans, newLoan]
      }
    }));

    // 发放贷款资金
    const txResult = state.addTransaction('BANK', amount, `贷款发放: ${rawProduct.name}`);
    if (!txResult.success) {
      // 如果发放失败，移除已添加的贷款记录（理论上不应发生）
      set((s: GameState) => ({
        bank: {
          ...s.bank,
          activeLoans: s.bank.activeLoans.filter(l => l.id !== newLoan.id)
        }
      }));
      return { success: false, message: "资金操作异常，贷款未能发放" };
    }

    return { success: true, message: `贷款 $${amount} 已发放。` };
  },

  takeMortgage: (amount, termTurns, rate) => {
    const state = get() as any;
    const { vitality } = state as GameState;

    // ✅ 【问题4-A】先扣信用分，再存贷款（原子性优化）
    const penalty = bankRules.creditScore.actions.hardInquiry;
    state.modifyStats({ 
        creditScore: penalty
    });

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

    // 存入贷款
    set((s: GameState) => ({
      bank: {
        ...s.bank,
        activeLoans: [...s.bank.activeLoans, newLoan]
      }
    }));

    return { success: true, message: "按揭贷款已批复。", loanId: newLoan.id };
  },

  makeInstallment: (loanId, amount) => {
    const state = get() as GameState & { 
      addTransaction: (c: string, a: number, d: string) => { success: boolean; actualAmount: number } 
    };
    const { bank, vitality } = state;
    
    if (vitality.metrics.gold < amount) {
        return { success: false, message: "资金不足，无法还款", principalPaid: 0, interestPaid: 0 };
    }

    const loans = [...bank.activeLoans];
    const loanIndex = loans.findIndex(l => l.id === loanId);
    
    if (loanIndex === -1) return { success: false, message: "贷款不存在", principalPaid: 0, interestPaid: 0 };
    
    const loan = { ...loans[loanIndex] };
    const totalDebt = loan.principal + loan.interest;
    
    if (amount > totalDebt) {
        return { 
            success: false, 
            message: `还款金额超额。该贷款剩余债务 $${totalDebt}，请准确还款或选择结清`, 
            principalPaid: 0, 
            interestPaid: 0 
        };
    }
    let remainingPayment = amount;
    let interestPaid = 0;
    let principalPaid = 0;

    // 扣除逻辑 (先息后本)
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

    const txResult = state.addTransaction('BANK', -amount, `偿还贷款: ${loan.id.substring(0, 4)}...`);
    if (!txResult.success) {
      return { success: false, message: "资金不足以支付还款", principalPaid: 0, interestPaid: 0 };
    }

    // 更新贷款状态
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
      // ✅ 修复: 这里才是正确使用 isCleared 和 bankRules 的地方
      vitality: {
          ...s.vitality,
          metrics: {
              ...s.vitality.metrics,
              creditScore: Math.max(
                  bankRules.creditScore.minScore ?? 300, // 设置下限保护
                  Math.min(
                      bankRules.creditScore.maxScore, // 850
                      s.vitality.metrics.creditScore + (isCleared 
                          ? -3  // 结清贷款：失去活跃维度，轻微掉分
                          : bankRules.creditScore.actions.installmentPaid)  // +1
                  )
              )
          }
      }
    }));

    return { 
        success: true, 
        message: isCleared ? "贷款已结清！" : "还款成功", 
        principalPaid, 
        interestPaid 
    };
  },

  clearLoan: (loanId) => {
    const { bank } = get() as GameState;
    const loans = [...bank.activeLoans];
    const loanIndex = loans.findIndex(l => l.id === loanId);
    
    if (loanIndex === -1) return false;
    
    loans.splice(loanIndex, 1);
    
    set((s: GameState) => ({
      bank: {
        ...s.bank,
        activeLoans: loans
      }
    }));
    
    return true;
  }
});