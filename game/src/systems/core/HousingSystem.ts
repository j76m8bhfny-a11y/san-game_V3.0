import { GameSystem, SystemResult } from '../types';
import { Housing } from '@/types/schema';
import housingData from '@/assets/data/housing.json';

import housingRules from '@/assets/data/rules/housing_rules.json';
import { calculateMortgagePayment } from '@/logic/bank';

export const HousingSystem: GameSystem = {
  id: 'HOUSING',

  processTurn: ({ state }) => {
    const { activeHousing, vitality, bank } = state;
    const result: SystemResult = {
      updates: {}, 
      newTransactions: [],
      logs: [],
      notes: []
    };

    // 1. 如果无房，跳过
    if (!activeHousing) {
      return result;
    }

    const housing = activeHousing;
    let updatedLoans = [...bank.activeLoans];
    let updatedHousing: typeof housing | null = housing;
    let hasUpdates = false;
    let isEvicted = false;

    // 查找原始配置
    const housingConfig = housingData.find(h => h.id === housing.definitionId) as Housing;
    if (!housingConfig) {
      return result;
    }

    const isOwned = housing.type === 'OWN';
    const costs: { label: string; baseAmount: number; type: 'RENT' | 'MAINTENANCE' }[] = [];

    // 计算本周费用
    if (!isOwned && housingConfig.rentConfig?.weeklyCosts) {
      housingConfig.rentConfig.weeklyCosts.forEach(costItem => {
        costs.push({
          label: costItem.label,
          baseAmount: costItem.baseAmount,
          type: 'RENT'
        });
      });
    }

    if (isOwned && housingConfig.buyConfig?.weeklyCosts) {
      housingConfig.buyConfig.weeklyCosts.forEach(costItem => {
        costs.push({
          label: costItem.label,
          baseAmount: costItem.baseAmount,
          type: 'MAINTENANCE'
        });
      });
    }

    // 驱逐检查 (仅针对租客)
    const totalCost = costs.reduce((sum, c) => sum + c.baseAmount, 0);
    
    // 使用实时余额（考虑前置系统的金钱变动）
    const currentGold = state.vitality?.metrics?.gold ?? 0;
    
    // ✅ 防御性编程：使用可选链和默认值
    const evictionConfig = housingRules?.eviction;
    if (!isOwned && (evictionConfig?.enableEviction ?? true)) {
      if (currentGold < totalCost) {
        result.logs.push(`【驱逐】因无力支付租金，房东把你赶出了 ${housing.name}！`);
        result.notes.push(`你失去了住所。`);
        
        // SAN 惩罚（带默认值）
        const penalty = evictionConfig?.insightPenalty ?? 20;
        const currentInsight = result.updates.vitality?.metrics?.insight ?? vitality.metrics.insight;
        result.updates.vitality = {
          ...result.updates.vitality,
          metrics: {
            ...(result.updates.vitality as any)?.metrics,
            insight: Math.max(0, currentInsight - penalty)
          }
        } as any;
        
        updatedHousing = null;
        hasUpdates = true;
        isEvicted = true;
      }
    }

    // 如果未被驱逐，处理费用和收益
    if (!isEvicted && updatedHousing) {
      // 费用扣除
      costs.forEach((cost, index) => {
        result.newTransactions!.push({
          id: `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}_${index}`,
          turn: vitality.time.currentTurn,
          category: 'HOUSING',
          amount: -cost.baseAmount,
          description: `${housing.name}: ${cost.label}`,
          timestamp: Date.now()
        });
      });

      // 房贷处理
      if (housing.loanId) {
        const loanIndex = updatedLoans.findIndex(l => l.id === housing.loanId);

        if (loanIndex !== -1) {
          const loan = { ...updatedLoans[loanIndex] };
          const payment = calculateMortgagePayment(loan.principal, loan.rate);
          const totalMortgagePayment = payment.total;

          // 检查计算结果是否异常
          if (isNaN(totalMortgagePayment)) {
            result.logs.push(`【警告】房贷计算异常，跳过扣款`);
            return result;
          }

          if (currentGold >= totalCost + totalMortgagePayment) {
            result.newTransactions!.push({
              id: `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}_mortgage`,
              turn: vitality.time.currentTurn,
              category: 'BANK',
              amount: -totalMortgagePayment,
              description: `${housing.name} 房贷 (本金$${payment.principalPayment} + 利息$${payment.interestPayment})`,
              timestamp: Date.now()
            });

            loan.interest = Math.max(0, loan.interest - payment.interestPayment);
            loan.principal = Math.max(0, loan.principal - payment.principalPayment);
            
            // ✅ 修复：重置逾期周数（成功还款）
            loan.overdueTurns = 0;

            if (loan.principal <= 0) {
              result.logs.push(`【恭喜】${housing.name} 的房贷已全部还清！`);
              updatedLoans.splice(loanIndex, 1);
              
              updatedHousing = {
                ...housing,
                loanId: undefined
              };
              hasUpdates = true;
            } else {
              updatedLoans[loanIndex] = loan;
            }
          } else {
            // ✅ 修复：增加逾期周数（扣款失败）
            loan.overdueTurns = (loan.overdueTurns || 0) + 1;
            updatedLoans[loanIndex] = loan;
            hasUpdates = true;
            
            result.logs.push(`【警告】${housing.name} 房贷扣款失败：余额不足 (需$${totalCost + totalMortgagePayment})，逾期 ${loan.overdueTurns} 周`);
          }
        }
      }

      // 居住收益
      if (housing.regenHp > 0 && vitality.metrics) {
        const newHp = Math.min(vitality.metrics.maxHp, vitality.metrics.hp + housing.regenHp);
        result.updates.vitality = {
          ...result.updates.vitality,
          metrics: {
            ...(result.updates.vitality as any)?.metrics,
            hp: newHp
          }
        } as any;
        result.logs.push(`家中休息: HP +${housing.regenHp}`);
      }
    }

    // 应用更新
    if (hasUpdates || updatedLoans.length !== bank.activeLoans.length) {
      result.updates.activeHousing = updatedHousing;
      result.updates.bank = {
        ...bank,
        activeLoans: updatedLoans
      };
    }

    return result;
  }
};
