import { ActiveLoan, LoanProduct } from '../types/schema';

// 信用分评级文案
export const getCreditRating = (score: number) => {
  if (score >= 800) return { label: 'PRIME (至尊)', color: 'text-yellow-400' };
  if (score >= 740) return { label: 'EXCELLENT (卓越)', color: 'text-green-400' };
  if (score >= 670) return { label: 'GOOD (良好)', color: 'text-green-600' };
  if (score >= 580) return { label: 'FAIR (一般)', color: 'text-yellow-600' };
  if (score >= 300) return { label: 'POOR (差劲)', color: 'text-red-500' };
  return { label: 'RUINED (毁灭)', color: 'text-red-700' };
};

// 计算最大可借额度 (基于信用分)
// 即使产品允许借 10万，如果你信用分只有 600，你也只能借一部分
export const calculateMaxBorrow = (product: LoanProduct, currentScore: number) => {
  if (currentScore < product.minScore) return 0;
  
  // 简单的额度系数模型
  // 信用分超出准入线越多，额度越高
  const scoreSurplus = currentScore - product.minScore;
  const utilizationRatio = Math.min(1, 0.2 + (scoreSurplus / 200)); 
  
  return Math.floor(product.maxAmount * utilizationRatio);
};

// 每日利息滚存计算
export const processDailyInterest = (loans: ActiveLoan[], currentDay: number) => {
  let totalDailyInterest = 0;
  
  const updatedLoans = loans.map(loan => {
    // 复利计算：每天 (本金+利息) * 利率
    // 这里的利率是极其恐怖的
    const dailyCost = Math.floor((loan.principal + loan.interest) * loan.rate);
    totalDailyInterest += dailyCost;

    return {
      ...loan,
      interest: loan.interest + dailyCost,
      isOverdue: currentDay > loan.dueDate
    };
  });

  return { updatedLoans, totalDailyInterest };
};