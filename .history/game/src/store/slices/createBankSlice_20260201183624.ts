import { StateCreator } from 'zustand';
import { BankState, LoanProduct, GameState, ActiveLoan } from '@/types/schema';
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
    // ✅ 修复: 使用 any 获取完整 Store 以访问 addTransaction Action
    const state = get() as any; 
    const { vitality } = state as GameState;

    const rawProduct = loansData.find(p => p.id === productId);
    if (!rawProduct) return { success: false, message: "信贷产品不存在" };

    // ✅ 修复: 构造符合新 Schema 的 Product 对象，处理 daily -> weekly 转换
    // 并且先定义 product 变量，再在后续逻辑中使用
    const product: LoanProduct = {
        id: rawProduct.id,
        name: rawProduct.name,
        provider: rawProduct.provider || "Unknown",
        description: rawProduct.description,
        minScore: rawProduct.minScore,
        // 如果 JSON 是 dailyRate，这里 x7，否则直接用
        weeklyRate: (rawProduct as any).dailyRate ? (rawProduct as any).dailyRate * 7 : (rawProduct as any).weeklyRate || 0.05,
        maxAmount: rawProduct.maxAmount,
        // 如果 JSON 是 termDays，这里 /7，否则直接用 termTurns
        termTurns: (rawProduct as any).termDays ? Math.ceil((rawProduct as any).termDays / 7) : (rawProduct as any).termTurns || 4,
        color: rawProduct.color,
        riskLevel: rawProduct.riskLevel
    };
    
    // 检查信用分
    if (state.bank.creditScore < product.minScore) {
        return { success: false, message: `信用评分不足 (需 ${product.minScore})` };
    }

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

    // 1. 发放资金 (调用 VitalitySlice 的 Action)
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
    const state = get() as any; // Cast for actions
    const { vitality, bank } = state as GameState;
    const loan = bank.activeLoans.find((l: ActiveLoan) => l.id === loanId);
    
    if (!loan) return { success: false, message: "贷款记录不存在" };
    
    const totalDue = loan.principal + loan.interest;
    if (vitality.metrics.gold < totalDue) return { success: false, message: "资金不足以还清本息" };

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