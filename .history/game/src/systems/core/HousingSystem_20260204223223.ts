import { GameSystem, SystemResult } from '../types';
import { Housing, LedgerRecord, PlayerClass } from '@/types/schema';
import housingData from '@/assets/data/housing.json';
import bankRules from '@/assets/data/rules/bankRules.json';

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

    // 2. 查找原始配置
    const housingConfig = housingData.find(h => h.id === activeHousing.definitionId) as Housing;
    if (!housingConfig) return result; 

    // =================================================================
    // 🏠 核心逻辑 A: 维护费用与驱逐机制 (Eviction Logic)
    // =================================================================
    
    // 计算本周需缴纳的费用列表
    const costs: { label: string; baseAmount: number; type: 'RENT' | 'MAINTENANCE' }[] = [];
    
    // ✅ 修复 1: 使用 activeHousing.type 判断所有权 ('RENT' | 'OWN')
    const isOwned = activeHousing.type === 'OWN';

    // A1. 租金 (如果是租的)
    // ✅ 修复 2: 遍历 weeklyCosts 数组计算总费用，不再读取不存在的 weeklyRent
    if (!isOwned && housingConfig.rentConfig) {
       housingConfig.rentConfig.weeklyCosts.forEach(costItem => {
         costs.push({
           label: costItem.label,
           baseAmount: costItem.baseAmount,
           type: 'RENT'
         });
       });
    }

    // A2. 物业费 (如果是买的)
    // ✅ 修复 3: 遍历 weeklyCosts 数组计算税费，不再读取不存在的 taxPerTurn
    if (isOwned && housingConfig.buyConfig) {
       housingConfig.buyConfig.weeklyCosts.forEach(costItem => {
         costs.push({
           label: costItem.label,
           baseAmount: costItem.baseAmount,
           type: 'MAINTENANCE'
         });
       });
    }

    // 🔥 驱逐检查 (仅针对租客)
    if (!isOwned) {
        const totalRent = costs.reduce((sum, c) => sum + c.baseAmount, 0);
        
        // 如果钱不够付房租
        if (vitality.metrics.gold < totalRent) {
            result.logs.push(`【驱逐】因无力支付租金，房东把你赶出了 ${activeHousing.name}！`);
            result.notes.push(`你失去了住所，流落街头。`);

            // 1. 强制移除住房
            result.updates.activeHousing = null; 

            // 2. 精神打击
            result.updates.vitality = {
                metrics: {
                    san: Math.max(0, vitality.metrics.san - 20)
                }
            } as any;

            return result; // ⛔️ 停止后续的回血和扣款逻辑
        }
    }

    // =================================================================
    // 💰 核心逻辑 B: 费用扣除 & 房贷闭环
    // =================================================================

    // B1. 处理普通费用 (租金/物业费)
    costs.forEach(cost => {
        result.newTransactions!.push({
          id: Math.random().toString(),
          turn: vitality.time.currentTurn,
          category: 'HOUSING',
          amount: -cost.baseAmount,
          description: `${activeHousing.name}: ${cost.label}`,
          timestamp: Date.now()
        });
    });

    // B2. 房贷处理
    if (activeHousing.loanId) {
        const loans = [...bank.activeLoans]; 
        const loanIndex = loans.findIndex(l => l.id === activeHousing.loanId);

        if (loanIndex !== -1) {
            const loan = { ...loans[loanIndex] };
            
            // [Old Hardcoded Logic]
            // const weeklyInterest = Math.ceil(loan.principal * loan.rate);
            // const weeklyPrincipal = Math.ceil(loan.principal * 0.01) + 10;
            
            // [New Configured Logic]
            // 读取 JSON 配置 (注意处理浮点数精度问题，这里保留原有 ceil 逻辑)
            const repaymentRate = bankRules.mortgage.weeklyPrincipalRate;
            const serviceFee = bankRules.mortgage.weeklyServiceFee;

            const weeklyInterest = Math.ceil(loan.principal * loan.rate);
            const weeklyPrincipal = Math.ceil(loan.principal * repaymentRate) + serviceFee;
            
            const totalMortgagePayment = weeklyInterest + weeklyPrincipal;

            if (vitality.metrics.gold >= totalMortgagePayment) {
                result.newTransactions!.push({
                    id: Math.random().toString(),
                    turn: vitality.time.currentTurn,
                    category: 'HOUSING',
                    amount: -totalMortgagePayment,
                    description: `房贷自动扣款 (本金$${weeklyPrincipal} + 利息$${weeklyInterest})`,
                    timestamp: Date.now()
                });

                loan.interest = Math.max(0, loan.interest - weeklyInterest);
                loan.principal = Math.max(0, loan.principal - weeklyPrincipal);

                if (loan.principal <= 0) {
                    result.logs.push(`【恭喜】${activeHousing.name} 的房贷已全部还清！`);
                    loans.splice(loanIndex, 1); 
                    
                    const updatedHousing = { ...activeHousing, loanId: undefined };
                    result.updates.activeHousing = updatedHousing;
                } else {
                    loans[loanIndex] = loan;
                }

                // ✅ 修复 4: 更新 bank 时保留完整属性 (如 lifetimeInterestPaid)
                // 使用 spread operator (...) 继承旧状态
                result.updates.bank = { 
                    ...bank, 
                    activeLoans: loans 
                };

            } else {
                result.logs.push(`【警告】余额不足，房贷扣款失败！(请小心银行催收)`);
            }
        }
    }

    // =================================================================
    // ❤️ 核心逻辑 C: 居住收益 (Regen)
    // =================================================================
    
    // ✅ 修复 5: 移除 schema 中不存在的 regenSan 逻辑
    // 目前 ActiveHousingState 和 HousingSchema 只有 regenHp
    if (activeHousing.regenHp > 0) {
      const currentHp = vitality.metrics.hp;
      const maxHp = vitality.metrics.maxHp;
      // const currentSan = vitality.metrics.san; // 已移除
      // const maxSan = vitality.metrics.maxSan;   // 已移除
      
      const newHp = Math.min(maxHp, currentHp + activeHousing.regenHp);

      result.updates.vitality = {
        ...result.updates.vitality,
        metrics: { 
            ...(result.updates.vitality as any)?.metrics,
            hp: newHp
        }
      } as any;
      
      result.logs.push(`家中休息: HP +${activeHousing.regenHp}`);
    }

    return result;
  }
};