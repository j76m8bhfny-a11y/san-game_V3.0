import { ActiveLoan, LoanProduct } from '../types/schema';

/**
 * 信用分评级文案 (保持不变)
 */
export const getCreditRating = (score: number) => {
  if (score >= 800) return { label: 'PRIME (至尊)', color: 'text-yellow-400' };
  if (score >= 740) return { label: 'EXCELLENT (卓越)', color: 'text-green-400' };
  if (score >= 670) return { label: 'GOOD (良好)', color: 'text-green-600' };
  if (score >= 580) return { label: 'FAIR (一般)', color: 'text-yellow-600' };
  if (score >= 300) return { label: 'POOR (差劲)', color: 'text-red-500' };
  return { label: 'RUINED (毁灭)', color: 'text-red-700' };
};

/**
 * 计算最大可借额度 (基于信用分)
 */
export const calculateMaxBorrow = (product: LoanProduct, currentScore: number) => {
  if (currentScore < product.minScore) return 0;
  
  // 信用分超出准入线越多，额度越高
  const scoreSurplus = currentScore - product.minScore;
  const utilizationRatio = Math.min(1, 0.2 + (scoreSurplus / 200)); 
  
  return Math.floor(product.maxAmount * utilizationRatio);
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