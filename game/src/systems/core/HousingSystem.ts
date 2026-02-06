import { GameSystem, SystemResult } from '../types';
import { Housing, LedgerRecord, PlayerClass, RegionID, ActiveHousingState } from '@/types/schema';
import housingData from '@/assets/data/housing.json';
import bankRules from '@/assets/data/rules/bankRules.json';
import housingRules from '@/assets/data/rules/housingRules.json';
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
    const housingEntries = activeHousing ? Object.entries(activeHousing) : [];
    if (housingEntries.length === 0) {
      return result;
    }

    let totalHpRegen = 0;
    let evictedRegions: RegionID[] = [];
    let updatedLoans = [...bank.activeLoans];
    let updatedHousing = { ...activeHousing };
    let hasUpdates = false;

    // 遍历所有区域的房产
    for (const [region, housing] of housingEntries) {
      if (!housing) continue;

      // 查找原始配置
      const housingConfig = housingData.find(h => h.id === housing.definitionId) as Housing;
      if (!housingConfig) continue;

      const isOwned = housing.type === 'OWN';
      const costs: { label: string; baseAmount: number; type: 'RENT' | 'MAINTENANCE' }[] = [];

      // 计算本周费用
      if (!isOwned && housingConfig.rentConfig) {
        housingConfig.rentConfig.weeklyCosts.forEach(costItem => {
          costs.push({
            label: costItem.label,
            baseAmount: costItem.baseAmount,
            type: 'RENT'
          });
        });
      }

      if (isOwned && housingConfig.buyConfig) {
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
      
      if (!isOwned && housingRules.eviction.enableEviction) {
        if (vitality.metrics.gold < totalCost) {
          result.logs.push(`【驱逐】因无力支付租金，房东把你赶出了 ${housing.name}！`);
          result.notes.push(`你失去了 ${region} 的住所。`);
          
          evictedRegions.push(region as RegionID);
          delete updatedHousing[region as RegionID];
          hasUpdates = true;

          // 精神打击
          const penalty = housingRules.eviction.sanPenalty;
          result.updates.vitality = {
            ...result.updates.vitality,
            metrics: {
              ...(result.updates.vitality as any)?.metrics,
              san: Math.max(0, vitality.metrics.san - (evictedRegions.length > 1 ? penalty : penalty))
            }
          } as any;
          continue; // 跳过该房产的其他处理
        }
      }

      // 费用扣除
      costs.forEach(cost => {
        result.newTransactions!.push({
          id: Math.random().toString(),
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

          if (vitality.metrics.gold >= totalCost + totalMortgagePayment) {
            result.newTransactions!.push({
              id: Math.random().toString(),
              turn: vitality.time.currentTurn,
              category: 'BANK',
              amount: -totalMortgagePayment,
              description: `${housing.name} 房贷 (本金$${payment.principalPayment} + 利息$${payment.interestPayment})`,
              timestamp: Date.now()
            });

            loan.interest = Math.max(0, loan.interest - payment.interestPayment);
            loan.principal = Math.max(0, loan.principal - payment.principalPayment);

            if (loan.principal <= 0) {
              result.logs.push(`【恭喜】${housing.name} 的房贷已全部还清！`);
              updatedLoans.splice(loanIndex, 1);
              
              updatedHousing[region as RegionID] = {
                ...housing,
                loanId: undefined
              };
              hasUpdates = true;
            } else {
              updatedLoans[loanIndex] = loan;
            }
          } else {
            result.logs.push(`【警告】${housing.name} 房贷扣款失败：余额不足 (需$${totalCost + totalMortgagePayment})`);
          }
        }
      }

      // 居住收益
      if (housing.regenHp > 0) {
        totalHpRegen += housing.regenHp;
      }
    }

    // 应用更新
    if (evictedRegions.length > 0) {
      const penalty = housingRules.eviction.sanPenalty * evictedRegions.length;
      const currentSan = result.updates.vitality?.metrics?.san ?? vitality.metrics.san;
      
      result.updates.vitality = {
        ...result.updates.vitality,
        metrics: {
          ...(result.updates.vitality as any)?.metrics,
          san: Math.max(0, currentSan - penalty)
        }
      } as any;
    }

    if (hasUpdates || updatedLoans.length !== bank.activeLoans.length) {
      result.updates.activeHousing = updatedHousing;
      result.updates.bank = {
        ...bank,
        activeLoans: updatedLoans
      };
    }

    if (totalHpRegen > 0) {
      const newHp = Math.min(vitality.metrics.maxHp, vitality.metrics.hp + totalHpRegen);
      result.updates.vitality = {
        ...result.updates.vitality,
        metrics: {
          ...(result.updates.vitality as any)?.metrics,
          hp: newHp
        }
      } as any;
      
      if (evictedRegions.length === 0) {
        result.logs.push(`家中休息: HP +${totalHpRegen} (共${housingEntries.length - evictedRegions.length}处住所)`);
      }
    }

    return result;
  }
};
