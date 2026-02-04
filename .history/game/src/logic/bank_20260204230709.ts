import { ActiveLoan, LoanProduct } from '../types/schema';
import bankRules from '@/assets/data/rules/bankRules.json';

/**
 * 信用分评级文案 (保持不变)
 */
export const getCreditRating = (score: number) => {
  // ✅ 动态读取评级配置
  // 注意：JSON中需保证按 threshold 降序排列
  const rating = bankRules.creditScore.ratings.find(r => score >= r.threshold);
  // Fallback to lowest rating if not found (RUINED)
  return rating || { label: 'RUINED (毁灭)', color: 'text-red-700' };
};

/**
 * 计算最大可借额度 (基于信用分)
 */
export const calculateMaxBorrow = (product: LoanProduct, currentScore: number) => {
  if (currentScore < product.minScore) return 0;
  
  // ✅ 动态计算额度公式
  const { baseRate, growthDivisor } = bankRules.creditScore.borrowLimit;
  
  const scoreSurplus = currentScore - product.minScore;
  const utilizationRatio = Math.min(1, baseRate + (scoreSurplus / growthDivisor)); 
  
  return Math.floor(product.maxAmount * utilizationRatio);
};

/**
 * 🆕 新增：统一计算房贷每期应还金额
 * @param principal 当前剩余本金
 * @param rate 贷款利率
 */
export const calculateMortgagePayment = (principal: number, rate: number) => {
  // 从配置读取还款规则 (避免硬编码)
  const { weeklyPrincipalRate, weeklyServiceFee } = bankRules.mortgage;

  // 1. 本金偿还部分 (例如: 剩余本金的 1%)
  const principalPayment = Math.ceil(principal * weeklyPrincipalRate);

  // 2. 利息部分 (例如: 剩余本金 * 利率)
  const interestPayment = Math.ceil(principal * rate);

  // 3. 服务费 (固定值)
  const serviceFee = weeklyServiceFee || 0;

  return {
    principalPayment,
    interestPayment,
    serviceFee,
    total: principalPayment + interestPayment + serviceFee
  };
};

/**
 * 每周利息滚存计算 (对齐 V3.0 Turn 逻辑)
 * ✅ 修复: 将 dueDate 修改为 dueTurn
 * ✅ 修复: 将 isOverdue 修改为符合 Schema 的 overdueTurns
 */
export const processTurnInterest = (loans: ActiveLoan[], currentTurn: number) => {
  let totalTurnInterest = 0;
  
  const updatedLoans = loans.map(loan => {
    // 复利计算：本周 (本金 + 累积利息) * 利率
    const interestCost = Math.floor((loan.principal + loan.interest) * loan.rate);
    totalTurnInterest += interestCost;

    // 逾期判定
    const isNowOverdue = currentTurn > loan.dueTurn;

    return {
      ...loan,
      interest: loan.interest + interestCost,
      // 如果已逾期，计数器 +1，否则保持 0
      overdueTurns: isNowOverdue ? (loan.overdueTurns || 0) + 1 : 0
    };
  });

  return { updatedLoans, totalTurnInterest };
};

// 导出别名以兼容旧代码调用
export const processDailyInterest = processTurnInterest;