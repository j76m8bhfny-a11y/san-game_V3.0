import { StateCreator } from 'zustand';
import { BankState, LoanProduct, GameState, ActiveLoan, LedgerCategory } from '@/types/schema';
import loansData from '@/assets/data/loans.json';

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export interface BankSlice {
  bank: BankState;
  
  // Actions
  // 1. 申请普通贷款 (获得现金，产生债务)
  takeLoan: (productId: string, amount: number) => { success: boolean; message: string };
  
  // 2. 申请房贷 (不获得现金，直接产生债务，用于 HousingSlice 买房)
  takeMortgage: (amount: number, termTurns: number, rate: number) => { success: boolean; message: string; loanId?: string };
  
  // 3. 全额还款 (普通贷款)
  repayLoan: (loanId: string) => { success: boolean; message: string };
  
  // 4. 分期还款 (用于房贷自动扣款)
  makeInstallment: (loanId: string, amount: number) => { success: boolean; message: string; principalPaid: number; interestPaid: number };
  
  // 5. 每周结算 (利息滚动、信用分调整)
  processTurnBank: () => { interestAccrued: number; scoreChange: number };
}

const INITIAL_BANK: BankState = {
  creditScore: 580, // 初始信用分 (Fair)
  creditHistory: [580],
  activeLoans: [],
  lifetimeInterestPaid: 0
};

export const createBankSlice: StateCreator<any, [], [], BankSlice> = (set, get) => ({
  bank: INITIAL_BANK,

  // --- 1. 普通贷款 ---
  takeLoan: (productId, amount) => {
    const state = get() as GameState;
    const { vitality } = state;
    const product = loansData.find(p => p.id === productId) as LoanProduct;
    
    if (!product) return { success: false, message: "信贷产品不存在" };
    if (state.bank.creditScore < product.minScore) return { success: false, message: `信用评分不足 (需 ${product.minScore})` };

    // 创建贷款记录
    const newLoan: ActiveLoan = {
      id: generateId(), 
      productId: product.id,
      principal: amount,
      interest: 0, // 初始无累积利息
      rate: product.weeklyRate, // 使用周利率
      dueTurn: vitality.time.currentTurn + product.termTurns, // 到期回合
      isOverdue: false,
      isMortgage: false
    };

    // 1. 发放资金 (记账)
    state.addTransaction('BANK', amount, `贷款发放: ${product.name}`);

    // 2. 更新银行状态
    set((s: GameState) => ({
      bank: {
        ...s.bank,
        activeLoans: [...s.bank.activeLoans, newLoan],
        // 硬查询 (Hard Inquiry) 扣分
        creditScore: Math.max(300, s.bank.creditScore - 10),
        creditHistory: [...s.bank.creditHistory, Math.max(300, s.bank.creditScore - 10)]
      }
    }));

    return { success: true, message: `贷款 $${amount} 已发放。` };
  },

  // --- 2. 房贷 (特殊) ---
  takeMortgage: (amount, termTurns, rate) => {
    const state = get() as GameState;
    const { vitality } = state;

    // 房贷通常不直接给玩家现金，而是支付给卖方
    // 所以这里不调用 addTransaction(INCOME)，只记录债务

    const newLoan: ActiveLoan = {
      id: generateId(),
      productId: 'MORTGAGE', // 特殊标记
      principal: amount,
      interest: 0,
      rate: rate,
      dueTurn: vitality.time.currentTurn + termTurns,
      isOverdue: false,
      isMortgage: true
    };

    set((s: GameState) => ({
      bank: {
        ...s.bank,
        activeLoans: [...s.bank.activeLoans, newLoan],
        // 房贷虽然也是负债，但属于优质资产抵押，扣分较少或不扣
        creditScore: s.bank.creditScore, 
      }
    }));

    return { success: true, message: "按揭贷款已批复。", loanId: newLoan.id };
  },

  // --- 3. 全额还款 ---
  repayLoan: (loanId) => {
    const state = get() as GameState;
    const loan = state.bank.activeLoans.find(l => l.id === loanId);
    
    if (!loan) return { success: false, message: "贷款记录不存在" };
    
    const totalDue = loan.principal + loan.interest;
    if (state.vitality.metrics.gold < totalDue) return { success: false, message: "资金不足以还清本息" };

    // 1. 扣款
    state.addTransaction('BANK', -totalDue, `还款: 结清贷款`);

    // 2. 更新状态
    set((s: GameState) => ({
      bank: {
        ...s.bank,
        activeLoans: s.bank.activeLoans.filter(l => l.id !== loanId),
        lifetimeInterestPaid: s.bank.lifetimeInterestPaid + loan.interest,
        // 结清贷款大幅提升信用
        creditScore: Math.min(850, s.bank.creditScore + 20),
        creditHistory: [...s.bank.creditHistory, Math.min(850, s.bank.creditScore + 20)]
      }
    }));

    return { success: true, message: "债务已结清，信用评分提升。" };
  },

  // --- 4. 分期还款 (部分还款) ---
  makeInstallment: (loanId, amount) => {
    const state = get() as GameState;
    const loans = [...state.bank.activeLoans];
    const loanIndex = loans.findIndex(l => l.id === loanId);
    
    if (loanIndex === -1) return { success: false, message: "贷款不存在", principalPaid: 0, interestPaid: 0 };
    
    const loan = { ...loans[loanIndex] };
    
    // 逻辑：先还利息，再还本金
    // 但如果 amount 是通过 HousingSystem 自动扣的，它通常是定额的
    
    let remainingPayment = amount;
    let interestPaid = 0;
    let principalPaid = 0;

    // 1. 抵扣累积利息
    if (loan.interest > 0) {
      const payInterest = Math.min(loan.interest, remainingPayment);
      loan.interest -= payInterest;
      remainingPayment -= payInterest;
      interestPaid += payInterest;
    }

    // 2. 抵扣本金
    if (remainingPayment > 0) {
      const payPrincipal = Math.min(loan.principal, remainingPayment);
      loan.principal -= payPrincipal;
      principalPaid += payPrincipal;
    }

    // 3. 检查是否还清
    const isCleared = loan.principal <= 0 && loan.interest <= 0;
    
    if (isCleared) {
      loans.splice(loanIndex, 1); // 移除贷款
    } else {
      loans[loanIndex] = loan; // 更新贷款
    }

    // 4. 不在这里扣款 (addTransaction)，假设调用方已经扣了钱 (如 HousingSystem)
    // 或者是 UI 里的主动还款，UI 层负责调用 addTransaction? 
    // 为了安全，这里我们不扣款，只处理 Bank 内部账目。
    // 调用方 (HousingSystem 或 UI) 必须负责 addTransaction。

    set((s: GameState) => ({
      bank: {
        ...s.bank,
        activeLoans: loans,
        lifetimeInterestPaid: s.bank.lifetimeInterestPaid + interestPaid,
        // 正常还款微量提升信用
        creditScore: Math.min(850, s.bank.creditScore + (isCleared ? 10 : 1))
      }
    }));

    return { 
      success: true, 
      message: isCleared ? "贷款已结清。" : "还款成功。",
      principalPaid,
      interestPaid
    };
  },

  // --- 5. 每周银行结算 ---
  processTurnBank: () => {
    const state = get() as GameState;
    const { activeLoans, creditScore } = state.bank;
    const currentTurn = state.vitality.time.currentTurn;

    let interestAccrued = 0;
    let hasOverdue = false;

    // 1. 计算利息与检查逾期
    const updatedLoans = activeLoans.map(loan => {
      // 简单复利或单利逻辑：每周增加 (本金 * 周利率)
      const weeklyInterest = Math.ceil(loan.principal * loan.rate);
      interestAccrued += weeklyInterest;

      // 检查逾期
      const isOverdue = currentTurn > loan.dueTurn;
      if (isOverdue) hasOverdue = true;

      return {
        ...loan,
        interest: loan.interest + weeklyInterest,
        isOverdue
      };
    });

    // 2. 调整信用分
    let scoreChange = 0;
    if (hasOverdue) {
      scoreChange = -15; // 逾期重罚
    } else if (activeLoans.length > 0) {
      scoreChange = 2; // 保持良好借贷习惯，每周+2
    } else {
      scoreChange = 0; // 无贷无分
    }
    
    // 如果分数过低，可能需要额外逻辑 (如强制变卖)，暂时不做

    const newScore = Math.max(300, Math.min(850, creditScore + scoreChange));

    set((s: GameState) => ({
      bank: {
        ...s.bank,
        activeLoans: updatedLoans,
        creditScore: newScore,
        creditHistory: [...s.bank.creditHistory, newScore]
      }
    }));

    return { interestAccrued, scoreChange };
  }
});