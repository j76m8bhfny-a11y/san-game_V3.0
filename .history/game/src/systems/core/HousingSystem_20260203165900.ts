import { GameSystem, SystemResult } from '../types';
import { Housing, LedgerRecord, PlayerClass } from '@/types/schema';
import housingData from '@/assets/data/housing.json';

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

    // 1. 如果无房，跳过 (流浪惩罚通常由 StatRules 处理)
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

    // A1. 租金 (如果是租的)
    if (!activeHousing.isOwned && housingConfig.rentConfig) {
       costs.push({
         label: '租金',
         baseAmount: housingConfig.rentConfig.weeklyRent,
         type: 'RENT'
       });
    }

    // A2. 物业费 (如果是买的)
    if (activeHousing.isOwned && housingConfig.buyConfig) {
       costs.push({
         label: '物业/税费',
         baseAmount: housingConfig.buyConfig.taxPerTurn,
         type: 'MAINTENANCE'
       });
    }

    // 🔥 驱逐检查 (仅针对租客)
    if (!activeHousing.isOwned) {
        const totalRent = costs.reduce((sum, c) => sum + c.baseAmount, 0);
        
        // 如果钱不够付房租
        if (vitality.metrics.gold < totalRent) {
            result.logs.push(`【驱逐】因无力支付租金，房东把你赶出了 ${activeHousing.name}！`);
            result.notes.push(`你失去了住所，流落街头。`);

            // 1. 强制移除住房
            result.updates.activeHousing = null; 

            // 2. 身份降级 (如果是中产以上，可能因破产降级，这里暂且只变回流浪汉身份逻辑上的处理，具体由 PlayerSlice 决定)
            // 这里为了简化，我们只修改 activeHousing，让 StatRules 下回合接管流浪惩罚
            
            // 3. 精神打击
            result.updates.vitality = {
                metrics: {
                    san: Math.max(0, vitality.metrics.san - 20) // 被赶出来很丢人，扣 20 SAN
                }
            } as any;

            return result; // ⛔️ 停止后续的回血和扣款逻辑
        }
    }

    // =================================================================
    // 💰 核心逻辑 B: 费用扣除 & 房贷闭环 (Mortgage Fix)
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

    // B2. 房贷处理 (修复“黑洞扣款”问题)
    if (activeHousing.loanId) {
        // 1. 在银行贷款列表中找到这笔房贷
        const loans = [...bank.activeLoans]; 
        const loanIndex = loans.findIndex(l => l.id === activeHousing.loanId);

        if (loanIndex !== -1) {
            const loan = { ...loans[loanIndex] };
            
            // 简单估算本周应还金额 (等额本息太复杂，这里用简单的利率+本金摊销 或 直接读取配置)
            // 假设 weeklyPayment = 贷款总额 * (利率 + 1/周期) 的简化算法，或者固定值
            // 为了不仅扣利息，还要扣本金，我们假设每周还款额 = 利息 + 1% 本金 (或者配置里的值)
            
            // 这里我们动态计算一个“最低还款额”来模拟：涵盖当周利息 + 极少量本金
            const weeklyInterest = Math.ceil(loan.principal * loan.rate);
            const weeklyPrincipal = Math.ceil(loan.principal * 0.01) + 10; // 每周至少还 1% + 10块
            const totalMortgagePayment = weeklyInterest + weeklyPrincipal;

            // 检查钱够不够 (如果不够，BankSystem 会处理逾期，这里我们只负责扣钱和更新余额)
            // 实际上 HousingSystem 应该只扣钱，具体是否逾期由 BankSystem 判断。
            // 但为了简化闭环，我们假设只要有钱就自动还进去。
            
            if (vitality.metrics.gold >= totalMortgagePayment) {
                // 生成流水
                result.newTransactions!.push({
                    id: Math.random().toString(),
                    turn: vitality.time.currentTurn,
                    category: 'HOUSING',
                    amount: -totalMortgagePayment,
                    description: `房贷自动扣款 (本金$${weeklyPrincipal} + 利息$${weeklyInterest})`,
                    timestamp: Date.now()
                });

                // ✅ 修复：更新银行内部账本
                loan.interest = Math.max(0, loan.interest - weeklyInterest); // 通常 currentInterest 是累计的逾期利息，这里简化处理
                loan.principal = Math.max(0, loan.principal - weeklyPrincipal);

                // 检查是否还清
                if (loan.principal <= 0) {
                    result.logs.push(`【恭喜】${activeHousing.name} 的房贷已全部还清！`);
                    loans.splice(loanIndex, 1); // 移除贷款
                    
                    // 更新房产状态：移除 loanId
                    const updatedHousing = { ...activeHousing, loanId: undefined };
                    result.updates.activeHousing = updatedHousing;
                } else {
                    loans[loanIndex] = loan; // 更新贷款进度
                }

                // 将更新后的 Bank 状态写入 result
                if (!result.updates.bank) result.updates.bank = { activeLoans: loans };
                else result.updates.bank.activeLoans = loans;

            } else {
                result.logs.push(`【警告】余额不足，房贷扣款失败！(请小心银行催收)`);
                // 这里不扣钱，也不更新贷款。
                // BankSystem 的 processTurn 会检测到 overdueTurns 增加并处理惩罚。
            }
        }
    }

    // =================================================================
    // ❤️ 核心逻辑 C: 居住收益 (Regen)
    // =================================================================
    
    // 只有没被驱逐才能享受回血
    if (activeHousing.regenHp > 0 || activeHousing.regenSan > 0) {
      const currentHp = vitality.metrics.hp;
      const maxHp = vitality.metrics.maxHp;
      const currentSan = vitality.metrics.san;
      const maxSan = vitality.metrics.maxSan;
      
      const newHp = Math.min(maxHp, currentHp + activeHousing.regenHp);
      const newSan = Math.min(maxSan, currentSan + activeHousing.regenSan);

      // 合并到 update
      result.updates.vitality = {
        ...result.updates.vitality,
        metrics: { 
            ...(result.updates.vitality as any)?.metrics,
            hp: newHp,
            san: newSan
        }
      } as any;
      
      if(activeHousing.regenHp > 0) result.logs.push(`家中休息: HP +${activeHousing.regenHp}`);
      if(activeHousing.regenSan > 0) result.logs.push(`家中安宁: SAN +${activeHousing.regenSan}`);
    }

    return result;
  }
};