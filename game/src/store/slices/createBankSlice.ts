import { StateCreator } from 'zustand';
import { BankState, LoanProduct, ActiveLoan } from '@/types/schema';
import loansData from '@/assets/data/loans.json';
import bankRules from '@/assets/data/rules/bank_rules.json';

// ✅ 引入类型安全工具
import { StoreState } from '@/types/store';
// ✅ 引入事务管理器
import { executeTransactionSync, createStep } from '@/utils/transaction';

const generateId = () => `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;

export interface BankSlice {
  bank: BankState;
  
  // Actions
  takeLoan: (productId: string, amount: number) => { success: boolean; message: string };
  takeMortgage: (amount: number, termTurns: number, rate: number) => { success: boolean; message: string; loanId?: string };
  makeInstallment: (loanId: string, amount: number) => { success: boolean; message: string; principalPaid: number; interestPaid: number };
  repayLoan: (loanId: string) => { success: boolean; message: string }; // 全额结清贷款
  clearLoan: (loanId: string) => boolean; // 强制结清贷款（如卖房时）
}

const INITIAL_BANK: BankState = {
  activeLoans: [],
  lifetimeInterestPaid: 0
};

export const createBankSlice: StateCreator<StoreState, [], [], BankSlice> = (set, get) => ({
  bank: INITIAL_BANK,

  takeLoan: (productId, amount) => {
    const state = get() as StoreState;
    const { vitality } = state;
    const currentScore = vitality.metrics.creditScore;
    
    // ✅ 计算有效信用分（考虑催收Debuff影响）
    let effectiveScore = currentScore;
    const collectionBuff = vitality.activeBuffs?.find((b: any) => b.id?.includes('buff_medical_collection'));
    if (collectionBuff?.data?.creditScoreModifier) {
      effectiveScore += collectionBuff.data.creditScoreModifier;
    }
    effectiveScore = Math.max(300, Math.min(850, effectiveScore));

    const rawProduct = (loansData as unknown as LoanProduct[]).find(p => p.id === productId);
    
    if (!rawProduct) return { success: false, message: "信贷产品不存在" };
    
    // 门槛检查（使用有效信用分）
    if (effectiveScore < rawProduct.minScore) {
      const reason = collectionBuff 
        ? `信用分不足 (当前: ${currentScore}, 有效: ${effectiveScore}, 需要: ${rawProduct.minScore})。医疗催收记录严重影响信用。`
        : `信用分不足 (当前: ${currentScore}, 需要: ${rawProduct.minScore})`;
      return { success: false, message: reason };
    }
    
    if (amount > rawProduct.maxAmount) {
      return { success: false, message: `超过该产品最大额度 $${rawProduct.maxAmount}` };
    }

    // ✅ 使用事务管理器保证原子性
    const penalty = bankRules.creditScore.actions.hardInquiry;
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

    // 保存初始状态用于回滚
    const initialLoans = [...state.bank.activeLoans];

    const result = executeTransactionSync([
      createStep(
        '发放贷款资金',
        () => {
          const txResult = state.addTransaction('BANK', amount, `贷款发放: ${rawProduct.name}`);
          return txResult.success;
        },
        () => {
          // 回滚：扣除已发放的贷款
          state.addTransaction('BANK', -amount, `贷款发放回滚`);
        }
      ),
      createStep(
        '扣除信用分',
        () => {
          state.modifyStats({ creditScore: penalty });
          return true;
        },
        () => {
          // 回滚：恢复信用分
          state.modifyStats({ creditScore: -penalty });
        }
      ),
      createStep(
        '创建贷款记录',
        () => {
          set((s: StoreState) => ({
            bank: {
              ...s.bank,
              activeLoans: [...s.bank.activeLoans, newLoan]
            }
          }));
          return true;
        },
        () => {
          // 回滚：移除贷款记录
          set((s: StoreState) => ({
            bank: {
              ...s.bank,
              activeLoans: initialLoans
            }
          }));
        }
      )
    ], 'takeLoan');

    if (result.success) {
      return { success: true, message: `贷款 $${amount} 已发放。` };
    } else {
      return { success: false, message: `贷款申请失败: ${result.error}` };
    }
  },

  takeMortgage: (amount, termTurns, rate) => {
    const state = get() as StoreState;
    const { vitality } = state;

    // ✅ 使用事务管理器保证原子性
    const penalty = bankRules.creditScore.actions.hardInquiry;
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

    // 保存初始状态用于回滚
    const initialLoans = [...state.bank.activeLoans];

    const result = executeTransactionSync([
      createStep(
        '扣除信用分',
        () => {
          state.modifyStats({ creditScore: penalty });
          return true;
        },
        () => {
          // 回滚：恢复信用分
          state.modifyStats({ creditScore: -penalty });
        }
      ),
      createStep(
        '创建按揭贷款记录',
        () => {
          set((s: StoreState) => ({
            bank: {
              ...s.bank,
              activeLoans: [...s.bank.activeLoans, newLoan]
            }
          }));
          return true;
        },
        () => {
          // 回滚：移除贷款记录
          set((s: StoreState) => ({
            bank: {
              ...s.bank,
              activeLoans: initialLoans
            }
          }));
        }
      )
    ], 'takeMortgage');

    if (result.success) {
      return { success: true, message: "按揭贷款已批复。", loanId: newLoan.id };
    } else {
      return { success: false, message: `按揭申请失败: ${result.error}` };
    }
  },

  makeInstallment: (loanId, amount) => {
    const state = get() as StoreState & {
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

    set((s: StoreState) => ({
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
                          ? bankRules.creditScore.actions.loanCleared  // 结清贷款：使用配置值
                          : bankRules.creditScore.actions.installmentPaid)  // 正常还款
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

  repayLoan: (loanId) => {
    const state = get() as StoreState;
    const { bank, vitality } = state;
    
    const loan = bank.activeLoans.find(l => l.id === loanId);
    if (!loan) return { success: false, message: "贷款不存在" };
    
    const totalDebt = loan.principal + loan.interest;
    
    if (vitality.metrics.gold < totalDebt) {
      return { success: false, message: "资金不足，无法结清贷款" };
    }
    
    // 调用 makeInstallment 全额还款
    return state.makeInstallment(loanId, totalDebt);
  },

  clearLoan: (loanId) => {
    const { bank } = get() as StoreState;
    const loans = [...bank.activeLoans];
    const loanIndex = loans.findIndex(l => l.id === loanId);
    
    if (loanIndex === -1) return false;
    
    loans.splice(loanIndex, 1);
    
    set((s: StoreState) => ({
      bank: {
        ...s.bank,
        activeLoans: loans
      }
    }));
    
    return true;
  }
});